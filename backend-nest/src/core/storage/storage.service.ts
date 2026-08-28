import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';

export interface UploadInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

export interface StoredFile {
  /** Public URL to store in `task_attachments.file_url`. */
  url: string;
}

/**
 * Storage abstraction: `local` (disk under `<cwd>/uploads`, served via
 * `app.useStaticAssets` in main.ts) or `s3` (MinIO-compatible, driven by
 * `STORAGE_DRIVER` — see validation.schema.ts). Local is the dev default so
 * `collaboration` attachments work without standing up MinIO.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly driver: 'local' | 's3';
  private readonly uploadsDir = join(process.cwd(), 'uploads');
  private s3Client?: S3Client;
  private bucket?: string;
  private endpoint?: string;

  constructor(private readonly configService: ConfigService) {
    this.driver = this.configService.get<'local' | 's3'>('STORAGE_DRIVER', 'local');
    if (this.driver === 's3') {
      this.bucket = this.configService.get<string>('S3_BUCKET');
      this.endpoint = this.configService.get<string>('S3_ENDPOINT');
      this.s3Client = new S3Client({
        endpoint: this.endpoint,
        region: 'us-east-1',
        forcePathStyle: true, // required for MinIO
        credentials: {
          accessKeyId: this.configService.get<string>('S3_ACCESS_KEY', ''),
          secretAccessKey: this.configService.get<string>('S3_SECRET_KEY', ''),
        },
      });
    }
  }

  async upload(file: UploadInput): Promise<StoredFile> {
    const safeName = file.originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const key = `${randomUUID()}-${safeName}`;

    if (this.driver === 's3') {
      await this.s3Client!.send(
        new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: file.buffer, ContentType: file.mimeType }),
      );
      return { url: `${this.endpoint}/${this.bucket}/${key}` };
    }

    await mkdir(this.uploadsDir, { recursive: true });
    await writeFile(join(this.uploadsDir, key), file.buffer);
    return { url: `/uploads/${key}` };
  }

  /** Best-effort delete — a missing/already-gone file must not block removing the DB row. */
  async delete(url: string): Promise<void> {
    try {
      if (this.driver === 's3') {
        const key = url.split('/').pop();
        if (!key) return;
        await this.s3Client!.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
        return;
      }
      const key = url.replace(/^\/uploads\//, '');
      await unlink(join(this.uploadsDir, key));
    } catch (err) {
      this.logger.warn(`Failed to delete stored file for ${url}: ${(err as Error).message}`);
    }
  }
}

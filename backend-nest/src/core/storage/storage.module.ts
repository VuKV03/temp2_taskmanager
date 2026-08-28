import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service.js';

/**
 * File storage abstraction: local disk (dev default) or S3-compatible
 * (MinIO). See `storage.service.ts` — driven by `STORAGE_DRIVER` env var.
 */
@Module({
  imports: [ConfigModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}

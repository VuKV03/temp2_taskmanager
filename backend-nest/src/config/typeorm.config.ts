import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// This file runs as native ESM (project is "type": "module"), where
// __dirname doesn't exist — reconstruct it from import.meta.url, same
// pattern as frontend-react/vite.config.ts.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'secret',
  database: process.env.DB_NAME || 'taskmanager',
  entities: [path.join(__dirname, '../features/**/entities/*.entity.ts')],
  migrations: [path.join(__dirname, '../database/migrations/*.ts')],
  subscribers: [],
  synchronize: false,
  logging: !isProduction,
  timezone: 'Z',
  ssl: isProduction,
});

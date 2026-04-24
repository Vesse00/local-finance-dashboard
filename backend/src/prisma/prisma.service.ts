import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../../src/generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'node:path';

const dbPath = process.env.DATABASE_URL ?? path.resolve(__dirname, '../../../dev.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ adapter });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

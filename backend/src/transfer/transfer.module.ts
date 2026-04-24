import { Module } from '@nestjs/common';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TransferController],
  providers: [TransferService, PrismaService],
})
export class TransferModule {}

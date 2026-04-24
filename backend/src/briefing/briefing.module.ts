import { Module } from '@nestjs/common';
import { BriefingController } from './briefing.controller';
import { BriefingService } from './briefing.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [BriefingController],
  providers: [BriefingService, PrismaService],
})
export class BriefingModule {}

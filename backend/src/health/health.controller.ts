import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { HealthService } from './health.service';
import { InternalAuthGuard } from '../auth/internal-auth.guard';
import { CurrentUserId } from '../auth/current-user-id.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @UseGuards(InternalAuthGuard)
  async getHealthDays(
    @CurrentUserId() userId: string,
    @Query('month') month?: string,
  ) {
    return this.healthService.getHealthDays(userId, month);
  }

  @Post()
  @UseGuards(InternalAuthGuard)
  async upsertHealthDay(
    @CurrentUserId() userId: string,
    @Body()
    body: {
      date?: string;
      weight?: number | string;
      waterGlasses?: number | string;
      calories?: number | string;
      workout?: string | null;
      chest?: number | string;
      waist?: number | string;
      hips?: number | string;
      biceps?: number | string;
      thigh?: number | string;
    },
  ) {
    return this.healthService.upsertHealthDay(userId, body);
  }

  @Post('calculator')
  async calculateTargets(
    @Body()
    body: {
      gender?: string;
      weight?: number;
      height?: number;
      age?: number;
      activity?: number;
      goal?: number;
    },
  ) {
    return this.healthService.calculateTargets(body);
  }
}

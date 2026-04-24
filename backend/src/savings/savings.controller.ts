import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SavingsService } from './savings.service';
import { InternalAuthGuard } from '../auth/internal-auth.guard';
import { CurrentUserId } from '../auth/current-user-id.decorator';

@Controller('savings')
@UseGuards(InternalAuthGuard)
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  @Get()
  async getOverview(@CurrentUserId() userId: string) {
    return this.savingsService.getOverview(userId);
  }

  @Post()
  async createAccount(
    @CurrentUserId() userId: string,
    @Body() body: { name?: string; balance?: number | string; type?: string },
  ) {
    return this.savingsService.createAccount(userId, body);
  }

  @Delete()
  async deleteAccount(
    @CurrentUserId() userId: string,
    @Body() body: { id?: string },
  ) {
    return this.savingsService.deleteAccount(userId, body);
  }

  @Get(':id')
  async getAccountDetails(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ) {
    return this.savingsService.getAccountDetails(userId, id);
  }

  @Post(':id/correction')
  async correction(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() body: { newBalance?: number | string; reason?: string },
  ) {
    return this.savingsService.correctAccount(userId, id, body);
  }
}

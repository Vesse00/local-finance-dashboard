import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { InternalAuthGuard } from '../auth/internal-auth.guard';
import { CurrentUserId } from '../auth/current-user-id.decorator';

@Controller('settings')
@UseGuards(InternalAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(@CurrentUserId() userId: string) {
    return this.settingsService.getSettings(userId);
  }

  @Put()
  async updateSettings(
    @CurrentUserId() userId: string,
    @Body()
    body: {
      currentPassword?: string;
      newEmail?: string;
      newPassword?: string;
      location?: string;
      currency?: string;
      payday?: number | string;
    },
  ) {
    return this.settingsService.updateSettings(userId, body);
  }
}

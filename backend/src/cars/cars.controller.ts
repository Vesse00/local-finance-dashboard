import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CarsService } from './cars.service';
import { InternalAuthGuard } from '../auth/internal-auth.guard';
import { CurrentUserId } from '../auth/current-user-id.decorator';

@Controller('cars')
@UseGuards(InternalAuthGuard)
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Get()
  async listCars(@CurrentUserId() userId: string) {
    return this.carsService.listCars(userId);
  }

  @Get(':id')
  async getCarDetails(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.carsService.getCarDetails(userId, id);
  }

  @Post()
  async createCar(
    @CurrentUserId() userId: string,
    @Body()
    body: {
      make?: string;
      model?: string;
      plate?: string;
      year?: number | string | null;
      ocDate?: string;
      inspectionDate?: string;
      oilDate?: string;
    },
  ) {
    return this.carsService.createCar(userId, body);
  }

  @Delete()
  async deleteCar(@CurrentUserId() userId: string, @Body() body: { id?: string }) {
    return this.carsService.deleteCar(userId, body.id);
  }

  @Post('events')
  async createEvent(
    @CurrentUserId() userId: string,
    @Body()
    body: {
      carId?: string;
      type?: string;
      date?: string;
      nextDueDate?: string;
      nextDueMileage?: number | string;
      cost?: number | string;
      description?: string;
      createExpense?: boolean;
      mileage?: number | string;
      liters?: number | string;
      pricePerLiter?: number | string;
    },
  ) {
    return this.carsService.createEvent(userId, body);
  }

  @Delete('events')
  async deleteEvent(@CurrentUserId() userId: string, @Body() body: { id?: string }) {
    return this.carsService.deleteEvent(userId, body.id);
  }
}

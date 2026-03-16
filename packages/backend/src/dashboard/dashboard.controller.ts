import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('dashboard')
  async getGlobalDashboard() {
    const dashboard = await this.dashboardService.getGlobalDashboard();
    return { data: dashboard };
  }

  @Get('events/:eventId/dashboard')
  async getEventDashboard(@Param('eventId') eventId: string) {
    const dashboard = await this.dashboardService.getEventDashboard(eventId);
    return { data: dashboard };
  }
}

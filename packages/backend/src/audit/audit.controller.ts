import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('events/:eventId')
  async findByEvent(@Param('eventId') eventId: string, @Query() query: any) {
    const result = await this.auditService.findByEvent(eventId, query);
    return result;
  }

  @Get('entity/:entityType/:entityId')
  async findByEntity(@Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    const logs = await this.auditService.findByEntity(entityType, entityId);
    return { data: logs };
  }

  @Get('recent')
  async getRecentActivity(@Query('limit') limit?: string) {
    const logs = await this.auditService.getRecentActivity(limit ? parseInt(limit) : 20);
    return { data: logs };
  }
}

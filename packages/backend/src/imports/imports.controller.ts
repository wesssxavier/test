import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportsService } from './imports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/imports')
export class ImportsController {
  constructor(private importsService: ImportsService) {}

  @Get()
  async getImportJobs(@Param('eventId') eventId: string) {
    const jobs = await this.importsService.getImportJobs(eventId);
    return { data: jobs };
  }

  @Get(':id')
  async getImportJobDetails(@Param('id') id: string) {
    const job = await this.importsService.getImportJobDetails(id);
    return { data: job };
  }

  @Post('preview')
  @UseInterceptors(FileInterceptor('file'))
  async preview(
    @Param('eventId') eventId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { error: 'No file uploaded' };
    }
    const result = await this.importsService.preview(eventId, file.buffer, file.originalname);
    return { data: result };
  }

  @Post('execute')
  @UseInterceptors(FileInterceptor('file'))
  async executeImport(
    @Param('eventId') eventId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { mapping: string; duplicateStrategy?: string },
    @Request() req: any,
  ) {
    if (!file) {
      return { error: 'No file uploaded' };
    }
    const mapping = JSON.parse(body.mapping);
    const duplicateStrategy = (body.duplicateStrategy as 'skip' | 'update' | 'create') || 'skip';

    const result = await this.importsService.executeImport(
      eventId,
      file.buffer,
      file.originalname,
      file.size,
      mapping,
      duplicateStrategy,
      req.user.id,
    );
    return { data: result };
  }

  @Get('templates/list')
  async getMappingTemplates() {
    const templates = await this.importsService.getMappingTemplates();
    return { data: templates };
  }

  @Post('templates')
  async saveMappingTemplate(@Body() body: { templateName: string; mappings: any }, @Request() req: any) {
    const template = await this.importsService.saveMappingTemplate({
      ...body,
      createdBy: req.user.id,
    });
    return { data: template };
  }

  @Delete('templates/:id')
  async deleteMappingTemplate(@Param('id') id: string) {
    const result = await this.importsService.deleteMappingTemplate(id);
    return { data: result };
  }
}

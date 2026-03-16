import { Module } from '@nestjs/common';
import { RelationshipsService } from './relationships.service';
import { RelationshipsController } from './relationships.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [RelationshipsService],
  controllers: [RelationshipsController],
  exports: [RelationshipsService],
})
export class RelationshipsModule {}

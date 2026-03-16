import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { GuestsModule } from './guests/guests.module';
import { TablesModule } from './tables/tables.module';
import { SeatingModule } from './seating/seating.module';
import { CustomFieldsModule } from './custom-fields/custom-fields.module';
import { ImportsModule } from './imports/imports.module';
import { ExportsModule } from './exports/exports.module';
import { CheckInModule } from './check-in/check-in.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';
import { SavedViewsModule } from './saved-views/saved-views.module';
import { RelationshipsModule } from './relationships/relationships.module';
import { RoomElementsModule } from './room-elements/room-elements.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EventsModule,
    GuestsModule,
    TablesModule,
    SeatingModule,
    CustomFieldsModule,
    ImportsModule,
    ExportsModule,
    CheckInModule,
    DashboardModule,
    AuditModule,
    SavedViewsModule,
    RelationshipsModule,
    RoomElementsModule,
  ],
})
export class AppModule {}

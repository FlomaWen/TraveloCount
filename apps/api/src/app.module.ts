import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TripsModule } from './trips/trips.module';
import { InvitesModule } from './invites/invites.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ExchangeModule } from './exchange/exchange.module';
import { ItineraryModule } from './itinerary/itinerary.module';
import { DocumentsModule } from './documents/documents.module';
import { MailModule } from './mail/mail.module';
import { ActivityModule } from './activity/activity.module';
import { StatsModule } from './stats/stats.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { MessagesModule } from './messages/messages.module';
import { SettlementsModule } from './settlements/settlements.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env'],
    }),
    PrismaModule,
    MailModule,
    AuthModule,
    ExchangeModule,
    TripsModule,
    InvitesModule,
    ExpensesModule,
    ItineraryModule,
    DocumentsModule,
    ActivityModule,
    StatsModule,
    UsersModule,
    AccountsModule,
    MessagesModule,
    SettlementsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

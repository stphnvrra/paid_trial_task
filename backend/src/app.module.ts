import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { MissionsModule } from './missions/missions.module';

@Module({
  imports: [DatabaseModule, MissionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

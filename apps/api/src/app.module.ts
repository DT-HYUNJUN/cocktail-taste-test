import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database.module';
import { CocktailsModule } from './cocktails/cocktails.module';

@Module({
  imports: [DatabaseModule, CocktailsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

// важно configModule импортировать первым
import { configModule } from './config-dynamic-module';

import { DynamicModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';
import { TestingModule } from './modules/testing/testing.module';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { CoreModule } from './core/core.module';
import { CoreConfig } from './core/core.config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

// nest g module modules/user-accounts
// nest g controller modules/user-accounts --no-spec
// nest g service modules/user-accounts --no-spec

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'sa',
      database: 'bloggers_platform',
      // entities: [__dirname + '/../**/*.entity.{ts,js}'],
      synchronize: true, // ❗ Только для разработки
      autoLoadEntities: true,
    }),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 10000,
          limit: 5,
        },
      ],
    }),

    BloggersPlatformModule,
    UserAccountsModule,
    NotificationsModule,
    MailerModule,
    CoreModule,
    configModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  static async forRoot(coreConfig: CoreConfig): Promise<DynamicModule> {
    return {
      module: AppModule,
      imports: [...(coreConfig.includeTestingModule ? [TestingModule] : [])],
    };
  }
}

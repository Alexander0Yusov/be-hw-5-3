import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
// import { InjectConnection } from '@nestjs/mongoose';
// import { Connection } from 'mongoose';

@Controller('testing')
export class TestingController {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    // @InjectConnection()
    // private readonly databaseConnection: any,
    // Connection,
  }

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    const tables = [
      'blogs',
      'comments',
      'likes',
      'posts',
      'sessions',
      'users',
      'email_confirmations',
      'password_recoveries',
    ];

    const truncatePromises = tables.map((table) =>
      this.dataSource.query(`TRUNCATE "${table}" RESTART IDENTITY CASCADE`),
    );

    await Promise.all(truncatePromises);

    return {
      status: 'succeeded',
    };
  }
}

import { Injectable } from '@nestjs/common';
import { Session } from '../../domain/session/session.entity';
import { SessionViewDto } from '../../dto/session/session-view.dto';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class SessionsQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {} // SessionModelType, // private SessionModel: any, // @InjectModel(Session.name)

  async findManyForCurrentUser(userId: number): Promise<SessionViewDto[]> {
    const result = await this.dataSource.query(
      `
    SELECT
      ip,
      device_name AS title,
      last_active_date AS "lastActiveDate",
      device_id AS "deviceId"
    FROM sessions
    WHERE user_id = $1
      AND is_revoked = false
      AND expires_at > NOW()
    ORDER BY last_active_date DESC
    `,
      [userId],
    );

    return result;
  }
}

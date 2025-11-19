import { Injectable, NotFoundException } from '@nestjs/common';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { CreateSessionDomainDto } from '../dto/session/create-session-domain.dto';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    // @InjectModel(Session.name)
    // private SessionModel: any, // SessionModelType,
  ) {}

  async save(
    session: any,
    // SessionDocument
  ) {
    await session.save();
  }

  async create(body: {
    deviceId: string;
    userId: number;
    ip: string;
    deviceName: string;
    expiresAt: Date;
    lastActiveDate: Date;
    isRevoked: boolean;
  }) {
    const {
      deviceId,
      userId,
      ip,
      deviceName,
      expiresAt,
      lastActiveDate,
      isRevoked,
    } = body;

    const result = await this.dataSource.query(
      `
  INSERT INTO public.sessions (
    device_id,
    user_id,
    ip,
    device_name,
    expires_at,
    last_active_date,
    is_revoked,
    updated_at
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
  ) RETURNING id
  `,
      [
        deviceId,
        userId,
        ip,
        deviceName,
        expiresAt,
        lastActiveDate,
        isRevoked,
        new Date(),
      ],
    );

    return result[0].id;
  }

  async findOrNotFoundFail(userId: string, deviceId: string): Promise<any> {
    // SessionDocument
    // const session = await this.SessionModel.findOne({
    //   userId: '', // new Types.ObjectId(userId),
    //   deviceId,
    // });

    // if (!session) {
    //   throw new DomainException({
    //     code: DomainExceptionCode.NotFound,
    //     message: 'Session not found',
    //   });
    // }

    return null; // session;
  }

  async findByDeviceIdOrNotFoundFail(
    deviceId: string,
  ): Promise<CreateSessionDomainDto> {
    const result: CreateSessionDomainDto[] = await this.dataSource.query(
      `SELECT  
  device_id AS "deviceId",
  user_id AS "userId",
  ip,
  device_name AS "deviceName",
  expires_at AS "expiresAt",
  last_active_date AS "lastActiveDate",
  is_revoked AS "isRevoked"  
FROM sessions
WHERE device_id = $1`,
      [deviceId],
    );

    if (result.length === 0) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Session not found',
      });
    }

    return result[0];
  }

  async updateExpAndIatTimesOrNotFoundFail(
    deviceId: string,
    expDate: Date,
    iatDate: Date,
  ) {
    const result = await this.dataSource.query(
      `UPDATE sessions
   SET expires_at = $1,
       last_active_date = $2
   WHERE device_id = $3
   RETURNING *`,
      [expDate, iatDate, deviceId],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('Session not found');
    }
  }

  async revokingSessionByDeviceIdOrNotFoundFail(deviceId: string) {
    const result = await this.dataSource.query(
      'UPDATE sessions SET is_revoked = true WHERE device_id = $1 RETURNING *',
      [deviceId],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException();
    }
  }

  async deleteManyExceptCurrent(
    userId: number,
    deviceId: string,
  ): Promise<void> {
    // await this.SessionModel.deleteMany({
    //   userId: '', // new Types.ObjectId(userId),
    //   deviceId: { $ne: deviceId },
    // });

    await this.dataSource.query(
      `UPDATE sessions
   SET is_revoked = true,
       updated_at = CURRENT_TIMESTAMP
   WHERE user_id = $1
     AND device_id != $2
     AND is_revoked = false
     AND expires_at > NOW()
   RETURNING *`,
      [userId, deviceId],
    );
  }

  async deleteByDeviceIdAndUserId(
    userId: number,
    deviceId: string,
  ): Promise<void> {
    await this.dataSource.query(
      `UPDATE sessions
   SET is_revoked = true,
       updated_at = CURRENT_TIMESTAMP
   WHERE device_id = $1
     AND user_id = $2
     AND is_revoked = false`,
      [deviceId, userId],
    );
  }
}

// CREATE TABLE public.sessions (
//   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
//   device_id TEXT NOT NULL,
//   user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
//   ip TEXT NOT NULL,
//   device_name TEXT NOT NULL,
//   expires_at TIMESTAMPTZ NOT NULL,
//   last_active_date TIMESTAMPTZ NOT NULL,
//   is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
//   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );

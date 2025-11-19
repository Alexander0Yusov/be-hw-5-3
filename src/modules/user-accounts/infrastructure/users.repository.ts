import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';

@Injectable()
export class UsersRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async create(
    login: string,
    password_hash: string,
    email: string,
  ): Promise<number> {
    const result = await this.dataSource.query(
      `
    INSERT INTO public.users (login, password_hash, email, created_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    RETURNING id;
    `,
      [login, password_hash, email],
    );

    const userId = result[0].id;

    return userId;
  }

  async findByLoginOrEmailOrNotFoundFail(loginOrEmail: string): Promise<{
    id: number;
    login: string;
    password_hash: string;
    email: string;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }> {
    const result = await this.dataSource.query(
      `SELECT * FROM users WHERE login = $1 OR email = $1`,
      [loginOrEmail],
    );

    if (result.length === 0) {
      throw new NotFoundException('User not found');
    }

    return result[0];
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<{
    id: number;
    login: string;
    password_hash: string;
    email: string;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
  } | null> {
    const result = await this.dataSource.query(
      `SELECT * FROM users WHERE login = $1 OR email = $1`,
      [loginOrEmail],
    );

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  async setEmailConfirmationCode(userId: number, code: string, expDate: Date) {
    await this.dataSource.query(
      `
      INSERT INTO public.email_confirmations (user_id, confirmation_code, expiration_date)
      VALUES ($1, $2, $3)
      `,
      [userId, code, expDate],
    );
  }

  async updateEmailConfirmationCode(id: number, code: string, expDate: Date) {
    const query = `
    UPDATE email_confirmations
    SET confirmation_code = $1,
        expiration_date = $2
    WHERE id = $3
  `;

    await this.dataSource.query(query, [code, expDate, id]);
  }

  async setIsConfirmedEmailConfirmationCode(id: number) {
    await this.dataSource.query(
      `
  UPDATE public.email_confirmations
  SET is_confirmed = TRUE
  WHERE id = $1    
  `,
      [id],
    );
  }

  async setNewPasswordConfirmationCode(
    userId: number,
    code: string,
    expDate: Date,
  ) {
    await this.dataSource.query(
      `
      INSERT INTO public.password_recoveries (user_id, confirmation_code, expiration_date)
      VALUES ($1, $2, $3)
      `,
      [userId, code, expDate],
    );
  }

  async getUserAndEmailConfirmationDataByCodeOrNotFounFail(
    code: string,
  ): Promise<{
    userId: number;
    login: string;
    email: string;
    confirmation_code: string;
    expiration_date: Date;
    is_confirmed: boolean;
  }> {
    const result = await this.dataSource.query(
      `
  SELECT 
    u.id AS "userId",
    u.login,
    u.email,    
    ec.confirmation_code,
    ec.expiration_date,
    ec.is_confirmed
  FROM public.email_confirmations ec
  JOIN public.users u ON ec.user_id = u.id
  WHERE ec.confirmation_code = $1
    AND ec.expiration_date > NOW()
    AND ec.is_confirmed = FALSE
  `,
      [code],
    );

    if (!result.length) {
      throw new NotFoundException('Code not found');
    }

    return result[0];
  }

  async getUserAndPasswordConfirmationDataOrNotFounFail(code: string): Promise<{
    id: number;
    user_id: number;
    confirmation_code: string;
    expiration_date: Date;
    is_confirmed: boolean;
    login: string;
    email: string;
  }> {
    const result = await this.dataSource.query(
      `
  SELECT pr.*, u.id AS user_id, u.login, u.email
  FROM public.password_recoveries pr
  JOIN public.users u ON pr.user_id = u.id
  WHERE pr.confirmation_code = $1
    AND pr.expiration_date > NOW()
  `,
      [code],
    );

    if (!result[0]) {
      throw new NotFoundException();
    }

    return result[0];
  }

  async getUserAndEmailConfirmationDataByEmailOrNotFoundFail(
    email: string,
  ): Promise<{
    confirmationId: number;
    userId: number;
    login: string;
    email: string;
    confirmation_code: string;
    expiration_date: Date;
    is_confirmed: boolean;
  }> {
    const result = await this.dataSource.query(
      `
  SELECT 
  u.id AS "userId",
  u.login,
  u.email,
  ec.id AS "confirmationId",    
  ec.confirmation_code,
  ec.expiration_date,
  ec.is_confirmed
FROM public.users u
LEFT JOIN public.email_confirmations ec 
  ON ec.user_id = u.id
  AND ec.is_confirmed = FALSE
WHERE u.email = $1
  `,
      [email],
    );

    if (!result.length) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Something wrong with email',
        extensions: [
          {
            field: 'email',
            message: 'Email not found',
          },
        ],
      });
    }

    return result[0];
  }

  async isEmailAlreadyConfirmed(email: string): Promise<boolean> {
    const query = `
  SELECT ec.*
  FROM email_confirmations ec
  JOIN users u ON ec.user_id = u.id
  WHERE u.email = $1    
    AND ec.is_confirmed = TRUE
`;

    const result = await this.dataSource.query(query, [email]);

    if (result.length > 0) {
      return true;
    }

    return false;
  }

  async setNewHashOrNotFoundFail(
    userId: number,
    password_hash: string,
  ): Promise<void> {
    const result = await this.dataSource.query(
      `UPDATE users
   SET password_hash = $1,
       updated_at = CURRENT_TIMESTAMP
   WHERE id = $2
   RETURNING *`,
      [password_hash, userId],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async updateRecoveryPasswordConfirmationStatusOrNotFoundFail(code: string) {
    const result = await this.dataSource.query(
      `
    UPDATE public.password_recoveries
    SET is_confirmed = TRUE
    WHERE confirmation_code = $1
      AND expiration_date > NOW()
    RETURNING *;
    `,
      [code],
    );

    if (result.length === 0) {
      throw new NotFoundException('Recovery code not found or expired');
    }
  }

  async deleteByIdOrNotFoundFail(id: number) {
    const [rows] = await this.dataSource.query(
      'UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id',
      [id],
    );

    if (!rows.length) {
      throw new NotFoundException();
    }
  }
}

// CREATE TABLE users (
//   id SERIAL PRIMARY KEY,
//   login TEXT NOT NULL UNIQUE,
//   password_hash TEXT NOT NULL,
//   email TEXT NOT NULL UNIQUE,
//   deleted_at TIMESTAMPTZ,
//   created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
//   updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
// );

// CREATE TABLE email_confirmations (
//   id SERIAL PRIMARY KEY,
//   user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   confirmation_code TEXT NOT NULL,
//   expiration_date TIMESTAMPTZ NOT NULL,
//   is_confirmed BOOLEAN DEFAULT FALSE
// );

// CREATE TABLE password_recoveries (
//   id SERIAL PRIMARY KEY,
//   user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   confirmation_code TEXT NOT NULL,
//   expiration_date TIMESTAMPTZ NOT NULL,
//   is_confirmed BOOLEAN DEFAULT FALSE
// );

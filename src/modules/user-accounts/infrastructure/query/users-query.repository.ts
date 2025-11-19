import { Injectable, NotFoundException } from '@nestjs/common';
import { MeViewDto, UserViewDto } from '../../dto/user/user-view.dto';
import { GetUsersQueryParams } from '../../dto/user/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    // @InjectModel(User.name)
    // private UserModel: any,
    // UserModelType,
  ) {}

  async findMeByIdOrNotFindFail(id: number): Promise<MeViewDto> {
    const result = await this.dataSource.query(
      `SELECT email, login, id AS "userId" FROM users WHERE id = $1`,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('User not found');
    }

    return {
      ...result[0],
      userId: String(result[0].userId),
    };
  }

  async findUserByIdOrNotFindFail(id: number): Promise<UserViewDto> {
    const result = await this.dataSource.query(
      `SELECT email, login, id, created_at AS "createdAt" FROM users WHERE id = $1`,
      [id],
    );

    if (result.length === 0) {
      throw new NotFoundException('User not found');
    }

    return {
      ...result[0],
      id: String(result[0].id),
    };
  }

  async findAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    const values: any[] = [];
    const baseClause = 'deleted_at IS NULL';
    const searchClauses: string[] = [];

    if (query.searchLoginTerm) {
      values.push(`%${query.searchLoginTerm}%`);
      searchClauses.push(`login ILIKE $${values.length}`);
    }

    if (query.searchEmailTerm) {
      values.push(`%${query.searchEmailTerm}%`);
      searchClauses.push(`email ILIKE $${values.length}`);
    }

    let whereSql = `WHERE ${baseClause}`;
    if (searchClauses.length > 0) {
      whereSql += ` AND (${searchClauses.join(' OR ')})`;
    }

    const sortFieldMap: Record<string, string> = {
      login: 'login',
      email: 'email',
      createdAt: 'created_at',
    };

    const sortBy = sortFieldMap[query.sortBy];

    // по этим двум полям надо нечувствительный регистр
    const stringFields = ['login', 'email'];
    const sortField = stringFields.includes(sortBy)
      ? `${sortBy} COLLATE "C"`
      : sortBy;

    // Основной запрос
    const usersSql = `
    SELECT id, login, email, created_at 
    FROM users ${whereSql}
    ORDER BY ${sortField} ${query.sortDirection.toUpperCase()}
    OFFSET ${query.calculateSkip()}
    LIMIT ${query.pageSize};
  `;
    const users = await this.dataSource.query(usersSql, values);

    // Подсчёт общего количества
    const countSql = `SELECT COUNT(*) FROM users ${whereSql};`;
    const countResult = await this.dataSource.query(countSql, values);

    const totalCount = parseInt(countResult[0].count);

    let items = [];
    if (totalCount) {
      items = users.map(UserViewDto.mapToView);
    }

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}

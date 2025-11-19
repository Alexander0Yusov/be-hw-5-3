import { Injectable, NotFoundException } from '@nestjs/common';
import { Blog } from '../../domain/blog/blog.entity';
import { BlogViewDto } from '../../dto/blog/blog-view.dto';
import { GetBlogsQueryParams } from '../../dto/blog/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async findByIdOrNotFoundFail(id: string): Promise<BlogViewDto> {
    const [blog] = await this.dataSource.query(
      `SELECT * FROM blogs b WHERE b.id = $1`,
      [Number(id)],
    );

    if (!blog) {
      throw new NotFoundException('blog not found');
    }

    return {
      id: blog.id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.website_url,
      createdAt: blog.created_at,
      isMembership: blog.is_membership,
    };
  }

  async getAll(
    query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const values: any[] = [];
    const searchClauses: string[] = [];

    if (query.searchNameTerm) {
      values.push(`%${query.searchNameTerm}%`);
      searchClauses.push(`name ILIKE $${values.length}`);
    }

    let whereSql = ``;
    if (searchClauses.length > 0) {
      whereSql += ` WHERE (${searchClauses.join(' AND ')})`;
    }

    const sortFieldMap: Record<string, string> = {
      name: 'name',
      createdAt: 'created_at',
    };

    // если существует запрос на сортировку по столбцу то переменная заполнится
    const sortBy = sortFieldMap[query.sortBy];

    // по этим полям (одно, но можно расширять) надо нечувствительный регистр
    const stringFields = ['name'];
    const sortField = stringFields.includes(sortBy)
      ? `${sortBy} COLLATE "C"`
      : sortBy;

    // Основной запрос
    const blogsSql = `
      SELECT id, name, description, website_url, created_at, is_membership 
      FROM blogs ${whereSql}
      ORDER BY ${sortField} ${query.sortDirection.toUpperCase()}
      OFFSET ${query.calculateSkip()}
      LIMIT ${query.pageSize};
    `;
    const blogs = await this.dataSource.query(blogsSql, values);

    // Подсчёт общего количества
    const countSql = `SELECT COUNT(*) FROM blogs ${whereSql};`;
    const countResult = await this.dataSource.query(countSql, values);

    const totalCount = parseInt(countResult[0].count);

    let items = [];
    if (totalCount) {
      items = blogs.map(BlogViewDto.mapToView);
    }

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}

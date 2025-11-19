import { Injectable, NotFoundException } from '@nestjs/common';

import { PostViewDto } from '../../dto/post/post-view.dto';
import { Like, LikeStatus } from '../../domain/like/like.entity';

import { GetPostsQueryParams } from '../../dto/post/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';

import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { PostDbDto } from '../../dto/post/post-db.dto';

@Injectable()
export class PostsQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async findByIdOrNotFoundFail(id: string): Promise<PostViewDto> {
    const [post] = await this.dataSource.query(
      `SELECT * FROM posts p WHERE p.id = $1`,
      [Number(id)],
    );

    if (!post) {
      throw new NotFoundException('blog not found');
    }

    // допилить склейку с лайком

    return {
      id: post.id.toString(),
      title: post.title,
      shortDescription: post.short_description,
      content: post.content,
      blogId: post.blog_id.toString(),
      blogName: post.blog_name,
      createdAt: post.created_at,
      extendedLikesInfo: {
        likesCount: post.likes_count,
        dislikesCount: post.dislikes_count,
        newestLikes: [],
        myStatus: LikeStatus.None,
      },
    };
  }

  async getAll(
    query: GetPostsQueryParams,
    blogId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const values: any[] = [];
    let whereSql = ``;

    if (blogId) {
      whereSql += ` WHERE blog_id = $1`;
      values.push(Number(blogId));
    }

    const sortFieldMap: Record<string, string> = {
      title: 'title',
      blogName: 'blog_name',
      createdAt: 'created_at',
    };

    // если существует запрос на сортировку по столбцу то переменная заполнится
    const sortBy = sortFieldMap[query.sortBy];

    // по этим полям (одно, но можно расширять) надо нечувствительный регистр
    const stringFields = ['title', 'blog_name'];
    const sortField = stringFields.includes(sortBy)
      ? `${sortBy} COLLATE "C"`
      : sortBy;

    // Основной запрос
    const blogsSql = `
          SELECT * 
          FROM posts ${whereSql}
          ORDER BY ${sortField} ${query.sortDirection.toUpperCase()}
          OFFSET ${query.calculateSkip()}
          LIMIT ${query.pageSize};
        `;

    const posts: PostDbDto[] = await this.dataSource.query(blogsSql, values);

    // Подсчёт общего количества
    const countSql = `SELECT COUNT(*) FROM posts ${whereSql};`;
    const countResult = await this.dataSource.query(countSql, values);

    const totalCount = parseInt(countResult[0].count);

    let items;
    if (posts.length) {
      items = posts.map(PostViewDto.mapToView);
    } else {
      items = [];
    }

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';

import { PostViewDto } from '../../dto/post/post-view.dto';
import { LikeStatus } from '../../domain/like/like.entity';

import { GetPostsQueryParams } from '../../dto/post/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';

import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { LikeForArrayViewDto, PostDbDto } from '../../dto/post/post-db.dto';

@Injectable()
export class PostsQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async findByIdOrNotFoundFail(id: string): Promise<PostViewDto> {
    const [post] = await this.dataSource.query(
      `SELECT p.id, p.title, p.short_description, p.content, p.blog_id, p.created_at,
      b.name AS blog_name
      FROM posts p
      JOIN blogs b ON p.blog_id = b.id
      WHERE p.id = $1;`,
      [Number(id)],
    );

    if (!post) {
      throw new NotFoundException('blog not found');
    }

    const [likes] = await this.dataSource.query(
      `
      SELECT
      COUNT(*) FILTER (WHERE status = 'Like')::int AS likes_count,
      COUNT(*) FILTER (WHERE status = 'Dislike')::int AS dislikes_count
      FROM likes
      WHERE parent_id = $1 AND parent_type = 'post';`,
      [Number(id)],
    );

    const newest_likes = await this.dataSource.query(
      `
      SELECT
      l.created_at AS "addedAt",
      l.user_id::text AS "userId",
      u.login AS "login"
      FROM likes l
      JOIN users u ON l.user_id = u.id
      WHERE l.parent_id = $1 AND l.parent_type = 'post' AND l.status = 'Like'
      ORDER BY l.created_at DESC
      LIMIT 3;`,
      [Number(id)],
    );

    return {
      id: post.id.toString(),
      title: post.title,
      shortDescription: post.short_description,
      content: post.content,
      blogId: post.blog_id.toString(),
      blogName: post.blog_name,
      createdAt: post.created_at,
      extendedLikesInfo: {
        likesCount: likes.likes_count,
        dislikesCount: likes.dislikes_count,
        newestLikes: newest_likes,
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
      whereSql += ` WHERE p.blog_id = $1`;
      values.push(Number(blogId));
    }

    const sortFieldMap: Record<string, string> = {
      title: 'p.title',
      blogName: 'b.name',
      createdAt: 'p.created_at',
    };

    const sortBy = sortFieldMap[query.sortBy] ?? 'p.created_at';

    const stringFields = ['p.title', 'b.name'];
    const sortField = stringFields.includes(sortBy)
      ? `${sortBy} COLLATE "C"`
      : sortBy;

    // Основной запрос с JOIN
    const postsSql = `
    SELECT 
      p.id,
      p.title,
      p.short_description,
      p.content,
      p.blog_id,
      p.created_at,
      p.updated_at,
      b.name AS blog_name
    FROM posts p
    JOIN blogs b ON p.blog_id = b.id
    ${whereSql}
    ORDER BY ${sortField} ${query.sortDirection.toUpperCase()}
    OFFSET ${query.calculateSkip()}
    LIMIT ${query.pageSize};
  `;

    const posts: PostDbDto[] = await this.dataSource.query(postsSql, values);

    // берем айдишки постов
    const postsIds = posts.length ? posts.map((item) => item.id) : [];

    // ищем кол лайков дизлайков
    const counts: {
      post_id: number;
      likes_count: number;
      dislikes_count: number;
    }[] = await this.dataSource.query(
      `
  SELECT 
    l.parent_id AS post_id,
    COUNT(*) FILTER (WHERE l.status = 'Like')::int AS likes_count,
    COUNT(*) FILTER (WHERE l.status = 'Dislike')::int AS dislikes_count
  FROM likes l
  WHERE l.parent_type = 'post' AND l.parent_id = ANY($1)
  GROUP BY l.parent_id;
  `,
      [postsIds],
    );

    // ищем последние три лайка
    const newestLikes: {
      post_id: number;
      newest_likes: LikeForArrayViewDto[];
    }[] = await this.dataSource.query(
      `
  SELECT 
  sub.post_id,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        -- 'addedAt', to_char(sub.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'addedAt', sub.created_at,
        'userId', sub.user_id::text,
        'login', sub.login
      )
      ORDER BY sub.created_at DESC
    ),
    '[]'::jsonb
  ) AS newest_likes
FROM (
  SELECT 
    l.parent_id AS post_id,
    l.created_at,
    l.user_id,
    u.login,
    ROW_NUMBER() OVER (PARTITION BY l.parent_id ORDER BY l.created_at DESC) AS rn
  FROM likes l
  JOIN users u ON l.user_id = u.id
  WHERE l.parent_type = 'post'
    AND l.status = 'Like'
    AND l.parent_id = ANY($1)
) sub
WHERE sub.rn <= 3
GROUP BY sub.post_id;
  `,
      [postsIds],
    );

    // мапим базовую часть, добавляя счетчики лайков и по последним трем лайкам
    const fullPosts = posts.map((post) => {
      const additionalCountsForPost = counts.find(
        (item) => item.post_id === post.id,
      ) ?? { likes_count: 0, dislikes_count: 0 };

      const additionalNewestLikesForPost = newestLikes.find(
        (item) => item.post_id === post.id,
      );

      if (additionalNewestLikesForPost) {
        return {
          ...post,
          ...additionalCountsForPost,
          newest_likes: [
            ...additionalNewestLikesForPost.newest_likes.map((like) => ({
              addedAt: new Date(like.addedAt).toISOString(),
              userId: like.userId,
              login: like.login,
            })),
          ],
        };
      } else {
        return {
          ...post,
          ...additionalCountsForPost,
          newest_likes: [],
        };
      }
    });

    const items = fullPosts.length ? fullPosts.map(PostViewDto.mapToView) : [];

    // Подсчёт общего количества
    const countSql = `
    SELECT COUNT(*) 
    FROM posts p
    JOIN blogs b ON p.blog_id = b.id
    ${whereSql};
  `;

    const countResult = await this.dataSource.query(countSql, values);
    const totalCount = parseInt(countResult[0].count);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}

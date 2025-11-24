import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CommentViewDto } from '../../dto/comment/comment-view.dto';
import { GetCommentsQueryParams } from '../../dto/comment/get-comments-query-params.input-dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CommentDbDto } from '../../dto/comment/comment-db.dto';

@Injectable()
export class CommentsQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async findByIdOrNotFoundFail(
    commentId: string,
    authorId?: string,
  ): Promise<CommentViewDto> {
    const params: any[] = [Number(commentId)];

    let sql = `
  SELECT c.id, c.content, c.user_id, c.created_at, u.login, l.status
  FROM comments c
  JOIN users u ON c.user_id = u.id
  LEFT JOIN likes l ON l.parent_id = c.id AND l.parent_type = 'comment'
`;

    if (authorId) {
      sql += ` AND l.user_id = $2`;
      params.push(Number(authorId));
    }

    sql += ` WHERE c.id = $1`;

    const [comment] = await this.dataSource.query(sql, params);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const { id, content, user_id, login, status, created_at } = comment;

    const [counts] = await this.dataSource.query(
      `
      SELECT
      COUNT(*) FILTER (WHERE status = 'Like')::int  AS likes_count,
      COUNT(*) FILTER (WHERE status = 'Dislike')::int AS dislikes_count
      FROM likes
      WHERE parent_id = $1 AND parent_type = $2 AND status != 'None';
      `,
      [Number(commentId), 'comment'],
    );

    return {
      id: String(id),
      content: content,
      commentatorInfo: { userId: String(user_id), userLogin: login },
      createdAt: created_at,
      likesInfo: {
        likesCount: counts.likes_count,
        dislikesCount: counts.dislikes_count,
        myStatus: status ?? 'None',
      },
    };
  }

  async findManyByPostId(
    id: string,
    queryDto: GetCommentsQueryParams,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const { pageNumber, pageSize, sortBy, sortDirection } = queryDto;
    const skip = (pageNumber - 1) * pageSize;

    const commentsQuery = `
    SELECT 
  c.id,
  c.content,
  c.user_id,
  c.created_at,
  u.login,
  COUNT(*) FILTER (WHERE l.status = 'Like')::int AS "likesCount",
  COUNT(*) FILTER (WHERE l.status = 'Dislike')::int AS "dislikesCount"
FROM comments c
JOIN users u ON c.user_id = u.id
LEFT JOIN likes l 
  ON l.parent_id = c.id 
 AND l.parent_type = 'comment'
WHERE c.post_id = $1
GROUP BY c.id, c.content, c.user_id, c.created_at, u.login
ORDER BY c.created_at ${sortDirection.toUpperCase()}
OFFSET $2
LIMIT $3;
  `;

    const comments: (CommentDbDto & {
      login: string;
      likesCount: number;
      dislikesCount: number;
    })[] = await this.dataSource.query(commentsQuery, [
      Number(id),
      skip,
      pageSize,
    ]);

    const items = comments.map((comment) => CommentViewDto.mapToView(comment));

    const totalCountResult = await this.dataSource.query(
      `
    SELECT COUNT(*)::int AS "totalCount"
    FROM comments c
    WHERE c.post_id = $1;
    `,
      [Number(id)],
    );

    return PaginatedViewDto.mapToView({
      items,
      totalCount: totalCountResult[0].totalCount,
      page: queryDto.pageNumber,
      size: queryDto.pageSize,
    });
  }
}

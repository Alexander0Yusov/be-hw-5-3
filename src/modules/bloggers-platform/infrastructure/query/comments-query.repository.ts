import { Injectable, NotFoundException } from '@nestjs/common';
import { Post } from '../../domain/post/post.entity';
import { PostViewDto } from '../../dto/post/post-view.dto';
import { Like } from '../../domain/like/like.entity';
import { GetPostsQueryParams } from '../../dto/post/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { Blog } from '../../domain/blog/blog.entity';
import { Comment } from '../../domain/comment/comment.entity';
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

    console.log(44444, comment, '==', counts);

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
  COUNT(*) FILTER (WHERE l.status = 'Like')    AS likeCount,
  COUNT(*) FILTER (WHERE l.status = 'Dislike') AS dislikeCount
FROM comments c
JOIN users u ON c.user_id = u.id
LEFT JOIN likes l 
  ON l.parent_id = c.id 
 AND l.parent_type = 'comment'
WHERE c.post_id = $1
GROUP BY c.id, c.content, c.user_id, c.created_at, u.login
ORDER BY c.${sortBy} ${sortDirection}
OFFSET $2
LIMIT $3;
  `;

    const comments: (CommentDbDto & {
      login: string;
      likeCount: number;
      dislikeCount: number;
    })[] = await this.dataSource.query(commentsQuery, [
      Number(id),
      skip,
      pageSize,
    ]);

    const items = comments.map((comment) => CommentViewDto.mapToView(comment));

    return PaginatedViewDto.mapToView({
      items,
      totalCount: comments.length,
      page: queryDto.pageNumber,
      size: queryDto.pageSize,
    });
  }
}

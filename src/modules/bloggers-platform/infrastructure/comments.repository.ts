import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CommentDbDto } from '../dto/comment/comment-db.dto';
import { CommentViewDto } from '../dto/comment/comment-view.dto';
import { LikeStatus } from '../domain/like/like.entity';
import { CommentUpdateDto } from '../dto/comment/comment-update.dto';

@Injectable()
export class CommentsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async create(dto: Partial<CommentDbDto>): Promise<number> {
    const result = await this.dataSource.query(
      `
  INSERT INTO comments (content, user_id, post_id)
  VALUES($1, $2, $3)
  RETURNING id
      `,
      [dto.content, dto.user_id, dto.post_id],
    );

    return result[0].id;
  }

  async update(dto: CommentUpdateDto, id: string): Promise<CommentDbDto> {
    const [comment] = await this.dataSource.query(
      `
    UPDATE comments
    SET content = $2,
    updated_at = NOW()
    WHERE id = $1;
    `,
      [Number(id), dto.content],
    );

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    return comment;
  }

  async findById(id: string): Promise<CommentDbDto> {
    const [comment] = await this.dataSource.query(
      `
    SELECT *
    FROM comments c
    WHERE c.id = $1
    `,
      [Number(id)],
    );

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    return comment;
  }

  async findByIdOrNotFoundFail(id: string): Promise<CommentViewDto> {
    const [comment] = await this.dataSource.query(
      `
    SELECT 
  c.id,
  c.content,
  c.user_id,
  c.created_at,
  u.login,
  COUNT(*) FILTER (WHERE l.status = 'Like')::int    AS "likesCount",
  COUNT(*) FILTER (WHERE l.status = 'Dislike')::int AS "dislikesCount"
FROM comments c
JOIN users u ON c.user_id = u.id
LEFT JOIN likes l 
  ON l.parent_id = c.id 
 AND l.parent_type = 'comment'
WHERE c.id = $1
GROUP BY c.id, c.content, c.user_id, c.created_at, u.login;
    `,
      [Number(id)],
    );

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    return {
      id: String(comment.id),
      content: comment.content,
      commentatorInfo: {
        userId: String(comment.user_id),
        userLogin: comment.login,
      },
      createdAt: comment.created_at,
      likesInfo: {
        likesCount: comment.likesCount,
        dislikesCount: comment.dislikesCount,
        myStatus: LikeStatus.None,
      },
    };
  }

  async findByIdAndDelete(id: string): Promise<void> {
    await this.dataSource.query(
      `
    DELETE FROM comments
    WHERE id = $1;
    `,
      [Number(id)],
    );
  }
}

// CREATE TABLE comments (
//   id SERIAL PRIMARY KEY,
//   content TEXT NOT NULL,
//   user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
//   created_at TIMESTAMP NOT NULL DEFAULT NOW(),
//   updated_at TIMESTAMP NOT NULL DEFAULT NOW()
// );

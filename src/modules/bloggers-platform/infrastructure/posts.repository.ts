import { Injectable, NotFoundException } from '@nestjs/common';
import { Post } from '../domain/post/post.entity';
import { CreatePostDomainDto } from '../dto/post/create-post-domain.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PostUpdateDto } from '../dto/post/post-update.dto';

@Injectable()
export class PostsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async create(dto: Partial<CreatePostDomainDto>) {
    const result = await this.dataSource.query(
      `INSERT INTO posts (title, short_description, content, blog_id, blog_name) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id`,
      [dto.title, dto.shortDescription, dto.content, dto.blogId, dto.blogName],
    );

    return result[0].id;
  }

  async findOrNotFoundFail(id: string): Promise<any> {
    // PostDocument
    // const post = await this.PostModel.findById(id);
    // if (!post) {
    //   //TODO: replace with domain exception
    //   throw new NotFoundException('post not found');
    // }
    // return post;
  }

  async deleteOrNotFoundFail(id: string): Promise<void> {
    const [rows, rowCount] = await this.dataSource.query(
      `DELETE FROM posts WHERE id = $1 RETURNING id`,
      [Number(id)],
    );

    if (rowCount === 0) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }
  }

  async update(dto: PostUpdateDto, id: string): Promise<void> {
    const [rows, rowCount] = await this.dataSource.query(
      `
      UPDATE posts SET title = $1, short_description = $2, content = $3
      WHERE blog_id = $4 AND id = $5
      RETURNING id      
      `,
      [
        dto.title,
        dto.shortDescription,
        dto.content,
        Number(dto.blogId),
        Number(id),
      ],
    );

    if (rowCount === 0) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }

    return rows[0].id;
  }
}

// CREATE TABLE posts (
//   id SERIAL PRIMARY KEY,
//   title TEXT NOT NULL,
//   short_description TEXT NOT NULL,
//   content TEXT NOT NULL,
//   blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
//   blog_name TEXT NOT NULL,
//   likes_count INTEGER NOT NULL DEFAULT 0,
//   dislikes_count INTEGER NOT NULL DEFAULT 0,
//   newest_likes JSONB NOT NULL DEFAULT '[]',
//   created_at TIMESTAMP NOT NULL DEFAULT NOW(),
//   updated_at TIMESTAMP NOT NULL DEFAULT NOW()
// );

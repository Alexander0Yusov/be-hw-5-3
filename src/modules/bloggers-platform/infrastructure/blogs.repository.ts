import { Injectable, NotFoundException } from '@nestjs/common';
import { Blog } from '../domain/blog/blog.entity';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { BlogInputDto } from '../dto/blog/blog-input.dto';

@Injectable()
export class BlogsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async create(dto: BlogInputDto): Promise<number> {
    const result = await this.dataSource.query(
      `
      INSERT INTO blogs (name, description, website_url)
      VALUES ($1, $2, $3)
      RETURNING id`,
      [dto.name, dto.description, dto.websiteUrl],
    );

    return result[0].id;
  }

  async update(dto: BlogInputDto, id: string): Promise<void> {
    const result = await this.dataSource.query(
      `
      UPDATE blogs SET name = $1, description = $2, website_url = $3
      WHERE id = $4`,
      [dto.name, dto.description, dto.websiteUrl, Number(id)],
    );

    if (result.length === 0) {
      throw new Error(`Blog with id=${id} not found or not updated`);
    }
  }

  async findOrNotFoundFail(id: string): Promise<any> {
    // BlogDocument
    // const blog = await this.BlogModel.findById(id);
    // if (!blog) {
    //   //TODO: replace with domain exception
    //   throw new NotFoundException('blog not found');
    // }
    // return blog;
  }

  async findById(id: string): Promise<any | null> {}

  async deleteOrNotFoundFail(id: string): Promise<void> {
    const [rows, rowCount] = await this.dataSource.query(
      `DELETE FROM blogs WHERE id = $1 RETURNING id`,
      [Number(id)],
    );

    if (rowCount === 0) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }
  }
}

// CREATE TABLE blogs (
//     id SERIAL PRIMARY KEY,                -- уникальный идентификатор
//     name VARCHAR(255) NOT NULL,           -- название блога
//     description TEXT,                     -- описание
//     website_url VARCHAR(255),             -- ссылка на сайт
//     is_membership BOOLEAN DEFAULT FALSE,  -- флаг членства
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- дата создания
//     updated_at TIMESTAMP DEFAULT NULL     -- дата обновления
// );

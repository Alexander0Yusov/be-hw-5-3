import { Injectable } from '@nestjs/common';
import { Like } from '../domain/like/like.entity';
import { LikeStatus } from '../domain/like/like.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class LikesRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async createOrUpdate(
    parentId: string,
    authorId: string,
    parent_type: 'comment' | 'post',
    newStatus: LikeStatus,
  ): Promise<number> {
    const result = await this.dataSource.query(
      `
      INSERT INTO likes (user_id, parent_id, parent_type, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, parent_id, parent_type)
      DO UPDATE SET status = $4, updated_at = now()
      RETURNING status
      `,
      [Number(authorId), Number(parentId), parent_type, newStatus],
    );

    return result[0].status;
  }

  // async countReactions(
  //   parentId: string,
  // ): Promise<{ likes: number; dislikes: number }> {
  //   const result = await this.LikeModel.aggregate([
  //     {
  //       $match: {
  //         parentId: '', // new Types.ObjectId(parentId),
  //         status: { $in: [LikeStatus.Like, LikeStatus.Dislike] },
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: '$status',
  //         count: { $sum: 1 },
  //       },
  //     },
  //   ]);

  //   let likes = 0;
  //   let dislikes = 0;

  //   for (const item of result) {
  //     if (item._id === LikeStatus.Like) likes = item.count;
  //     if (item._id === LikeStatus.Dislike) dislikes = item.count;
  //   }

  //   return { likes, dislikes };
  // }

  // async deleteManyByParentId(parentId: string): Promise<void> {
  //   await this.LikeModel.deleteMany({
  //     parentId: '', // new Types.ObjectId(parentId)
  //   });
  // }

  // async findByCommentIdByAuthorId(
  //   parentId: string,
  //   authorId: string,
  // ): Promise<any> {
  //   // LikeDocument | null
  //   const like = await this.LikeModel.findOne({
  //     parentId: '', // new Types.ObjectId(parentId),
  //     authorId: '', // new Types.ObjectId(authorId),
  //     // parentModel: 'Comment',
  //   });

  //   return like;
  // }

  async findByPostIdByAuthorId(
    parentId: string,
    authorId: string,
  ): Promise<{ status: LikeStatus }> {
    const [like] = await this.dataSource.query(
      `
      SELECT l.status
      FROM likes l
      WHERE l.parent_type = 'post' AND l.user_id = $1 AND l.parent_id = $2
      `,
      [Number(authorId), Number(parentId)],
    );

    return like;
  }

  async findByCommentIdByAuthorId(
    parentId: string,
    authorId: string,
  ): Promise<{
    status: LikeStatus;
  }> {
    const [like] = await this.dataSource.query(
      `
      SELECT status
FROM likes
WHERE parent_id = $1
  AND parent_type = 'comment'
  AND user_id = $2;
      `,
      [Number(parentId), Number(authorId)],
    );

    return like;
  }

  // async getLatestLikes(parentId: string): Promise<any> {
  //   // LikeDocument[]
  //   const latestLikes = await this.LikeModel.find({
  //     parentId: '', // new Types.ObjectId(parentId),
  //     status: 'Like',
  //   })
  //     .sort({ createdAt: -1 }) // сортировка по времени — от новых к старым
  //     .limit(3);

  //   return latestLikes;
  // }
}

// CREATE TYPE parent_kind AS ENUM ('post', 'comment');

// CREATE TABLE likes (
//     user_id     INT NOT NULL,
//     parent_id   INT NOT NULL,
//     parent_type parent_kind NOT NULL,
//     status      BOOLEAN NOT NULL,
//     created_at  TIMESTAMP DEFAULT now(),
//     updated_at  TIMESTAMP DEFAULT now(),
//     PRIMARY KEY (user_id, parent_id, parent_type)
// );

import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { LikeDbDto } from '../../dto/like/like-db.dto';

@Injectable()
export class LikesQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getMyLikesForPostsIds(
    postsIds: number[],
    myId: string,
  ): Promise<LikeDbDto[]> {
    const res = await this.dataSource.query(
      `
      SELECT *
      FROM likes l
      WHERE l.parent_type = 'post' AND l.parent_id = ANY($1) AND l.user_id = $2
      `,
      [postsIds, Number(myId)],
    );

    return res;
  }

  async getMyLikesForCommentsIds(
    commentsIds: number[],
    myId: string,
  ): Promise<LikeDbDto[]> {
    const res = await this.dataSource.query(
      `
      SELECT *
      FROM likes l
      WHERE l.parent_type = 'comment' AND l.parent_id = ANY($1) AND l.user_id = $2
      `,
      [commentsIds, Number(myId)],
    );

    return res;
  }
}

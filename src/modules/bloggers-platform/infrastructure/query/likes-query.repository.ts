import { Injectable } from '@nestjs/common';
import { Like } from '../../domain/like/like.entity';

@Injectable()
export class LikesQueryRepository {
  constructor() //@InjectModel(Like.name)
  // private LikeModel: any,
  //LikeModelType
  {}

  // async getLikesByParentsIds(
  //   parentsIds: any, // Types.ObjectId[],
  //   userId: string,
  // ): Promise<Like[]> {
  //   return await this.LikeModel.find({
  //     parentId: { $in: parentsIds },
  //     authorId: '', // new Types.ObjectId(userId),
  //     status: { $in: ['Like', 'Dislike'] },
  //   }).lean();
  // }
}

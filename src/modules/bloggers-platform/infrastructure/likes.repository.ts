import { Injectable } from '@nestjs/common';
import { Like } from '../domain/like/like.entity';
import { LikeStatus } from '../domain/like/like.entity';

@Injectable()
export class LikesRepository {
  constructor(
    // @InjectModel(Like.name)
    private LikeModel: any,
    // LikeModelType
  ) {}

  async save(
    like: any,
    // LikeDocument
  ) {
    await like.save();
  }

  async createOrUpdate(
    parentId: string,
    authorId: string,
    newStatus: LikeStatus,
    login?: string,
  ): Promise<string> {
    const result = await this.LikeModel.findOneAndUpdate(
      {
        parentId: '', // new Types.ObjectId(parentId),
        authorId: '', // new Types.ObjectId(authorId),
      },
      {
        $set: { status: newStatus, login },
      },
      {
        new: true, // вернуть обновлённый документ
        upsert: true, // создать, если не найден
      },
    ).lean();

    return result.status;
  }

  async countReactions(
    parentId: string,
  ): Promise<{ likes: number; dislikes: number }> {
    const result = await this.LikeModel.aggregate([
      {
        $match: {
          parentId: '', // new Types.ObjectId(parentId),
          status: { $in: [LikeStatus.Like, LikeStatus.Dislike] },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    let likes = 0;
    let dislikes = 0;

    for (const item of result) {
      if (item._id === LikeStatus.Like) likes = item.count;
      if (item._id === LikeStatus.Dislike) dislikes = item.count;
    }

    return { likes, dislikes };
  }

  async deleteManyByParentId(parentId: string): Promise<void> {
    await this.LikeModel.deleteMany({
      parentId: '', // new Types.ObjectId(parentId)
    });
  }

  async findByCommentIdByAuthorId(
    parentId: string,
    authorId: string,
  ): Promise<any> {
  // LikeDocument | null
    const like = await this.LikeModel.findOne({
      parentId: '', // new Types.ObjectId(parentId),
      authorId: '', // new Types.ObjectId(authorId),
      // parentModel: 'Comment',
    });

    return like;
  }

  async findByPostIdByAuthorId(
    parentId: string,
    authorId: string,
  ): Promise<any> {
  // LikeDocument | null
    const like = await this.LikeModel.findOne({
      parentId: '', // new Types.ObjectId(parentId),
      authorId: '', // new Types.ObjectId(authorId),
      // parentModel: 'Post',
    });

    return like;
  }

  async getLatestLikes(parentId: string): Promise<any> {
  // LikeDocument[]
    const latestLikes = await this.LikeModel.find({
      parentId: '', // new Types.ObjectId(parentId),
      status: 'Like',
    })
      .sort({ createdAt: -1 }) // сортировка по времени — от новых к старым
      .limit(3);

    return latestLikes;
  }
}

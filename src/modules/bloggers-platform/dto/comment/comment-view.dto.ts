import { Comment } from '../../domain/comment/comment.entity';
import { LikeStatus } from '../../domain/like/like.entity';
import { CommentDbDto } from './comment-db.dto';

export class CommentatorInfo {
  userId: string;
  userLogin: string;
}

export class CommentViewDto {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  createdAt: string;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatus;
  };

  static mapToView(
    comment: CommentDbDto & {
      login: string;
      likeCount: number;
      dislikeCount: number;
    },
    myStatus: LikeStatus = LikeStatus.None,
  ): CommentViewDto {
    return {
      id: comment.id.toString(),
      content: comment.content,
      commentatorInfo: {
        userId: comment.user_id.toString(),
        userLogin: comment.login.toString(),
      },
      createdAt: comment.created_at.toISOString(),
      likesInfo: {
        likesCount: comment.likeCount,
        dislikesCount: comment.dislikeCount,
        myStatus: myStatus,
      },
    };
  }
}

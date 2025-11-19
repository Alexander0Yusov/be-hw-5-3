import { CommentatorInfo } from './commentator-info';
import { CreateCommentDomainDto } from '../../dto/comment/create-comment-domain';

// @Schema({ timestamps: true })
export class Comment {
  // @Prop({ type: String, required: true })
  content: string;

  // @Prop({ type: CommentatorInfoSchema })
  commentatorInfo: CommentatorInfo;

  // @Prop({ type: Types.ObjectId, required: true })
  postId: any; //Types.ObjectId;

  // @Prop({ type: Number, required: true })
  likeCount: number;

  // @Prop({ type: Number, required: true })
  dislikeCount: number;

  createdAt: Date;
  updatedAt: Date;

  updateContent(newContent: string) {
    this.content = newContent;
  }

  updateLikesCounters(likes: number, dislikes: number) {
    this.likeCount = likes;
    this.dislikeCount = dislikes;
  }

  //   static mapToView(like: Like) {
  //     return {
  //       addedAt: like.createdAt.toISOString(),
  //       userId: like.authorId.toString(),
  //       login: like.login,
  //     };
  //   }
}

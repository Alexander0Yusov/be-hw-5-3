import { LikeForArrayViewDto } from '../../dto/like/like-for-array-view.dto';

export enum LikeStatus {
  Like = 'Like',
  Dislike = 'Dislike',
  None = 'None',
}

// @Schema({ timestamps: true })
export class Like {
  // @Prop({ type: String, enum: LikeStatus, required: true })
  status: LikeStatus;

  // @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  authorId: any; // Types.ObjectId;

  // @Prop({ type: Types.ObjectId, required: true, refPath: 'parentModel' })
  parentId: any; // Types.ObjectId;

  // расшифровка двойной ссылки на две коллекции refPath: 'parentModel'
  // @Prop({ type: String, required: true, enum: ['Post', 'Comment'] })
  parentModel: 'Post' | 'Comment';

  // @Prop({ type: String, required: true })
  login: string;

  createdAt: Date;
  updatedAt: Date;

  // static mapToView(like: LikeDocument): LikeForArrayViewDto {
  //   return {
  //     addedAt: like.createdAt.toISOString(),
  //     userId: like.authorId.toString(),
  //     login: like.login,
  //   };
  // }
}

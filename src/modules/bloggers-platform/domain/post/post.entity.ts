import { CreatePostDomainDto } from '../../dto/post/create-post-domain.dto';
import { PostUpdateDto } from '../../dto/post/post-update.dto';
import { LikeForArrayViewDto } from '../../dto/like/like-for-array-view.dto';

// @Schema({ timestamps: true })
export class Post {
  // @Prop({ type: String, required: true })
  title: string;

  // @Prop({ type: String, required: true })
  shortDescription: string;

  // @Prop({ type: String, required: true })
  content: string;

  // @Prop({ type: Types.ObjectId, required: true, ref: 'Blog' })
  blogId: ''; // Types.ObjectId;

  // @Prop({ type: String, required: true })
  blogName: string;

  // @Prop({ type: Number, required: true })
  likesCount: number;

  // @Prop({ type: Number, required: true })
  dislikesCount: number;

  // @Prop({ type: [Object], default: [] })
  newestLikes: LikeForArrayViewDto[];

  createdAt: Date;
  updatedAt: Date;
}

import { CreateBlogDomainDto } from '../../dto/blog/create-blog-domain.dto';
import { BlogUpdateDto } from '../../dto/blog/blog-update.dto';

// @Schema({ timestamps: true })
export class Blog {
  // @Prop({ required: true })
  name: string;

  // @Prop({ required: true, max: 1000 })
  description: string;

  // @Prop({ required: true })
  websiteUrl: string;

  // @Prop({ default: false })
  isMembership: boolean;

  createdAt: Date;
  updatedAt: Date;
}

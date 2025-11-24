import { LikeStatus } from '../../domain/like/like.entity';

export class PostViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  //
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatus;
    newestLikes: {
      addedAt: string;
      userId: string;
      login: string;
    }[];
  };

  static mapToView(data: any): PostViewDto {
    return {
      id: String(data.id),
      title: data.title,
      shortDescription: data.short_description,
      content: data.content,
      blogId: String(data.blog_id),
      blogName: data.blog_name,
      createdAt: data.created_at.toISOString(),
      extendedLikesInfo: {
        likesCount: data.likes_count,
        dislikesCount: data.dislikes_count,
        myStatus: LikeStatus.None,
        newestLikes: data.newest_likes,
      },
    };
  }
}

export type PostDbDto = {
  id: number;
  title: string;
  short_description: string;
  content: string;
  blog_id: number;
  blog_name: string;
  likes_count: number;
  dislikes_count: number;
  newest_likes: LikeForArrayViewDto[];
  created_at: Date;
  updated_at: Date;
};

export type LikeForArrayViewDto = {
  addedAt: string;
  userId: string;
  login: string;
};

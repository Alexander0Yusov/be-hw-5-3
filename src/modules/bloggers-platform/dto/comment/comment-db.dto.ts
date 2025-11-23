export type CommentDbDto = {
  id: number;
  content: string;
  user_id: number;
  post_id: number;
  created_at: Date;
  updated_at: Date;
};

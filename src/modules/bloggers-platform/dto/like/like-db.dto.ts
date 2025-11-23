import { LikeStatus } from '../../domain/like/like.entity';

export type ParentKind = 'post' | 'comment';

export type LikeDbDto = {
  user_id: number;
  parent_id: number;
  parent_type: ParentKind;
  status: LikeStatus;
  created_at: Date;
  updated_at: Date;
};

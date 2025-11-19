export class CreateCommentDomainDto {
  content: string;
  userId: any; // Types.ObjectId;
  userLogin: string;
  postId: any; // Types.ObjectId;
  likesCount: number;
  dislikesCount: number;
}

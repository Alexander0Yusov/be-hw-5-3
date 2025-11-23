import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Comment } from 'src/modules/bloggers-platform/domain/comment/comment.entity';
import { CommentInputDto } from 'src/modules/bloggers-platform/dto/comment/comment-input.dto';
import { CreateCommentDomainDto } from 'src/modules/bloggers-platform/dto/comment/create-comment-domain';
import { CommentsRepository } from 'src/modules/bloggers-platform/infrastructure/comments.repository';
import { PostsQueryRepository } from 'src/modules/bloggers-platform/infrastructure/query/posts-query.repository';
import { UsersQueryRepository } from 'src/modules/user-accounts/infrastructure/query/users-query.repository';

export class CreateCommentCommand {
  constructor(
    public dto: CommentInputDto,
    public postId: string,
    public userId: string,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand, string>
{
  constructor(
    private commentsRepository: CommentsRepository,
    private postsQueryRepository: PostsQueryRepository,
    private usersQueryRepository: UsersQueryRepository,
  ) {}

  async execute({
    dto,
    postId,
    userId,
  }: CreateCommentCommand): Promise<string> {
    await this.postsQueryRepository.findByIdOrNotFoundFail(postId);
    // const user = await this.usersQueryRepository.findByIdOrNotFoundFail(userId);

    const commentId = await this.commentsRepository.create({
      content: dto.content,
      user_id: Number(userId),
      post_id: Number(postId),
    });

    return commentId.toString();
  }
}

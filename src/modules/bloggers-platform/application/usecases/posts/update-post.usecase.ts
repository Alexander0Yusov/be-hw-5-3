import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostUpdateDto } from 'src/modules/bloggers-platform/dto/post/post-update.dto';
import { PostsRepository } from 'src/modules/bloggers-platform/infrastructure/posts.repository';

export class UpdatePostCommand {
  constructor(
    public dto: PostUpdateDto,
    public postId: string,
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase
  implements ICommandHandler<UpdatePostCommand, void>
{
  constructor(
    // private blogsQueryRepository: BlogsQueryRepository,
    private postsRepository: PostsRepository,
  ) {}

  async execute({ dto, postId }: UpdatePostCommand): Promise<void> {
    // await this.blogsQueryRepository.findByIdOrNotFoundFail(dto.blogId);
    await this.postsRepository.update(dto, postId);
  }
}

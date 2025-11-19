import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostInputDto } from 'src/modules/bloggers-platform/dto/post/post-iput.dto';
import { PostsRepository } from 'src/modules/bloggers-platform/infrastructure/posts.repository';
import { BlogsQueryRepository } from 'src/modules/bloggers-platform/infrastructure/query/blogs-query.repository';

export class CreatePostCommand {
  constructor(public dto: PostInputDto) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase
  implements ICommandHandler<CreatePostCommand, string>
{
  constructor(
    private postsRepository: PostsRepository,
    private blogsQueryRepository: BlogsQueryRepository,
  ) {}

  async execute({ dto }: CreatePostCommand): Promise<string> {
    const blog = await this.blogsQueryRepository.findByIdOrNotFoundFail(
      dto.blogId,
    );

    const postId = await this.postsRepository.create({
      ...dto,
      blogName: blog.name,
    });

    return postId.toString();
  }
}

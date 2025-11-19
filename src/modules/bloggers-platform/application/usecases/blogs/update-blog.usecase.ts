import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogInputDto } from 'src/modules/bloggers-platform/dto/blog/blog-input.dto';
import { BlogsRepository } from 'src/modules/bloggers-platform/infrastructure/blogs.repository';
import { BlogsQueryRepository } from 'src/modules/bloggers-platform/infrastructure/query/blogs-query.repository';

export class UpdateBlogCommand {
  constructor(
    public dto: BlogInputDto,
    public id: string,
  ) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase
  implements ICommandHandler<UpdateBlogCommand, void>
{
  constructor(
    private blogsRepository: BlogsRepository,
    private blogsQueryRepository: BlogsQueryRepository,
  ) {}

  async execute({ dto, id }: UpdateBlogCommand): Promise<void> {
    await this.blogsQueryRepository.findByIdOrNotFoundFail(id);

    await this.blogsRepository.update(dto, id);
  }
}

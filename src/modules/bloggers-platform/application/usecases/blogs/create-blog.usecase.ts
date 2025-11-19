import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogInputDto } from 'src/modules/bloggers-platform/dto/blog/blog-input.dto';
import { BlogsRepository } from 'src/modules/bloggers-platform/infrastructure/blogs.repository';

export class CreateBlogCommand {
  constructor(public dto: BlogInputDto) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase
  implements ICommandHandler<CreateBlogCommand, string>
{
  constructor(private blogsRepository: BlogsRepository) {}

  async execute({ dto }: CreateBlogCommand): Promise<string> {
    const blogId = await this.blogsRepository.create(dto);

    return blogId.toString();
  }
}

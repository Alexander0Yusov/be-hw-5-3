import { Injectable, NotFoundException } from '@nestjs/common';
import { Post } from '../../domain/post/post.entity';
import { PostViewDto } from '../../dto/post/post-view.dto';
import { Like } from '../../domain/like/like.entity';
import { GetPostsQueryParams } from '../../dto/post/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { Blog } from '../../domain/blog/blog.entity';
import { Comment } from '../../domain/comment/comment.entity';
import { CommentViewDto } from '../../dto/comment/comment-view.dto';
import { GetCommentsQueryParams } from '../../dto/comment/get-comments-query-params.input-dto';

@Injectable()
export class CommentsQueryRepository {
  constructor() // @InjectModel(Comment.name)
  // private CommentModel: any,
  // CommentModelType,
  //@InjectModel(Like.name)
  // private LikeModel: any,
  // LikeModelType,
  //  @InjectModel(Blog.name) private BlogModel: BlogModelType,
  {}

  // async findByIdOrNotFoundFail(
  //   parentId: string,
  //   authorId?: string,
  // ): Promise<CommentViewDto> {
  //   const comment = await this.CommentModel.findById(parentId);

  //   if (!comment) {
  //     throw new NotFoundException('post not found');
  //   }

  //   const filter: Record<string, any> = {
  //     parentId: '', // new Types.ObjectId(parentId),
  //     // parentModel: 'Comment',
  //   };

  //   let myLike;

  //   if (authorId) {
  //     filter.authorId = ''; //new Types.ObjectId(authorId);
  //     myLike = await this.LikeModel.findOne(filter).lean();
  //   }

  //   return CommentViewDto.mapToView(comment, myLike?.status);
  // }

  // async findManyByPostId(
  //   id: string,
  //   queryDto: GetCommentsQueryParams,
  // ): Promise<PaginatedViewDto<CommentViewDto[]>> {
  //   const { pageNumber, pageSize, sortBy, sortDirection } = queryDto;
  //   const skip = (pageNumber - 1) * pageSize;
  //   const filter = {
  //     postId: '', // new Types.ObjectId(id)
  //   };

  //   const totalCount = await this.CommentModel.countDocuments(filter);

  //   const comments = await this.CommentModel.find(filter)
  //     .sort({ [sortBy]: sortDirection })
  //     .skip(skip)
  //     .limit(pageSize);

  //   const items = comments.map((comment) => CommentViewDto.mapToView(comment));

  //   return PaginatedViewDto.mapToView({
  //     items,
  //     totalCount,
  //     page: queryDto.pageNumber,
  //     size: queryDto.pageSize,
  //   });
  // }
}

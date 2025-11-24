export class BlogViewDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
  isMembership: boolean;

  static mapToView(
    blog: any, // BlogDocument
  ): BlogViewDto {
    const dto = new BlogViewDto();

    dto.id = blog.id.toString();
    dto.name = blog.name;
    dto.description = blog.description;
    dto.websiteUrl = blog.website_url;
    dto.createdAt = blog.created_at;
    dto.isMembership = blog.is_membership;

    return dto;
  }
}

import { OmitType } from '@nestjs/swagger';
// import { UserDocument } from '../../domain/user/user.entity';

export class UserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: Date;

  static mapToView(
    user: any,
    // UserDocument
  ) {
    const dto = new UserViewDto();

    dto.email = user.email;
    dto.login = user.login;
    dto.id = user.id.toString();
    dto.createdAt = user.created_at;

    return dto;
  }
}

//https://docs.nestjs.com/openapi/mapped-types
export class MeViewDto extends OmitType(UserViewDto, [
  'createdAt',
  'id',
] as const) {
  userId: string;

  static mapToView(
    user: any,
    // UserDocument
  ): MeViewDto {
    const dto = new MeViewDto();

    dto.email = user.email;
    dto.login = user.login;
    dto.userId = user._id.toString();

    return dto;
  }
}

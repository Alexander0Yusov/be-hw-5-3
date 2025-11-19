import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserInputDto } from 'src/modules/user-accounts/dto/user/user-input.dto';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users.repository';
import { CryptoService } from '../../crupto.service';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';

export class CreateUserCommand {
  constructor(public dto: UserInputDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase
  implements ICommandHandler<CreateUserCommand, number>
{
  constructor(
    private cryptoService: CryptoService,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    dto: { login, password, email },
  }: CreateUserCommand): Promise<number> {
    const existsLogin = await this.usersRepository.findByLoginOrEmail(login);

    if (existsLogin) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Email or login already exists',
        extensions: [{ message: 'Login already exists', field: 'login' }],
      });
    }

    const existsEmail = await this.usersRepository.findByLoginOrEmail(email);

    if (existsEmail) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Email or login already exists',
        extensions: [{ message: 'Email already exists', field: 'email' }],
      });
    }

    const password_hash = await this.cryptoService.createPasswordHash(password);

    const userId = await this.usersRepository.create(
      login,
      password_hash,
      email,
    );

    return userId;
  }
}

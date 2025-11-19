import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users.repository';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { DomainExceptionCode } from 'src/core/exceptions/domain-exception-codes';

export class AuthEmailConfirmationCommand {
  constructor(public body: { code: string }) {}
}

@CommandHandler(AuthEmailConfirmationCommand)
export class AuthEmailConfirmationUseCase
  implements ICommandHandler<AuthEmailConfirmationCommand>
{
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({ body }: AuthEmailConfirmationCommand): Promise<void> {
    try {
      const { is_confirmed, userId } =
        await this.usersRepository.getUserAndEmailConfirmationDataByCodeOrNotFounFail(
          body.code,
        );

      if (!is_confirmed) {
        await this.usersRepository.setIsConfirmedEmailConfirmationCode(userId);
      }
    } catch (er) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Something wrong with code',
        extensions: [
          {
            field: 'code',
            message:
              'The confirmation code is incorrect, expired or already been applied',
          },
        ],
      });
    }
  }
}

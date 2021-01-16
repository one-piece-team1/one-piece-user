/**
 * @classdesc User create command
 */
export class UserCreditCommand {
  constructor(public readonly username: string, public readonly email: string, public readonly password: string) {}
}

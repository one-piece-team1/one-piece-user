export class UpdateUserPasswordEvent {
  public constructor(public readonly type: string, public readonly data: unknown) {}
}

export class AddUserEventCMD {
  public constructor(public readonly type: string, public readonly data: unknown) {}
}

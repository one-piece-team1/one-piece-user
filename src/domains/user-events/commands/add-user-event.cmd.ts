export class AddUserEventCMD {
  public constructor(public readonly requestId: string, public readonly type: string, public readonly data: Array<any>) {}
}

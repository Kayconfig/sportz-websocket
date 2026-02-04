export class ErrInternal extends Error {
  constructor(msg: string) {
    super(msg);
  }

  static create(msg: string): ErrInternal {
    return new ErrInternal(msg);
  }
}

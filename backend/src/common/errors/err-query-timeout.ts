export class ErrQueryTimeout extends Error {
  constructor(msg: string) {
    super(msg);
  }

  static create(msg: string): ErrQueryTimeout {
    return new ErrQueryTimeout(msg);
  }
}

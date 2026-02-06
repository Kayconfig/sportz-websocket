export class ErrParseStringNumber extends Error {
  constructor(errMsg: string) {
    super(errMsg);
  }

  static create(errMsg: string): ErrParseStringNumber {
    return new ErrParseStringNumber(errMsg);
  }
}

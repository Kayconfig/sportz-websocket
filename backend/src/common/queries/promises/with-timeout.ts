import { ErrQueryTimeout } from '../../errors/err-query-timeout';

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutInMilliseconds: number,
  errMsg: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(ErrQueryTimeout.create(errMsg)),
        timeoutInMilliseconds
      );
    }),
  ]);
}

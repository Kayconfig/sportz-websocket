export type Logger = {
  info: (input: string) => void;
  error: (err: Error) => void;
};

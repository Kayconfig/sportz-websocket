export type Logger = {
  info: (input: string) => void;
  error: (err: unknown) => void;
};

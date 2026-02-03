import { z } from 'zod';

const envSecretSchema = z.object({
  PORT: z.coerce.number(),
  POSTGRES_DATABASE_URL: z.string().nonempty(),
});

type EnvSecrets = z.infer<typeof envSecretSchema>;

let _secrets: EnvSecrets | null = null;

function validate() {
  _secrets = envSecretSchema.parse(process.env);
}

function getOrThrow<EnvKeyName extends keyof EnvSecrets>(
  key: EnvKeyName
): EnvSecrets[EnvKeyName] {
  if (!_secrets) {
    throw new Error(
      'secrets not initialized. call secret.validate to initialize'
    );
  }
  const value = _secrets[key];
  if (!value) {
    throw new Error(`value for secret ${key} not found`);
  }
  return value;
}

export const secrets = { getOrThrow, validate };

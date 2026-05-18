// Next.js automatically handles loading env variables from .env files

function getEnvOrDefault(key: string, defaultValue: string): string {
  const value = process.env[key];
  if (!value) {
    console.warn(`Warning: Missing environment variable ${key}. Using fallback/default.`);
    return defaultValue;
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '3001', 10),
  DATABASE_URL: getEnvOrDefault('DATABASE_URL', 'postgresql://dummy:dummy@localhost:5432/dummy'),
  JWT_SECRET: getEnvOrDefault('JWT_SECRET', 'fallback_secret_for_local_dev_only'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '8h',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
};

import dotenv from "dotenv";

dotenv.config({ quiet: true });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const isDev = process.env.NODE_ENV === "development";

export const ENV = {
  PORT: process.env.PORT || 3000,
  DB_URL: isDev ? process.env.DB_URL : required("DB_URL"),
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
  INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
  STREAM_API_KEY: isDev ? process.env.STREAM_API_KEY : required("STREAM_API_KEY"),
  STREAM_API_SECRET: isDev ? process.env.STREAM_API_SECRET : required("STREAM_API_SECRET"),
  ENABLE_ML_TRACK: process.env.ENABLE_ML_TRACK ?? "1",
  ML_JUDGE_TIMEOUT_MS: Number(process.env.ML_JUDGE_TIMEOUT_MS || 25000),
  EXECUTE_MAX_BODY_BYTES: Number(process.env.EXECUTE_MAX_BODY_BYTES || 262144),
  EXECUTE_MAX_CODE_CHARS: Number(process.env.EXECUTE_MAX_CODE_CHARS || 100000),
  EXECUTE_RATE_LIMIT_WINDOW_MS: Number(process.env.EXECUTE_RATE_LIMIT_WINDOW_MS || 60000),
  EXECUTE_RATE_LIMIT_MAX: Number(process.env.EXECUTE_RATE_LIMIT_MAX || 40),
};

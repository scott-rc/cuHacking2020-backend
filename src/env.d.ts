declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: "development" | "production";
    readonly LOG_LEVEL: string;
    readonly SESSION_TIMEOUT: string;
    readonly DB_DATABASE: string;
    readonly DB_HOST: string;
    readonly DB_PORT: number;
    readonly DB_PASSWORD: string;
  }
}

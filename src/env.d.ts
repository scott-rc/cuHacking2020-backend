declare namespace NodeJS {
  interface ProcessEnv {
    readonly DB_DATABASE: string;
    readonly DB_HOST: string;
    readonly DB_PORT: number;
    readonly DB_PASSWORD: string;
  }
}

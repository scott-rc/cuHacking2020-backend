import knex from "knex";

export default knex({
  client: "pg",
  connection: {
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT as any,
    user: process.env.DB_USER
  }
});

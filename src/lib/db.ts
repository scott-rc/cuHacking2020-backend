import { camelizeKeys, decamelize } from "humps";
import knex from "knex";

export default knex({
  client: "pg",
  connection: {
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT as any,
    user: process.env.DB_USER
  },
  wrapIdentifier: (value, origImpl) => origImpl(decamelize(value)),
  postProcessResponse: result =>
    Array.isArray(result)
      ? result.map(x => camelizeKeys(x))
      : camelizeKeys(result)
});

import { Pool } from "pg";
import env from "../config/index.js";
import { readFileSync } from "fs";

const pool = new Pool ({
    connectionString: env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: true,
        ca: readFileSync("./certs/prod-ca-2021.crt").toString()
    }
})

export default pool;

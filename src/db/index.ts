import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from '../schemas'

const client = createClient({
    url: import.meta.env.VITE_TURSO_DATABASE_URL!,
  authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN!,
  });
  
  export const db = drizzle(client,{
    schema:schema
  });
  
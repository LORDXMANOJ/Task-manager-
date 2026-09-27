/**
 * Local development database (optional).
 *
 * Starts a real PostgreSQL server from the `embedded-postgres` npm package so
 * you can run TaskFlow without installing PostgreSQL or Docker.
 * Data is stored in backend/.pgdata (git-ignored).
 *
 *   npm run db:local
 *
 * Connection string (matches .env.example):
 *   postgresql://taskflow:taskflow@localhost:5433/taskflow
 *
 * In production use a managed PostgreSQL database (Neon, Supabase, Railway...).
 */
import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.LOCAL_DB_PORT ?? 5433);
const USER = "taskflow";
const PASSWORD = "taskflow";
const DATABASES = ["taskflow", "taskflow_test"];
const dataDir = path.resolve(__dirname, "..", ".pgdata");

async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
    onLog: () => {},
  });

  const isNew = !fs.existsSync(path.join(dataDir, "PG_VERSION"));
  if (isNew) {
    console.log("Initialising local PostgreSQL cluster...");
    await pg.initialise();
  }

  await pg.start();

  for (const name of DATABASES) {
    try {
      await pg.createDatabase(name);
      console.log(`Created database "${name}"`);
    } catch {
      // Database already exists
    }
  }

  console.log(`\nLocal PostgreSQL running on port ${PORT}`);
  console.log(`DATABASE_URL=postgresql://${USER}:${PASSWORD}@localhost:${PORT}/taskflow`);
  console.log("Press Ctrl+C to stop.\n");

  const shutdown = async () => {
    console.log("\nStopping PostgreSQL...");
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start local PostgreSQL:", err);
  process.exit(1);
});

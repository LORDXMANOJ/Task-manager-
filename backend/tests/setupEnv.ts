import dotenv from "dotenv";

// Load .env.test before any app module reads process.env.
dotenv.config({ path: ".env.test", override: true });

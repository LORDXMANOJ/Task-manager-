import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Compared against when the email doesn't exist, so login takes the same time
// whether or not an account exists (prevents user enumeration by timing).
const DUMMY_HASH = bcrypt.hashSync("taskflow-timing-safe-dummy", SALT_ROUNDS);

export async function burnPasswordCheck(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_HASH);
}

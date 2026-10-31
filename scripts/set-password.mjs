// Sets a new password for any account, including moderators.
// Stop the server first: it keeps the data in memory and would overwrite this change.
//   node scripts/set-password.mjs <email> [new-password]
// Without a password, a random one is generated and printed.
import crypto from "node:crypto";
import { buildConfig } from "../src/config.js";
import { createStore } from "../src/db.js";
import { hashPassword } from "../src/auth.js";
import { checkPassword } from "../src/validate.js";

const [email, given] = process.argv.slice(2);
if (!email) {
  console.error("Usage: node scripts/set-password.mjs <email> [new-password]");
  process.exit(1);
}
const password = given || `${crypto.randomBytes(9).toString("base64url")}7a`;
try {
  checkPassword(password);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
const store = createStore(buildConfig().dataDir);
const user = store.data.users.find((u) => u.email === email.trim().toLowerCase());
if (!user) {
  console.error(`No account with the email ${email}.`);
  process.exit(1);
}
user.passHash = await hashPassword(password);
store.data.sessions = store.data.sessions.filter((s) => s.userId !== user.id);
store.flush();
console.log(`Password updated for ${user.email}${user.isModerator ? " (moderator)" : ""}. All their sessions were signed out.`);
if (!given) console.log(`New password: ${password}`);

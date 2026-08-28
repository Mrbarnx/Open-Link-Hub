import { createHmac, randomBytes } from "node:crypto";

const base64url = (value) => Buffer.from(value).toString("base64url");
const username = `owner_${base64url(randomBytes(12))}`;
const password = base64url(randomBytes(24));
const pepper = base64url(randomBytes(32));
const sessionSecret = base64url(randomBytes(48));
const digest = createHmac("sha256", pepper).update(password).digest("base64url");

console.log("Save these values in a password manager. Do not commit them.\n");
console.log(`ADMIN_USERNAME=${username}`);
console.log(`ADMIN_PASSWORD=${password}`);
console.log(`ADMIN_PASSWORD_DIGEST=${digest}`);
console.log(`ADMIN_PASSWORD_PEPPER=${pepper}`);
console.log(`ADMIN_SESSION_SECRET=${sessionSecret}`);

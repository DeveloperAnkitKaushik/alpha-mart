import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

// Same shape as the old Firestore ids (the PhonePe webhook validates it); bytes >= 248 are skipped so every character is equally likely.
export function randomId(length = 20): string {
  let out = "";
  while (out.length < length) {
    for (const b of randomBytes(length)) {
      if (b < 248 && out.length < length) out += ALPHABET[b % 62];
    }
  }
  return out;
}

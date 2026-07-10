import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

function key(): Buffer {
  const raw = process.env.GATEWAY_ENC_KEY;
  if (!raw) throw new Error("GATEWAY_ENC_KEY not configured");
  // Derive a 32-byte key from whatever secret length was generated
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${ct.toString("hex")}:${tag.toString("hex")}`;
}

export function decryptSecret(payload: string): string {
  const [ivH, ctH, tagH] = payload.split(":");
  if (!ivH || !ctH || !tagH) throw new Error("Invalid encrypted payload");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivH, "hex"));
  decipher.setAuthTag(Buffer.from(tagH, "hex"));
  const pt = Buffer.concat([decipher.update(Buffer.from(ctH, "hex")), decipher.final()]);
  return pt.toString("utf8");
}

export function maskSecret(plain: string): string {
  if (!plain) return "";
  if (plain.length <= 8) return "•".repeat(plain.length);
  return plain.slice(0, 4) + "•".repeat(Math.max(4, plain.length - 8)) + plain.slice(-4);
}

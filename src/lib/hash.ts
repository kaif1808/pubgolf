import { createHash, timingSafeEqual } from "node:crypto";

function pepper(): string {
  return (
    process.env.ORGANIZER_PEPPER ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "dev-organizer-pepper-unsafe"
  );
}

export function hashOrganizerKey(plain: string): string {
  return createHash("sha256").update(`${pepper()}:${plain}`, "utf8").digest("hex");
}

export function verifyOrganizerKey(plain: string, hash: string): boolean {
  if (!plain || !hash) return false;
  const a = hashOrganizerKey(plain);
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(hash, "hex");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

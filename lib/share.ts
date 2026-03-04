import crypto from "crypto";

const SECRET: string = process.env.SHARE_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
if (!SECRET) {
  throw new Error("Missing SHARE_SECRET (or AUTH_SECRET / NEXTAUTH_SECRET) environment variable");
}

function base64urlEncode(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(s: string) {
  let str = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  if (pad) str += "=".repeat(4 - pad);
  return Buffer.from(str, "base64");
}

export type SharePayload = {
  scope: "all" | "selected" | "single";
  productIds?: string[];
  singleProductId?: string | null;
  createdAt?: string;
  exp?: number | null; // unix seconds
  meta?: { title?: string; description?: string; image?: string } | null;
};

export function signShare(payload: SharePayload): string {
  const withTs: SharePayload = { ...payload, createdAt: new Date().toISOString() };
  const json = JSON.stringify(withTs);
  const p = Buffer.from(json, "utf8");
  const sig = crypto.createHmac("sha256", SECRET).update(p).digest();
  return `${base64urlEncode(p)}.${base64urlEncode(sig)}`;
}

export function verifyShare(token: string): SharePayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const payloadBuf = base64urlDecode(parts[0]);
    const sigBuf = base64urlDecode(parts[1]);
    const expected = crypto.createHmac("sha256", SECRET).update(payloadBuf).digest();
    if (expected.length !== sigBuf.length || !crypto.timingSafeEqual(expected, sigBuf)) return null;
    const payload = JSON.parse(payloadBuf.toString("utf8")) as SharePayload;
    if (payload.exp && typeof payload.exp === "number") {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}

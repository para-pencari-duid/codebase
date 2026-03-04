import { auth } from "@/lib/auth";
import { signShare } from "@/lib/share";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    // only OWNER or MANAGER can create shares
    const role = (session.user as any).role;
    if (role === "KASIR") return new NextResponse("Forbidden", { status: 403 });

    const body = await req.json().catch(() => ({}));
    const scope = body.scope === "selected" || body.scope === "single" ? body.scope : "all";
    const productIds = Array.isArray(body.productIds) ? body.productIds.map(String) : [];
    const singleProductId = body.singleProductId ? String(body.singleProductId) : null;

    let exp: number | null = null;
    if (body.expiresIn && Number(body.expiresIn) > 0) {
      exp = Math.floor(Date.now() / 1000) + Number(body.expiresIn);
    }

    const payload = {
      scope,
      productIds: productIds.length ? productIds : undefined,
      singleProductId: singleProductId || undefined,
      exp,
      meta: body.meta || undefined,
    };

    const token = signShare(payload as any);
    const origin = new URL(req.url).origin;
    const url = `${origin}/share/${token}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[SHARES_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

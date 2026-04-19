import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Generate a memorable temp password: 3 random bytes + "2026"
  const temp = crypto.randomBytes(4).toString("hex") + "!26";
  const hash = await bcrypt.hash(temp, 10);
  await prisma.user.update({
    where: { id: params.id },
    data: { passwordHash: hash, mustChangePassword: true },
  });
  return NextResponse.json({ tempPassword: temp });
}

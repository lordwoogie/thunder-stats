import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || !user?.isAdmin) redirect("/picks");

  const series = await prisma.series.findMany({
    orderBy: [{ round: "asc" }, { slot: "asc" }],
  });
  const users = await prisma.user.findMany({
    orderBy: [{ teamName: "asc" }],
    select: {
      id: true,
      username: true,
      teamName: true,
      isAdmin: true,
      mustChangePassword: true,
    },
  });

  return (
    <AdminDashboard
      series={series.map((s) => ({
        ...s,
        lockAt: s.lockAt ? s.lockAt.toISOString() : null,
      }))}
      users={users}
    />
  );
}

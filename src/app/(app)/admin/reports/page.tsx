import type { Metadata } from "next";

import {
  ReportsTable,
  type AdminBugReport,
} from "@/components/admin/reports-table";
import { PageHeader } from "@/components/page-header";
import { requireRole } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Relatos",
};

export default async function AdminReportsPage() {
  await requireRole("DEV");

  const reports = await prisma.bugReport.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      category: true,
      description: true,
      status: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  const openCount = reports.filter(
    (report) => report.status !== "RESOLVED",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatos de problemas"
        description={`${openCount} relato(s) aguardando resolução.`}
      />

      <ReportsTable reports={reports as AdminBugReport[]} />
    </div>
  );
}

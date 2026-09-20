"use client";

import { BugOff, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { ConfirmAction } from "@/components/confirm-action";
import { ResponsiveTable, type Column } from "@/components/responsive-table";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BugStatus } from "@/generated/prisma/enums";
import { BUG_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { deleteBugReport, updateBugStatus } from "@/server/actions/community";

export type AdminBugReport = {
  id: string;
  category: string;
  description: string;
  status: BugStatus;
  createdAt: Date | string;
  user: { name: string } | null;
};

const STATUS_OPTIONS = Object.keys(BUG_STATUS_LABELS) as BugStatus[];

export function ReportsTable({ reports }: { reports: AdminBugReport[] }) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(id: string, status: BugStatus) {
    startTransition(async () => {
      const result = await updateBugStatus({ id, status });

      if (!result.ok) {
        toast.error(result.message);

        return;
      }

      toast.success(result.message ?? "Status atualizado.");
    });
  }

  function statusSelect(report: AdminBugReport) {
    return (
      <Select
        value={report.status}
        disabled={isPending}
        onValueChange={(value) => handleStatusChange(report.id, value as BugStatus)}
      >
        <SelectTrigger
          className="w-36"
          aria-label={`Status do relato ${report.category}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {BUG_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  function removeButton(report: AdminBugReport) {
    return (
      <ConfirmAction
        title="Excluir relato"
        description="Este relato será apagado definitivamente."
        confirmLabel="Excluir"
        onConfirm={() => deleteBugReport({ id: report.id })}
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            aria-label="Excluir relato"
          >
            <Trash2 aria-hidden />
          </Button>
        }
      />
    );
  }

  const columns: Column<AdminBugReport>[] = [
    {
      id: "report",
      header: "Relato",
      className: "max-w-md",
      cell: (report) => (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{report.category}</p>
          <p className="text-sm whitespace-pre-wrap">{report.description}</p>
        </div>
      ),
    },
    {
      id: "author",
      header: "Enviado por",
      className: "hidden lg:table-cell",
      cell: (report) => (
        <div>
          <p className="text-sm">{report.user?.name ?? "Conta removida"}</p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {formatDateTime(report.createdAt)}
          </p>
        </div>
      ),
    },
    { id: "status", header: "Status", className: "w-40", cell: statusSelect },
    {
      id: "actions",
      header: "Ação",
      align: "end",
      className: "w-20",
      cell: removeButton,
    },
  ];

  if (reports.length === 0) {
    return (
      <Empty className="rounded-lg border border-dashed border-border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BugOff aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Nenhum relato</EmptyTitle>
          <EmptyDescription>
            Quando alguém relatar um problema, ele aparece aqui.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ResponsiveTable
      items={reports}
      columns={columns}
      getRowKey={(report) => report.id}
      renderCard={(report) => (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {report.category}
              </p>
              <p className="text-sm whitespace-pre-wrap">{report.description}</p>
            </div>
            {removeButton(report)}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs">
                {report.user?.name ?? "Conta removida"}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                {formatDateTime(report.createdAt)}
              </p>
            </div>
            {statusSelect(report)}
          </div>
        </div>
      )}
    />
  );
}

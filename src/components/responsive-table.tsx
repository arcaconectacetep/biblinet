import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type Column<TItem> = {
  id: string;
  header: React.ReactNode;
  cell: (item: TItem) => React.ReactNode;
  /** Extra classes for both the header cell and the body cells. */
  className?: string;
  align?: "start" | "end";
};

/**
 * Data tables are unusable on a phone — the action column ends up off-screen
 * behind a horizontal scroll. So the same rows are rendered as a table from
 * `md` up and as cards below it.
 */
export function ResponsiveTable<TItem>({
  items,
  columns,
  getRowKey,
  renderCard,
  emptyMessage = "Nenhum resultado.",
}: {
  items: TItem[];
  columns: Column<TItem>[];
  getRowKey: (item: TItem) => string;
  renderCard: (item: TItem) => React.ReactNode;
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    column.align === "end" && "text-right",
                    column.className,
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.map((item) => (
              <TableRow key={getRowKey(item)}>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      column.align === "end" && "text-right",
                      column.className,
                    )}
                  >
                    {column.cell(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 md:hidden">
        {items.map((item) => (
          <li
            key={getRowKey(item)}
            className="rounded-lg border border-border bg-card p-4"
          >
            {renderCard(item)}
          </li>
        ))}
      </ul>
    </>
  );
}

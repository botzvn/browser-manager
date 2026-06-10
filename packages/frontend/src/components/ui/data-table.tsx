import * as React from 'react';

import type { ColumnDef, PaginationState, RowSelectionState, Table as TanstackTable } from '@tanstack/react-table';
import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DataTableProps<TData> {
  /** Row data */
  data: TData[];
  /** Column definitions from TanStack Table */
  columns: ColumnDef<TData, any>[];
  /** Unique row id extractor */
  getRowId?: (row: TData) => string;
  /** Controlled row selection state */
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: React.Dispatch<React.SetStateAction<RowSelectionState>>;
  /** Available page sizes. Defaults to [20, 50, 100] */
  pageSizeOptions?: number[];
  /** Default page size. Defaults to 50 */
  defaultPageSize?: number;
  /** Empty state content */
  emptyContent?: React.ReactNode;
  /** Left slot inside the footer (e.g. bulk-action buttons) */
  footerLeft?: (table: TanstackTable<TData>) => React.ReactNode;
  /** Called with the current page's row data whenever pagination changes */
  onPageChange?: (visibleRows: TData[]) => void;
  /** Header row className override */
  headerClassName?: string;
  /** Body row className */
  rowClassName?: string | ((row: TData, isSelected: boolean) => string);
  /** Loading state — shows spinner row */
  isLoading?: boolean;
}

// ─── Page size selector label ─────────────────────────────────────────────────

const PAGE_SIZES_DEFAULT = [20, 50, 100];

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<TData>({
  data,
  columns,
  getRowId,
  rowSelection,
  onRowSelectionChange,
  pageSizeOptions = PAGE_SIZES_DEFAULT,
  defaultPageSize = 50,
  emptyContent,
  footerLeft,
  onPageChange,
  headerClassName,
  rowClassName,
  isLoading = false,
}: DataTableProps<TData>) {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  const table = useReactTable<TData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange,
    onPaginationChange: (updater) => {
      setPagination((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        return next;
      });
    },
    state: {
      ...(rowSelection !== undefined ? { rowSelection } : {}),
      pagination,
    },
    ...(getRowId ? { getRowId } : {}),
  });

  // Fire onPageChange when the SET of visible row IDs changes (pagination, filter, load).
  // We deliberately do NOT track `data` by reference — status updates from hydratePage
  // mutate profile objects within `data`, which would re-trigger this effect and create
  // an infinite loop: hydratePage → status change → data change → onPageChange → hydratePage.
  const visibleRowIds = table.getRowModel().rows.map((r) => r.id).join(',');
  React.useEffect(() => {
    if (onPageChange && visibleRowIds) {
      const rows = table.getRowModel().rows.map((r) => r.original);
      onPageChange(rows);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleRowIds]);

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);
  const pageCount = table.getPageCount() || 1;

  return (
    <>
      {/* ── Scrollable table area ── */}
      <div className="flex-1 overflow-auto h-0">
        <Table>
          <TableHeader className={cn('bg-slate-50 dark:bg-slate-900 sticky top-0 z-20 shadow-sm border-0', headerClassName)}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-0">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-10 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider align-middle"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span className="text-sm">Đang tải...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                const isSelected = row.getIsSelected();
                const customClass =
                  typeof rowClassName === 'function'
                    ? rowClassName(row.original, isSelected)
                    : rowClassName;
                return (
                  <TableRow
                    key={row.id}
                    data-state={isSelected ? 'selected' : undefined}
                    className={cn(
                      'group border-0 shadow-[0_1px_0_0_rgba(0,0,0,0.03)] hover:shadow-md hover:bg-white/90 dark:hover:bg-primary/10 cursor-default transition-all relative z-0 hover:z-10 bg-white/30',
                      customClass,
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2.5 align-middle border-0 transition-colors">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                  {emptyContent ?? 'Không có dữ liệu.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          {/* ── Pagination footer inside the table ── */}
          <TableFooter className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-t border-slate-100 dark:border-slate-700/50">
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="px-4 py-2">
                <div className="flex items-center justify-between gap-4">
                  {/* Left slot */}
                  <div className="flex items-center gap-2 min-w-[180px]">
                    {footerLeft
                      ? footerLeft(table)
                      : (
                        <span className="text-xs text-slate-400 tabular-nums">
                          {totalRows} dòng
                        </span>
                      )}
                  </div>

                  {/* Centre: range */}
                  <span className="text-xs text-slate-500 hidden sm:block tabular-nums">
                    {totalRows > 0 ? `${from}–${to} / ${totalRows}` : '–'}
                  </span>

                  {/* Right: page size + navigation */}
                  <div className="flex items-center gap-2">
                    <Select
                      value={String(pageSize)}
                      onValueChange={(val) => {
                        table.setPageSize(Number(val));
                        table.setPageIndex(0);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[90px] text-xs border-0 bg-slate-100 dark:bg-slate-700 rounded-lg shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pageSizeOptions.map((size) => (
                          <SelectItem key={size} value={String(size)} className="text-xs">
                            {size} / trang
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                        title="Trang đầu"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        title="Trang trước"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      <span className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg min-w-[60px] text-center tabular-nums">
                        {pageIndex + 1} / {pageCount}
                      </span>

                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        title="Trang sau"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                        onClick={() => table.setPageIndex(pageCount - 1)}
                        disabled={!table.getCanNextPage()}
                        title="Trang cuối"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </>
  );
}

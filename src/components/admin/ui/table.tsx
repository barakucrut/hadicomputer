import * as React from "react";

export function Table({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="admin-table-wrap relative w-full overflow-auto">
      <table
        className={`admin-table w-full caption-bottom text-sm border-collapse text-left ${className}`}
        {...props}
      />
    </div>
  );
}

export function TableHeader({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`border-b border-[#e5e3dd] bg-[#fdfdfc] ${className}`} {...props} />;
}

export function TableBody({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`divide-y divide-[#e5e3dd] ${className}`} {...props} />;
}

export function TableRow({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`admin-table-row transition-colors hover:bg-[#f8f7f4]/80 ${className}`}
      {...props}
    />
  );
}

export function TableHead({
  className = "",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`h-11 px-4 text-left align-middle font-semibold text-[#111413] text-xs uppercase tracking-wider ${className}`}
      {...props}
    />
  );
}

export function TableCell({
  className = "",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`p-4 align-middle text-sm text-[#111413] ${className}`}
      {...props}
    />
  );
}

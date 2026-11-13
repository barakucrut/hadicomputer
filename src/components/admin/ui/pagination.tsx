"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Check,
} from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

function ShadcnPageSizeSelect({
  value,
  onChange,
  options,
}: {
  value: number;
  onChange: (val: number) => void;
  options: number[];
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          height: "32px",
          padding: "0 10px",
          borderRadius: "7px",
          border: "1px solid var(--border)",
          backgroundColor: "#ffffff",
          color: "var(--ink)",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "var(--shadow-xs)",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          minWidth: "64px",
        }}
      >
        <span>{value}</span>
        <ChevronDown
          size={14}
          style={{
            color: "var(--muted)",
            transition: "transform 0.15s ease",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            left: 0,
            minWidth: "76px",
            backgroundColor: "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            boxShadow: "var(--shadow-md)",
            padding: "4px",
            zIndex: 60,
          }}
        >
          {options.map((opt) => {
            const isSelected = opt === value;
            return (
              <div
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  borderRadius: "5px",
                  fontSize: "12px",
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? "var(--red)" : "var(--ink)",
                  backgroundColor: isSelected ? "var(--surface)" : "transparent",
                  cursor: "pointer",
                  transition: "background-color 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "var(--surface-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <span>{opt}</span>
                {isSelected && <Check size={13} style={{ color: "var(--red)" }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className = "",
}: PaginationProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={`admin-pagination-container ${className}`.trim()}>
      {/* Information text */}
      <div className="admin-pagination-info">
        <span>Menampilkan</span>
        <strong>{startItem} – {endItem}</strong>
        <span>dari</span>
        <strong>{totalItems}</strong>
        <span>data</span>
      </div>

      {/* Controls */}
      <div className="admin-pagination-controls">
        {/* Page Size Selector */}
        {onPageSizeChange && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginRight: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>Per hal:</span>
            <ShadcnPageSizeSelect
              value={pageSize}
              onChange={onPageSizeChange}
              options={pageSizeOptions}
            />
          </div>
        )}

        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="admin-page-btn"
          title="Halaman Pertama"
          aria-label="Halaman Pertama"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="admin-page-btn"
          title="Halaman Sebelumnya"
          aria-label="Halaman Sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page Numbers */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{ padding: "0 6px", color: "var(--muted)", fontSize: "12px" }}
                >
                  …
                </span>
              );
            }
            const pageNum = p as number;
            const isActive = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`admin-page-btn ${isActive ? "active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="admin-page-btn"
          title="Halaman Selanjutnya"
          aria-label="Halaman Selanjutnya"
        >
          <ChevronRight size={16} />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="admin-page-btn"
          title="Halaman Terakhir"
          aria-label="Halaman Terakhir"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}

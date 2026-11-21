"use client";

import * as React from "react";
import { UploadCloud, X } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { useToast } from "@/components/admin/ui/toast";

/**
 * Dropzone unggah gambar standar CMS (.admin-dropzone):
 * kosong -> area drag & drop; terisi -> thumbnail di tengah + nama file + [ ✕ Remove file ].
 * File dikirim ke /api/admin/upload (otomatis dikompres & dioptimasi).
 */
export function ImageDropzone({
  value,
  onChange,
  folder,
  label = "Tarik & Lepas Gambar ke Sini",
  hint = "PNG, JPG, WebP atau SVG — otomatis dikompres.",
  previewHeight = 72,
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  folder: "products" | "banners" | "services" | "testimonials" | "brands" | "logos" | "favicons";
  label?: string;
  hint?: string;
  previewHeight?: number;
}) {
  const toast = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah gambar");
      onChange(data.url);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) upload(e.target.files[0]);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className="admin-dropzone flex flex-col items-center justify-center py-5 text-center" style={{ cursor: "default" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" style={{ height: previewHeight, maxWidth: "80%", objectFit: "contain" }} className="mb-2" />
          <p className="text-xs font-bold text-[#111413] max-w-sm truncate">{value.split("/").pop()}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="mt-3 flex items-center gap-1.5 h-8 px-3.5 text-xs font-bold"
          >
            <X size={13} />
            <span>Remove file</span>
          </Button>
        </div>
      ) : (
        <div
          className={`admin-dropzone ${dragging ? "is-dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files?.[0]) upload(e.dataTransfer.files[0]);
          }}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud size={32} className="text-[#818779] mx-auto mb-2" />
          <p className="text-sm font-bold text-[#111413]">{uploading ? "Mengunggah..." : label}</p>
          <p className="text-xs text-[#525854] mt-1">
            atau <span className="text-red-600 font-bold underline">klik untuk memilih dari komputer</span>
          </p>
          <p className="admin-form-hint mt-2">{hint}</p>
        </div>
      )}
    </>
  );
}

// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/lib/org";

type SchemaInfo = {
  required: string[];
  optional: string[];
  sample_row: Record<string, unknown>;
} | null;

type UploadResult = {
  ok: boolean;
  stored: number;
  errors: Array<{ row?: number; error: string }>;
  warnings: string[];
} | null;

export default function UploadLogsClient() {
  const { orgState, loading: orgLoading } = useOrganization();
  const canUpload = orgState?.can_upload !== false;
  const [schema, setSchema] = useState<SchemaInfo>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult>(null);
  const [drag, setDrag] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchSchema = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const res = await fetch(`${apiUrl}/ingestion/schema`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) setSchema(await res.json());
  }, [apiUrl]);

  const uploadFile = useCallback(
    async (file: File) => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setResult({ ok: false, stored: 0, errors: [{ error: "Not signed in." }], warnings: [] });
        return;
      }
      setLoading(true);
      setResult(null);
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch(`${apiUrl}/ingestion/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: form,
        });
        const data = await res.json();
        setResult(data);
      } catch (e) {
        setResult({
          ok: false,
          stored: 0,
          errors: [{ error: e instanceof Error ? e.message : "Upload failed." }],
          warnings: [],
        });
      } finally {
        setLoading(false);
      }
    },
    [apiUrl]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const f = e.dataTransfer.files[0];
      if (f && (f.name.endsWith(".csv") || f.name.endsWith(".json"))) uploadFile(f);
    },
    [uploadFile]
  );
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
  }, []);

  return (
    <div className="space-y-6">
      {!orgLoading && !canUpload && (
        <div className="rounded-xl border border-amber-400/50 bg-amber-400/10 p-4">
          <p className="text-amber-200 font-medium mb-1">Trial ended</p>
          <p className="text-white/80 text-sm mb-3">Subscribe ($20/month) to upload new logs and generate insights.</p>
          <Link href="/settings" className="btn-primary inline-block">Subscribe in Settings</Link>
        </div>
      )}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition ${
          !canUpload ? "opacity-60 pointer-events-none" : ""
        } ${
          drag ? "border-brand-cyan bg-brand-cyan/10" : "border-white/20 hover:border-white/30"
        }`}
      >
        <input
          type="file"
          accept=".csv,.json"
          className="hidden"
          id="file-upload"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadFile(f);
            e.target.value = "";
          }}
        />
        <label htmlFor="file-upload" className="cursor-pointer block">
          <span className="text-white/70 block mb-2">
            Drop a CSV or JSON file here, or click to choose
          </span>
          <span className="btn-primary inline-block">Choose file</span>
        </label>
      </div>

      {!schema && (
        <button type="button" onClick={fetchSchema} className="text-brand-cyan hover:underline text-sm">
          Show required fields & sample row
        </button>
      )}
      {schema && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-left">
          <p className="text-white/80 text-sm font-medium mb-2">Required:</p>
          <p className="text-white/60 text-sm mb-2">{schema.required.join(", ")}</p>
          <p className="text-white/80 text-sm font-medium mb-2">Optional:</p>
          <p className="text-white/60 text-sm mb-2">{schema.optional.join(", ")}</p>
          <p className="text-white/80 text-sm font-medium mb-2">Sample row (JSON):</p>
          <pre className="text-white/60 text-xs overflow-x-auto p-2 rounded bg-black/20">
            {JSON.stringify(schema.sample_row, null, 2)}
          </pre>
          <button
            type="button"
            onClick={() => {
              const sample = [schema.sample_row, { ...schema.sample_row, session_id: "sess_xyz", timestamp: "2024-01-16T14:00:00Z" }];
              const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "sample_ai_logs.json";
              a.click();
              URL.revokeObjectURL(a.href);
            }}
            className="text-brand-cyan hover:underline text-sm mt-2"
          >
            Download sample JSON
          </button>
        </div>
      )}

      {loading && (
        <p className="text-brand-cyan text-sm">Uploading and validating…</p>
      )}

      {result && !loading && (
        <div className={`rounded-xl border p-4 text-left ${result.ok ? "border-brand-cyan/50 bg-brand-cyan/5" : "border-red-400/50 bg-red-400/5"}`}>
          {result.ok ? (
            <>
              <p className="text-white font-medium mb-1">Stored {result.stored} row(s).</p>
              {result.warnings?.length > 0 && (
                <ul className="text-amber-300 text-sm list-disc list-inside">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
              <Link href="/decision-cards" className="btn-primary mt-4 inline-block">
                Generate insights, then view Decision Cards →
              </Link>
            </>
          ) : (
            <>
              <p className="text-red-300 font-medium mb-2">Validation failed</p>
              <ul className="text-red-200/90 text-sm list-disc list-inside space-y-1">
                {(result.errors || []).slice(0, 15).map((e, i) => (
                  <li key={i}>
                    {e.row != null ? `Row ${e.row}: ` : ""}{e.error}
                  </li>
                ))}
              </ul>
              {result.errors && result.errors.length > 15 && (
                <p className="text-white/60 text-xs mt-2">… and {result.errors.length - 15} more</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

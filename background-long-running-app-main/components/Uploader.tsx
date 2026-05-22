"use client";

import { useRef, useState } from "react";
import type { Filter } from "@/lib/types";

const FILTERS: { value: Filter; label: string; emoji: string }[] = [
  { value: "grayscale", label: "Grayscale", emoji: "⚫" },
  { value: "blur", label: "Blur", emoji: "🌫️" },
  { value: "sepia", label: "Sepia", emoji: "🟤" },
];

export function Uploader({ onJobCreated }: { onJobCreated: (jobId: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("grayscale");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    try {
      setStage("Requesting presigned URL…");
      const urlRes = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      }).then((r) => r.json());

      setStage("Uploading to S3…");
      await fetch(urlRes.url, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });

      setStage("Enqueueing to SQS…");
      const job = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ inputKey: urlRes.key, filter }),
      }).then((r) => r.json());

      onJobCreated(job.jobId);
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setBusy(false);
      setStage("");
    }
  };

  return (
    <div className="space-y-5 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6">
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files?.[0] ?? null);
        }}
        className="flex aspect-[16/7] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-black/20 transition hover:border-indigo-400/60 hover:bg-indigo-500/[0.04]"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="preview" className="h-full w-full rounded-xl object-contain" />
        ) : (
          <>
            <div className="text-3xl">📤</div>
            <div className="text-sm font-medium">Drop an image or click to choose</div>
            <div className="text-xs text-white/40">JPEG · PNG · WebP up to ~10 MB</div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
      </label>

      <div>
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-white/50">Filter</div>
        <div className="grid grid-cols-3 gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-xl border px-3 py-3 text-sm transition ${
                filter === f.value
                  ? "border-indigo-400/70 bg-indigo-500/15 text-white"
                  : "border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.05]"
              }`}
            >
              <div className="text-lg">{f.emoji}</div>
              <div className="mt-1 font-medium">{f.label}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={submit}
        disabled={!file || busy}
        className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? stage || "Working…" : "Process Image"}
      </button>
    </div>
  );
}

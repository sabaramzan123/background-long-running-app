"use client";

import type { JobStatus } from "@/lib/types";

const stages: { key: string; label: string; status: JobStatus[] }[] = [
  { key: "upload", label: "Uploaded", status: ["QUEUED", "PROCESSING", "DONE", "FAILED"] },
  { key: "queue", label: "Queued", status: ["QUEUED", "PROCESSING", "DONE", "FAILED"] },
  { key: "process", label: "Processing", status: ["PROCESSING", "DONE", "FAILED"] },
  { key: "ready", label: "Ready", status: ["DONE"] },
];

export function PipelineDiagram({ status }: { status?: JobStatus }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      {stages.map((s, i) => {
        const active = status && s.status.includes(status);
        const current =
          (status === "QUEUED" && s.key === "queue") ||
          (status === "PROCESSING" && s.key === "process") ||
          (status === "DONE" && s.key === "ready");
        return (
          <div key={s.key} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full border text-xs font-semibold transition-all ${
                  active
                    ? "border-indigo-400 bg-indigo-500/20 text-indigo-200"
                    : "border-white/10 bg-white/[0.03] text-white/30"
                } ${current ? "pulse-ring" : ""}`}
              >
                {i + 1}
              </div>
              <span className={`text-[11px] font-medium ${active ? "text-white" : "text-white/40"}`}>
                {s.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-white/5" />
            )}
          </div>
        );
      })}
    </div>
  );
}

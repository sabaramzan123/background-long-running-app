"use client";

import { useEffect, useState } from "react";
import type { Job, JobStatus } from "@/lib/types";
import { PipelineDiagram } from "./PipelineDiagram";

type JobWithUrls = Job & { inputUrl?: string; outputUrl?: string };

const statusColors: Record<JobStatus, string> = {
  QUEUED: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  PROCESSING: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  DONE: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  FAILED: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export function JobCard({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<JobWithUrls | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data: JobWithUrls = await res.json();
        if (!cancelled) setJob(data);
        if (data.status === "DONE" || data.status === "FAILED") return;
      } catch {}
      if (!cancelled) setTimeout(tick, 1500);
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (!job) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="shimmer h-6 w-32 rounded" />
      </div>
    );
  }

  const elapsed = ((job.updatedAt - job.createdAt) / 1000).toFixed(1);

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ${statusColors[job.status]}`}
          >
            {(job.status === "QUEUED" || job.status === "PROCESSING") && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            )}
            {job.status}
          </span>
          <span className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-white/60">
            filter: <span className="text-white">{job.filter}</span>
          </span>
        </div>
        <span className="text-xs text-white/40">
          {job.jobId.slice(0, 8)} · {elapsed}s
        </span>
      </div>

      <PipelineDiagram status={job.status} />

      <div className="grid grid-cols-2 gap-4">
        <Panel title="Input" url={job.inputUrl} />
        <Panel title="Output" url={job.outputUrl} loading={job.status !== "DONE" && job.status !== "FAILED"} />
      </div>

      {job.error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
          {job.error}
        </div>
      )}
    </div>
  );
}

function Panel({ title, url, loading }: { title: string; url?: string; loading?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
      <div className="border-b border-white/5 px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-white/50">
        {title}
      </div>
      <div className="relative flex aspect-square items-center justify-center bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.08),transparent_60%)]">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={title} className="h-full w-full object-contain" />
        ) : loading ? (
          <div className="shimmer h-full w-full" />
        ) : (
          <span className="text-xs text-white/30">—</span>
        )}
      </div>
    </div>
  );
}

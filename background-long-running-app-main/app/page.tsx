"use client";

import { useState } from "react";
import { Uploader } from "@/components/Uploader";
import { JobCard } from "@/components/JobCard";

export default function Home() {
  const [jobIds, setJobIds] = useState<string[]>([]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/60">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Online
        </div>
        <h1 className="bg-gradient-to-br from-white via-white to-indigo-200 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
          Image Processor
        </h1>
        <p className="mt-3 max-w-2xl text-white/60">
          Upload an image, pick a filter, and we&apos;ll process it for you in seconds.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
        <Uploader onJobCreated={(id) => setJobIds((p) => [id, ...p])} />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">
              Jobs ({jobIds.length})
            </h2>
            {jobIds.length > 0 && (
              <button
                onClick={() => setJobIds([])}
                className="text-xs text-white/40 hover:text-white/80"
              >
                Clear
              </button>
            )}
          </div>
          {jobIds.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-10 text-center text-sm text-white/40">
              No jobs yet. Upload an image to start.
            </div>
          ) : (
            jobIds.map((id) => <JobCard key={id} jobId={id} />)
          )}
        </section>
      </div>

      <footer className="mt-16 border-t border-white/5 pt-6 text-center text-xs text-white/30">
        © {new Date().getFullYear()} Image Processor
      </footer>
    </main>
  );
}

export type Filter = "grayscale" | "blur" | "sepia";

export type JobStatus = "QUEUED" | "PROCESSING" | "DONE" | "FAILED";

export interface Job {
  jobId: string;
  status: JobStatus;
  filter: Filter;
  inputKey: string;
  outputKey?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

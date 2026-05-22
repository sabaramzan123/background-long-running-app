import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AWS Image Processor — SQS · Lambda · S3 · DynamoDB",
  description: "Class demo: long-running task pipeline on AWS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

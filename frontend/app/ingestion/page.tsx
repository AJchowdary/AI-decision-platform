// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import UploadLogsClient from "@/components/ingestion/UploadLogsClient";

export default async function IngestionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="card-3d glass rounded-2xl p-8">
          <h1 className="font-display text-2xl font-bold text-white mb-2">Upload AI logs</h1>
          <p className="text-white/70 text-sm mb-2">
            CSV or JSON. We use your logs only to generate Decision Cards — what’s broken and what to fix first. No dashboards.
          </p>
          <details className="rounded-xl bg-white/5 border border-white/10 p-4 mb-4 text-left">
            <summary className="text-brand-cyan cursor-pointer hover:underline text-sm font-medium">What are AI logs? What can I upload?</summary>
            <div className="mt-3 text-white/70 text-sm space-y-2">
              <p>
                <strong className="text-white/90">AI logs</strong> are records of interactions with your AI feature: each row = one user interaction, with the user’s input, your system’s output, and how the user rated it (e.g. thumbs up/down, score). We use these to find failure patterns and recommend what to fix.
              </p>
              <p>
                <strong className="text-white/90">Accepted:</strong> CSV or JSON files with the required fields (session_id, timestamp, input, output, feedback_type, feedback_value). Optional: user_id, tags, metadata.
              </p>
              <p>
                <strong className="text-white/90">Not accepted:</strong> Other business documents (PDFs, Word, spreadsheets without the required columns, support tickets, etc.). The product is built for structured AI interaction + feedback data only. Export your AI/chat/conversation logs in CSV or JSON with the required fields to use this page.
              </p>
            </div>
          </details>
          <details className="rounded-xl bg-white/5 border border-white/10 p-4 mb-6 text-left">
            <summary className="text-brand-cyan cursor-pointer hover:underline text-sm font-medium">How do I get AI logs from my business?</summary>
            <div className="mt-3 text-white/70 text-sm space-y-3">
              <p>
                Logs come from <strong className="text-white/90">your</strong> product — wherever you have an AI feature (chat, assistant, API, search). You need to record each interaction and any user feedback, then export that data.
              </p>
              <ul className="list-disc list-inside space-y-1 text-white/70">
                <li><strong className="text-white/90">Already logging?</strong> If your app or backend already stores user input, model output, and feedback (thumbs, ratings, tags), export that table or stream to CSV/JSON with columns: session_id, timestamp, input, output, feedback_type, feedback_value.</li>
                <li><strong className="text-white/90">Using a database or data warehouse?</strong> Run a query that selects those fields per interaction and export the result as CSV or JSON.</li>
                <li><strong className="text-white/90">Not logging yet?</strong> Add a small step in your backend: when a user sends a message and your AI replies, save one row with input, output, and (when the user rates) feedback_type and feedback_value. Use a session or request ID as session_id and the event time as timestamp. Then export periodically.</li>
                <li><strong className="text-white/90">Quick test:</strong> Use “Show required fields & sample row” below, then “Download sample JSON”. Fill a few rows from real or example interactions and upload to try the flow.</li>
              </ul>
              <p className="text-white/60 text-xs">
                feedback_type examples: thumbs_up, thumbs_down, rating. feedback_value: 1–5 score, or empty for thumbs. Timestamp: ISO 8601, e.g. 2026-02-22T12:00:00Z.
              </p>
            </div>
          </details>
          <p className="text-white/50 text-xs mb-6">
            We use your logs only to generate Decision Cards. Delete your data anytime from your account.
          </p>
          <UploadLogsClient />
          <a href="/decision-cards" className="btn-secondary mt-6 inline-block">Back to Decision Cards</a>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

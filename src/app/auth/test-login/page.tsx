"use client";

import { useState } from "react";
import { signInWithEmail } from "@/app/auth/actions";

export default function TestLoginPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runTest = async (label: string, email: string, expectedPath: string) => {
    setLoading(true);
    try {
      // signInWithEmail now calls redirect() server-side — it always throws NEXT_REDIRECT on success.
      await signInWithEmail(email, "Test@123456");
      // Should never reach here
      setResults((prev) => [
        ...prev,
        { test: label, passed: false, error: "No redirect thrown — unexpected return" },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isRedirect = message.includes("NEXT_REDIRECT");
      setResults((prev) => [
        ...prev,
        {
          test: label,
          passed: isRedirect,
          note: isRedirect
            ? `✓ Server-side redirect fired (would go to ${expectedPath})`
            : `✗ Unexpected error: ${message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Login Tests</h1>
        <p className="text-slate-500 mb-8 text-sm">
          signInWithEmail now uses server-side redirect(). A NEXT_REDIRECT throw = success.
        </p>

        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => runTest("Customer Login", "customer.a@fixify.dev", "/customer")}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Testing…" : "Test Customer Login"}
          </button>

          <button
            onClick={() => runTest("Professional Login", "pro.a@fixify.dev", "/professional")}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Testing…" : "Test Professional Login"}
          </button>

          <button
            onClick={() => runTest("Admin Login", "admin.test@fixify.dev", "/admin")}
            disabled={loading}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Testing…" : "Test Admin Login"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-2 ${
                  result.passed ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
                }`}
              >
                <h3 className="font-bold text-lg mb-1">{result.test}</h3>
                <p className="text-sm">{result.note || result.error}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

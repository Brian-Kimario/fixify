"use client";

import { useState } from "react";
import Link from "next/link";

export default function DebugPage() {
  const [testEmail, setTestEmail] = useState("customer.a@fixify.dev");
  const [testPassword, setTestPassword] = useState("");
  const [result, setResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const testLogin = async () => {
    setIsLoading(true);
    setResult("Testing...");

    try {
      const response = await fetch("/api/auth/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`✅ Success!\n\nUser ID: ${data.userId}\nRole: ${data.role}\nEmail: ${data.email}`);
      } else {
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setResult(`❌ Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Auth Debug Tool</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email:</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="customer.a@fixify.dev"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password:</label>
            <input
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Enter password"
            />
          </div>

          <button
            onClick={testLogin}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {isLoading ? "Testing..." : "Test Login"}
          </button>

          {result && (
            <div className="mt-4 p-4 bg-slate-100 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap font-mono">{result}</pre>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t">
          <Link href="/auth/login" className="text-teal-600 hover:text-teal-700">
            ← Back to Login
          </Link>
        </div>

        {/* Info Panel */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <h3 className="font-semibold mb-2">Test Credentials:</h3>
          <div className="space-y-1 font-mono text-xs">
            <div>📧 customer.a@fixify.dev</div>
            <div>📧 pro.a@fixify.dev</div>
            <div>⚠️ Password: (check Supabase Auth)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

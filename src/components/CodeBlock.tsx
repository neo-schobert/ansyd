"use client";
import React, { useState, useEffect } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-go";
import "prismjs/themes/prism-okaidia.css";

interface CodeBlockProps {
  children: string;
  endpoint: string;
}

interface LabResponse {
  stdout: string;
  stderr: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ children, endpoint }) => {
  const [log, setLog] = useState<string>("");

  const isClient = typeof window !== "undefined";

  useEffect(() => {
    Prism.highlightAll(); // highlight après hydratation
  }, [children]);

  const handleExecute = async () => {
    setLog("⏳ Exécution…");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s

    try {
      const res = await fetch(endpoint, { signal: controller.signal });
      const text = await res.text();
      clearTimeout(timeout);

      let data: LabResponse;
      try {
        data = JSON.parse(text);
      } catch {
        const safe = text.replace(/\r?\n/g, "\\n").replace(/\t/g, "\\t");
        data = JSON.parse(safe);
      }
      const output = data.stderr
        ? `${data.stdout}\n⚠️ Erreur : ${data.stderr}`
        : data.stdout;
      setLog(output.replace(/\\n/g, "\n").replace(/\\t/g, "\t"));
    } catch (err) {
      clearTimeout(timeout);
      setLog(`❌ Erreur : ${String(err)}`);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-xl shadow-md border border-gray-200">
      <pre
        className="rounded-lg overflow-x-auto text-sm language-go"
        tabIndex={0}
      >
        <code className="language-go">{children}</code>
      </pre>

      <button
        onClick={handleExecute}
        className="mt-3 px-4 py-2 bg-indigo-500 cursor-pointer text-white rounded-lg hover:bg-indigo-600 transition"
      >
        Exécuter le code
      </button>

      {isClient && log && (
        <div className="mt-3 bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm whitespace-pre-wrap">
          {log}
        </div>
      )}
    </div>
  );
};

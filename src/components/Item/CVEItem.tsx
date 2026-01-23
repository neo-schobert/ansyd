"use client";
import { CVE } from "@/app/(procom)/procom/page";
import { useState } from "react";

export default function CVEItem({
  cve,
  isDarkMode,
}: {
  cve: CVE;
  isDarkMode: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const MAX_CHARS = 30;
  const isLong = cve.description.length > MAX_CHARS;

  const text = expanded ? cve.description : cve.description.slice(0, MAX_CHARS);

  const severityColor = (() => {
    switch (cve.severity.toLowerCase()) {
      case "low":
        return "#22c55e";
      case "medium":
        return "#eab308";
      case "high":
        return "#f97316";
      case "critical":
        return "#dc2626";
      default:
        return "text-gray-400";
    }
  })();

  return (
    <li className="mb-2">
      <div>
        • <span className="font-mono">{cve.id}</span> –{" "}
        <span style={{ color: severityColor }}>{cve.severity}</span> – CVSS:{" "}
        {cve.cvss}
      </div>

      <div className={`${isDarkMode ? "text-zinc-400" : "text-zinc-600"}`}>
        {text}
        {isLong && !expanded && "…"}
      </div>

      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={`text-blue-400 cursor-pointer hover:underline text-sm mt-1 ${
            isDarkMode ? "text-blue-400" : "text-blue-600"
          }`}
        >
          {expanded ? "Voir moins" : "Voir plus"}
        </button>
      )}
    </li>
  );
}

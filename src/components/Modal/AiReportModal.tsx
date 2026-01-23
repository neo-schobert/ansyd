import React from "react";
import Modal from "@mui/joy/Modal";
import CircularProgress from "@mui/joy/CircularProgress";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Literal, Parent } from "unist";

type AiReportModalProps = {
  openModalAiReport: boolean;
  setOpenModalAiReport: (open: boolean) => void;
  aiReport: string | null;
};

export default function AiReportModal({
  openModalAiReport,
  setOpenModalAiReport,
  aiReport,
}: AiReportModalProps) {
  return (
    <Modal
      open={openModalAiReport}
      onClose={() => setOpenModalAiReport(false)}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(6px)",
        padding: "1rem",
      }}
    >
      <div className="bg-white text-gray-900 rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200">
          <h2 className="text-xl font-semibold tracking-tight">
            AI Vulnerability Report
          </h2>
          <button
            onClick={() => setOpenModalAiReport(false)}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 prose prose-slate max-w-none">
          {aiReport ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ node, className, children, ...props }) => {
                  const element = node as any; // Element de unist

                  // Inline code → <code> sans className de language
                  const isInline = !className?.includes("language-");

                  if (isInline) {
                    return (
                      <code className="bg-gray-100 text-gray-800 text-sm font-mono px-1 py-0.5 rounded-md">
                        {children}
                      </code>
                    );
                  }

                  // Block code → SyntaxHighlighter
                  const languageMatch = /language-(\w+)/.exec(className || "");
                  const language = languageMatch ? languageMatch[1] : "text";

                  return (
                    <div className="relative mb-4">
                      <SyntaxHighlighter
                        language={language}
                        style={oneDark}
                        PreTag="div"
                        wrapLines
                        showLineNumbers
                        lineNumberStyle={{ color: "#888", paddingRight: 12 }}
                        className="rounded-md overflow-hidden"
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>

                      <button
                        className="absolute top-2 right-2 text-gray-400 hover:text-white bg-gray-700 bg-opacity-30 rounded px-2 py-1 text-xs font-mono transition-colors"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            String(children).replace(/\n$/, "")
                          )
                        }
                      >
                        Copy
                      </button>
                    </div>
                  );
                },
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 px-3 py-1 bg-gray-100 text-left font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 px-3 py-1 align-top">
                    {children}
                  </td>
                ),
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold mt-6 mb-2">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold mt-5 mb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold mt-4 mb-2">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 mb-3">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5 mb-3">{children}</ol>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {aiReport}
            </ReactMarkdown>
          ) : (
            <div className="flex items-center justify-center h-full">
              <CircularProgress />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

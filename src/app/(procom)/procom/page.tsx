"use client";

import { useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { Network, DataSet } from "vis-network/standalone";
import "vis-network/styles/vis-network.css";
import { CircularProgress, Modal, ModalClose } from "@mui/joy";
import CVEItem from "@/components/Item/CVEItem";
import AiReportModal from "@/components/Modal/AiReportModal";
import DarkModeToggle from "@/components/Button/DarkModeToggle";
import Hero from "@/components/Hero/Hero";
import ConfigMenu from "@/components/Button/ConfigMenu";
import { useSearchParams } from "next/navigation";

declare module "react" {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: boolean;
    directory?: boolean;
  }
}

/* =====================
   Types
===================== */

export type CVE = {
  id: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  cvss: number;
  published_date: string;
  exploit_db?: string;
  affected_versions?: string;
};

export type ProjectInfos = {
  name?: string;
  version?: string;
  standard?: string;
  cmake?: CMake;
  call_graph?: CallGraphNode;
};

export type CMake = {
  dependencies: LibraryInfos[];
};

export type LibraryInfos = {
  name: string;
  vendor?: string;
  version: string;
  source: string;
  cves: CVE[];
  git_repo?: string;
  options: Record<string, string>;
  checked_at?: string;
};

export type Location = {
  file: string;
  line: number;
  column?: number;
};

export type CallGraphNode = {
  id?: string;
  func_name?: string;
  locations: Location[];
  library?: LibraryInfos | null;
  children: CallGraphNode[];
  extracted_code?: string;
  ai_report?: string;
  ai_vulnerability_score?: number;
  global_report?: string;
  global_score?: number;
  critical_nodes?: CallGraphNode[];
};

/* =====================
   Color system — continuous gradient
===================== */

/**
 * Returns a hex color interpolated continuously along:
 *   0.0  → #16a34a  (green-600)
 *   5.0  → #eab308  (yellow-500)
 *   10.0 → #dc2626  (red-600)
 *
 * If score is undefined the node has CVEs but no AI analysis yet → amber warning.
 * If no CVEs at all → dim slate.
 */
function scoreToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function interpolateColor(
  [r1, g1, b1]: [number, number, number],
  [r2, g2, b2]: [number, number, number],
  t: number,
): string {
  return scoreToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

const GREEN: [number, number, number] = [22, 163, 74]; // #16a34a
const YELLOW: [number, number, number] = [234, 179, 8]; // #eab308
const RED: [number, number, number] = [220, 38, 38]; // #dc2626
const AMBER_UNSCORED = "#d97706";
const SLATE_SAFE = "#475569";
const SLATE_DESCENDANT = "#94a3b8";

export function vulnerabilityColor(node: CallGraphNode): string {
  const hasCves = (node.library?.cves?.length ?? 0) > 0;

  if (!hasCves) {
    // Check if any descendant has CVEs
    const hasDescendant =
      node.children?.some((c) => hasVulnerabilitiesRecursively(c)) ?? false;
    return hasDescendant ? SLATE_DESCENDANT : SLATE_SAFE;
  }

  // Has CVEs but no AI score yet
  if (
    node.ai_vulnerability_score === undefined ||
    node.ai_vulnerability_score === null
  ) {
    return AMBER_UNSCORED;
  }

  const s = Math.max(0, Math.min(10, node.ai_vulnerability_score));

  if (s <= 5) {
    // green → yellow (t: 0 at score=0, 1 at score=5)
    return interpolateColor(GREEN, YELLOW, s / 5);
  } else {
    // yellow → red (t: 0 at score=5, 1 at score=10)
    return interpolateColor(YELLOW, RED, (s - 5) / 5);
  }
}

/** CSS rgba string with opacity, for UI badges */
export function vulnerabilityColorRgba(node: CallGraphNode, alpha = 1): string {
  const hex = vulnerabilityColor(node);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function vulnerabilityLabel(node: CallGraphNode): string {
  const hasCves = (node.library?.cves?.length ?? 0) > 0;
  if (!hasCves) {
    const hasDescendant =
      node.children?.some((c) => hasVulnerabilitiesRecursively(c)) ?? false;
    return hasDescendant ? "Vulnerable by Descendant" : "Safe";
  }
  if (
    node.ai_vulnerability_score === undefined ||
    node.ai_vulnerability_score === null
  ) {
    return "Pending Analysis";
  }
  const s = node.ai_vulnerability_score;
  if (s >= 8) return `Critical Risk (${s.toFixed(1)})`;
  if (s >= 6) return `High Risk (${s.toFixed(1)})`;
  if (s >= 4) return `Medium Risk (${s.toFixed(1)})`;
  if (s >= 2) return `Low Risk (${s.toFixed(1)})`;
  return `Minimal Risk (${s.toFixed(1)})`;
}

/* =====================
   Graph helpers
===================== */

const LOCAL_URL = "http://localhost:8000";

const hasVulnerabilitiesRecursively = (
  node: CallGraphNode,
  memo = new WeakMap<CallGraphNode, boolean>(),
): boolean => {
  if (memo.has(node)) return memo.get(node)!;
  const selfHasCves = (node.library?.cves?.length ?? 0) > 0;
  const scored =
    node.ai_vulnerability_score !== undefined &&
    node.ai_vulnerability_score !== null;
  const aboveThreshold = (node.ai_vulnerability_score ?? 10) >= 2;
  if (selfHasCves && (!scored || aboveThreshold)) {
    memo.set(node, true);
    return true;
  }
  const childHas =
    node.children?.some((c) => hasVulnerabilitiesRecursively(c, memo)) ?? false;
  memo.set(node, childHas);
  return childHas;
};

const collectVulnerableDescendants = (
  node: CallGraphNode,
  result: Set<CallGraphNode> = new Set(),
  visited: Set<CallGraphNode> = new Set(),
): CallGraphNode[] => {
  if (visited.has(node)) return [];
  visited.add(node);
  node.children?.forEach((child) => {
    if ((child.library?.cves?.length ?? 0) > 0) result.add(child);
    collectVulnerableDescendants(child, result, visited);
  });
  return Array.from(result);
};

type GraphNode = {
  id: string;
  label: string;
  color: string;
  level: number;
  data: CallGraphNode;
};
type GraphEdge = {
  id: string;
  from: string;
  to: string;
  color: { color: string; highlight: string; hover: string };
};

function buildGraph(
  node: CallGraphNode,
  nodes: GraphNode[],
  edges: GraphEdge[],
  nodeMap: Map<string, string> = new Map(),
  parentId?: string,
  level = 0,
) {
  if (!node.func_name) node.func_name = "anonymous";
  const locKey = node.locations
    .map((l) => `${l.file}:${l.line}:${l.column ?? 0}`)
    .sort()
    .join("|");
  const nodeKey = `${node.func_name}_${locKey}`;
  const color = vulnerabilityColor(node);

  if (nodeMap.has(nodeKey)) {
    const nodeId = nodeMap.get(nodeKey)!;
    if (parentId)
      edges.push({
        id: `edge-${edges.length}`,
        from: parentId,
        to: nodeId,
        color: { color, highlight: color, hover: color },
      });
  } else {
    const nodeId = `node-${nodes.length}`;
    nodeMap.set(nodeKey, nodeId);
    node.id = nodeId;
    nodes.push({ id: nodeId, label: node.func_name, color, level, data: node });
    if (parentId)
      edges.push({
        id: `edge-${edges.length}`,
        from: parentId,
        to: nodeId,
        color: { color, highlight: color, hover: color },
      });
    node.children.forEach((child) =>
      buildGraph(child, nodes, edges, nodeMap, nodeId, level + 1),
    );
  }
}

const NETWORK_OPTIONS = {
  layout: {
    hierarchical: {
      enabled: true,
      direction: "UD",
      sortMethod: "directed",
      levelSeparation: 150,
      nodeSpacing: 200,
      treeSpacing: 250,
    },
  },
  edges: {
    smooth: {
      enabled: true,
      type: "cubicBezier",
      forceDirection: true,
      roundness: 0.4,
    },
    arrows: { from: true },
  },
  physics: false,
};

/* =====================
   Score gradient bar
===================== */

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = vulnerabilityColor({
    locations: [],
    children: [],
    library: {
      name: "",
      version: "",
      source: "",
      cves: [{}] as CVE[],
      options: {},
    },
    ai_vulnerability_score: score,
  });

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, #16a34a, #eab308, #dc2626)`,
            clipPath: `inset(0 ${100 - pct}% 0 0)`,
          }}
        />
      </div>
      <span className="text-xs font-mono font-bold" style={{ color }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

/* =====================
   Component
===================== */

export default function Page() {
  const searchParams = useSearchParams();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const dm = searchParams.get("isDarkModeInit");
    setIsDarkMode(dm === "true");
  }, [searchParams]);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingGenerateReport, setLoadingGenerateReport] = useState(false);
  const [openModalAiReport, setOpenModalAiReport] = useState(false);
  const [showAiReport, setShowAiReport] = useState<CallGraphNode | null>(null);
  const [projectInfo, setProjectInfo] = useState<ProjectInfos | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<CallGraphNode | null>(null);
  const [openSelectFolderModal, setOpenSelectFolderModal] = useState(false);

  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute("webkitdirectory", "");
      folderInputRef.current.setAttribute("directory", "");
    }
  }, []);

  useEffect(() => {
    if (files) uploadAndAnalyzeProject();
  }, [files]);

  const handleFolderSelect = (fileList: FileList) => setFiles(fileList);

  const buildAndRenderGraph = (
    project: ProjectInfos,
    graphNodes: GraphNode[],
    graphEdges: GraphEdge[],
  ) => {
    if (!containerRef.current) return;
    const net = new Network(
      containerRef.current,
      { nodes: new DataSet(graphNodes), edges: new DataSet(graphEdges) },
      NETWORK_OPTIONS,
    );
    net.on("selectNode", (params) => {
      const nodeId = params.nodes[0];
      const node = graphNodes.find((n) => n.id === nodeId);
      if (node) setSelectedNode(node.data);
    });
    networkRef.current = net;
  };

  const uploadAndAnalyzeProject = async () => {
    if (!files) return;
    setLoading(true);
    try {
      setOpenSelectFolderModal(false);
      const zip = new JSZip();
      Array.from(files).forEach((file) =>
        zip.file(file.webkitRelativePath || file.name, file),
      );
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const formData = new FormData();
      formData.append("project", zipBlob, "project.zip");

      const res = await fetch(`${LOCAL_URL}/analyze`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to analyze project");

      const project: ProjectInfos = await res.json();
      setProjectInfo(project);

      const graphNodes: GraphNode[] = [];
      const graphEdges: GraphEdge[] = [];
      if (project.call_graph)
        buildGraph(project.call_graph, graphNodes, graphEdges);
      setNodes(graphNodes);
      setEdges(graphEdges);
      buildAndRenderGraph(project, graphNodes, graphEdges);
    } catch (err) {
      console.error(err);
      alert("Error analyzing project");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiReport = async (selectedNode?: CallGraphNode) => {
    if (!files) return;
    setLoadingGenerateReport(true);
    try {
      const zip = new JSZip();
      Array.from(files).forEach((file) =>
        zip.file(file.webkitRelativePath || file.name, file),
      );
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const formData = new FormData();
      formData.append("project", zipBlob, "project.zip");
      formData.append("projectInfos", JSON.stringify(projectInfo || {}));
      if (selectedNode)
        formData.append("selectedNode", JSON.stringify(selectedNode));

      const res = await fetch(`${LOCAL_URL}/llm_generate_report`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to generate report");

      const project: ProjectInfos = await res.json();
      setProjectInfo(project);

      const graphNodes: GraphNode[] = [];
      const graphEdges: GraphEdge[] = [];
      if (project.call_graph)
        buildGraph(project.call_graph, graphNodes, graphEdges);
      setNodes(graphNodes);
      setEdges(graphEdges);
      buildAndRenderGraph(project, graphNodes, graphEdges);

      if (!selectedNode) setOpenModalAiReport(true);
      setSelectedNode(null);
    } catch (err) {
      console.error(err);
      alert("Error generating AI report");
    } finally {
      setLoadingGenerateReport(false);
    }
  };

  const unwrapMarkdownBlock = (text: string) => {
    const match = text.match(/```markdown\s*([\s\S]*?)\s*```/i);
    return match ? match[1] : text;
  };

  const dk = isDarkMode;
  const card = dk ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200";

  return (
    <div
      className={`min-h-screen p-8 flex flex-col md:flex-row gap-6 ${dk ? "bg-zinc-950 text-white" : "bg-gray-100 text-gray-900"}`}
    >
      {/* Top-right controls */}
      <div className="fixed top-4 right-4 z-50 gap-4 flex items-center">
        <DarkModeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        <ConfigMenu isDarkMode={isDarkMode} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col gap-6">
        <h1 className="text-4xl font-extrabold tracking-tight">
          C/C++ CVE Vulnerability Detection
        </h1>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={() => setOpenSelectFolderModal(true)}
            className={`px-5 py-2 rounded-lg cursor-pointer font-medium transition-colors ${dk ? "bg-zinc-800 hover:bg-zinc-700" : "bg-gray-300 hover:bg-gray-200"}`}
          >
            Select Project Folder
            <input
              ref={folderInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) =>
                e.target.files && handleFolderSelect(e.target.files)
              }
            />
          </button>

          {nodes.some((n) => (n.data.library?.cves?.length ?? 0) > 0) &&
            !projectInfo?.call_graph?.global_report && (
              <button
                className="px-5 py-2 rounded-lg cursor-pointer font-semibold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 shadow-md hover:scale-105"
                onClick={() => handleGenerateAiReport()}
              >
                Generate Global AI Report
              </button>
            )}

          {projectInfo?.call_graph?.global_report && (
            <button
              className="px-5 py-2 rounded-lg cursor-pointer font-semibold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 shadow-md hover:scale-105"
              onClick={() => setOpenModalAiReport(true)}
            >
              Show AI Report
            </button>
          )}
        </div>

        {/* Gradient legend */}
        {nodes.length > 0 && (
          <div
            className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-xs font-medium ${card}`}
          >
            <span className={dk ? "text-zinc-400" : "text-zinc-500"}>Risk</span>
            <div
              className="flex-1 h-3 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, #16a34a 0%, #eab308 50%, #dc2626 100%)",
              }}
            />
            <div className="flex gap-4">
              <span style={{ color: "#16a34a" }}>0 – Safe</span>
              <span style={{ color: "#eab308" }}>5 – Medium</span>
              <span style={{ color: "#dc2626" }}>10 – Critical</span>
            </div>
            <span className={dk ? "text-zinc-500" : "text-zinc-400"}>
              ◆ <span style={{ color: AMBER_UNSCORED }}>Pending</span>
              {"  "}◆ <span style={{ color: SLATE_SAFE }}>Safe</span>
              {"  "}◆ <span style={{ color: SLATE_DESCENDANT }}>Desc.</span>
            </span>
          </div>
        )}

        {/* Graph */}
        <div
          className={`border rounded-xl p-4 h-[700px] shadow-inner ${dk ? "border-zinc-800" : "border-gray-300 bg-white"}`}
        >
          <div ref={containerRef} className="h-full w-full" />
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`w-full md:w-96 mt-16 flex flex-col gap-6 p-5 rounded-xl border shadow-md ${card}`}
      >
        {/* Project info */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Project Info</h2>
          {projectInfo ? (
            <div
              className={`space-y-1 text-sm ${dk ? "text-zinc-300" : "text-zinc-700"}`}
            >
              <div>
                <strong>Name:</strong> {projectInfo.name}
              </div>
              <div>
                <strong>Version:</strong> {projectInfo.version}
              </div>
              {projectInfo.call_graph?.global_score !== undefined &&
                projectInfo.call_graph.global_score !== null && (
                  <div className="mt-2">
                    <strong className="block mb-1">Global Risk Score</strong>
                    <ScoreBar score={projectInfo.call_graph.global_score} />
                  </div>
                )}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">No project loaded</p>
          )}
        </div>

        <div className={`w-full h-px ${dk ? "bg-zinc-800" : "bg-gray-200"}`} />

        {/* Node info */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Function Info</h2>
          {selectedNode ? (
            <div
              className={`space-y-3 text-sm ${dk ? "text-zinc-300" : "text-zinc-700"}`}
            >
              <div>
                <strong>Name:</strong> {selectedNode.func_name}
              </div>

              {selectedNode.library ? (
                <div>
                  <strong>Library:</strong>{" "}
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() =>
                      window.open(selectedNode.library?.git_repo, "_blank")
                    }
                  >
                    {selectedNode.library.name}
                  </span>
                  {selectedNode.library.version && (
                    <span className="ml-1 text-xs opacity-60">
                      v{selectedNode.library.version}
                    </span>
                  )}
                </div>
              ) : (
                <div>
                  <strong>Library:</strong> None (or std)
                </div>
              )}

              {/* Continuous risk badge */}
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: vulnerabilityColor(selectedNode) }}
                />
                <span
                  style={{ color: vulnerabilityColor(selectedNode) }}
                  className="font-semibold"
                >
                  {vulnerabilityLabel(selectedNode)}
                </span>
              </div>

              {/* Score bar */}
              {selectedNode.ai_vulnerability_score !== undefined &&
                selectedNode.ai_vulnerability_score !== null && (
                  <div>
                    <strong className="block mb-1">
                      AI Vulnerability Score
                    </strong>
                    <ScoreBar score={selectedNode.ai_vulnerability_score} />
                  </div>
                )}

              {/* AI report actions */}
              {(selectedNode.library?.cves?.length ?? 0) > 0 &&
                (selectedNode.ai_report ? (
                  <button
                    className="w-full px-3 py-1.5 rounded-lg text-sm cursor-pointer font-semibold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 shadow hover:scale-105 transition-transform"
                    onClick={() => setShowAiReport(selectedNode)}
                  >
                    Show AI Report
                  </button>
                ) : (
                  <button
                    className="w-full px-3 py-1.5 rounded-lg text-sm cursor-pointer font-semibold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 shadow hover:scale-105 transition-transform"
                    onClick={() => handleGenerateAiReport(selectedNode)}
                  >
                    Analyze with AI
                  </button>
                ))}

              {/* Vulnerable descendants */}
              {(selectedNode.library?.cves?.length ?? 0) === 0 &&
                collectVulnerableDescendants(selectedNode).length > 0 && (
                  <div>
                    <strong>Vulnerable Descendants:</strong>
                    <ul className="space-y-1 mt-1">
                      {collectVulnerableDescendants(selectedNode).map(
                        (child) => (
                          <li
                            key={
                              child.func_name +
                              child.locations
                                .map((l) => `${l.file}:${l.line}`)
                                .join("|")
                            }
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{
                                  background: vulnerabilityColor(child),
                                }}
                              />
                              {child.func_name}
                            </span>
                            <button
                              className={`text-xs cursor-pointer px-2 py-0.5 rounded-md font-medium transition-colors ${dk ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                              onClick={() => {
                                setSelectedNode(child);
                                if (child.id)
                                  networkRef?.current?.selectNodes([child.id]);
                              }}
                            >
                              Focus
                            </button>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

              {/* Call locations */}
              {selectedNode.locations.length > 0 && (
                <>
                  <div
                    className={`w-full h-px ${dk ? "bg-zinc-800" : "bg-gray-200"}`}
                  />
                  <div>
                    <strong>Called in:</strong>
                    <ul
                      className={`space-y-0.5 mt-1 ${dk ? "text-zinc-400" : "text-zinc-600"}`}
                    >
                      {selectedNode.locations.map((loc) => (
                        <li
                          key={`${loc.file}:${loc.line}:${loc.column ?? 0}`}
                          className="text-xs font-mono"
                        >
                          • {loc.file.replace(/^\/tmp\/[^/]+\//, "")}:{loc.line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* CVEs */}
              {(selectedNode.library?.cves?.length ?? 0) > 0 && (
                <>
                  <div
                    className={`w-full h-px ${dk ? "bg-zinc-800" : "bg-gray-200"}`}
                  />
                  <div>
                    <strong>CVEs ({selectedNode.library!.cves.length}):</strong>
                    <ul
                      className={`space-y-1 mt-1 ${dk ? "text-zinc-400" : "text-zinc-600"}`}
                    >
                      {selectedNode.library!.cves.map((cve) => (
                        <CVEItem
                          key={cve.id}
                          cve={cve}
                          isDarkMode={isDarkMode}
                        />
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">No function selected</p>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        open={loading}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div
          className={`p-6 rounded-2xl flex flex-col items-center ${dk ? "bg-zinc-900/90 backdrop-blur-md" : "bg-white/90 backdrop-blur-sm"} shadow-lg`}
        >
          <CircularProgress />
          <p
            className={`text-lg mt-3 ${dk ? "text-zinc-300" : "text-zinc-700"}`}
          >
            Analyzing project...
          </p>
        </div>
      </Modal>

      <Modal
        open={loadingGenerateReport}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div
          className={`p-6 rounded-2xl flex flex-col items-center ${dk ? "bg-zinc-900/90 backdrop-blur-md" : "bg-white/90 backdrop-blur-sm"} shadow-lg`}
        >
          <CircularProgress />
          <p
            className={`text-lg mt-3 ${dk ? "text-zinc-300" : "text-zinc-700"}`}
          >
            Generating report...
          </p>
        </div>
      </Modal>

      <Modal
        open={openSelectFolderModal}
        onClose={() => setOpenSelectFolderModal(false)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div
          className={`p-6 rounded-2xl flex flex-col items-center gap-4 ${dk ? "bg-zinc-900/90 backdrop-blur-md" : "bg-white/90 backdrop-blur-sm"} shadow-lg pt-10`}
        >
          <ModalClose onClick={() => setOpenSelectFolderModal(false)} />
          <Hero
            title="C/C++ CVE Vulnerability Detection"
            descriptive="Secure & Private"
            description="Select your project folder to analyze its vulnerabilities. Your code remains private and is only used for analysis."
            isBlackTheme={isDarkMode}
            bouton2OnClick={() => folderInputRef.current?.click()}
            bouton2Text="Browse Folder"
            isTopPage={true}
          />
        </div>
      </Modal>

      <AiReportModal
        openModalAiReport={openModalAiReport}
        setOpenModalAiReport={setOpenModalAiReport}
        aiScore={projectInfo?.call_graph?.global_score ?? null}
        aiReport={unwrapMarkdownBlock(
          projectInfo?.call_graph?.global_report || "",
        )}
      />
      <AiReportModal
        openModalAiReport={!!showAiReport}
        setOpenModalAiReport={() => setShowAiReport(null)}
        aiScore={showAiReport?.ai_vulnerability_score ?? null}
        aiReport={unwrapMarkdownBlock(showAiReport?.ai_report || "")}
      />
    </div>
  );
}

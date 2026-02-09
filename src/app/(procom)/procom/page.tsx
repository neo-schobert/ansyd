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
   Helpers
===================== */

const LOCAL_URL = "http://localhost:8000";
const CLOUD_URL =
  "https://cpp-analyzer-backend-531057961347.europe-west1.run.app";

const hasVulnerabilitiesRecursively = (
  node: CallGraphNode,
  memo = new WeakMap<CallGraphNode, boolean>(),
): boolean => {
  if (memo.has(node)) return memo.get(node)!;

  const selfHasCves = (node.library?.cves?.length ?? 0) > 0;
  const selfHasAiScore =
    node.ai_vulnerability_score !== undefined &&
    node.ai_vulnerability_score !== null;
  const selfHasAiScoreGreaterThan2 = (node.ai_vulnerability_score ?? 10) >= 2;
  if (selfHasCves && (!selfHasAiScore || selfHasAiScoreGreaterThan2)) {
    memo.set(node, true);
    return true;
  }

  const childHasVulnerabilities =
    node.children?.some((child) =>
      hasVulnerabilitiesRecursively(child, memo),
    ) ?? false;

  memo.set(node, childHasVulnerabilities);
  return childHasVulnerabilities;
};

const collectVulnerableDescendants = (
  node: CallGraphNode,
  result: Set<CallGraphNode> = new Set(),
  visited: Set<CallGraphNode> = new Set(),
): CallGraphNode[] => {
  if (visited.has(node)) return [];
  visited.add(node);

  node.children?.forEach((child) => {
    const hasVulnerabilities = (child.library?.cves?.length ?? 0) > 0;

    if (hasVulnerabilities) {
      result.add(child);
    }

    collectVulnerableDescendants(child, result, visited);
  });

  return Array.from(result);
};

const nodeColor = (node: CallGraphNode) => {
  const hasOwnVulnerabilities = (node.library?.cves?.length ?? 0) > 0;
  const hasDescendantVulnerability =
    node.children?.some((child) => hasVulnerabilitiesRecursively(child)) ??
    false;

  if (hasOwnVulnerabilities) {
    if (
      node.ai_vulnerability_score === undefined ||
      node.ai_vulnerability_score === null
    ) {
      return POTENTIALLY_VULNERABLE_COLOR;
    } else {
      if (node.ai_vulnerability_score >= 7) {
        return "#dc2626"; // red-600
      } else if (node.ai_vulnerability_score >= 2) {
        return "#eab308"; // yellow-500
      } else {
        return "#22c55e"; // green-500
      }
    }
  }

  if (hasDescendantVulnerability) {
    return VULNERABLE_BY_DESCENDANT_COLOR;
  }

  return SAFE_COLOR;
};

const nodeText = (node: CallGraphNode) => {
  const hasOwnVulnerabilities = (node.library?.cves?.length ?? 0) > 0;
  const hasDescendantVulnerability =
    node.children?.some((child) => hasVulnerabilitiesRecursively(child)) ??
    false;

  if (hasOwnVulnerabilities) {
    if (
      node.ai_vulnerability_score === undefined ||
      node.ai_vulnerability_score === null
    ) {
      return "Potentially Vulnerable";
    } else {
      if (node.ai_vulnerability_score >= 7) {
        return "Potentially Vulnerable (High Risk)";
      } else if (node.ai_vulnerability_score >= 2) {
        return "Potentially Vulnerable (Medium Risk)";
      } else {
        return "Potentially Vulnerable (Low Risk)";
      }
    }
  }

  if (hasDescendantVulnerability) {
    return "Potentially Vulnerable by Descendant";
  }

  return "Safe";
};

const VULNERABLE_BY_DESCENDANT_COLOR = "#fecc76";
const POTENTIALLY_VULNERABLE_COLOR = "#d97706";
const SAFE_COLOR = "#16a34a";

/* =====================
   Recursive CallGraph Traversal
===================== */

function buildGraph(
  node: CallGraphNode,
  nodes: {
    id: string;
    label: string;
    color: string;
    level: number;
    data: CallGraphNode;
  }[],
  edges: {
    id: string;
    from: string;
    to: string;
    color: { color: string; highlight: string; hover: string };
  }[],
  nodeMap: Map<string, string> = new Map(), // clé = func_name + locations
  parentId?: string,
  level: number = 0,
) {
  if (!node.func_name) node.func_name = "anonymous"; // fallback

  // Crée une clé unique basée sur le nom et les locations
  const locKey = node.locations
    .map((l) => `${l.file}:${l.line}:${l.column ?? 0}`)
    .sort()
    .join("|"); // tri pour que l'ordre n'importe pas
  const nodeKey = `${node.func_name}_${locKey}`;

  let nodeId: string;

  if (nodeMap.has(nodeKey)) {
    nodeId = nodeMap.get(nodeKey)!;

    if (parentId) {
      edges.push({
        id: `edge-${edges.length}`,
        from: parentId,
        to: nodeId,
        color: {
          color: nodeColor(node),
          highlight: nodeColor(node),
          hover: nodeColor(node),
        },
      });
    }
  } else {
    nodeId = `node-${nodes.length}`;
    nodeMap.set(nodeKey, nodeId);
    node.id = nodeId;
    nodes.push({
      id: nodeId,
      label: node.func_name,
      color: nodeColor(node),
      level,
      data: node,
    });

    if (parentId) {
      edges.push({
        id: `edge-${edges.length}`,
        from: parentId,
        to: nodeId,
        color: {
          color: nodeColor(node),
          highlight: nodeColor(node),
          hover: nodeColor(node),
        },
      });
    }

    // Recursion sur les enfants
    node.children.forEach((child) =>
      buildGraph(child, nodes, edges, nodeMap, nodeId, level + 1),
    );
  }
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
  const [nodes, setNodes] = useState<
    {
      id: string;
      label: string;
      color: string;
      level: number;
      data: CallGraphNode;
    }[]
  >([]);
  const [edges, setEdges] = useState<
    {
      id: string;
      from: string;
      to: string;
      color: { color: string; highlight: string; hover: string };
    }[]
  >([]);
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

      const res = await fetch(`${CLOUD_URL}/analyze`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to analyze project");

      const project: ProjectInfos = await res.json();
      setProjectInfo(project);

      // Build graph
      const graphNodes: typeof nodes = [];
      const graphEdges: typeof edges = [];

      if (project.call_graph) {
        buildGraph(project.call_graph, graphNodes, graphEdges);
      }

      setNodes(graphNodes);
      setEdges(graphEdges);

      if (containerRef.current) {
        networkRef.current = new Network(
          containerRef.current,
          { nodes: new DataSet(graphNodes), edges: new DataSet(graphEdges) },
          {
            layout: {
              hierarchical: {
                enabled: true,
                direction: "UD", // "LR" = gauche-droite, "UD" = haut-bas
                sortMethod: "directed",
                levelSeparation: 150,
                nodeSpacing: 200,
                treeSpacing: 250,
              },
            },
            edges: {
              smooth: {
                enabled: true, // ✅ obligatoire
                type: "cubicBezier",
                forceDirection: true,
                roundness: 0.4,
              },
              arrows: { from: true },
            },
            physics: false, // pour ne pas que la physique modifie le layout
          },
        );

        networkRef.current.on("selectNode", (params) => {
          const nodeId = params.nodes[0];
          const node = graphNodes.find((n) => n.id === nodeId);
          if (node) setSelectedNode(node.data);
        });
      }
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
      if (selectedNode) {
        formData.append("selectedNode", JSON.stringify(selectedNode));
      }
      const res = await fetch(CLOUD_URL + "/llm_generate_report", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to analyze project");

      const project: ProjectInfos = await res.json();
      setProjectInfo(project);

      // Build graph
      const graphNodes: typeof nodes = [];
      const graphEdges: typeof edges = [];

      if (project.call_graph) {
        buildGraph(project.call_graph, graphNodes, graphEdges);
      }

      setNodes(graphNodes);
      setEdges(graphEdges);

      if (!selectedNode) {
        setOpenModalAiReport(true);
      }
      setSelectedNode(null);

      if (containerRef.current) {
        networkRef.current = new Network(
          containerRef.current,
          { nodes: new DataSet(graphNodes), edges: new DataSet(graphEdges) },
          {
            layout: {
              hierarchical: {
                enabled: true,
                direction: "UD", // "LR" = gauche-droite, "UD" = haut-bas
                sortMethod: "directed",
                levelSeparation: 150,
                nodeSpacing: 200,
                treeSpacing: 250,
              },
            },
            edges: {
              smooth: {
                enabled: true, // ✅ obligatoire
                type: "cubicBezier",
                forceDirection: true,
                roundness: 0.4,
              },
              arrows: { from: true },
            },
            physics: false, // pour ne pas que la physique modifie le layout
          },
        );

        networkRef.current.on("selectNode", (params) => {
          const nodeId = params.nodes[0];
          const node = graphNodes.find((n) => n.id === nodeId);
          if (node) setSelectedNode(node.data);
        });
      }
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

  return (
    <div
      className={`min-h-screen p-8 flex flex-col md:flex-row gap-6 ${isDarkMode ? "bg-zinc-950 text-white" : "bg-gray-100 text-gray-900"}`}
    >
      <div className="fixed top-4 right-4 z-50 gap-4 flex items-center">
        <DarkModeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        <ConfigMenu isDarkMode={isDarkMode} />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6">
        <h1 className="text-4xl font-extrabold mb-6 tracking-tight">
          C/C++ CVE Vulnerability Detection
        </h1>

        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={() => setOpenSelectFolderModal(true)}
            className={`px-5 py-2 rounded-lg cursor-pointer font-medium transition-colors ${isDarkMode ? "bg-zinc-800 hover:bg-zinc-700" : "bg-gray-300 hover:bg-gray-200"}`}
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

          {nodes.some((n) => n.data.library?.cves?.length !== 0) &&
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

        <div
          className={`border rounded-xl p-4 h-[700px] ${isDarkMode ? "border-zinc-800" : "border-gray-300 bg-white"} shadow-inner`}
        >
          <div ref={containerRef} className="h-full w-full" />
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`w-full md:w-96 mt-16 flex flex-col gap-6 p-5 rounded-xl border shadow-md ${isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-300"}`}
      >
        <div>
          <h2 className="text-xl font-semibold mb-2">Project Info</h2>
          {projectInfo ? (
            <div
              className={
                isDarkMode
                  ? "text-zinc-300 space-y-1"
                  : "text-zinc-700 space-y-1"
              }
            >
              <div>
                <strong>Name:</strong> {projectInfo.name}
              </div>
              <div>
                <strong>Version:</strong> {projectInfo.version}
              </div>
            </div>
          ) : (
            <p className="text-zinc-500">No project loaded</p>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Function Info</h2>
          {selectedNode ? (
            <div
              className={
                isDarkMode
                  ? "text-zinc-300 space-y-3"
                  : "text-zinc-700 space-y-3"
              }
            >
              <div>
                <strong>Name:</strong> {selectedNode.func_name}
              </div>
              {selectedNode.library ? (
                <div>
                  <strong>Librairie Associée:</strong>{" "}
                  <span
                    onClick={() =>
                      window.open(selectedNode.library?.git_repo, "_blank")
                    }
                    className="cursor-pointer hover:underline"
                  >
                    {selectedNode.library?.name}{" "}
                  </span>
                </div>
              ) : (
                <div>
                  <strong>Librairie Associée:</strong>{" "}
                  <span>Aucune (ou std)</span>
                </div>
              )}
              {selectedNode.library?.version && (
                <div>
                  <strong>Version:</strong>{" "}
                  <span>
                    {selectedNode.library?.version &&
                      `${selectedNode.library.version}`}
                  </span>
                </div>
              )}
              <div>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    color: nodeColor(selectedNode),
                  }}
                >
                  {nodeText(selectedNode)}
                </span>
              </div>
              {selectedNode.ai_vulnerability_score !== undefined &&
                selectedNode.ai_vulnerability_score !== null && (
                  <div
                    className={`px-3 py-1 text-center rounded-full text-sm font-medium ${
                      isDarkMode
                        ? selectedNode.ai_vulnerability_score >= 7
                          ? "bg-red-700 text-red-100"
                          : selectedNode.ai_vulnerability_score >= 4
                            ? "bg-yellow-700 text-yellow-100"
                            : "bg-green-700 text-green-100"
                        : selectedNode.ai_vulnerability_score >= 7
                          ? "bg-red-100 text-red-800"
                          : selectedNode.ai_vulnerability_score >= 4
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                    }`}
                  >
                    AI Score: {selectedNode.ai_vulnerability_score?.toFixed(1)}{" "}
                    / 10
                  </div>
                )}

              {selectedNode.library?.cves &&
              selectedNode.library?.cves?.length > 0 ? (
                selectedNode.ai_report ? (
                  <button
                    className="px-2 py-1 rounded-lg text-sm cursor-pointer font-semibold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 shadow-md hover:scale-105"
                    onClick={() => setShowAiReport(selectedNode)}
                  >
                    Show AI Report
                  </button>
                ) : (
                  <button
                    className="px-2 py-1 rounded-lg text-sm cursor-pointer font-semibold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 shadow-md hover:scale-105"
                    onClick={() => handleGenerateAiReport(selectedNode)}
                  >
                    Analyze with AI
                  </button>
                )
              ) : collectVulnerableDescendants(selectedNode).length > 0 ? (
                <div>
                  <strong>Vulnerable Descendants:</strong>
                  <ul
                    className={`list-inside ${
                      isDarkMode ? "text-zinc-400" : "text-zinc-600"
                    } space-y-1 mt-1`}
                  >
                    {collectVulnerableDescendants(selectedNode).map((child) => (
                      <li
                        key={
                          child.func_name +
                          child.locations
                            .map((l) => `${l.file}:${l.line}:${l.column ?? 0}`)
                            .join("|")
                        }
                        className="flex items-center justify-between gap-2"
                      >
                        <span>{child.func_name}</span>

                        <button
                          className={`text-xs cursor-pointer px-2 py-0.5 rounded-md font-medium transition-colors ${
                            isDarkMode
                              ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                          onClick={() => {
                            setSelectedNode(child);
                            if (child.id)
                              networkRef?.current?.selectNodes([child.id]);
                          }}
                        >
                          Learn more
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selectedNode.locations.length > 0 && (
                <>
                  <div className="w-full h-0.5 bg-zinc-300 dark:bg-zinc-700" />
                  <div>
                    <strong>Called in:</strong>
                    <ul
                      className={`list-inside ${
                        isDarkMode ? "text-zinc-400" : "text-zinc-600"
                      } space-y-1 mt-1`}
                    >
                      {selectedNode.locations.map((loc) => (
                        <li key={`${loc.file}:${loc.line}:${loc.column ?? 0}`}>
                          • {loc.file.replace(/^\/tmp\/[^\/]+\//, "")}:
                          {loc.line}:{loc.column ?? 0}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {selectedNode.library?.cves &&
                    selectedNode.library.cves.length > 0 && (
                      <div className="w-full h-0.5 bg-zinc-300 dark:bg-zinc-700" />
                    )}
                </>
              )}
              {selectedNode.library?.cves &&
                selectedNode.library.cves.length > 0 && (
                  <div>
                    <strong>CVEs:</strong>
                    <ul
                      className={`list-inside ${
                        isDarkMode ? "text-zinc-400" : "text-zinc-600"
                      } space-y-1 mt-1`}
                    >
                      {selectedNode.library.cves.map((cve) => (
                        <CVEItem
                          key={cve.id}
                          cve={cve}
                          isDarkMode={isDarkMode}
                        />
                      ))}
                    </ul>
                  </div>
                )}
              {/* {selectedNode.ai_report && (
                <div>
                  <strong>AI Report:</strong>
                  <p>{selectedNode.ai_report}</p>
                </div>
              )} */}
            </div>
          ) : (
            <p className="text-zinc-500">No function selected</p>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        open={loading}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div
          className={`p-6 rounded-2xl flex flex-col items-center ${isDarkMode ? "bg-zinc-900/90 backdrop-blur-md" : "bg-white/90 backdrop-blur-sm"} shadow-lg`}
        >
          <CircularProgress />
          <p
            className={`text-lg mt-3 ${isDarkMode ? "text-zinc-300" : "text-zinc-700"}`}
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
          className={`p-6 rounded-2xl flex flex-col items-center ${isDarkMode ? "bg-zinc-900/90 backdrop-blur-md" : "bg-white/90 backdrop-blur-sm"} shadow-lg`}
        >
          <CircularProgress />
          <p
            className={`text-lg mt-3 ${isDarkMode ? "text-zinc-300" : "text-zinc-700"}`}
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
          className={`p-6 rounded-2xl flex flex-col items-center gap-4 ${
            isDarkMode
              ? "bg-zinc-900/90 backdrop-blur-md"
              : "bg-white/90 backdrop-blur-sm"
          } shadow-lg pt-10`}
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
        aiScore={projectInfo?.call_graph?.global_score || null}
        aiReport={unwrapMarkdownBlock(
          projectInfo?.call_graph?.global_report || "",
        )}
      />
      <AiReportModal
        openModalAiReport={!!showAiReport}
        setOpenModalAiReport={() => setShowAiReport(null)}
        aiScore={showAiReport?.ai_vulnerability_score || null}
        aiReport={unwrapMarkdownBlock(showAiReport?.ai_report || "")}
      />
    </div>
  );
}

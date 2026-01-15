"use client";

import { useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { Network, DataSet } from "vis-network/standalone";
import "vis-network/styles/vis-network.css";
import { CircularProgress, Modal } from "@mui/joy";
import CVEItem from "@/components/Item/CVEItem";

/* =====================
   Types
===================== */

export type CVE = {
  id: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  cvss: number;
  published_date: string;
};

type FunctionNodeData = {
  id: string;
  name: string;
  dependency: string;
  files_used: string[];
  version: string;
  status: "potentially vulnerable" | "safe" | "vulnerable";
  cves?: CVE[];
};

export type CallGraph = {
  [functionName: string]: CallGraph;
};

type ASTResponse = {
  call_graph: {
    call_graph: CallGraph;
    file_call_graphs: { [key: string]: { [key: string]: string[] } };
    file_functions: { [key: string]: string[] };
    functions: {
      [key: string]: {
        name: string;
        files: string[];
        line: number;
        calls: { functions: string; line: number; column: number }[];
      };
    };
  };
  cmake: {
    compiler_requirements: { compile_options: string[] };
    dependencies: {
      name: string;
      version: string;
      git_repo: string;
      vendor: string;
      source: string;
    }[];
    linked_libraries: string[];
    project: {
      name: string;
      version: string;
      cpp_standard: string;
      cmake_version: string;
    };
    subdirectories: string[];
  };
  exploit_db: { [key: string]: string[] };
  impact: {
    direct: string[];
    indirect: string[];
    chains: { [key: string]: string[] };
    counts: {
      direct: number;
      indirect: number;
      functions: number;
      libs: number;
    };
    vulnerable_functions: string[];
    vulnerable_libs: string[];
  };
  meta: {
    cpp_files: number;
    dependencies: number;
    cves: number;
  };
  vulnerabilities: {
    [key: string]: {
      checked_at: string;
      cve_count: number;
      cves: {
        id: string;
        severity: string;
        cvss: number;
        description: string;
        published_date: string;
      }[];
      library: string;
      max_severity: string;
      version: string;
    };
  };
};

/* =====================
   Config
===================== */

const LOCAL_URL = "http://localhost:8000";
const CLOUD_URL =
  "https://cpp-analyzer-backend-531057961347.europe-west1.run.app";

/* =====================
   Helpers
===================== */

const nodeColor = (status: FunctionNodeData["status"]) => {
  switch (status) {
    case "safe":
      return "#16a34a";
    case "vulnerable":
      return "#b91c1c";
    case "potentially vulnerable":
      return "#d97706";
    default:
      return "#6b7280";
  }
};

/* =====================
   Recursive CallGraph Traversal
===================== */

function buildGraphFromCallGraph(
  graph: CallGraph,
  ast: ASTResponse,
  nodes: {
    id: string;
    label: string;
    color: string;
    level: number;
    data: FunctionNodeData;
  }[],
  edges: {
    from: string;
    to: string;
    color: {
      color: string;
      highlight: string;
      hover: string;
    };
  }[],
  idMap: Record<string, string>,
  parent?: string,
  level: number = 0
) {
  Object.entries(graph).forEach(([funcName, children]) => {
    // Si le nœud n'existe pas encore, on le crée
    if (!idMap[funcName]) {
      const funcVulnInfo = Object.values(ast.vulnerabilities).find((lib) =>
        lib.cves.some((cve) =>
          Object.values(ast.impact.chains).some((chain) =>
            chain.includes(funcName)
          )
        )
      );

      const status: FunctionNodeData["status"] = Object.values(
        ast.impact.chains
      ).some((chain) => chain.includes(funcName))
        ? "potentially vulnerable"
        : "safe";

      const cves: CVE[] | undefined = funcVulnInfo
        ? funcVulnInfo.cves.map((cve) => ({
            id: cve.id,
            description: cve.description,
            severity: cve.severity as CVE["severity"],
            cvss: cve.cvss,
            published_date: cve.published_date,
          }))
        : undefined;

      const uniqueId = `node-${Object.keys(idMap).length}`;
      idMap[funcName] = uniqueId;

      nodes.push({
        id: uniqueId,
        label: funcName,
        color: nodeColor(status),
        level, // ← niveau pour Vis Network
        data: {
          id: uniqueId,
          name: funcName,
          dependency: funcVulnInfo
            ? funcVulnInfo.library
            : "potentially vulnerable",
          version: funcVulnInfo
            ? funcVulnInfo.version
            : "potentially vulnerable",
          status,
          cves,
          files_used: ast.call_graph.functions[funcName]?.files
            ? ast.call_graph.functions[funcName].files.map((f) =>
                f
                  .split("/")
                  .filter((v, i) => i > 3)
                  .join("/")
              )
            : Object.keys(ast.call_graph.file_call_graphs)
                .filter((file) =>
                  Object.values(ast.call_graph.file_call_graphs[file]).some(
                    (chain) => chain.includes(funcName)
                  )
                )
                .map((f) =>
                  f
                    .split("/")
                    .filter((v, i) => i > 3)
                    .join("/")
                ),
        } as FunctionNodeData,
      });
    } else {
      // Si le nœud existe déjà, mettre à jour le niveau si nécessaire
      const node = nodes.find((n) => n.id === idMap[funcName]);
      if (node && level < node.level) {
        node.level = level;
      }
    }

    // Crée une arête depuis le parent si existant
    if (parent && parent !== funcName) {
      edges.push({
        from: idMap[parent],
        to: idMap[funcName],
        color: {
          color: nodeColor(
            Object.values(ast.impact.chains).some((chain) =>
              chain.includes(funcName)
            )
              ? "potentially vulnerable"
              : "safe"
          ),
          highlight: nodeColor(
            Object.values(ast.impact.chains).some((chain) =>
              chain.includes(funcName)
            )
              ? "potentially vulnerable"
              : "safe"
          ),
          hover: nodeColor(
            Object.values(ast.impact.chains).some((chain) =>
              chain.includes(funcName)
            )
              ? "potentially vulnerable"
              : "safe"
          ),
        },
      });
    }

    // Récursion sur les sous-fonctions
    buildGraphFromCallGraph(
      children,
      ast,
      nodes,
      edges,
      idMap,
      funcName,
      level + 1
    );
  });
}

/* =====================
   Component
===================== */

export default function Page() {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const networkRef = useRef<Network | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const [files, setFiles] = useState<FileList | null>(null);
  const [selectedNode, setSelectedNode] = useState<FunctionNodeData | null>(
    null
  );
  const [projectInfo, setProjectInfo] = useState<
    ASTResponse["cmake"]["project"] | null
  >(null);

  /* =====================
     Folder input
  ==================== */
  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute("webkitdirectory", "");
      folderInputRef.current.setAttribute("directory", "");
    }
  }, []);

  const handleFolderSelect = (fileList: FileList) => {
    setFiles(fileList);
  };

  useEffect(() => {
    if (files) {
      uploadAndAnalyzeProject();
    }
  }, [files]);

  /* =====================
     Upload & analyze
  ==================== */
  const uploadAndAnalyzeProject = async () => {
    if (!files) return;

    setLoading(true);

    try {
      const zip = new JSZip();
      Array.from(files).forEach((file) =>
        zip.file(file.webkitRelativePath || file.name, file)
      );

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const formData = new FormData();
      formData.append("project", zipBlob, "project.zip");

      const res = await fetch(CLOUD_URL + "/analyze", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to analyze project");

      const ast: ASTResponse = await res.json();
      console.log("AST Response:", ast);
      setProjectInfo(ast.cmake.project);

      // Build nodes & edges from recursive call graph
      const nodes: {
        id: string;
        label: string;
        color: string;
        level: number;
        data: FunctionNodeData;
      }[] = [];
      const edges: {
        id: string;
        from: string;
        to: string;
        color: {
          color: string;
          highlight: string;
          hover: string;
        };
      }[] = [];
      const idMap: Record<string, string> = {};

      buildGraphFromCallGraph(
        ast.call_graph.call_graph,
        ast,
        nodes,
        edges,
        idMap
      );

      // Initialize vis-network
      if (containerRef.current) {
        networkRef.current = new Network(
          containerRef.current,
          { nodes: new DataSet(nodes), edges: new DataSet(edges) },
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
          }
        );

        networkRef.current.on("selectNode", (params) => {
          const nodeId = params.nodes[0];
          const node = nodes.find((n) => n.id === nodeId);
          if (node) setSelectedNode(node.data as FunctionNodeData);
        });
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Error analyzing project");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-6">
          C/C++ CVE Vulnerability Detection
        </h1>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <label className="bg-zinc-800 px-4 py-2 rounded cursor-pointer hover:bg-zinc-700">
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
          </label>
        </div>

        {/* Graph */}
        <div className="border border-zinc-800 rounded p-4 h-[700px]">
          <div ref={containerRef} className="h-full w-full" />
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full md:w-96 border border-zinc-800 rounded p-4 flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Project Info</h2>
        {projectInfo ? (
          <div className="text-zinc-300 space-y-1">
            <div>
              <strong>Name:</strong> {projectInfo.name}
            </div>
            <div>
              <strong>Version:</strong> {projectInfo.version}
            </div>
            <div>
              <strong>C++ Standard:</strong> {projectInfo.cpp_standard}
            </div>
            <div>
              <strong>CMake Version:</strong> {projectInfo.cmake_version}
            </div>
          </div>
        ) : (
          <p className="text-zinc-500">No project loaded</p>
        )}

        <h2 className="text-xl font-semibold mt-4">Function Info</h2>
        {selectedNode ? (
          <div className="text-zinc-300 space-y-2">
            <div>
              <strong>Name:</strong> {selectedNode.name}
            </div>
            <div>
              <strong style={{ color: nodeColor(selectedNode.status) }}>
                Status:
              </strong>{" "}
              <span style={{ color: nodeColor(selectedNode.status) }}>
                {selectedNode.status}
              </span>
            </div>
            <div>
              <strong>Called in:</strong>{" "}
              {selectedNode.files_used.map((f) => (
                <div key={f}>- {f}</div>
              ))}
            </div>

            {selectedNode.cves && selectedNode.cves.length > 0 && (
              <>
                <div>
                  <strong>CVEs:</strong>
                </div>
                <ul className="list-disc list-inside text-zinc-400">
                  {selectedNode.cves.map((cve) => (
                    <CVEItem key={cve.id} cve={cve} />
                  ))}
                </ul>
              </>
            )}
          </div>
        ) : (
          <p className="text-zinc-500">Select a node to see details</p>
        )}
      </div>
      <Modal
        open={loading}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div className="bg-zinc-900/90 backdrop-blur-md rounded-lg p-6 flex flex-col items-center">
          <div className="loader mb-4"></div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </div>
          <p className="text-white text-lg">Analyzing project...</p>
        </div>
      </Modal>
    </div>
  );
}

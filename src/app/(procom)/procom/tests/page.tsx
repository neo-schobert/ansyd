"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/joy";

import { CallGraphNode, ProjectInfos } from "../page";
import FolderPicker from "@/components/Input/FolderPicker";
import DarkModeToggle from "@/components/Button/DarkModeToggle";
import ConfigMenuTest from "@/components/Button/ConfigMenuTest";
import { useSearchParams } from "next/navigation";

/* =====================================================
   🔴 OBLIGATOIRE — EXACTEMENT comme dans le code qui marche
===================================================== */

declare module "react" {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: boolean;
    directory?: boolean;
  }
}

/* =====================
   Types
===================== */

export type JudgeReports = Record<string, string>;
export type JudgeScores = Record<string, number>;
export type JudgeMetricScores = Record<string, Record<string, number>>;

export type JudgedCallGraphNode = CallGraphNode & {
  judge_ai_reports?: JudgeReports;
  judge_ai_vulnerability_scores?: JudgeScores;
  judge_ai_metric_scores?: JudgeMetricScores;
};

export type TestResult = {
  id: string;
  created_at: string;
  tested_model: string;
  project: ProjectInfos & {
    call_graph: JudgedCallGraphNode;
  };
};

/* =====================
   Mock data
===================== */

const AVAILABLE_MODELS = [
  "gpt-4.1",
  "gpt-4o-mini",
  "claude-3-opus",
  "deepseek-coder",
];

/* =====================
   Component
===================== */

export default function TestsPage() {
  const searchParams = useSearchParams();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const dm = searchParams.get("isDarkModeInit");
    setIsDarkMode(dm === "true");
  }, [searchParams]);

  const [tests, setTests] = useState<TestResult[]>([]);
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [selectedNode, setSelectedNode] = useState<JudgedCallGraphNode | null>(
    null,
  );

  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);

  const [openCreateModal, setOpenCreateModal] = useState(false);

  const [testedModel, setTestedModel] = useState<string | null>(null);
  const [judgeModels, setJudgeModels] = useState<string[]>([]);

  /* =====================================================
     🔴 OBLIGATOIRE — injection DOM réelle
  ===================================================== */

  useEffect(() => {
    if (files) {
      console.log("Files selected:", files);
    }
  }, [files]);

  const handleFolderSelect = (fileList: FileList) => {
    setFiles(fileList);
  };

  const toggleJudgeModel = (model: string) => {
    setJudgeModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model],
    );
  };

  const handleCreateTest = async () => {
    if (!files || !testedModel || judgeModels.length === 0) return;

    setLoading(true);
    try {
      console.log({
        files,
        testedModel,
        judgeModels,
      });

      setOpenCreateModal(false);
      setFiles(null);
      setTestedModel(null);
      setJudgeModels([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen p-8 flex gap-6 ${
        isDarkMode ? "bg-zinc-950 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="fixed top-4 right-4 z-50 gap-4 flex items-center">
        <DarkModeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        <ConfigMenuTest isDarkMode={isDarkMode} />
      </div>
      {/* Tests list */}
      <div
        className={`w-80 rounded-xl border p-4 flex flex-col gap-3 ${
          isDarkMode
            ? "bg-zinc-900 border-zinc-800"
            : "bg-white border-gray-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tests</h2>
          <button
            className="px-5 py-2 rounded-lg cursor-pointer font-semibold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 shadow-md hover:scale-105"
            onClick={() => setOpenCreateModal(true)}
          >
            New
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {tests.map((test) => (
            <div
              key={test.id}
              onClick={() => {
                setSelectedTest(test);
                setSelectedNode(null);
              }}
              className={`p-3 rounded-lg cursor-pointer mb-2 transition ${
                selectedTest?.id === test.id
                  ? "bg-blue-600 text-white"
                  : isDarkMode
                    ? "hover:bg-zinc-800"
                    : "hover:bg-gray-200"
              }`}
            >
              <div className="font-medium">{test.project.name}</div>
              <div className="text-sm opacity-70">
                Model: {test.tested_model}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main panel */}
      <div className="flex-1 flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Model Evaluation</h1>

        <div
          className={`flex-1 border rounded-xl ${
            isDarkMode ? "border-zinc-800" : "border-gray-300 bg-white"
          }`}
        >
          {selectedTest ? (
            <div className="h-full w-full" />
          ) : (
            <div className="h-full flex items-center justify-center opacity-60">
              Select a test
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`w-96 mt-13 rounded-xl border p-5 ${
          isDarkMode
            ? "bg-zinc-900 border-zinc-800"
            : "bg-white border-gray-300"
        }`}
      >
        <h2 className="text-xl font-semibold mb-4">Details</h2>
        {!selectedNode && <p className="opacity-60">No node selected</p>}
      </div>

      {/* Create Test Modal */}
      <Modal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className={`px-16 py-6 rounded-2xl flex flex-col items-center gap-4 ${
            isDarkMode
              ? "bg-zinc-900/90 backdrop-blur-md"
              : "bg-white/90 backdrop-blur-sm"
          } shadow-lg pt-10`}
        >
          {/* Close button */}
          <Button
            variant="plain"
            onClick={() => setOpenCreateModal(false)}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: isDarkMode ? "#e5e7eb" : "#111",
            }}
          >
            ✕
          </Button>

          {/* Title */}
          <Typography
            level="h4"
            sx={{
              textAlign: "center",
              color: isDarkMode ? "#e5e7eb" : "#111",
            }}
          >
            Create New Test
          </Typography>

          {/* Project */}
          <div className="flex flex-col items-center gap-2 w-full">
            <FolderPicker
              buttonText="Select Project Folder"
              onSelect={handleFolderSelect}
              isDarkMode={isDarkMode}
            />
            {files && (
              <Typography
                level="body-xs"
                mt={1}
                sx={{ opacity: 0.7, textAlign: "center" }}
              >
                {files.length} files selected
              </Typography>
            )}
          </div>

          <Divider
            sx={{
              width: "100%",
              borderColor: isDarkMode ? "#374151" : "#e5e7eb",
            }}
          />

          {/* Tested Model */}
          <div className="flex flex-col items-center gap-2 w-full">
            <Typography
              level="title-sm"
              sx={{
                textAlign: "center",
                color: isDarkMode ? "#e5e7eb" : "#111",
              }}
            >
              Tested Model
            </Typography>
            <RadioGroup orientation="vertical">
              {AVAILABLE_MODELS.map((m) => (
                <Radio
                  key={m}
                  label={m}
                  checked={testedModel === m}
                  onChange={() => setTestedModel(m)}
                  sx={{ color: isDarkMode ? "#e5e7eb" : "#111" }}
                />
              ))}
            </RadioGroup>
          </div>

          <Divider
            sx={{
              width: "100%",
              borderColor: isDarkMode ? "#374151" : "#e5e7eb",
            }}
          />

          {/* Judge Models */}
          <div className="flex flex-col items-center gap-2 w-full">
            <Typography
              level="title-sm"
              sx={{
                textAlign: "center",
                color: isDarkMode ? "#e5e7eb" : "#111",
              }}
            >
              Judge Models
            </Typography>
            <Stack>
              {AVAILABLE_MODELS.map((m) => (
                <Checkbox
                  key={m}
                  label={m}
                  checked={judgeModels.includes(m)}
                  onChange={() => toggleJudgeModel(m)}
                  disabled={m === testedModel}
                  sx={{ color: isDarkMode ? "#e5e7eb" : "#111", mb: 1 }}
                />
              ))}
            </Stack>
          </div>

          <Divider
            sx={{
              width: "100%",
              borderColor: isDarkMode ? "#374151" : "#e5e7eb",
            }}
          />

          {/* Launch button */}
          <div className="flex justify-center w-full mt-4">
            <button
              onClick={handleCreateTest}
              //   disabled={!files || !testedModel || judgeModels.length === 0}
              disabled={true}
              className={`${isDarkMode ? "text-white" : "text-black"} ${
                !files || !testedModel || judgeModels.length === 0
                  ? "bg-gray-400 cursor-not-allowed text-gray-200"
                  : "bg-gradient-to-r from-[#f99c01] to-[#fa3001] hover:shadow-[0px_10px_25px_rgba(0,0,0,0.3)] hover:-translate-y-1"
              } font-bold py-4 px-8 cursor-pointer rounded-lg shadow-[0px_10px_25px_rgba(0,0,0,0.15)] transition transform`}
            >
              {/* Launch Test */}
              NON DISPONIBLE
            </button>
          </div>
        </div>
      </Modal>

      {/* Loading */}
      <Modal open={loading}>
        <div className="p-6 rounded-xl">
          <CircularProgress />
        </div>
      </Modal>
    </div>
  );
}

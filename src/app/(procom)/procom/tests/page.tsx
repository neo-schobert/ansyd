import TestsPage, { TestResult } from "./TestsPage";

const LOCAL_URL = "http://localhost:8000";
const CLOUD_URL =
  "https://cpp-analyzer-backend-531057961347.europe-west1.run.app";

type TestResultsResponse = {
  results: Record<string, TestResult>;
  testModels: string[];
  judgeModels: string[];
};

async function getTests(): Promise<{
  tests: TestResult[];
  testModels: string[];
  judgeModels: string[];
}> {
  try {
    const res = await fetch(`${CLOUD_URL}/test_results`, { cache: "no-store" });

    if (!res.ok) {
      console.error(`[getTests] HTTP ${res.status}: ${res.statusText}`);
      return { tests: [], testModels: [], judgeModels: [] };
    }

    const data = (await res.json()) as TestResultsResponse;

    return {
      tests: Object.values(data.results ?? {}),
      testModels: Array.isArray(data.testModels) ? data.testModels : [],
      judgeModels: Array.isArray(data.judgeModels) ? data.judgeModels : [],
    };
  } catch (e) {
    console.error("[getTests] Error:", e);
    return { tests: [], testModels: [], judgeModels: [] };
  }
}

export default async function Page() {
  const { tests, testModels, judgeModels } = await getTests();
  return (
    <TestsPage
      serverTests={tests}
      testModels={testModels}
      defaultJudgeModels={judgeModels}
    />
  );
}

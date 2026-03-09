import TestsPage, { TestResult } from "./TestsPage";

const LOCAL_URL = "http://localhost:8000";
const CLOUD_URL =
  "https://cpp-analyzer-backend-531057961347.europe-west1.run.app";

// Définir un type pour la nouvelle réponse
type TestResultsResponse = {
  results: Record<string, TestResult>;
  models: string[];
};

// Fetch côté serveur
async function getTests(): Promise<{ tests: TestResult[]; models: string[] }> {
  try {
    const res = await fetch(`${LOCAL_URL}/test_results`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch tests");

    const data = (await res.json()) as TestResultsResponse;

    const tests = Object.values(data.results);
    const models = data.models;

    return { tests, models };
  } catch (e) {
    console.error("Error fetching tests:", e);
    return { tests: [], models: [] };
  }
}

export default async function Page() {
  const { tests: serverTests, models } = await getTests();

  return <TestsPage serverTests={serverTests} models={models} />;
}

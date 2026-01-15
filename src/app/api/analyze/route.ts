import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

function parseCppFiles(filePaths: string[]) {
  const functions: Record<string, any> = {};
  const edges: { from: string; to: string }[] = [];

  const funcRegex = /\b([\w:~]+)\s*\(([^)]*)\)\s*\{/g;
  const callRegex = /([\w:]+)\s*\(/g;

  for (const filePath of filePaths) {
    const content = fs.readFileSync(filePath, "utf-8");
    const funcNames: string[] = [];
    let m;

    // Extraction fonctions
    while ((m = funcRegex.exec(content)) !== null) {
      const name = m[1];
      functions[name] = {
        id: name,
        name,
        dependency: "unknown",
        version: "unknown",
      };
      funcNames.push(name);
    }

    // Extraction appels
    while ((m = callRegex.exec(content)) !== null) {
      const callee = m[1];
      for (const parent of funcNames) {
        if (callee !== parent) edges.push({ from: parent, to: callee });
      }
    }
  }

  return { functions, edges };
}

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as any[];

    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cppproj-"));
    const cppFiles: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const dest = path.join(tempDir, file.name);
      fs.writeFileSync(dest, buffer);

      if (
        file.name.endsWith(".c") ||
        file.name.endsWith(".cpp") ||
        file.name.endsWith(".h") ||
        file.name.endsWith(".hpp")
      )
        cppFiles.push(dest);
    }

    const { functions, edges } = parseCppFiles(cppFiles);

    fs.rmSync(tempDir, { recursive: true, force: true });

    return NextResponse.json({ functions, edges });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Failed to analyze project" },
      { status: 500 }
    );
  }
};

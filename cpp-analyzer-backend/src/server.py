import os
import sys
import zipfile
import tempfile
import traceback
from pathlib import Path
from typing import Dict, List

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse



# =========================
# Imports pipeline
# =========================
from .exploit_db import find_cve_exploit_db
from .cmake_extractor import extract_dependencies, serialize_cmake_info
from .cve_checker import check_vulnerabilities, serialize_vulnerability_result
from .ast_analyzer import analyze_files , serialize_call_graph
from .cve_impact_analyzer import analyze_impact , serialize_impact
from .openrouter_client import create_client
from .vulnerability_report_generator import generate_report
from .config import OPENROUTER_API_KEY, MODEL_NAME

if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY not set")

if not MODEL_NAME:
    raise ValueError("MODEL_NAME not set")

# =========================
# Variables Environment
# =========================




# =========================
# Utils
# =========================
def find_cpp_files(directory: str) -> List[str]:
    directory = Path(directory)
    cpp_files = []
    for pattern in ["**/*.cpp", "**/*.cc", "**/*.cxx", "**/*.c"]:
        cpp_files.extend(str(f) for f in directory.glob(pattern))
    return sorted(cpp_files)


def find_cmake(project_dir: Path) -> str | None:
    """
    Find a CMakeLists.txt file anywhere in the project directory.
    
    Search order:
    1. project_dir/CMakeLists.txt
    2. project_dir/cmake/CMakeLists.txt
    3. Any CMakeLists.txt recursively in project_dir
    """
    # 1️⃣ Root-level
    root_candidates = [
        project_dir / "CMakeLists.txt",
        project_dir / "cmake" / "CMakeLists.txt",
    ]
    for path in root_candidates:
        if path.exists():
            return str(path)

    # 2️⃣ Recursive search
    for path in project_dir.rglob("CMakeLists.txt"):
        return str(path)  # return first found

    # 3️⃣ Not found
    return None


# =========================
# Core analysis logic
# =========================
def analyze_cpp_project(project_dir: str, generate_ai_report: bool = False, project_name: str = None) -> Dict:
    project_dir = Path(project_dir)

    # -------- Step 1: CMake deps --------
    cmake_path = find_cmake(project_dir)
    dependencies = []
    cmake_info = None

    if cmake_path:
        cmake_info = extract_dependencies(cmake_path)
        dependencies = cmake_info.dependencies
    else :
        print("Warning: CMakeLists.txt not found, skipping dependency extraction.", file=sys.stderr)

    # -------- Step 2: CVEs --------
    vulnerabilities = {}
    if dependencies:
        vulnerabilities = check_vulnerabilities(
            dependencies,
            verbose=True,
        )
    else :
        print("Warning: No dependencies found, skipping vulnerability check.", file=sys.stderr)

    libs_ = [key for key in vulnerabilities.keys()]

    cve_full_list = []

    for lib_ in libs_: 
        cve_full_list+= [v.cve_id for v in list(vulnerabilities[lib_].cves)] 

    exploit_db_info = find_cve_exploit_db(cve_full_list)
    
    
    # -------- Step 3: AST / Call graph --------
    cpp_files = find_cpp_files(str(project_dir))
    if not cpp_files:
        raise RuntimeError("No C/C++ source files found")

    call_graph = analyze_files(cpp_files)

    # -------- Step 4: Impact analysis --------
    impact = analyze_impact(call_graph, vulnerabilities)


    # ====================================================================
    # Step 5: Generate AI-powered vulnerability assessment report
    # ====================================================================
    report = None
    if generate_ai_report:
        print("\n[6/6] Generating AI-powered vulnerability assessment report...")
        

        
        # Create OpenRouter client
        print("OPENROUTER_API_KEY:", OPENROUTER_API_KEY)

        client = create_client(OPENROUTER_API_KEY, MODEL_NAME)
        print(f"  Using model: {client.default_model}")
        # Generate report
        report = generate_report(
            exploit_db_info,
            vulnerabilities,
            call_graph,
            impact,
            client,
            project_name
        )
        
    
        

    # -------- Result JSON --------
    return {
        "meta": {
            "cpp_files": len(cpp_files),
            "dependencies": len(dependencies),
            "cves": len(cve_full_list),
        },
        "cmake": serialize_cmake_info(cmake_info) if cmake_info else None,
        "vulnerabilities": {
            lib: serialize_vulnerability_result(data)
            for lib, data in vulnerabilities.items()
        },
        "exploit_db": exploit_db_info,
        "call_graph": serialize_call_graph(call_graph),
        "impact": serialize_impact(impact),
        "ai_report": report,
    }


# =========================
# FastAPI server
# =========================
app = FastAPI()

origins = [
    "http://localhost:3000",
    "https://ast-analyzer-531057961347.europe-west1.run.app",
    "https://www.neo-imt.cloud",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/analyze")
async def analyze(project: UploadFile = File(...)):
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            zip_path = os.path.join(tmpdir, "project.zip")

            with open(zip_path, "wb") as f:
                f.write(await project.read())

            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                zip_ref.extractall(tmpdir)

            result = analyze_cpp_project(tmpdir)
            return JSONResponse(result)

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            {"error": str(e)},
            status_code=500,
        )


@app.post("/llm_generate_report")
async def llm_generate_report(project: UploadFile = File(...)):
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            zip_path = os.path.join(tmpdir, "project.zip")

            with open(zip_path, "wb") as f:
                f.write(await project.read())

            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                zip_ref.extractall(tmpdir)

            result = analyze_cpp_project(tmpdir, generate_ai_report=True, project_name=project.filename)
            return JSONResponse(result)

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            {"error": str(e)},
            status_code=500,
        )

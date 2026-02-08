import asyncio
from datetime import datetime
import json
import os
import sys
import zipfile
import tempfile
import traceback
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import asdict
sys.path.append(str(Path(__file__).parent))

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from classes.ProjectInfos import ProjectInfos
from classes.config import OPENROUTER_API_KEY, MODEL_NAME
from classes.Model import Model

# =========================
# Imports pipeline
# =========================

from classes.CallGraphNode import CallGraphNode

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
def _serialize(obj):
    """Convertit les objets non JSON-serializables en chaîne"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    return str(obj)





def generate_ai_report(projectInfos: ProjectInfos, selectedNode : CallGraphNode = None) -> Dict:
    # Create OpenRouter client
    if selectedNode:
        projectInfos.call_graph.generate_targeted_ai_report(selectedNode)
    else:
        projectInfos.call_graph.generate_global_ai_report()
    project_dict = asdict(projectInfos)
    # Retour JSON compatible FastAPI
    json_str = json.dumps(project_dict, default=_serialize, indent=2)
    return json.loads(json_str)  # on retourne un dict pour FastAPI




async def analyzeCppProject(project_dir: str) -> Dict:
    # === Réinitialisation globale statique ===
    CallGraphNode._initialized = False
    CallGraphNode._library_tasks = []
    CallGraphNode._functions = {}
    CallGraphNode._calls = {}
    CallGraphNode._visited = {}
    CallGraphNode._libraries = {}

    # === Construction du projet ===
    project = ProjectInfos(project_dir)

    # === Attente des tâches asynchrones des bibliothèques ===
    if CallGraphNode._library_tasks:
        await asyncio.gather(*CallGraphNode._library_tasks)
    CallGraphNode._library_tasks = []

    # === Retour JSON ===
    project_dict = asdict(project)
    json_str = json.dumps(project_dict, default=_serialize, indent=2)
    return json.loads(json_str)


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

            result = await analyzeCppProject(tmpdir)
            return JSONResponse(result)

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            {"error": str(e)},
            status_code=500,
        )


@app.post("/llm_generate_report")
async def llm_generate_report(
    project: UploadFile = File(...),
    projectInfos: str = Form(...),
    selectedNode: Optional[str] = Form(None),
):
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            zip_path = os.path.join(tmpdir, "project.zip")

            with open(zip_path, "wb") as f:
                f.write(await project.read())

            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                zip_ref.extractall(tmpdir)

            projectInfos_obj = ProjectInfos.from_dict(json.loads(projectInfos), Path(tmpdir))

            selectedNode = CallGraphNode.from_dict(json.loads(selectedNode), Path(tmpdir)) if selectedNode else None

            result = generate_ai_report(projectInfos_obj, selectedNode=selectedNode)
            return JSONResponse(result)

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            {"error": str(e)},
            status_code=500,
        )



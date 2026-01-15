"""
CMake Dependency Extractor

This module provides functionality to extract dependency information from CMakeLists.txt files.
It can be used as a library by other scripts or run directly for CLI usage.

Main API:
    - extract_dependencies(file_path) -> CMakeInfo: Extract all dependency information
    - save_to_json(cmake_info, output_path): Save extracted info to JSON file
"""

import re
import json
from typing import Dict, List, Set, Optional
from dataclasses import dataclass, field, asdict
from pathlib import Path


# ============================================================================
# Data Models
# ============================================================================

@dataclass
class Dependency:
    """Represents a single dependency with its metadata"""
    name: str
    vendor: Optional[str] = None
    version: str = "unknown"
    source: str = "unknown"  # FetchContent, find_package, ExternalProject, etc.
    git_repo: Optional[str] = None
    options: Dict[str, str] = field(default_factory=dict)


@dataclass
class CMakeInfo:
    """Complete CMake project information"""
    dependencies: List[Dependency] = field(default_factory=list)
    linked_libraries: Set[str] = field(default_factory=set)
    subdirectories: List[str] = field(default_factory=list)
    cmake_version: Optional[str] = None
    cpp_standard: Optional[str] = None
    project_name: Optional[str] = None
    project_version: Optional[str] = None
    compiler_requirements: Dict[str, any] = field(default_factory=dict)


# ============================================================================
# Helper Functions
# ============================================================================
def serialize_dependency(d: Dependency) -> dict:
    return {
        "name": d.name,
        "vendor": d.vendor,
        "version": d.version,
        "source": d.source,
        "git_repo": d.git_repo,
        "options": d.options,
    }

def serialize_cmake_info(info: CMakeInfo) -> dict:
    return {
        "project": {
            "name": info.project_name,
            "version": info.project_version,
            "cmake_version": info.cmake_version,
            "cpp_standard": info.cpp_standard,
        },
        "dependencies": [serialize_dependency(d) for d in info.dependencies],
        "linked_libraries": sorted(info.linked_libraries),  # set → list
        "subdirectories": info.subdirectories,
        "compiler_requirements": info.compiler_requirements,
    }


def _infer_vendor_from_git(git_url: str) -> Optional[str]:
    """Try to extract vendor/organization from a git URL"""
    if not git_url:
        return None
    
    # Clean up the URL first
    clean_url = git_url.strip()
    if clean_url.endswith('.git'):
        clean_url = clean_url[:-4]
        
    # Pattern 1: github.com/VENDOR/REPO
    match = re.search(r'(?:github|gitlab)\.com[:/]([^/]+)/([^/]+)', clean_url)
    if match:
        return match.group(1)
        
    # Pattern 2: Generic git URLs (git://host/VENDOR/REPO)
    match = re.search(r'[:/]([^/]+)/([^/]+)$', clean_url)
    if match:
        return match.group(1)
        
    return None

# ============================================================================
# Core Extraction Functions
# ============================================================================

def _extract_fetchcontent_dependencies(content: str) -> List[Dependency]:
    """Extract dependencies declared with FetchContent_Declare"""
    dependencies = []
    pattern = r'FetchContent_Declare\s*\(\s*(\w+)(.*?)(?=\n\s*\))'
    matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
    
    for lib_name, declaration in matches:
        dep = Dependency(name=lib_name, source="FetchContent")
        
        # Extract GIT_REPOSITORY
        if git_repo_match := re.search(r'GIT_REPOSITORY\s+([^\s]+)', declaration):
            dep.git_repo = git_repo_match.group(1)
            # NEW: Infer vendor from the URL
            dep.vendor = _infer_vendor_from_git(dep.git_repo)
        
        # Extract GIT_TAG (version)
        if git_tag_match := re.search(r'GIT_TAG\s+([^\s]+)', declaration):
            dep.version = git_tag_match.group(1)
        
        # Extract URL
        if url_match := re.search(r'URL\s+([^\s]+)', declaration):
            dep.options['url'] = url_match.group(1)
        
        # Extract URL_HASH
        if hash_match := re.search(r'URL_HASH\s+([^\s]+)', declaration):
            dep.options['hash'] = hash_match.group(1)
        
        dependencies.append(dep)
    
    return dependencies


def _extract_find_package_dependencies(content: str) -> List[Dependency]:
    """Extract dependencies from find_package commands"""
    dependencies = []
    patterns = [
        r'find_package\s*\(\s*(\w+)\s+(\d+[\.\d]*)\s+REQUIRED',
        r'find_package\s*\(\s*(\w+)\s+(\d+[\.\d]*)\s*\)',
        r'find_package\s*\(\s*(\w+)\s+REQUIRED\s*\)',
        r'find_package\s*\(\s*(\w+)\s*\)',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for match in matches:
            if isinstance(match, tuple):
                name = match[0]
                version = match[1] if len(match) > 1 else "any"
            else:
                name = match
                version = "any"
            
            # Avoid duplicates
            if not any(d.name == name for d in dependencies):
                dependencies.append(Dependency(name=name, version=version, source="find_package"))
    
    return dependencies


def _extract_external_projects(content: str) -> List[Dependency]:
    """Extract dependencies from ExternalProject_Add"""
    dependencies = []
    pattern = r'ExternalProject_Add\s*\(\s*(\w+)(.*?)(?=\n\s*\))'
    matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
    
    for proj_name, declaration in matches:
        dep = Dependency(name=proj_name, source="ExternalProject")
        
        if git_repo_match := re.search(r'GIT_REPOSITORY\s+([^\s]+)', declaration):
            dep.git_repo = git_repo_match.group(1)
        
        if git_tag_match := re.search(r'GIT_TAG\s+([^\s]+)', declaration):
            dep.version = git_tag_match.group(1)
        
        dependencies.append(dep)
    
    return dependencies


def _extract_pkg_config_dependencies(content: str) -> List[Dependency]:
    """Extract dependencies from pkg_check_modules"""
    dependencies = []
    pattern = r'pkg_check_modules\s*\(\s*\w+\s+REQUIRED\s+([\w\s\->=<\.]+)\)'
    matches = re.findall(pattern, content, re.IGNORECASE)
    
    for match in matches:
        packages = match.strip().split()
        for pkg in packages:
            if version_match := re.match(r'([\w\-]+)(>=|<=|=|>|<)([\d\.]+)', pkg):
                name, op, version = version_match.groups()
                dep = Dependency(name=name, version=f"{op}{version}", source="pkg-config")
            else:
                dep = Dependency(name=pkg, version="any", source="pkg-config")
            dependencies.append(dep)
    
    return dependencies


def _extract_linked_libraries(content: str) -> Set[str]:
    """Extract libraries linked to targets"""
    linked_libs = set()
    pattern = r'target_link_libraries\s*\([^\)]*\)'
    matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
    
    keywords = {'PRIVATE', 'PUBLIC', 'INTERFACE', 'target'}
    for match in matches:
        libs = re.findall(r'(\w+(?:::\w+)?)', match)
        for lib in libs:
            if lib.upper() not in keywords and lib != 'target_link_libraries':
                linked_libs.add(lib)
    
    return linked_libs


def _extract_subdirectories(content: str) -> List[str]:
    """Extract subdirectories added with add_subdirectory"""
    pattern = r'add_subdirectory\s*\(\s*([^\s\)]+)'
    return re.findall(pattern, content, re.IGNORECASE)


def _extract_project_metadata(content: str) -> Dict[str, any]:
    """Extract project-level metadata (version, standards, etc.)"""
    metadata = {}
    
    # CMake minimum version
    if cmake_match := re.search(r'cmake_minimum_required\s*\(\s*VERSION\s+([\d\.]+)', content, re.IGNORECASE):
        metadata['cmake_version'] = cmake_match.group(1)
    
    # C++ standard
    if cpp_std_match := re.search(r'CMAKE_CXX_STANDARD\s+(\d+)', content):
        metadata['cpp_standard'] = cpp_std_match.group(1)
    
    # C standard
    if c_std_match := re.search(r'CMAKE_C_STANDARD\s+(\d+)', content):
        metadata['c_standard'] = c_std_match.group(1)
    
    # Project name and version
    if project_match := re.search(r'project\s*\(\s*(\w+)(?:\s+VERSION\s+([\d\.]+))?', content, re.IGNORECASE):
        metadata['project_name'] = project_match.group(1)
        metadata['project_version'] = project_match.group(2) if project_match.group(2) else "unspecified"
    
    # Compile options
    compile_options = re.findall(r'target_compile_options\s*\([^\)]+\)', content, re.IGNORECASE)
    if compile_options:
        metadata['compile_options'] = compile_options
    
    return metadata


# ============================================================================
# Public API
# ============================================================================

def extract_dependencies(file_path: str) -> CMakeInfo:
    """
    Extract all dependency information from a CMakeLists.txt file.
    
    This is the main function to be called by other scripts.
    
    Args:
        file_path: Path to the CMakeLists.txt file
        
    Returns:
        CMakeInfo object containing all extracted information
        
    Raises:
        FileNotFoundError: If the CMakeLists.txt file doesn't exist
        ValueError: If the file cannot be read or parsed
    """
    file_path = Path(file_path)
    
    if not file_path.exists():
        raise FileNotFoundError(f"CMakeLists.txt not found: {file_path}")
    
    try:
        content = file_path.read_text(encoding='utf-8')
    except Exception as e:
        raise ValueError(f"Failed to read file {file_path}: {e}")
    
    # Extract all information
    info = CMakeInfo()
    
    # Dependencies from various sources
    info.dependencies.extend(_extract_fetchcontent_dependencies(content))
    info.dependencies.extend(_extract_find_package_dependencies(content))
    info.dependencies.extend(_extract_external_projects(content))
    info.dependencies.extend(_extract_pkg_config_dependencies(content))
    
    # Linked libraries and subdirectories
    info.linked_libraries = _extract_linked_libraries(content)
    info.subdirectories = _extract_subdirectories(content)
    
    # Project metadata
    metadata = _extract_project_metadata(content)
    info.cmake_version = metadata.get('cmake_version')
    info.cpp_standard = metadata.get('cpp_standard')
    info.project_name = metadata.get('project_name')
    info.project_version = metadata.get('project_version')
    
    # Compiler requirements
    if 'c_standard' in metadata:
        info.compiler_requirements['c_standard'] = metadata['c_standard']
    if 'compile_options' in metadata:
        info.compiler_requirements['compile_options'] = metadata['compile_options']
    
    return info


def save_to_json(cmake_info: CMakeInfo, output_path: str) -> None:
    """
    Save CMake dependency information to a JSON file.
    
    Args:
        cmake_info: CMakeInfo object to serialize
        output_path: Path where JSON file will be saved
    """
    output_path = Path(output_path)
    
    # Convert to dictionary
    data = {
        'dependencies': [asdict(dep) for dep in cmake_info.dependencies],
        'linked_libraries': sorted(cmake_info.linked_libraries),
        'subdirectories': cmake_info.subdirectories,
        'cmake_version': cmake_info.cmake_version,
        'cpp_standard': cmake_info.cpp_standard,
        'project_name': cmake_info.project_name,
        'project_version': cmake_info.project_version,
        'compiler_requirements': cmake_info.compiler_requirements
    }
    
    output_path.write_text(json.dumps(data, indent=2), encoding='utf-8')


# ============================================================================
# CLI/Display Functions (for direct usage)
# ============================================================================

def print_dependency_info(cmake_info: CMakeInfo) -> None:
    """
    Print formatted dependency information to console.
    
    Args:
        cmake_info: CMakeInfo object to display
    """
    print("=" * 70)
    print("CMakeLists.txt Complete Dependency Analysis")
    print("=" * 70)
    
    # Project info
    if cmake_info.project_name:
        version = cmake_info.project_version or "unspecified"
        print(f"\n📦 Project: {cmake_info.project_name} v{version}")
    
    # Build requirements
    print("\n🔧 Build Requirements:")
    print("-" * 70)
    if cmake_info.cmake_version:
        print(f"  CMake: >= {cmake_info.cmake_version}")
    if cmake_info.cpp_standard:
        print(f"  C++ Standard: C++{cmake_info.cpp_standard}")
    if 'c_standard' in cmake_info.compiler_requirements:
        print(f"  C Standard: C{cmake_info.compiler_requirements['c_standard']}")
    
    # Dependencies
    if cmake_info.dependencies:
        print(f"\n📚 Dependencies ({len(cmake_info.dependencies)}):")
        print("-" * 70)
        
        # Group by source
        by_source = {}
        for dep in cmake_info.dependencies:
            by_source.setdefault(dep.source, []).append(dep)
        
        for source, deps in by_source.items():
            print(f"\n  [{source}]")
            for dep in deps:
                version_str = f"v{dep.version}" if dep.version != "unknown" else "any version"
                print(f"    • {dep.name:<25} {version_str}")
                if dep.git_repo:
                    print(f"      └─ Repo: {dep.git_repo}")
                for key, value in dep.options.items():
                    print(f"      └─ {key}: {value}")
    else:
        print("\n📚 Dependencies: None found")
    
    # Linked libraries
    if cmake_info.linked_libraries:
        print(f"\n🔗 Linked Libraries ({len(cmake_info.linked_libraries)}):")
        print("-" * 70)
        for lib in sorted(cmake_info.linked_libraries):
            print(f"  • {lib}")
    
    # Subdirectories
    if cmake_info.subdirectories:
        print(f"\n📁 Subdirectories ({len(cmake_info.subdirectories)}):")
        print("-" * 70)
        for subdir in cmake_info.subdirectories:
            print(f"  • {subdir}")
    
    print("\n" + "=" * 70)


# ============================================================================
# CLI Entry Point
# ============================================================================

def main():
    """Command-line interface for direct usage"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python cmake_extractor.py <path_to_CMakeLists.txt> [--json output.json]")
        sys.exit(1)
    
    cmake_file = sys.argv[1]
    
    try:
        # Extract dependencies
        cmake_info = extract_dependencies(cmake_file)
        
        # Print to console
        print_dependency_info(cmake_info)
        
        # Save to JSON if requested
        if '--json' in sys.argv:
            json_index = sys.argv.index('--json')
            if json_index + 1 < len(sys.argv):
                output_file = sys.argv[json_index + 1]
                save_to_json(cmake_info, output_file)
                print(f"\n✓ Dependencies exported to {output_file}")
        
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

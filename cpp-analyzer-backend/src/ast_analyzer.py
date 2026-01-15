"""
AST Analyzer for C++ Code

This module analyzes C++ source files to build function call graphs using tree-sitter.
It extracts function definitions and their call relationships.

Main API:
    - analyze_files(file_paths) -> CallGraphData: Analyze C++ files and build call graph
    - save_to_json(data, output_path): Save call graph data to JSON
"""

import json
from pathlib import Path
from typing import Dict, List, Set, Optional
from dataclasses import dataclass, field, asdict
from tree_sitter import Language, Parser
import tree_sitter_cpp as tscpp


# ============================================================================
# Data Models
# ============================================================================

@dataclass
class FunctionCall:
    """Represents a single function call"""
    function: str
    line: int
    column: int


@dataclass
class FunctionInfo:
    """Information about a function definition"""
    name: str
    files: List[str]
    line: int
    calls: List[FunctionCall] = field(default_factory=list)


@dataclass
class CallGraphData:
    """Complete call graph data for analyzed files"""
    functions: Dict[str, FunctionInfo] = field(default_factory=dict)  # All functions
    call_graph: Dict[str, List[str]] = field(default_factory=dict)  # func -> [called_funcs]
    file_functions: Dict[str, List[str]] = field(default_factory=dict)  # file -> [funcs]
    file_call_graphs: Dict[str, Dict[str, List[str]]] = field(default_factory=dict)  # file -> call_graph


# ============================================================================
# AST Analyzer
# ============================================================================


from typing import Dict, List

CallGraph = Dict[str, List[str]]
SerializedGraph = Dict[str, "SerializedGraph"]  # type récursif

def convert_call_graph(graph: CallGraph, root: str = "main") -> SerializedGraph:
    """
    Convertit un call graph en dictionnaire imbriqué pour affichage,
    en évitant que les fonctions se réfèrent à elles-mêmes.
    """
    def _recurse(func: str, path: Set[str]) -> SerializedGraph:
        if func in path:
            # Self-loop détecté, on ne l'ajoute pas
            return {}
        path = path | {func}  # créer un nouveau set pour chaque branche
        children = graph.get(func, [])
        return {
            func: {child: _recurse(child, path) for child in children if child != func}
        }

    return _recurse(root, set())

def serialize_call_graph(call_graph) -> dict:
    return {
        "functions": {
            fid: {
                "name": f.name,
                "files": f.files,
                "line": f.line,
                "calls": [
                    {
                        "function": c.function,
                        "line": c.line,
                        "column": c.column,
                    }
                    for c in f.calls
                ],
            }
            for fid, f in call_graph.functions.items()
        },
        "call_graph": convert_call_graph(call_graph.call_graph),
        "file_functions": call_graph.file_functions,
        "file_call_graphs": call_graph.file_call_graphs,
    }

class ASTAnalyzer:
    """Analyze C++ files and build function call graphs using tree-sitter"""
    
    def __init__(self):
        """Initialize the AST analyzer with C++ language support"""
        self.cpp_language = Language(tscpp.language())
        self.parser = Parser(self.cpp_language)
        self.data = CallGraphData()
    
    # ------------------------------------------------------------------------
    # AST Extraction Methods
    # ------------------------------------------------------------------------
    
    def _extract_function_name(self, node) -> Optional[str]:
        """Extract function name from a function declaration/definition node"""
        for child in node.children:
            if child.type == 'function_declarator':
                for subchild in child.children:
                    if subchild.type == 'identifier':
                        return subchild.text.decode('utf8')
        return None
    
    def _extract_call_name(self, node) -> Optional[str]:
        """Extract function name from a call expression node"""
        if not node.children:
            return None
        
        first_child = node.children[0]
        
        if first_child.type == 'identifier':
            return first_child.text.decode('utf8')
        
        elif first_child.type == 'field_expression':
            # Handle cases like std::cout, obj.method()
            parts = []
            for subchild in first_child.children:
                if subchild.type == 'identifier':
                    parts.append(subchild.text.decode('utf8'))
            return '::'.join(parts) if parts else None
        
        elif first_child.type == 'qualified_identifier':
            # Handle qualified names like namespace::function
            return first_child.text.decode('utf8')
        
        return None
    
    def _is_valid_function_call(self, name: str) -> bool:
        """
        Filter out non-function identifiers using heuristics.
        
        This filters type casts, keywords, macros, and variables
        while keeping actual function calls.
        """
        if not name or len(name) <= 2:
            return False
        
        # C++ keywords
        cpp_keywords = {
            'int', 'char', 'float', 'double', 'void', 'bool', 'auto', 'long', 'short',
            'const', 'static', 'return', 'if', 'else', 'for', 'while', 'do', 'switch',
            'class', 'struct', 'enum', 'namespace', 'template', 'typename', 'sizeof',
            'true', 'false', 'nullptr', 'this', 'new', 'delete', 'throw', 'try', 'catch'
        }
        if name.lower() in cpp_keywords:
            return False
        
        # All uppercase without underscores = macro
        if name.isupper() and '_' not in name:
            return False
        
        # Has :: = namespace qualified, definitely keep
        if '::' in name:
            return True
        
        # Has underscore = likely library function (curl_easy_init, sqlite3_open)
        if '_' in name:
            if name.isupper():  # ALL_CAPS_WITH_UNDERSCORES = macro
                return False
            return True
        
        # Starts with uppercase letter
        if name[0].isupper():
            transitions = sum(1 for i in range(len(name)-1) 
                            if name[i].islower() and name[i+1].isupper())
            
            # Has transitions = PascalCase function (ParseXML, HandleRequest)
            if transitions >= 1:
                return True
            
            # No transitions but long = probably OK (WebSocketServer)
            if len(name) >= 12:
                return True
            
            # Keep to avoid filtering too much
            return True
        
        # Starts with lowercase
        if name[0].islower():
            upper_count = sum(1 for c in name if c.isupper())
            
            if upper_count == 0:
                # Very long or has digits = might be function
                if len(name) >= 15 or any(c.isdigit() for c in name):
                    return True
                
                # Common C functions
                c_functions = {
                    'memset', 'memcpy', 'malloc', 'free', 'printf', 'scanf',
                    'strlen', 'strcpy', 'strcmp', 'fopen', 'fclose', 'fread',
                    'deflate', 'inflate', 'accept', 'bind', 'connect', 'listen'
                }
                if name in c_functions:
                    return True
                return False
            
            # Has uppercase = camelCase
            transitions = sum(1 for i in range(len(name)-1) 
                            if name[i].islower() and name[i+1].isupper())
            
            # Multiple transitions = definitely function (fetchDataWithCurl)
            if transitions >= 2:
                return True
            
            # Single transition - analyze transition position
            if transitions == 1:
                trans_idx = next((i for i in range(len(name)-1) 
                                if name[i].islower() and name[i+1].isupper()), -1)
                
                if trans_idx > 0:
                    ratio = trans_idx / len(name)
                    
                    # Transition in latter half = probably function (getData, setValue)
                    if ratio >= 0.35:
                        return True
                    
                    # Check for verb prefixes
                    prefix = name[:trans_idx]
                    verb_prefixes = {
                        'get', 'set', 'is', 'has', 'can', 'should', 'will',
                        'create', 'init', 'start', 'stop', 'open', 'close',
                        'read', 'write', 'parse', 'handle', 'process', 'fetch',
                        'load', 'save', 'update', 'delete', 'insert', 'query',
                        'send', 'receive', 'connect', 'disconnect', 'bind'
                    }
                    if prefix.lower() in verb_prefixes:
                        return True
                    
                    return False
            
            return False
        
        # Default: keep it
        return True
    
    def _is_type_cast(self, node) -> bool:
        """Check if a call expression is actually a type cast"""
        parent = node.parent
        if parent and parent.type in ['cast_expression', 'type_descriptor', 'sized_type_specifier']:
            return True
        
        called_func = self._extract_call_name(node)
        if called_func and len(called_func) > 0:
            # Likely type cast: starts with uppercase, no ::, no _, all uppercase after first char
            if (called_func[0].isupper() and 
                '::' not in called_func and 
                '_' not in called_func):
                
                cpp_types = {'String', 'Vector', 'List', 'Map', 'Set', 'Array', 'Pair', 'Tuple'}
                if called_func in cpp_types:
                    return True
                
                if len(called_func) < 12 and not any(c.islower() for c in called_func[1:]):
                    return True
        
        return False
    
    def _find_function_calls(
        self,
        node,
        current_function: Optional[str] = None,
        current_file: Optional[str] = None,
    ):
        """Recursively traverse AST to find function definitions and calls"""

        # ------------------------------------------------------------------
        # Function definition
        # ------------------------------------------------------------------
        if node.type == "function_definition":
            func_name = self._extract_function_name(node)
            if func_name:
                current_function = func_name

                # Register or update function info
                if func_name not in self.data.functions:
                    self.data.functions[func_name] = FunctionInfo(
                        name=func_name,
                        files=[current_file] if current_file else [],
                        line=node.start_point[0] + 1,
                        calls=[],
                    )
                else:
                    if current_file and current_file not in self.data.functions[func_name].files:
                        self.data.functions[func_name].files.append(current_file)

                # Track functions per file
                if current_file:
                    if current_file not in self.data.file_functions:
                        self.data.file_functions[current_file] = []
                    if func_name not in self.data.file_functions[current_file]:
                        self.data.file_functions[current_file].append(func_name)

                # Initialize global call graph
                if func_name not in self.data.call_graph:
                    self.data.call_graph[func_name] = []

                # Initialize file-specific call graph
                if current_file:
                    if current_file not in self.data.file_call_graphs:
                        self.data.file_call_graphs[current_file] = {}
                    if func_name not in self.data.file_call_graphs[current_file]:
                        self.data.file_call_graphs[current_file][func_name] = []

        # ------------------------------------------------------------------
        # Function call
        # ------------------------------------------------------------------
        elif node.type == "call_expression" and current_function:
            if not self._is_type_cast(node):
                called_func = self._extract_call_name(node)

                if called_func and self._is_valid_function_call(called_func):

                    # Ensure current_function exists (appel avant définition possible)
                    if current_function not in self.data.functions:
                        self.data.functions[current_function] = FunctionInfo(
                            name=current_function,
                            files=[current_file] if current_file else [],
                            line=0,
                            calls=[],
                        )
                        self.data.call_graph.setdefault(current_function, [])
                        if current_file:
                            self.data.file_call_graphs.setdefault(current_file, {}) \
                                .setdefault(current_function, [])

                    call_info = FunctionCall(
                        function=called_func,
                        line=node.start_point[0] + 1,
                        column=node.start_point[1] + 1,
                    )

                    self.data.functions[current_function].calls.append(call_info)

                    if called_func not in self.data.call_graph[current_function]:
                        self.data.call_graph[current_function].append(called_func)

                    if current_file:
                        if called_func not in self.data.file_call_graphs[current_file][current_function]:
                            self.data.file_call_graphs[current_file][current_function].append(called_func)

        # ------------------------------------------------------------------
        # Recurse
        # ------------------------------------------------------------------
        for child in node.children:
            self._find_function_calls(child, current_function, current_file)

    # ------------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------------
    
    def analyze_file(self, file_path: str) -> None:
        """
        Analyze a single C++ file and add to call graph.
        
        Args:
            file_path: Path to the C++ source file
        """
        try:
            with open(file_path, 'rb') as f:
                code = f.read()
            tree = self.parser.parse(code)
            self._find_function_calls(tree.root_node, current_file=file_path)
        except Exception as e:
            print(f"Error analyzing {file_path}: {e}")
    
    def analyze_files(self, file_paths: List[str]) -> None:
        """
        Analyze multiple C++ files.
        
        Args:
            file_paths: List of paths to C++ source files
        """
        for file_path in file_paths:
            self.analyze_file(file_path)
    
    def get_call_graph(self) -> CallGraphData:
        """
        Get the complete call graph data.
        
        Returns:
            CallGraphData object containing all analysis results
        """
        return self.data


# ============================================================================
# Public API Functions
# ============================================================================

def analyze_files(file_paths: List[str]) -> CallGraphData:
    """
    Analyze C++ files and build function call graph.
    
    This is the main function to be called by other scripts.
    
    Args:
        file_paths: List of paths to C++ source files
        
    Returns:
        CallGraphData object containing complete call graph information
        
    Example:
        >>> files = ['main.cpp', 'utils.cpp']
        >>> call_graph = analyze_files(files)
        >>> print(f"Found {len(call_graph.functions)} functions")
    """
    analyzer = ASTAnalyzer()
    analyzer.analyze_files(file_paths)
    return analyzer.get_call_graph()


def save_to_json(data: CallGraphData, output_path: str) -> None:
    """
    Save call graph data to a JSON file.
    
    Args:
        data: CallGraphData object to serialize
        output_path: Path where JSON file will be saved
    """
    output_path = Path(output_path)
    
    # Convert to serializable format
    json_data = {
        'functions': {
            name: {
                'name': func.name,
                'files': func.files,
                'line': func.line,
                'calls': [asdict(call) for call in func.calls]
            }
            for name, func in data.functions.items()
        },
        'call_graph': data.call_graph,
        'file_functions': data.file_functions,
        'file_call_graphs': data.file_call_graphs
    }
    
    output_path.write_text(json.dumps(json_data, indent=2), encoding='utf-8')


# ============================================================================
# CLI Entry Point
# ============================================================================

def main():
    """Command-line interface for direct usage"""
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(
        description='Analyze C++ files and generate function call graph'
    )
    parser.add_argument(
        'files',
        nargs='+',
        help='C++ source files to analyze'
    )
    parser.add_argument(
        '--output',
        help='Output JSON file path'
    )
    
    args = parser.parse_args()
    
    try:
        print(f"Analyzing {len(args.files)} file(s)...")
        call_graph = analyze_files(args.files)
        
        print(f"\nAnalysis complete:")
        print(f"  Functions found: {len(call_graph.functions)}")
        print(f"  Files analyzed: {len(call_graph.file_functions)}")
        
        # Print summary
        print(f"\nFunctions by file:")
        for file_path, funcs in call_graph.file_functions.items():
            from pathlib import Path
            print(f"  {Path(file_path).name}: {len(funcs)} functions")
        
        # Save to JSON if requested
        if args.output:
            save_to_json(call_graph, args.output)
            print(f"\n✓ Call graph saved to {args.output}")
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

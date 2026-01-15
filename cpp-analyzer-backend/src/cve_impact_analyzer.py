"""
CVE Impact Analyzer

This module determines which functions in a codebase are affected by CVE vulnerabilities.
It traces vulnerability impact through the call graph to identify all affected functions.

Main API:
    - analyze_impact(call_graph, vulnerabilities) -> ImpactAnalysis: Analyze CVE impact
    - save_to_json(analysis, output_path): Save impact analysis to JSON
"""

import json
from pathlib import Path
from typing import Dict, List, Set
from dataclasses import dataclass, field, asdict


# ============================================================================
# Data Models
# ============================================================================

@dataclass
class ImpactAnalysis:
    """Results of CVE impact analysis"""
    vulnerable_functions: Set[str] = field(default_factory=set)
    directly_vulnerable: Set[str] = field(default_factory=set)
    indirectly_vulnerable: Set[str] = field(default_factory=set)
    vulnerable_libs: Set[str] = field(default_factory=set)
    vulnerability_chains: Dict[str, List[str]] = field(default_factory=dict)


# ============================================================================
# Impact Analyzer
# ============================================================================

def serialize_impact(impact: ImpactAnalysis) -> dict:
    return {
        "vulnerable_functions": sorted(impact.vulnerable_functions),
        "direct": sorted(impact.directly_vulnerable),
        "indirect": sorted(impact.indirectly_vulnerable),
        "vulnerable_libs": sorted(impact.vulnerable_libs),
        "chains": impact.vulnerability_chains,
        "counts": {
            "functions": len(impact.vulnerable_functions),
            "direct": len(impact.directly_vulnerable),
            "indirect": len(impact.indirectly_vulnerable),
            "libs": len(impact.vulnerable_libs),
        },
    }


class CVEImpactAnalyzer:
    """Analyze the impact of CVE vulnerabilities on function call graph"""
    
    def __init__(self, call_graph_data, vulnerabilities: Dict[str, List]):
        """
        Initialize impact analyzer.
        
        Args:
            call_graph_data: CallGraphData object from ast_analyzer
            vulnerabilities: Dictionary mapping library names to CVE lists
        """
        self.call_graph = call_graph_data
        self.vulnerabilities = vulnerabilities
        self.vulnerable_libs = set(vulnerabilities.keys())
        
        self.analysis = ImpactAnalysis()
        self.analysis.vulnerable_libs = self.vulnerable_libs.copy()
        
        self._analyze()
    
    def _is_vulnerable_library_call(self, func_name: str) -> bool:
        """
        Check if a function name matches a vulnerable library.
        
        Args:
            func_name: Function name to check
            
        Returns:
            True if function is from a vulnerable library
        """
        func_lower = func_name.lower()
        for vuln_lib in self.vulnerable_libs:
            if vuln_lib.lower() in func_lower:
                return True
        return False
    
    def _find_directly_vulnerable_functions(self) -> Set[str]:
        """
        Identify functions that directly call vulnerable libraries.
        
        Returns:
            Set of function names that make direct calls to vulnerable libraries
        """
        directly_vulnerable = set()
        
        for func_name, func_info in self.call_graph.functions.items():
            for call in func_info.calls:
                called_func = call.function
                if self._is_vulnerable_library_call(called_func):
                    directly_vulnerable.add(func_name)
                    break
        
        return directly_vulnerable
    
    def _propagate_vulnerability(self, directly_vulnerable: Set[str]) -> Set[str]:
        """
        Propagate vulnerability up the call chain.
        
        If function A calls function B, and B is vulnerable, then A is also vulnerable.
        This continues until no new vulnerabilities are found.
        
        Args:
            directly_vulnerable: Set of directly vulnerable functions
            
        Returns:
            Complete set of vulnerable functions (direct + indirect)
        """
        vulnerable = directly_vulnerable.copy()
        
        # Keep propagating until no new vulnerabilities are found
        changed = True
        iteration = 0
        while changed:
            changed = False
            iteration += 1
            
            for func_name, func_info in self.call_graph.functions.items():
                if func_name not in vulnerable:
                    # Check if this function calls any vulnerable function
                    for call in func_info.calls:
                        called_func = call.function
                        if called_func in vulnerable:
                            vulnerable.add(func_name)
                            changed = True
                            break
        
        return vulnerable
    
    def _build_vulnerability_chains(self) -> Dict[str, List[str]]:
        """
        Build vulnerability chains showing how each function is affected.
        
        For each vulnerable function, trace back to the vulnerable library it depends on.
        
        Returns:
            Dictionary mapping function names to their vulnerability chains
        """
        chains = {}
        
        for func_name in self.analysis.vulnerable_functions:
            # Find shortest path to a vulnerable library call
            chain = self._find_vulnerability_path(func_name)
            if chain:
                chains[func_name] = chain
        
        return chains
    
    def _find_vulnerability_path(self, func_name: str) -> List[str]:
        """
        Find the path from a function to a vulnerable library call.
        
        Uses BFS to find the shortest path.
        
        Args:
            func_name: Function to trace
            
        Returns:
            List of function names forming the vulnerability path
        """
        from collections import deque
        
        if func_name not in self.call_graph.functions:
            return []
        
        # BFS to find shortest path
        queue = deque([(func_name, [func_name])])
        visited = {func_name}
        
        while queue:
            current, path = queue.popleft()
            
            if current not in self.call_graph.functions:
                # External function - check if it's vulnerable
                if self._is_vulnerable_library_call(current):
                    return path
                continue
            
            # Check direct calls
            for call in self.call_graph.functions[current].calls:
                called = call.function
                
                # Found a vulnerable library call
                if self._is_vulnerable_library_call(called):
                    return path + [called]
                
                # Continue searching
                if called not in visited:
                    visited.add(called)
                    queue.append((called, path + [called]))
        
        return []
    
    def _analyze(self):
        """Perform complete impact analysis"""
        # Step 1: Find directly vulnerable functions
        self.analysis.directly_vulnerable = self._find_directly_vulnerable_functions()
        
        # Step 2: Propagate vulnerability through call graph
        self.analysis.vulnerable_functions = self._propagate_vulnerability(
            self.analysis.directly_vulnerable
        )
        
        # Step 3: Calculate indirectly vulnerable functions
        self.analysis.indirectly_vulnerable = (
            self.analysis.vulnerable_functions - self.analysis.directly_vulnerable
        )
        
        # Step 4: Build vulnerability chains
        self.analysis.vulnerability_chains = self._build_vulnerability_chains()
    
    def get_analysis(self) -> ImpactAnalysis:
        """
        Get the complete impact analysis.
        
        Returns:
            ImpactAnalysis object with all results
        """
        return self.analysis
    
    def is_function_vulnerable(self, func_name: str) -> bool:
        """
        Check if a specific function is vulnerable.
        
        Args:
            func_name: Function name to check
            
        Returns:
            True if function is vulnerable (directly or indirectly)
        """
        return func_name in self.analysis.vulnerable_functions
    
    def get_vulnerability_chain(self, func_name: str) -> List[str]:
        """
        Get the vulnerability chain for a function.
        
        Args:
            func_name: Function name
            
        Returns:
            List of function names showing path to vulnerable library
        """
        return self.analysis.vulnerability_chains.get(func_name, [])
    
    def get_affected_library(self, func_name: str) -> str:
        """
        Get the vulnerable library affecting a function.
        
        Args:
            func_name: Function name
            
        Returns:
            Name of vulnerable library, or None if not found
        """
        chain = self.get_vulnerability_chain(func_name)
        if not chain:
            return None
        
        # Last item in chain should be the vulnerable library call
        last_call = chain[-1].lower()
        for lib in self.vulnerable_libs:
            if lib.lower() in last_call:
                return lib
        
        return None


# ============================================================================
# Public API
# ============================================================================

def analyze_impact(call_graph_data, vulnerabilities: Dict[str, List]) -> ImpactAnalysis:
    """
    Analyze the impact of CVE vulnerabilities on a call graph.
    
    This is the main function to be called by other scripts.
    
    Args:
        call_graph_data: CallGraphData object from ast_analyzer
        vulnerabilities: Dictionary mapping library names to CVE lists
                        (from cve_checker module)
        
    Returns:
        ImpactAnalysis object containing vulnerability impact data
        
    Example:
        >>> from ast_analyzer import analyze_files
        >>> from cve_checker import check_vulnerabilities
        >>> 
        >>> call_graph = analyze_files(['main.cpp'])
        >>> vulns = check_vulnerabilities(dependencies)
        >>> impact = analyze_impact(call_graph, vulns)
        >>> print(f"{len(impact.vulnerable_functions)} functions affected")
    """
    analyzer = CVEImpactAnalyzer(call_graph_data, vulnerabilities)
    return analyzer.get_analysis()


def save_to_json(analysis: ImpactAnalysis, output_path: str) -> None:
    """
    Save impact analysis to a JSON file.
    
    Args:
        analysis: ImpactAnalysis object to serialize
        output_path: Path where JSON file will be saved
    """
    output_path = Path(output_path)
    
    # Convert to serializable format
    data = {
        'vulnerable_functions': sorted(analysis.vulnerable_functions),
        'directly_vulnerable': sorted(analysis.directly_vulnerable),
        'indirectly_vulnerable': sorted(analysis.indirectly_vulnerable),
        'vulnerable_libraries': sorted(analysis.vulnerable_libs),
        'vulnerability_chains': analysis.vulnerability_chains,
        'summary': {
            'total_vulnerable': len(analysis.vulnerable_functions),
            'directly_vulnerable': len(analysis.directly_vulnerable),
            'indirectly_vulnerable': len(analysis.indirectly_vulnerable),
            'affected_libraries': len(analysis.vulnerable_libs)
        }
    }
    
    output_path.write_text(json.dumps(data, indent=2), encoding='utf-8')


# ============================================================================
# CLI/Display Functions (for direct usage)
# ============================================================================

def print_impact_report(analysis: ImpactAnalysis, detailed: bool = False) -> None:
    """
    Print a formatted impact analysis report.
    
    Args:
        analysis: ImpactAnalysis object to display
        detailed: Show detailed vulnerability chains
    """
    print("\n" + "=" * 80)
    print("CVE IMPACT ANALYSIS")
    print("=" * 80)
    
    print(f"\n📊 Summary:")
    print(f"  Total vulnerable functions: {len(analysis.vulnerable_functions)}")
    print(f"  Directly vulnerable: {len(analysis.directly_vulnerable)}")
    print(f"  Indirectly vulnerable: {len(analysis.indirectly_vulnerable)}")
    print(f"  Affected libraries: {len(analysis.vulnerable_libs)}")
    
    if analysis.vulnerable_libs:
        print(f"\n🔒 Vulnerable Libraries:")
        for lib in sorted(analysis.vulnerable_libs):
            print(f"  • {lib}")
    
    if analysis.directly_vulnerable:
        print(f"\n🔴 Directly Vulnerable Functions ({len(analysis.directly_vulnerable)}):")
        for func in sorted(analysis.directly_vulnerable):
            print(f"  • {func}()")
    
    if analysis.indirectly_vulnerable:
        print(f"\n🟡 Indirectly Vulnerable Functions ({len(analysis.indirectly_vulnerable)}):")
        for func in sorted(list(analysis.indirectly_vulnerable)[:10]):
            print(f"  • {func}()")
        if len(analysis.indirectly_vulnerable) > 10:
            print(f"  ... and {len(analysis.indirectly_vulnerable) - 10} more")
    
    if detailed and analysis.vulnerability_chains:
        print(f"\n🔗 Vulnerability Chains:")
        for func, chain in sorted(analysis.vulnerability_chains.items())[:10]:
            chain_str = " → ".join(chain)
            print(f"\n  {func}():")
            print(f"    {chain_str}")
        if len(analysis.vulnerability_chains) > 10:
            print(f"\n  ... and {len(analysis.vulnerability_chains) - 10} more chains")
    
    print("\n" + "=" * 80)


# ============================================================================
# CLI Entry Point
# ============================================================================

def main():
    """Command-line interface for direct usage"""
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(
        description='Analyze CVE impact on function call graph'
    )
    parser.add_argument(
        'call_graph',
        help='Path to call graph JSON file (from ast_analyzer)'
    )
    parser.add_argument(
        'vulnerabilities',
        help='Path to vulnerabilities JSON file (from cve_checker)'
    )
    parser.add_argument(
        '--output',
        help='Output JSON file path'
    )
    parser.add_argument(
        '--detailed',
        action='store_true',
        help='Show detailed vulnerability chains'
    )
    
    args = parser.parse_args()
    
    try:
        # Load call graph
        print(f"Loading call graph from {args.call_graph}...")
        with open(args.call_graph, 'r') as f:
            cg_data = json.load(f)
        
        # Load vulnerabilities
        print(f"Loading vulnerabilities from {args.vulnerabilities}...")
        with open(args.vulnerabilities, 'r') as f:
            vulns = json.load(f)
        
        # Create mock call graph data object
        from ast_analyzer import CallGraphData, FunctionInfo, FunctionCall
        call_graph = CallGraphData()
        
        for name, func_data in cg_data['functions'].items():
            calls = [FunctionCall(**call) for call in func_data['calls']]
            call_graph.functions[name] = FunctionInfo(
                name=func_data['name'],
                file=func_data['file'],
                line=func_data['line'],
                calls=calls
            )
        
        call_graph.call_graph = cg_data['call_graph']
        call_graph.file_functions = cg_data['file_functions']
        call_graph.file_call_graphs = cg_data['file_call_graphs']
        
        # Analyze impact
        print("\nAnalyzing CVE impact...")
        analysis = analyze_impact(call_graph, vulns)
        
        # Print report
        print_impact_report(analysis, detailed=args.detailed)
        
        # Save to JSON if requested
        if args.output:
            save_to_json(analysis, args.output)
            print(f"\n✓ Impact analysis saved to {args.output}")
        
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

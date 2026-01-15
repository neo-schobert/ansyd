"""
CVE Vulnerability Checker

This module checks software dependencies against the National Vulnerability Database (NVD)
to identify known security vulnerabilities. It supports version-aware CVE matching.

Main API:
    - check_vulnerabilities(dependencies) -> Dict[str, List[CVE]]: Check dependencies for CVEs
    - save_to_json(results, output_path): Save CVE results to JSON file
"""

import re
import time
import json
import requests
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from pathlib import Path
from packaging.version import parse as parse_version, InvalidVersion


# ============================================================================
# Data Models
# ============================================================================

@dataclass
class CVE:
    """Represents a single CVE vulnerability"""
    cve_id: str
    description: str
    cvss_score: Optional[float]
    severity: str
    published_date: Optional[str] = None
    affected_versions: List[str] = None
    
    def __post_init__(self):
        if self.affected_versions is None:
            self.affected_versions = []


@dataclass
class VulnerabilityResult:
    """Result of vulnerability check for a single dependency"""
    library_name: str
    version: str
    cves: List[CVE]
    checked_at: str


# ============================================================================
# Version Comparison Utilities
# ============================================================================

def serialize_cve(cve: CVE) -> dict:
    return {
        "id": cve.cve_id,
        "severity": cve.severity,
        "cvss": cve.cvss_score,
        "description": cve.description,
        "published_date": cve.published_date,
        "affected_versions": cve.affected_versions,
    }

def serialize_vulnerability_result(vr: VulnerabilityResult) -> dict:
    return {
        "library": vr.library_name,
        "version": vr.version,
        "checked_at": vr.checked_at,
        "cves": [serialize_cve(cve) for cve in vr.cves],
        "cve_count": len(vr.cves),
        "max_severity": (
            getMax((c.severity for c in vr.cves), default=None)
        ),
    }

def getMax(severities, default=None):
    level = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
    try:
        return max(severities, key=lambda s: level.get(s, 0), default=default)
    except ValueError:
        return default


def _version_matches_match_data(dep_version_str: str, cpe_match: dict) -> bool:
    """
    Robust check if dependency version matches the NVD CPE match data.
    Handles both ranges (start/end) and specific version matches (from CPE URI).
    """
    if not dep_version_str or dep_version_str in ["unknown", "any"]:
        return True # Can't rule it out

    try:
        dep_v = parse_version(dep_version_str)
    except InvalidVersion:
        return True # Assume vulnerable if we can't parse

    # 1. Check Range Constraints
    v_start_inc = cpe_match.get('versionStartIncluding')
    v_start_exc = cpe_match.get('versionStartExcluding')
    v_end_inc = cpe_match.get('versionEndIncluding')
    v_end_exc = cpe_match.get('versionEndExcluding')

    # If ANY range data exists, use range logic
    if any([v_start_inc, v_start_exc, v_end_inc, v_end_exc]):
        try:
            if v_start_inc and dep_v < parse_version(v_start_inc): return False
            if v_start_exc and dep_v <= parse_version(v_start_exc): return False
            if v_end_inc and dep_v > parse_version(v_end_inc): return False
            if v_end_exc and dep_v >= parse_version(v_end_exc): return False
            return True
        except InvalidVersion:
            return True # Fallback

    # 2. No range data? It might be a specific version match in the CPE URI
    # CPE format: cpe:2.3:part:vendor:product:version:update:edition:...
    criteria = cpe_match.get('criteria', '')
    if criteria.startswith('cpe:2.3:'):
        parts = criteria.split(':')
        if len(parts) > 5:
            cpe_version = parts[5]
            if cpe_version == '*' or cpe_version == '-':
                return True # Matches all or n/a
            
            # Compare exact version matches (handling wildcard logic if needed)
            try:
                # Direct string match is safest for exact CPEs, or parse if you trust it
                return str(dep_v) == cpe_version
            except Exception:
                pass
                
    return False


# ============================================================================
# CVE Database Interface
# ============================================================================

class CVEDatabase:
    """Interface to the National Vulnerability Database (NVD)"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize CVE database client.
        
        Args:
            api_key: Optional NVD API key for higher rate limits
                    Without key: 5 requests per 30 seconds
                    With key: 50 requests per 30 seconds
        """
        self.base_url = "https://services.nvd.nist.gov/rest/json/cves/2.0"
        self.api_key = api_key
        self.request_count = 0
        self.last_request_time = 0
        
    def _respect_rate_limit(self):
        """Implement rate limiting for NVD API"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        # Without API key: max 5 requests per 30 seconds (wait 6 seconds between)
        # With API key: max 50 requests per 30 seconds (wait 0.6 seconds)
        min_interval = 0.6 if self.api_key else 6.0
        
        if time_since_last < min_interval:
            time.sleep(min_interval - time_since_last)
        
        self.last_request_time = time.time()
    
    def _calculate_severity(self, cvss_score: float) -> str:
        """Calculate severity rating from CVSS score"""
        if cvss_score >= 9.0:
            return 'CRITICAL'
        elif cvss_score >= 7.0:
            return 'HIGH'
        elif cvss_score >= 4.0:
            return 'MEDIUM'
        elif cvss_score > 0:
            return 'LOW'
        return 'NONE'
    
    def _extract_cve_info(self, cve_item: dict, library_name: str, version: str, vendor: Optional[str] = None) -> Optional[CVE]:
        """Extract relevant CVE information from NVD response"""
        cve_id = cve_item.get('id', 'Unknown')
        
        # Get description
        descriptions = cve_item.get('descriptions', [])
        description = descriptions[0].get('value', 'No description available') if descriptions else 'No description available'
        
        # Get published date
        published = cve_item.get('published', None)
        
        # Extract CVSS score and severity
        metrics = cve_item.get('metrics', {})
        cvss_score = None
        severity = 'UNKNOWN'
        
        # Try CVSSv3.1 first (most recent)
        if 'cvssMetricV31' in metrics and metrics['cvssMetricV31']:
            cvss_data = metrics['cvssMetricV31'][0].get('cvssData', {})
            cvss_score = cvss_data.get('baseScore')
            severity = cvss_data.get('baseSeverity', 'UNKNOWN')
        # Fall back to CVSSv3.0
        elif 'cvssMetricV30' in metrics and metrics['cvssMetricV30']:
            cvss_data = metrics['cvssMetricV30'][0].get('cvssData', {})
            cvss_score = cvss_data.get('baseScore')
            severity = cvss_data.get('baseSeverity', 'UNKNOWN')
        # Fall back to CVSSv2
        elif 'cvssMetricV2' in metrics and metrics['cvssMetricV2']:
            cvss_data = metrics['cvssMetricV2'][0].get('cvssData', {})
            cvss_score = cvss_data.get('baseScore')
            severity = self._calculate_severity(cvss_score) if cvss_score else 'UNKNOWN'
        
        # Extract affected version information
        affected_versions = []
        is_vulnerable = False  # Track if the dependency actually matches
        
        configurations = cve_item.get('configurations', [])
        for config in configurations:
            nodes = config.get('nodes', [])
            for node in nodes:
                cpe_matches = node.get('cpeMatch', [])
                for cpe in cpe_matches:
                    if cpe.get('vulnerable', False):
                        # --- DEBUG PRINTS ---
                        #cpe_uri = cpe.get('criteria', '')
                        #print(f"DEBUG: Checking {library_name} | Target Vendor: '{vendor}'")
                        #print(f"       CPE: {cpe_uri}")
                        # --------------------
                        # --- VENDOR FILTERING LOGIC ---
                        if vendor:
                            cpe_uri = cpe.get('criteria', '')
                            # Handle CPE 2.3 format: cpe:2.3:part:vendor:product:...
                            # Handle CPE 2.2 format: cpe:/part:vendor:product:...
                            parts = cpe_uri.replace('\\:', '&&&').split(':') # simple split, ignoring escaped colons
                            
                            cpe_vendor = None
                            if cpe_uri.startswith('cpe:2.3') and len(parts) > 3:
                                cpe_vendor = parts[3]
                            elif cpe_uri.startswith('cpe:/') and len(parts) > 2:
                                cpe_vendor = parts[2]
                                
                            # If we extracted a vendor and it doesn't match our target, skip this CPE
                            if cpe_vendor and cpe_vendor != '*' and cpe_vendor.lower() != vendor.lower():
                                continue
                        # -----------------------------------

                        # Use the new robust matching function
                        if _version_matches_match_data(version, cpe):
                            is_vulnerable = True
                            
                            # Create a clean info block (removing nulls)
                            version_info = {
                                'versionStartIncluding': cpe.get('versionStartIncluding'),
                                'versionEndExcluding': cpe.get('versionEndExcluding'),
                                'versionStartExcluding': cpe.get('versionStartExcluding'),
                                'versionEndIncluding': cpe.get('versionEndIncluding'),
                            }
                            
                            # 1. Remove None keys
                            clean_info = {k: v for k, v in version_info.items() if v is not None}

                            # 2. If no range keys exist, parse the CPE string for the version
                            if not clean_info:
                                cpe_uri = cpe.get('criteria', '')
                                parts = cpe_uri.split(':')
                                
                                # CPE 2.3: index 5 is version
                                if len(parts) > 5:
                                    version_part = parts[5]
                                    if version_part == '*' or version_part == '-':
                                        clean_info = {'version': 'ALL / Unspecified'}
                                    else:
                                        clean_info = {'version': version_part}
                                else:
                                    clean_info = {'cpe_raw': cpe_uri}

                            if clean_info not in affected_versions:
                                affected_versions.append(clean_info)
        
        # Only return the CVE if we confirmed the version matches
        if not is_vulnerable:
            return None
        
        return CVE(
            cve_id=cve_id,
            description=description,
            cvss_score=cvss_score,
            severity=severity,
            published_date=published,
            affected_versions=affected_versions
        )

    def search_cves(self, library_name: str, version: str = "unknown", vendor: Optional[str] = None) -> List[CVE]:
        """
        Search for CVEs affecting a specific library and version.
        """
        self._respect_rate_limit()
        
        headers = {}
        if self.api_key:
            headers['apiKey'] = self.api_key
        
        # Combine vendor and library name for a more specific search
        # e.g., "nlohmann json" instead of just "json"
        search_term = f"{vendor} {library_name}" if vendor else library_name
        
        print(f"DEBUG: Querying NVD for: '{search_term}' (Vendor: {vendor})")
        
        params = {
            "keywordSearch": search_term,
            "resultsPerPage": 50
        }
        
        try:
            response = requests.get(
                self.base_url,
                params=params,
                headers=headers,
                timeout=15
            )
            
            if response.status_code != 200:
                print(f"Warning: NVD API returned status {response.status_code} for {library_name}")
                return []
            
            data = response.json()
            cves = []
            
            if 'vulnerabilities' in data:
                for vuln in data['vulnerabilities']:
                    cve_item = vuln.get('cve', {})
                    # PASS THE VENDOR HERE
                    cve = self._extract_cve_info(cve_item, library_name, version, vendor)
                    if cve:
                        cves.append(cve)
            return cves
            
        except requests.exceptions.RequestException as e:
            print(f"Error querying NVD for {library_name}: {e}")
            return []
        except Exception as e:
            print(f"Unexpected error checking {library_name}: {e}")
            return []
    

# ============================================================================
# Public API
# ============================================================================

def check_vulnerabilities(
    dependencies: List[dict],
    api_key: Optional[str] = None,
    verbose: bool = True
) -> Dict[str, VulnerabilityResult]:
    """
    Check a list of dependencies for known vulnerabilities.
    
    This is the main function to be called by other scripts.
    
    Args:
        dependencies: List of dependency dicts with 'name' and 'version' keys
                     Can also accept Dependency objects from cmake_extractor
        api_key: Optional NVD API key for higher rate limits
        verbose: Print progress information
        
    Returns:
        Dictionary mapping library names to VulnerabilityResult objects
        
    Example:
        >>> deps = [
        ...     {'name': 'openssl', 'version': '1.0.1'},
        ...     {'name': 'curl', 'version': '7.68.0'}
        ... ]
        >>> results = check_vulnerabilities(deps)
    """
    db = CVEDatabase(api_key)
    results = {}
    
    from datetime import datetime
    check_time = datetime.utcnow().isoformat()
    # print(f"Configuration print {dependencies}\n")
    for i, dep in enumerate(dependencies, 1):
        # Handle both dict and object formats
        vendor = None
        if hasattr(dep, 'name'):
            lib_name = dep.name
            version = dep.version
            # Extract vendor if it exists on the object
            vendor = getattr(dep, 'vendor', None)
        else:
            lib_name = dep.get('name', 'unknown')
            version = dep.get('version', 'unknown')
            vendor = dep.get('vendor')
            
        if verbose:
            vendor_msg = f" (vendor: {vendor})" if vendor else ""
            print(f"[{i}/{len(dependencies)}] Checking {lib_name} {version}{vendor_msg}...")
        
        # Pass vendor to search
        cves = db.search_cves(lib_name, version, vendor)
        
        result = VulnerabilityResult(
            library_name=lib_name,
            version=version,
            cves=cves,
            checked_at=check_time
        )
        
        if cves:
            results[lib_name] = result
            if verbose:
                print(f"  → Found {len(cves)} CVE(s)")
    
    return results


def save_to_json(results: Dict[str, VulnerabilityResult], output_path: str) -> None:
    """
    Save vulnerability check results to a JSON file.
    
    Args:
        results: Dictionary of VulnerabilityResult objects
        output_path: Path where JSON file will be saved
    """
    output_path = Path(output_path)
    
    # Convert to serializable format
    data = {
        lib_name: {
            'library_name': result.library_name,
            'version': result.version,
            'checked_at': result.checked_at,
            'vulnerability_count': len(result.cves),
            'cves': [asdict(cve) for cve in result.cves]
        }
        for lib_name, result in results.items()
    }
    
    output_path.write_text(json.dumps(data, indent=2), encoding='utf-8')


# ============================================================================
# CLI/Display Functions (for direct usage)
# ============================================================================

def print_vulnerability_report(results: Dict[str, VulnerabilityResult], detailed: bool = False) -> None:
    """
    Print a formatted vulnerability report to console.
    
    Args:
        results: Dictionary of VulnerabilityResult objects
        detailed: Show full CVE descriptions
    """
    if not results:
        print("\n✓ No known vulnerabilities found!")
        return
    
    total_cves = sum(len(result.cves) for result in results.values())
    
    print("\n" + "=" * 80)
    print("VULNERABILITY REPORT")
    print("=" * 80)
    print(f"\nFound {total_cves} CVE(s) across {len(results)} vulnerable libraries\n")
    
    # Sort by severity
    severity_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3, 'NONE': 4, 'UNKNOWN': 5}
    
    for lib_name, result in sorted(results.items()):
        print(f"\n📦 {lib_name.upper()} (version: {result.version})")
        print("-" * 80)
        
        # Sort CVEs by severity
        sorted_cves = sorted(
            result.cves,
            key=lambda x: (severity_order.get(x.severity, 99), x.cve_id)
        )
        
        for cve in sorted_cves:
            severity_icon = {
                'CRITICAL': '🔴',
                'HIGH': '🟠',
                'MEDIUM': '🟡',
                'LOW': '🟢',
                'NONE': '⚪',
                'UNKNOWN': '⚪'
            }.get(cve.severity, '⚪')
            
            cvss_display = f"{cve.cvss_score:.1f}" if cve.cvss_score else "N/A"
            
            print(f"\n  {severity_icon} {cve.cve_id}")
            print(f"     Severity: {cve.severity} (CVSS: {cvss_display})")
            
            if cve.published_date:
                print(f"     Published: {cve.published_date[:10]}")
            
            # Show description
            description = cve.description
            if not detailed and len(description) > 200:
                description = description[:200] + "..."
            print(f"     Description: {description}")
            
            # Show affected versions if available
            if detailed and cve.affected_versions:
                print(f"     Affected versions: {len(cve.affected_versions)} range(s)")
    
    print("\n" + "=" * 80)
    
    # Summary by severity
    severity_counts = {}
    for result in results.values():
        for cve in result.cves:
            severity_counts[cve.severity] = severity_counts.get(cve.severity, 0) + 1
    
    print("\nSummary by Severity:")
    for severity in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']:
        if severity in severity_counts:
            print(f"  {severity}: {severity_counts[severity]}")


# ============================================================================
# CLI Entry Point
# ============================================================================

def main():
    """Command-line interface for direct usage"""
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(
        description='Check dependencies for CVE vulnerabilities'
    )
    parser.add_argument(
        'cmake_file',
        help='Path to CMakeLists.txt file'
    )
    parser.add_argument(
        '--api-key',
        help='NVD API key for higher rate limits'
    )
    parser.add_argument(
        '--output',
        help='Output JSON file path'
    )
    parser.add_argument(
        '--detailed',
        action='store_true',
        help='Show detailed CVE information'
    )
    
    args = parser.parse_args()
    
    try:
        # Import cmake_extractor
        from cmake_extractor import extract_dependencies
        
        # Extract dependencies from CMakeLists.txt
        print(f"Extracting dependencies from {args.cmake_file}...")
        cmake_info = extract_dependencies(args.cmake_file)
        
        if not cmake_info.dependencies:
            print("No dependencies found in CMakeLists.txt")
            sys.exit(0)
        
        print(f"Found {len(cmake_info.dependencies)} dependencies {cmake_info}\n")
        
        # Check for vulnerabilities
        print("Checking NVD for vulnerabilities...")
        print("(This may take a while due to API rate limits)\n")
        
        results = check_vulnerabilities(
            cmake_info.dependencies,
            api_key=args.api_key,
            verbose=True
        )
        
        # Print report
        print_vulnerability_report(results, detailed=args.detailed)
        
        # Save to JSON if requested
        if args.output:
            save_to_json(results, args.output)
            print(f"\n✓ Results saved to {args.output}")
        
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except ImportError as e:
        print(f"Error: Could not import cmake_extractor: {e}", file=sys.stderr)
        print("Make sure cmake_extractor.py is in the same directory", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
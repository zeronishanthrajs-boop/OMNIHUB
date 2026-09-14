"""
ULTRON CLI Companion (Item 278)
Trigger autonomous missions and export projects directly from the command line.
"""

import sys
import argparse
import json
import project_manager as pm

def main():
    parser = argparse.ArgumentParser(description="ULTRON Autonomous Orchestrator CLI")
    parser.add_argument("--list", action="store_true", help="List all active projects")
    parser.add_argument("--run", type=str, help="Launch a synthesis mission")
    parser.add_argument("--export", type=str, help="Export a project to ZIP")

    args = parser.parse_args()

    if args.list:
        projects = pm.list_projects()
        print(f"[ULTRON CLI] {len(projects)} project(s) found:")
        for p in projects:
            print(f"  - {p['id']}: {p['title']} ({p.get('time_remaining_str', '')})")
    elif args.export:
        zip_bytes = pm.export_project_zip(args.export)
        if zip_bytes:
            out_file = f"{args.export}.zip"
            with open(out_file, "wb") as f:
                f.write(zip_bytes)
            print(f"[ULTRON CLI] Exported {args.export} to {out_file}")
        else:
            print(f"[ULTRON CLI] Failed to export {args.export}")
    elif args.run:
        print(f"[ULTRON CLI] Launching mission: {args.run}")
        proj = pm.create_project(goal=args.run, logical_tree={}, code="<!DOCTYPE html><html><body>CLI Project</body></html>")
        print(f"[ULTRON CLI] Created project {proj['id']}")
    else:
        parser.print_help()

if __name__ == "__main__":
    main()

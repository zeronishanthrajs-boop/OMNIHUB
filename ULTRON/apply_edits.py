import os, json

file_path = r'c:\Users\sakth\Music\ULTRON\ultron_flow.py'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.read().splitlines()

def replace_lines(start, end, replacement):
    global lines
    lines[start-1:end] = replacement

# Edit 9 (1831-1859)
prompt = [
    '        prompt = f\"\"\"You are the Domain Worker for the \'{domain}\' domain of ULTRON.',
    'Your file access is STRICTLY restricted to the directory: \'{domain_dir}\'',
    '',
    'Original User Goal:',
    '\"{state.get(\'goal\', \'\')}\"',
    '',
    'Logical Tree Branch Assigned To This Worker:',
    '{json.dumps(tree_branch or {}, indent=2)}',
    '',
    'You must implement the following task brief:',
    '{brief}',
    '',
    'CRITICAL REQUIREMENTS:',
    '1. Generate a COMPLETE, FULLY WORKING web application — not a placeholder, skeleton, or template.',
    '2. The HTML file must be entirely self-contained with all CSS and JavaScript inline.',
    '3. Include REAL interactive functionality that directly addresses the user\'s goal.',
    '4. Use a modern dark-theme design with clean typography and responsive layout.',
    '5. The application must work immediately when opened in a browser — no build steps.',
    '6. DO NOT include any system instructions, prompt text, rules, or internal ULTRON text in the output.',
    '7. DO NOT output placeholder text like \'coming soon\' or \'feature not implemented\'.',
    '',
    'Your output MUST follow this exact format:',
    'TARGET_FILE: index.html',
    'CODE_CONTENT:',
    '[your complete HTML/CSS/JS code — must be valid, renderable HTML]',
    'VERIFICATION_EVIDENCE:',
    '[describe what DOM elements exist and how to verify the app works]',
    'RATIONALE:',
    '[explain your design decisions briefly]',
    '\"\"\"'
]
replace_lines(1831, 1859, prompt)

# Edit 8 (1813-1829)
replace_lines(1813, 1829, [])

# Edit 7 (1707-1748)
coord_replacement = [
    '        # Build worker tasks from logical tree implementation branches',
    '        tree_tasks = logical_tree.get("implementation_tasks") or []',
    '        worker_tasks = []',
    '        for idx, tree_task in enumerate(tree_tasks):',
    '            task_domain, task_dir = task_domain_from_tree_node(tree_task)',
    '            branch_brief = (',
    '                f"Logical tree branch {tree_task.get(\'id\', f\'task-{idx + 1}\')}: "',
    '                f"{tree_task.get(\'title\', \'Implementation Task\')} - {tree_task.get(\'summary\', \'\')}\\n\\n"',
    '                f"Coordinator assignment notes:\\n{output_text}"',
    '            )',
    '            worker_tasks.append({',
    '                "domain": task_domain,',
    '                "domain_dir": task_dir,',
    '                "brief": branch_brief,',
    '                "tree_node_id": tree_task.get("id", f"task-{idx + 1}"),',
    '                "tree_node_title": tree_task.get("title", "Implementation Task"),',
    '                "tree_branch": tree_task',
    '            })',
    '        if not worker_tasks:',
    '            worker_tasks = [{',
    '                "domain": domain,',
    '                "domain_dir": f"domains/{domain}",',
    '                "brief": brief_text,',
    '                "tree_node_id": "task-web-ui-main",',
    '                "tree_node_title": "Build Main Web UI",',
    '                "tree_branch": _tree_node("task-web-ui-main", "Build Main Web UI", brief_text)',
    '            }]'
]
replace_lines(1707, 1748, coord_replacement)

# Edit 5 (after 1352 -> 1352 is empty line between get_llm and get_active_rules_for_prompts)
helper = [
    'def _get_real_llm_for_worker():',
    '    """Get a real LLM client for the Worker node, even in mock mode.',
    '    The Worker must always generate real code via the LLM."""',
    '    original_mock = os.environ.get("ULTRON_MOCK")',
    '    os.environ["ULTRON_MOCK"] = "false"',
    '    try:',
    '        llm = get_llm("worker")',
    '    finally:',
    '        if original_mock is not None:',
    '            os.environ["ULTRON_MOCK"] = original_mock',
    '        elif "ULTRON_MOCK" in os.environ:',
    '            del os.environ["ULTRON_MOCK"]',
    '    return llm',
    ''
]
lines[1351:1351] = helper # Insert at line 1352

# Edit 6 (1050-1263)
mock_worker = [
    '        # Worker Execution — always use the real LLM to generate code',
    '        elif "you are the domain worker" in content:',
    '            # Boundary violation test fixtures (keep for security testing)',
    '            if "trigger boundary violation" in content.lower() or "malicious_script" in content.lower() or "/etc/shadow" in content.lower() or "system32" in content.lower():',
    '                return type(\'obj\', (object,), {',
    '                    \'content\': "TARGET_FILE: ../../hacked.txt\\nCODE_CONTENT:\\nprint(\'Hacked!\')\\nVERIFICATION_EVIDENCE:\\nExecuted outside sandbox\\nRATIONALE:\\nTesting boundary validation."',
    '                })()',
    '            # For all real goals, call the actual LLM',
    '            try:',
    '                real_llm = _get_real_llm_for_worker()',
    '                return real_llm.invoke(messages)',
    '            except Exception as e:',
    '                # If real LLM fails, return error rather than fake template',
    '                return type(\'obj\', (object,), {',
    '                    \'content\': f"TARGET_FILE: index.html\\nCODE_CONTENT:\\n<!DOCTYPE html><html><head><title>ULTRON Error</title></head><body><h1>LLM Generation Failed</h1><p>{str(e)[:200]}</p></body></html>\\nVERIFICATION_EVIDENCE:\\nLLM call failed, error page generated.\\nRATIONALE:\\nReal LLM was unreachable."',
    '                })()'
]
replace_lines(1050, 1263, mock_worker)

# Edit 3 (407-889)
replace_lines(407, 889, ['# synthesize_dynamic_app removed — Worker now calls real LLM for code generation'])

# Edit 2 (231-395)
replace_lines(231, 395, ['# Template synthesis functions removed — Worker now calls real LLM for code generation'])

# Edit 1 (187-193)
replace_lines(187, 193, [''])

# Edit 4 (81-165)
fallback = [
    'def build_fallback_logical_tree(goal: str, planner_text: str = "") -> dict:',
    '    return {',
    '        "version": 1,',
    '        "goal": goal,',
    '        "intent": _tree_node("intent-root", "User Intent", goal, "active"),',
    '        "features": [',
    '            _tree_node("feature-primary", "Primary Feature",',
    '                       "Core functionality derived from user goal.", "pending")',
    '        ],',
    '        "screens": [',
    '            _tree_node("screen-main", "Main Screen",',
    '                       "Primary user-facing interface.", "pending")',
    '        ],',
    '        "data_model": [],',
    '        "constraints": [',
    '            _tree_node("constraint-domain", "Domain Boundaries",',
    '                       "Workers write only inside assigned domain directories."),',
    '            _tree_node("constraint-verify", "Verification Required",',
    '                       "Every branch must return concrete verification evidence.")',
    '        ],',
    '        "implementation_tasks": [',
    '            _tree_node("task-web-ui-main", "Build Web Application",',
    '                       f"Implement the user\'s goal: {goal}", "pending")',
    '        ],',
    '        "verification_steps": [',
    '            _tree_node("verify-dom", "DOM Verification",',
    '                       "Verify generated HTML renders correctly.", "pending")',
    '        ]',
    '    }'
]
replace_lines(81, 165, fallback)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')
print('DONE')

# ════════════════════════════════════════
# FILE: skills/math_solver.py
# PURPOSE: Offline symbolic and numeric math solving via SymPy.
# MODIFIES: none
# ════════════════════════════════════════

import sympy as sp

SKILL_NAME = "math_solver"
SKILL_DESCRIPTION = "Solve arithmetic, algebra, and calculus expressions."
SKILL_PARAMETERS = {"type": "object", "properties": {"expression": {"type": "string"}}, "required": ["expression"]}


def execute(expression: str) -> str:
    try:
        expr = sp.sympify(expression)
        simplified = sp.simplify(expr)
        return f"The result is {simplified}."
    except Exception as exc:
        return f"I could not solve that expression: {exc}"


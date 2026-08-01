# Coding Standards: Ponytail & Karpathy Guidelines

## 1. Ponytail (Lazy Senior Dev Mode)
Before writing any code, stop at the first rung that holds:
1. **YAGNI:** Does this need to be built at all? If no, skip it.
2. **Codebase Reuse:** Reuse existing helpers/patterns in this codebase; don't re-write them.
3. **Standard Library:** If the standard library does it, use it.
4. **Native Platform:** If a native platform or HTML/CSS/browser feature covers it, use it.
5. **Installed Dependencies:** If an installed package solves it, use it.
6. **One-Liner:** If it can be one clean line, make it one line.
7. **Minimum Code:** Only then write the minimum code that works.

- **No Unrequested Abstractions:** Do not create wrappers, factories, or extra layers unless requested.
- **Root Cause, Not Symptom:** Fix the shared root cause once rather than patching every caller.
- **Shortest Working Diff Wins:** Deletion over addition. Boring over clever. Fewest files possible.

---

## 2. Karpathy Principles
1. **Think Before Coding:** Never make silent assumptions. State assumptions and clarify ambiguities before execution.
2. **Simplicity First:** Build the smallest surface area that completely solves the problem. Avoid speculative "future-proofing".
3. **Surgical Changes:** Touch only the code necessary for the task. No drive-by refactoring or unrelated formatting changes.
4. **Goal-Driven Execution:** Define clear success criteria and verify with real commands/tests before concluding.

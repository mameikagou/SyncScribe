"""Build reusable architecture/dataflow analysis prompts from a local project path."""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from typing import Sequence

import tomllib


DEFAULT_IGNORE = "node_modules|dist|.git|.venv|__pycache__|.next|.uv_cache"
MODULE1_FILENAME = "module1_architecture_prompt"
MODULE2_FILENAME = "module2_dataflow_prompt"

ENTRY_FILE_HINTS = (
    "__main__.py",
    "main.py",
    "app.py",
    "server.py",
    "server.ts",
    "server.js",
    "index.ts",
    "index.js",
    "App.tsx",
    "commands.py",
)

CORE_NAME_HINTS = (
    "service",
    "services",
    "core",
    "agent",
    "router",
    "manager",
    "loop",
    "provider",
    "controller",
)


MODULE1_TEMPLATE = """# Role: 资深技术架构师 (Senior Architect)
# Task: 项目架构与目录职责深度解析

## 输入信息
我将提供一个开源项目的 **文件目录树 (File Tree)** 和 **关键依赖文件**。

## 你的目标
请像给新入职的初级工程师讲解一样，用通俗易懂的“人话”帮我建立对这个项目的宏观认知。不要堆砌术语，要讲清楚“为什么这么设计”。

## 输出要求 (必须严格遵守)

### 1. 核心架构画像 (The Big Picture)
* **一句话定义：** 这个项目本质上是一个什么系统？
* **架构模式：** 它是 MVC？DDD（领域驱动设计）？还是微服务？或者是简单的脚本集合？
* **技术栈选型理由：** 挑出 3-5 个核心库，解释为什么选它们而不是别的。

### 2. 目录职能映射 (The Map)
请分析目录结构，按重要性列出核心文件夹，并按以下格式输出：
* **📂 [文件夹名称]**
    * **职能标签：** (例如：🧠 大脑 / 🔌 接口 / 🎨 皮肤 / 🗄️ 仓库)
    * **人话解释：** 它是做什么的？如果不写这一层会发生什么？
    * **架构层级：** (例如：表现层 / 业务逻辑层 / 数据持久层)

### 3. 分层架构图 (Mermaid)
请生成一个 Mermaid `graph TD` 代码块，可视化展示各层级之间的依赖关系（例如：UI -> Service -> API -> DB）。

## 开始分析

### 文件目录树
```text
{tree_output}
```

### 关键依赖文件
{dependency_blocks}

### README 前 {readme_lines} 行
```markdown
{readme_head}
```
"""


MODULE2_TEMPLATE = """# Role: 全栈系统分析师 (System Analyst)
# Task: 核心链路数据流转追踪

## 输入信息
1. 核心代码片段。
2. 指定场景：**{scenario}**

## 你的目标
请像讲故事一样，追踪数据在系统中的完整生命周期。不要只贴代码，我要看的是“数据的旅行”。

## 输出要求 (必须严格遵守)

### 1. 剧情式数据流 (The Story)
请按步骤描述数据流转，每一步必须包含：
* **阶段名称：** (例如：1. 请求接收 -> 2. 鉴权 -> 3. 业务处理)
* **涉及文件：** (标出核心文件名)
* **数据形态变化：** 数据在这个环节变成了什么样？
* **核心逻辑：** 这里做了什么关键决策？

### 2. 关键代码锚点 (The Anchors)
针对上面的流程，提取出最关键的 3-5 行代码逻辑（不用全贴，只贴核心），并用注释解释其作用。

### 3. 时序图 (Mermaid Sequence Diagram)
请生成一个 Mermaid `sequenceDiagram` 代码块，展示对象/模块之间的交互时序。
* 参与者(Participant) 应该是具体的模块或类名 (e.g., `Gateway`, `AgentService`, `LLMClient`)。
* 消息(Message) 应该是具体的方法调用或数据包。

## 开始分析

### 入口文件片段
{entry_blocks}

### 核心逻辑文件片段
{core_blocks}
"""


def _split_ignore(ignore_pattern: str) -> set[str]:
    return {item.strip() for item in ignore_pattern.split("|") if item.strip()}


def _depth_within(path: Path, root: Path) -> int:
    rel = path.relative_to(root)
    return len(rel.parts)


def _walk_files(project_path: Path, ignore_names: set[str], max_depth: int) -> list[Path]:
    files: list[Path] = []
    for path in sorted(project_path.rglob("*")):
        if any(part in ignore_names for part in path.parts):
            continue
        if _depth_within(path, project_path) > max_depth:
            continue
        if path.is_file():
            files.append(path)
    return files


def _run_tree(project_path: Path, max_depth: int, ignore_pattern: str) -> str:
    command = [
        "tree",
        "-I",
        ignore_pattern,
        "-L",
        str(max_depth),
        str(project_path),
    ]
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        return result.stdout.strip() or f"{project_path} (empty)"
    except (FileNotFoundError, subprocess.CalledProcessError):
        return _fallback_tree(project_path, max_depth, _split_ignore(ignore_pattern))


def _fallback_tree(project_path: Path, max_depth: int, ignore_names: set[str]) -> str:
    def should_skip(path: Path) -> bool:
        return any(part in ignore_names for part in path.parts)

    lines = [str(project_path)]

    def walk(current: Path, prefix: str, depth: int) -> None:
        if depth >= max_depth:
            return
        entries = [
            entry
            for entry in sorted(current.iterdir(), key=lambda p: (p.is_file(), p.name.lower()))
            if not should_skip(entry)
        ]
        total = len(entries)
        for index, entry in enumerate(entries, start=1):
            connector = "└── " if index == total else "├── "
            lines.append(f"{prefix}{connector}{entry.name}")
            if entry.is_dir():
                extension = "    " if index == total else "│   "
                walk(entry, prefix + extension, depth + 1)

    walk(project_path, "", 0)
    return "\n".join(lines)


def _safe_read(path: Path) -> str:
    for encoding in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue
    return ""


def _read_head_lines(path: Path, line_limit: int) -> str:
    content = _safe_read(path)
    if not content:
        return "(内容为空或无法读取)"
    return "\n".join(content.splitlines()[:line_limit]).strip() or "(文件为空)"


def _format_json_snippet(path: Path) -> str:
    try:
        parsed = json.loads(_safe_read(path))
    except json.JSONDecodeError:
        return _read_head_lines(path, 220)

    keys = [
        "name",
        "version",
        "private",
        "type",
        "scripts",
        "dependencies",
        "devDependencies",
    ]
    filtered = {key: parsed[key] for key in keys if key in parsed}
    return json.dumps(filtered, ensure_ascii=False, indent=2)


def _format_pyproject_snippet(path: Path) -> str:
    try:
        parsed = tomllib.loads(_safe_read(path))
    except tomllib.TOMLDecodeError:
        return _read_head_lines(path, 220)

    project = parsed.get("project", {})
    selected = {
        "name": project.get("name"),
        "version": project.get("version"),
        "requires-python": project.get("requires-python"),
        "dependencies": project.get("dependencies", []),
        "optional-dependencies": project.get("optional-dependencies", {}),
    }
    cleaned = {key: value for key, value in selected.items() if value not in (None, [], {})}
    return json.dumps(cleaned, ensure_ascii=False, indent=2)


def _format_dependency_block(path: Path) -> str:
    suffix = path.name.lower()
    if suffix == "package.json":
        body = _format_json_snippet(path)
        language = "json"
    elif suffix == "pyproject.toml":
        body = _format_pyproject_snippet(path)
        language = "json"
    else:
        body = _read_head_lines(path, 220)
        language = "text"

    return f"#### `{path}`\n```{language}\n{body}\n```"


def _collect_dependency_files(project_path: Path) -> list[Path]:
    preferred = [
        project_path / "package.json",
        project_path / "pyproject.toml",
        project_path / "requirements.txt",
    ]
    found = [path for path in preferred if path.exists()]
    if found:
        return found

    fallback: list[Path] = []
    for filename in ("package.json", "pyproject.toml", "requirements.txt"):
        fallback.extend(project_path.glob(f"*/{filename}"))
    return sorted(fallback)[:3]


def _locate_readme(project_path: Path) -> Path | None:
    for filename in ("README.md", "readme.md", "README.MD"):
        candidate = project_path / filename
        if candidate.exists():
            return candidate
    return None


def build_module1_prompt(
    project_path: Path,
    max_depth: int,
    readme_lines: int,
    ignore_pattern: str,
) -> str:
    tree_output = _run_tree(project_path, max_depth=max_depth, ignore_pattern=ignore_pattern)

    dependency_files = _collect_dependency_files(project_path)
    if dependency_files:
        dependency_blocks = "\n\n".join(_format_dependency_block(path) for path in dependency_files)
    else:
        dependency_blocks = "未找到 package.json / pyproject.toml / requirements.txt。"

    readme_path = _locate_readme(project_path)
    if readme_path:
        readme_head = _read_head_lines(readme_path, readme_lines)
    else:
        readme_head = "(未找到 README.md)"

    return MODULE1_TEMPLATE.format(
        tree_output=tree_output,
        dependency_blocks=dependency_blocks,
        readme_lines=readme_lines,
        readme_head=readme_head,
    )


def _resolve_paths(project_path: Path, user_paths: Sequence[str] | None) -> list[Path]:
    if not user_paths:
        return []

    resolved: list[Path] = []
    for raw in user_paths:
        path = Path(raw)
        candidate = path if path.is_absolute() else project_path / path
        if candidate.exists() and candidate.is_file():
            resolved.append(candidate)
    return resolved


def _auto_pick_entry_files(project_path: Path, ignore_names: set[str]) -> list[Path]:
    files = _walk_files(project_path, ignore_names=ignore_names, max_depth=5)
    entries = [path for path in files if path.name in ENTRY_FILE_HINTS]
    return entries[:4]


def _auto_pick_core_files(project_path: Path, ignore_names: set[str]) -> list[Path]:
    files = _walk_files(project_path, ignore_names=ignore_names, max_depth=6)

    scored: list[tuple[int, Path]] = []
    for path in files:
        lowered = str(path.relative_to(project_path)).lower()
        score = sum(2 for hint in CORE_NAME_HINTS if f"/{hint}/" in f"/{lowered}")
        score += sum(1 for hint in CORE_NAME_HINTS if hint in path.stem.lower())
        if score > 0 and path.suffix in {".py", ".ts", ".tsx", ".js"}:
            scored.append((score, path))

    scored.sort(key=lambda item: (-item[0], len(str(item[1])), str(item[1]).lower()))

    selected: list[Path] = []
    for _, path in scored:
        if path not in selected:
            selected.append(path)
        if len(selected) >= 6:
            break
    return selected


def _fence_language(path: Path) -> str:
    mapping = {
        ".py": "python",
        ".ts": "ts",
        ".tsx": "tsx",
        ".js": "js",
        ".json": "json",
        ".toml": "toml",
        ".md": "markdown",
    }
    return mapping.get(path.suffix.lower(), "text")


def _format_code_block(path: Path, project_path: Path, max_lines: int) -> str:
    lines = _safe_read(path).splitlines()
    snippet = lines[:max_lines]
    numbered = "\n".join(f"{index + 1:>4}: {line}" for index, line in enumerate(snippet))
    rel_path = path.relative_to(project_path)
    fence = _fence_language(path)
    return f"#### `{rel_path}`\n```{fence}\n{numbered}\n```"


def _ensure_nonempty(paths: list[Path], label: str) -> str:
    if paths:
        return ""
    return f"(未自动识别到{label}，请通过命令参数手动指定。)"


def build_module2_prompt(
    project_path: Path,
    scenario: str,
    entry_files: Sequence[str] | None,
    core_files: Sequence[str] | None,
    max_lines: int,
    ignore_pattern: str,
) -> str:
    ignore_names = _split_ignore(ignore_pattern)

    resolved_entry = _resolve_paths(project_path, entry_files)
    resolved_core = _resolve_paths(project_path, core_files)

    if not resolved_entry:
        resolved_entry = _auto_pick_entry_files(project_path, ignore_names=ignore_names)
    if not resolved_core:
        resolved_core = _auto_pick_core_files(project_path, ignore_names=ignore_names)

    entry_hint = _ensure_nonempty(resolved_entry, "入口文件")
    core_hint = _ensure_nonempty(resolved_core, "核心逻辑文件")

    entry_blocks = "\n\n".join(
        _format_code_block(path, project_path=project_path, max_lines=max_lines)
        for path in resolved_entry
    )
    core_blocks = "\n\n".join(
        _format_code_block(path, project_path=project_path, max_lines=max_lines)
        for path in resolved_core
    )

    entry_blocks = "\n\n".join(filter(None, [entry_hint, entry_blocks]))
    core_blocks = "\n\n".join(filter(None, [core_hint, core_blocks]))

    return MODULE2_TEMPLATE.format(
        scenario=scenario,
        entry_blocks=entry_blocks,
        core_blocks=core_blocks,
    )


def _default_output(project_name: str, module_name: str) -> Path:
    base = Path(__file__).resolve().parent / "vibe_output"
    base.mkdir(parents=True, exist_ok=True)
    return base / f"{project_name}_{module_name}.md"


def _write_output(content: str, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content, encoding="utf-8")


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build architecture/dataflow analysis prompts")
    subparsers = parser.add_subparsers(dest="module", required=True)

    parser_m1 = subparsers.add_parser("module1", help="Generate module1 architecture prompt")
    parser_m1.add_argument("--project", required=True, help="Target project path")
    parser_m1.add_argument("--max-depth", type=int, default=4, help="Tree max depth")
    parser_m1.add_argument("--readme-lines", type=int, default=50, help="README head lines")
    parser_m1.add_argument("--ignore", default=DEFAULT_IGNORE, help="Tree ignore pattern")
    parser_m1.add_argument("--output", help="Output markdown path")

    parser_m2 = subparsers.add_parser("module2", help="Generate module2 dataflow prompt")
    parser_m2.add_argument("--project", required=True, help="Target project path")
    parser_m2.add_argument("--scenario", required=True, help="Scenario to trace")
    parser_m2.add_argument("--entry", action="append", help="Entry file path (repeatable)")
    parser_m2.add_argument("--core", action="append", help="Core file path (repeatable)")
    parser_m2.add_argument("--max-lines", type=int, default=220, help="Max lines per snippet")
    parser_m2.add_argument("--ignore", default=DEFAULT_IGNORE, help="File scan ignore pattern")
    parser_m2.add_argument("--output", help="Output markdown path")

    return parser


def _normalize_project_path(raw: str) -> Path:
    project_path = Path(raw).expanduser().resolve()
    if not project_path.exists() or not project_path.is_dir():
        raise ValueError(f"项目路径不存在或不是目录: {project_path}")
    return project_path


def main(argv: Sequence[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    project_path = _normalize_project_path(args.project)
    project_name = project_path.name

    if args.module == "module1":
        content = build_module1_prompt(
            project_path=project_path,
            max_depth=args.max_depth,
            readme_lines=args.readme_lines,
            ignore_pattern=args.ignore,
        )
        output = Path(args.output).expanduser().resolve() if args.output else _default_output(project_name, MODULE1_FILENAME)
    else:
        content = build_module2_prompt(
            project_path=project_path,
            scenario=args.scenario,
            entry_files=args.entry,
            core_files=args.core,
            max_lines=args.max_lines,
            ignore_pattern=args.ignore,
        )
        output = Path(args.output).expanduser().resolve() if args.output else _default_output(project_name, MODULE2_FILENAME)

    _write_output(content, output)
    print(f"✅ Prompt generated: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

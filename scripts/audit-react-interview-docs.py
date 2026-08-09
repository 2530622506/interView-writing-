#!/usr/bin/env python3
"""审计 React 面试 Markdown 的结构、相对链接与图片可移植性。"""

from __future__ import annotations

import argparse
import re
import sys
from collections import defaultdict
from pathlib import Path
from urllib.parse import unquote

FENCE_RE = re.compile(r"^\s*(`{3,}|~{3,})(.*)$")
HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*#*\s*$")
LINK_RE = re.compile(r"(?<!!)\[[^\]]+\]\(([^)\s]+)(?:\s+[\"'][^\"']*[\"'])?\)")
IMAGE_RE = re.compile(r"!\[[^\]]*\]\(([^)\s]+)(?:\s+[\"'][^\"']*[\"'])?\)")
CONFLICT_RE = re.compile(r"^(?:<<<<<<<|=======|>>>>>>>)", re.MULTILINE)


def markdown_slug(title: str) -> str:
    """近似 GitHub / Typora 的标题锚点规则，覆盖当前文档使用方式。"""
    title = re.sub(r"<[^>]+>", "", title)
    title = re.sub(r"[`*_~]", "", title).strip().lower()
    title = re.sub(r"[^\w\-\u4e00-\u9fff ]", "", title)
    return re.sub(r"\s", "-", title)


def scan_fences(path: Path, lines: list[str]) -> tuple[list[str], list[bool]]:
    errors: list[str] = []
    inside = [False] * len(lines)
    fence: tuple[str, int, int] | None = None

    for index, line in enumerate(lines):
        match = FENCE_RE.match(line)
        if match is None:
            inside[index] = fence is not None
            continue

        marker = match.group(1)
        if fence is None:
            fence = (marker[0], len(marker), index + 1)
            inside[index] = True
        elif marker[0] == fence[0] and len(marker) >= fence[1]:
            inside[index] = True
            fence = None
        else:
            inside[index] = True

    if fence is not None:
        errors.append(f"{path}:{fence[2]} 未闭合代码围栏")

    return errors, inside


def collect_anchors(lines: list[str], inside_fence: list[bool]) -> set[str]:
    counts: dict[str, int] = defaultdict(int)
    anchors: set[str] = set()

    for index, line in enumerate(lines):
        if inside_fence[index]:
            continue
        match = HEADING_RE.match(line)
        if match is None:
            continue

        base = markdown_slug(match.group(2))
        number = counts[base]
        counts[base] += 1
        anchors.add(base if number == 0 else f"{base}-{number}")

    return anchors


def line_number(text: str, position: int) -> int:
    return text.count("\n", 0, position) + 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "docs_dir",
        nargs="?",
        default="docs/react-interview",
        help="React 面试文档目录，默认 docs/react-interview",
    )
    args = parser.parse_args()

    root = Path(args.docs_dir).resolve()
    markdown_files = sorted(root.glob("*.md"))
    if not markdown_files:
        print(f"ERROR 未找到 Markdown：{root}")
        return 1

    errors: list[str] = []
    warnings: list[str] = []
    metadata: dict[Path, tuple[str, list[str], list[bool], set[str]]] = {}

    # 第一遍先收集全部标题，避免跨文件链接受文件遍历顺序影响。
    for path in markdown_files:
        text = path.read_text(encoding="utf-8")
        lines = text.splitlines()
        fence_errors, inside_fence = scan_fences(path, lines)
        errors.extend(fence_errors)
        metadata[path.resolve()] = (
            text,
            lines,
            inside_fence,
            collect_anchors(lines, inside_fence),
        )

    for path in markdown_files:
        resolved = path.resolve()
        text, lines, inside_fence, _ = metadata[resolved]

        if CONFLICT_RE.search(text):
            errors.append(f"{path} 存在 Git 冲突标记")

        # 只检查非代码围栏区域中的链接，避免把示例字符串当成真实引用。
        visible_text = "\n".join(
            line if not inside_fence[index] else ""
            for index, line in enumerate(lines)
        )

        for match in IMAGE_RE.finditer(visible_text):
            target = unquote(match.group(1).strip("<>"))
            current_line = line_number(visible_text, match.start())
            clean_target = target.split("?", 1)[0].lower()

            if clean_target.endswith(".svg"):
                errors.append(f"{path}:{current_line} 不允许 SVG 图片：{target}")

            if not target.startswith(("https://", "http://")):
                errors.append(f"{path}:{current_line} 图片必须使用远程绝对链接：{target}")
                continue

            if not (
                target.startswith("https://cdn.jsdelivr.net/")
                and clean_target.endswith(".png")
            ):
                errors.append(
                    f"{path}:{current_line} 图片必须是 jsDelivr PNG：{target}"
                )

        for match in LINK_RE.finditer(visible_text):
            target = unquote(match.group(1).strip("<>"))
            current_line = line_number(visible_text, match.start())

            if target.startswith(("https://", "http://", "mailto:", "tel:")):
                continue

            file_part, separator, anchor = target.partition("#")
            destination = (
                (path.parent / file_part).resolve() if file_part else resolved
            )

            if not destination.exists():
                errors.append(f"{path}:{current_line} 相对链接不存在：{target}")
                continue

            if separator and anchor and destination.suffix.lower() == ".md":
                destination_meta = metadata.get(destination)
                if destination_meta is None:
                    warnings.append(
                        f"{path}:{current_line} 未审计目录外锚点：{target}"
                    )
                elif anchor.lower() not in destination_meta[3]:
                    errors.append(f"{path}:{current_line} 标题锚点不存在：{target}")

    print(f"扫描目录：{root}")
    print(f"Markdown：{len(markdown_files)} 个")
    print(f"错误：{len(errors)}；警告：{len(warnings)}")

    for item in errors:
        print(f"ERROR {item}")
    for item in warnings:
        print(f"WARN  {item}")

    if errors:
        return 1

    print("PASS  Markdown 结构、相对链接与图片约束检查通过")
    return 0


if __name__ == "__main__":
    sys.exit(main())

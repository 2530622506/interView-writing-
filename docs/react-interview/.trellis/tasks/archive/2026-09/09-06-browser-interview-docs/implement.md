# 实施计划：浏览器篇面试文档重构

## 阶段 1：整理素材

- [x] 阅读源文档并建立主题清单、重复问题清单和需纠正的示例清单。
- [x] 对照仓库现有 React 文档的 Markdown 风格，确定标题、提示块、表格和代码块规范。
- [x] 确认主文档目录与章节顺序，保留源文档的有效知识点但不机械复制原章节。

## 阶段 2：生成内容

- [x] 编写浏览器整体架构与 URL 到页面展现主线。
- [x] 重写缓存和本地存储章节，补充流程图、对比表和工程策略。
- [x] 重写网络协议与渲染流水线章节，补充 TCP / TLS、阻塞关系和关键渲染路径。
- [x] 编写性能、Worker、SSR / CSR 和高频面试问答章节。
- [x] 生成并引用本地 SVG 图，确保与正文术语一致。

## 阶段 3：校验

- [x] 检查 Mermaid fenced code 数量、围栏闭合和关键节点内容。
- [x] 检查 Markdown 中是否残留 `<font>`、OCR 注释、源文档远程图片和断裂编号。
- [x] 检查本地 SVG 是否存在、格式可解析、引用路径正确。
- [x] 检查代码块中的 HTTP / JavaScript 示例是否语法和语义一致。
- [x] 检查现有文件变更范围，确认没有修改源文档和既有 React 文档。
- [x] 从头通读主文档，验证章节顺序、术语一致性和面试表达可复述性。

## 验证命令

```bash
wc -l browser-interview-guide.md
grep -c '^```mermaid$' browser-interview-guide.md
find assets -maxdepth 1 -name '*.svg' -print
rg -n '<font|OCR|ocr|TODO|TBD' browser-interview-guide.md
python3 - <<'PY'
from pathlib import Path
import xml.etree.ElementTree as ET
for path in Path('assets').glob('browser-*.svg'):
    ET.parse(path)
    print('valid:', path)
PY
```

## 风险与回滚点

- 主要风险是源文档内容量大且存在事实混杂；通过主题清单和“结论—解释—边界—追问”模板控制遗漏。
- 若 SVG 在阅读器中显示异常，可保留 Mermaid 作为信息主载体，并修正 SVG 的尺寸、命名空间或引用路径。
- 所有变更集中在新主文档、指定 SVG 和本任务目录；可通过 `git restore -- <new files>` 或删除新文件回滚，不触碰既有文档。

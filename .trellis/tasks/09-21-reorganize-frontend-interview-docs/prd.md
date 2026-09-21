# 重新整理前端面试文档 JS/CSS/HTML 三篇

## Goal

将三份从语雀导出的前端面试文档整理为结构清晰、通俗易懂的 Markdown 文件，输出至 `docs/` 目录，技术深度不减少。

源文件规模：JS 篇 8086 行 / 147 个知识点，CSS 篇 3118 行 / 74 个知识点，HTML 篇 754 行 / 13 个知识点。

## Requirements

1. **清理格式**：去除所有 `<font style="...">` 等 HTML 标签、无效空行、不可访问的语雀图片链接（保留有实质内容的 OCR 注释文字转成正文）、作者个人吐槽文字
2. **合并碎片**：同一知识点分散在多处的内容合并为一节，去除重复段落但不丢失任何技术细节
3. **标题规范**：每个考点以问句作为标题，层级统一（`##` 为大主题，`###` 为具体考点）
4. **语言通俗**：技术术语准确，辅以简洁类比帮助理解，保留原文中有价值的面试官追问场景
5. **代码完整**：所有代码示例原样保留，补全代码块语言标注（```javascript 等）
6. **Vue 内容**：JS 篇中混入的 Vue 相关题目（vue key、mapState/mapGetters/mapActions/mapMutations）收录在文件末尾独立一节 `## Vue 相关`

## Output

| 源文件 | 输出文件 |
|---|---|
| 2024年前端面试---JS篇.md | docs/js-interview.md |
| 2024年前端面试---CSS篇.md | docs/css-interview.md |
| 2024年前端面试---HTML篇.md | docs/html-interview.md |

命名风格与目录已有文件（vue3-reactivity-principles.md）保持一致。

## Acceptance Criteria

- [ ] 三个输出文件均存在于 `docs/` 目录
- [ ] 无残留 `<font>` / `<style>` 等 HTML 标签（可用 `grep` 验证）
- [ ] 每个知识点技术内容与源文件一致，无遗漏
- [ ] 所有代码块有语言标注
- [ ] 标题层级统一，每个考点为问句形式
- [ ] Vue 相关内容独立成节，位于 js-interview.md 末尾

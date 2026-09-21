# 执行计划：重新整理前端面试文档

## 执行顺序

按难度从小到大，先跑通流程再处理大文件。

- [ ] 1. HTML 篇（754 行，13 个知识点）→ `docs/html-interview.md`
- [ ] 2. CSS 篇（3118 行，74 个知识点）→ `docs/css-interview.md`
- [ ] 3. JS 篇（8086 行，147 个知识点）→ `docs/js-interview.md`

---

## 每篇处理规则

### 格式清理（每篇通用）

1. 去除所有 `<font style="...">...</font>` 标签，保留标签内文本
2. 去除语雀图片链接 `![](https://cdn.nlark.com/...)` 整行
3. OCR 注释 `<!-- 这是一张图片，ocr 内容为：... -->` 若含有实质技术内容则提取为正文，否则删除
4. 去除作者吐槽性文字（如"这道题给我干懵了"）
5. 清理连续空行（保留最多一个空行）
6. 修正代码块：补全缺失的语言标注，修正未闭合的代码围栏

### 结构整理（每篇通用）

1. 顶层结构：`##` 大主题，`###` 具体考点（问句形式）
2. 合并同一知识点的碎片化章节（源文件中常见同一题目分多处描述）
3. 删除重复段落，但任何技术细节不丢失
4. 面试追问场景（"面试官问..."）有价值的保留，整合进答案

---

## 1. HTML 篇执行细节

源文件：`/Users/zz/Downloads/2024年前端面试---HTML篇.md`

**章节规划**

```
## 文档基础
### DOCTYPE 是什么？有什么作用？
### 严格模式和混杂模式有什么区别？
### HTML5 为什么只需要写 <!DOCTYPE html>？
### meta 标签有哪些常用属性？

## 元素与语义化
### 行内元素和块级元素分别有哪些？有何区别？怎样转换？
### title 与 h1 的区别、b 与 strong 的区别、i 与 em 的区别？
### a 标签除了导航，还有哪些用途？

## 浏览器兼容与标准
### 如何处理 HTML5 新标签的兼容问题？
### Quirks 模式是什么？和 Standards 模式有何区别？
### 浏览器乱码的原因和解决办法？
### 为什么要遵守 Web 标准？
```

**验证命令**

```bash
grep -n "<font" docs/html-interview.md  # 应无输出
grep -n "cdn.nlark.com" docs/html-interview.md  # 应无输出
grep -c "^### " docs/html-interview.md  # 应 ≥ 10
```

---

## 2. CSS 篇执行细节

源文件：`/Users/zz/Downloads/2024年前端面试---CSS篇.md`

**章节规划**

```
## 选择器与优先级
### CSS 选择器有哪些类型？优先级如何计算？
### 哪些 CSS 属性可以被继承？

## 布局
### 垂直居中 / 水平垂直居中有哪些实现方式？
### Flexbox 布局怎么用？常见属性有哪些？
### Grid 布局和 Flex 的区别是什么？
### 圣杯布局和双飞翼布局如何实现？有什么区别？
### position 有哪些值？各有什么区别？
### sticky 粘性布局怎么用？
### display、float、position 三者之间的关系？
### absolute 和 fixed 有什么共同点和不同点？
### 如何脱离标准流？会产生什么影响？

## 盒模型与层叠
### BFC 是什么？如何触发？
### 为什么需要清除浮动？有哪些方法？
### margin 重叠（塌陷）是什么？如何解决？
### 元素的层叠顺序是怎样的？

## 响应式与移动端
### 响应式布局有哪些实现方案？
### rem 实现移动端适配的原理是什么？
### 如何显示小于 10px 的文字？

## 视觉效果与动画
### CSS 动画有哪些方式？了解 GPU 加速吗？
### display:none、visibility:hidden、opacity:0 的区别？
### 为什么用 transform 做位移而不用 top/left？
### 如何用 CSS 画三角形、扇形、自适应正方形？
### 多行文本溢出如何处理？

## 其他
### 伪类和伪元素的区别？
### link 和 @import 的区别？
### flex-basis 是什么？和 width 有什么区别？
### space-between 和 space-around 的区别？
### 标签间空白间隙如何解决？
### img 底部空白缝隙如何解决？
```

**注意**：CSS 篇中"垂直居中"章节与"水平垂直居中"章节有大量重叠，整理时合并为一节。

**验证命令**

```bash
grep -n "<font" docs/css-interview.md  # 应无输出
grep -n "cdn.nlark.com" docs/css-interview.md  # 应无输出
grep -c "^### " docs/css-interview.md  # 应 ≥ 25
```

---

## 3. JS 篇执行细节

源文件：`/Users/zz/Downloads/2024年前端面试---JS篇.md`

**章节规划（按主题分组）**

```
## 面向对象与设计模式
## 数据类型
## 数组与对象操作
## ES6+ 新特性
## 异步与事件循环
## 作用域、闭包与 this
## 原型与继承
## 内存管理与垃圾回收
## 模块化
## 浏览器与 DOM
## 网络与存储
## 性能优化
## 其他（正则、Web Worker 等）
## Vue 相关（混入 JS 篇）
```

**需要合并的碎片章节（已识别）**

| 合并后标题 | 源标题（碎片） |
|---|---|
| `### 类型检测有哪些方法？各有什么优缺点？` | `### 类型检测方法` + `### 检测数据类型的工具函数` |
| `### for、for...in、for...of、forEach 有什么区别？` | 多处分散描述 |
| `### 什么是事件循环？` | `### Event loop事件循环机制` + `### 事件循环` + `### 解释 JavaScript 的单线程模型` |
| `### 什么是深拷贝和浅拷贝？` | `### 对深拷贝和浅拷贝的理解` + `### 数据类型存储以及堆栈内存是什么？` |
| `### 迭代器和生成器是什么？` | `### 迭代器和生成器` + `### 5.1 迭代器对象` + `### 5.2 可迭代对象` + `### 5.3 生成器函数` 等多节 |

**验证命令**

```bash
grep -n "<font" docs/js-interview.md  # 应无输出
grep -n "cdn.nlark.com" docs/js-interview.md  # 应无输出
grep -c "^### " docs/js-interview.md  # 应 ≥ 60
grep -n "^## Vue 相关" docs/js-interview.md  # 应存在
```

---

## 全局验收

```bash
# 检查三个文件都存在
ls docs/js-interview.md docs/css-interview.md docs/html-interview.md

# 检查无残留 HTML 标签
grep -rn "<font\|</font\|<style" docs/js-interview.md docs/css-interview.md docs/html-interview.md

# 检查代码块语言标注（找没有语言标注的代码块）
grep -n "^\`\`\`$" docs/js-interview.md docs/css-interview.md docs/html-interview.md
```

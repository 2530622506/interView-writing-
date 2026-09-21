# HTML 面试题整理

## 文档基础

### DOCTYPE 是什么？有什么作用？

DOCTYPE（Document Type Declaration，文档类型声明）是 HTML 文档的第一行，用来告诉浏览器当前文档使用哪个 HTML 版本，从而决定用什么规则来解析页面。

HTML5 的写法：

```html
<!DOCTYPE html>
```

不写 DOCTYPE 的后果：浏览器会进入**混杂模式**（Quirks Mode），用自己的方式解析渲染页面，不同浏览器行为不一致，出现样式错乱。写了之后浏览器进入**标准模式**，按 W3C 规范统一渲染。

可以通过 `document.compatMode` 查看当前模式：
- `CSS1Compat`：标准模式
- `BackCompat`：混杂模式

### 严格模式和混杂模式有什么区别？

- **严格模式（Standards Mode）**：浏览器按 W3C 标准解析渲染，各浏览器行为一致。
- **混杂模式（Quirks Mode）**：浏览器用自己的怪异方式解析，模拟老式浏览器行为，主要为兼容老网站。

常见的具体区别：

| 特性 | 标准模式 | 混杂模式（IE） |
|---|---|---|
| 盒模型 | width/height 只算内容区 | width/height 包含 padding 和 border |
| 行内元素设置宽高 | 无效 | 有效 |
| `margin: 0 auto` 水平居中 | 有效 | 无效 |
| 百分比高度 | 父元素无高度则子元素百分比高无效 | 宽松处理 |

混杂模式是历史遗留产物，现代开发只需要写上 `<!DOCTYPE html>` 即可避免。

### HTML5 为什么只需要写 `<!DOCTYPE html>`？

HTML4 时代的声明很长：

```html
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
```

原因：HTML4 基于 SGML（标准通用标记语言），需要引用 DTD（文档类型定义）来规定语法规则。

HTML5 不基于 SGML，不需要引用 DTD，所以声明大幅简化为 `<!DOCTYPE html>`。

HTML5 也没有严格模式和混杂模式的区分，实现时尽量向后兼容。

### meta 标签有哪些常用属性？

meta 标签放在 `<head>` 中，用于传达页面级元数据，不直接显示在页面上。

**name 属性系列**（`name` 和 `content` 配合使用）：

```html
<!-- 作者 -->
<meta name="author" content="张三">

<!-- 页面描述，显示在搜索引擎结果中 -->
<meta name="description" content="这是一个前端学习网站">

<!-- 搜索引擎关键词 -->
<meta name="keywords" content="前端,HTML,CSS,JavaScript">

<!-- 移动端视口设置 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- 控制爬虫行为：all/none/index/follow -->
<meta name="robots" content="index,follow">

<!-- 指定双核浏览器（如 360）使用 webkit 内核 -->
<meta name="renderer" content="webkit">
```

**http-equiv 属性系列**（相当于 HTTP 响应头）：

```html
<!-- IE 兼容性：使用最新渲染模式 -->
<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">

<!-- 字符集声明（旧写法，HTML5 推荐用 charset） -->
<meta http-equiv="content-type" content="text/html; charset=utf-8">

<!-- 开启 a 标签的 DNS 预解析（https 下默认关闭） -->
<meta http-equiv="x-dns-prefetch-control" content="on">
```

**charset 属性**：

```html
<!-- HTML5 推荐写法，声明字符编码 -->
<meta charset="UTF-8">
```

---

## 元素与语义化

### 行内元素和块级元素分别有哪些？有何区别？怎样转换？

**常见块级元素**：`div`、`h1-h6`、`p`、`ul`、`ol`、`li`、`form`、`table`、`header`、`footer`、`aside`、`section`

**常见行内元素**：`span`、`a`、`strong`、`em`、`i`、`b`、`label`、`q`

**行内块元素**：`img`、`input`、`td`（可设置宽高，但在同一行内显示）

**区别对比**：

| 特性 | 块级元素 | 行内元素 |
|---|---|---|
| 排列方式 | 独占一行，从上到下 | 在一行内从左到右排列 |
| 宽度 | 默认 100% 父元素宽度 | 由内容撑开 |
| 宽高设置 | 可以设置 | width/height 无效 |
| margin/padding | 上下左右均有效 | 上下 margin 无效，上下 padding 在视觉上有效但不影响布局 |
| 嵌套规则 | 可包含行内元素和块级元素 | 只能包含文本或其他行内元素 |

**转换方式**：用 `display` 属性切换：

```css
display: block;        /* 转为块级 */
display: inline;       /* 转为行内 */
display: inline-block; /* 行内块，既可设宽高，又在同行显示 */
```

#### 为什么 `img` 是行内元素却可以设置宽高？——替换元素（Replaced Element）

`img`、`input`、`video`、`iframe` 等是**替换元素**：它们的内容由外部资源决定，浏览器用外部内容"替换"掉该元素占位。替换元素天然具有固有尺寸（intrinsic size），因此可以设置 `width`/`height`，行为更接近 `inline-block`。

常见替换元素：`img`、`input`、`video`、`audio`、`canvas`、`iframe`、`embed`、`object`

这也解释了为什么 `img` 底部会有空白缝隙——它作为行内元素按**基线（baseline）**对齐，而基线下方留有字母下行区域（如 g、y 的尾巴）。

```css
/* 消除 img 底部空白缝隙 */
img { display: block; }
/* 或 */
img { vertical-align: bottom; }
```

### title 与 h1 的区别、b 与 strong 的区别、i 与 em 的区别？

**title 与 h1**：
- `<title>` 是页面标题，只出现在浏览器标签栏，对 SEO 影响大，页面只有一个
- `<h1>` 是页面内容的主标题，显示在页面中，层次明确，搜索引擎对其权重较高

**b 与 strong**：
- `<b>` 只是视觉上加粗，没有语义
- `<strong>` 有**加重语气**的语义，搜索引擎更重视它；两者显示效果相同，但语义不同

**i 与 em**：
- `<i>` 只是视觉上斜体，没有语义
- `<em>` 表示**强调**，是有语义的斜体；屏幕阅读器会以不同语气朗读 `<em>` 内的内容

原则：优先使用有语义的标签（`strong`、`em`），有利于 SEO 和无障碍访问。

### a 标签除了导航，还有哪些用途？

```html
<!-- 1. 锚点：点击跳转到页面某个位置 -->
<a href="#section1">跳到第一节</a>
<div id="section1">...</div>

<!-- 2. 下载文件 -->
<a href="/files/report.pdf" download>下载报告</a>

<!-- 3. 打电话 -->
<a href="tel:10086">拨打客服</a>

<!-- 4. 发短信 -->
<a href="sms:10086">发送短信</a>

<!-- 5. 发邮件 -->
<a href="mailto:hello@example.com">发送邮件</a>
```

下载原理：当 `href` 指向浏览器无法解析的资源时，浏览器会自动下载该文件；加上 `download` 属性可以强制下载并指定文件名。

### src 和 href 有什么区别？

- **src**（source，来源）：用于 `img`、`video`、`audio`、`script` 等元素，将外部资源**嵌入**当前文档。浏览器解析到含 `src` 的标签时会**暂停解析**，等资源加载完再继续——这就是为什么 `<script>` 要放在 `</body>` 前面。
- **href**（hyper reference，超链接）：用于 `a`、`link` 等元素，指向**外部资源**，浏览器会**并行下载**，不阻塞当前文档解析。

简单记忆：src 是"我要把它放进来"，href 是"我要链接到那里"。

### 什么是 HTML 语义化？有什么好处？

语义化就是用**正确的标签做正确的事**，让标签本身传达内容的含义，而不只是用 `div` 堆砌一切。

常用语义化标签：

```html
<header>   <!-- 页面或区块的头部 -->
<nav>      <!-- 导航链接区域 -->
<main>     <!-- 页面主内容，一个页面只有一个 -->
<article>  <!-- 独立的内容块，可独立分发（如文章、评论、帖子） -->
<section>  <!-- 有主题的内容区，通常配 h2/h3 标题 -->
<aside>    <!-- 侧边栏或辅助内容，与主内容相关但可独立 -->
<footer>   <!-- 页面或区块的底部 -->
<figure>   <!-- 独立的图像/代码块等媒体内容 -->
<figcaption> <!-- figure 的标题/说明 -->
```

**`article` vs `section` vs `div` 的选择**：
- `article`：能独立分发的内容（删掉它放到别的页面也能看懂）——博客文章、新闻、用户评论
- `section`：有主题的分组，通常需要配一个标题——章节、功能区块
- `div`：纯粹的布局容器，没有任何语义含义

好处：

1. **无 CSS 时页面仍然清晰**，标签本身传达内容结构
2. **SEO 友好**：搜索引擎按标签语义分配权重。`<h1>` 内的词比 `<div>` 内的词重要，`<strong>` 比普通 `<span>` 更受重视
3. **无障碍访问**：屏幕阅读器（如 JAWS、NVDA）依赖语义标签导航——`<nav>` 让用户跳过导航直达内容，`<main>` 让用户直接定位到主区域
4. **团队协作**：语义清晰的 HTML 比 `div.nav`、`div.header` 可读性高，维护成本低

**追问：W3C 和 WHATWG 是什么关系？HTML 现在由谁维护？**

W3C（万维网联盟）是制定 Web 标准的组织，HTML5 最初由其与 WHATWG 共同推进。WHATWG（Web Hypertext Application Technology Working Group）由浏览器厂商（Google、Apple、Mozilla、微软）主导，维护**HTML Living Standard**——一个持续更新的"活标准"，没有版本号。

2019 年 W3C 和 WHATWG 签署协议，HTML 标准统一由 WHATWG 的 Living Standard 为准，W3C 不再发布独立的 HTML 版本。所以现在说的"HTML5"实际上是指这个持续更新的 Living Standard。

---

## HTML5 新特性

### HTML5 新增了哪些特性？移除了哪些元素？

**新增主要特性**：

1. **语义化标签**：`article`、`footer`、`header`、`nav`、`section`、`aside` 等

2. **媒体元素**：

```html
<!-- 音频 -->
<audio src="audio.mp3" controls autoplay loop></audio>

<!-- 视频，source 解决兼容性 -->
<video poster="cover.jpg" controls>
  <source src="video.mp4" type="video/mp4">
  <source src="video.webm" type="video/webm">
</video>
```

3. **Canvas 画布**：通过 JavaScript 绘制 2D 图形

```html
<canvas id="myCanvas" width="500" height="500"></canvas>
```

```javascript
const canvas = document.getElementById('myCanvas')
const ctx = canvas.getContext('2d')
ctx.fillStyle = 'red'
ctx.fillRect(10, 10, 100, 100)
```

4. **新表单类型**：`email`、`url`、`number`、`search`、`range`、`color`、`date`、`time` 等

5. **新表单属性**：`placeholder`、`autofocus`、`autocomplete`、`required`、`pattern`、`multiple`

6. **本地存储**：`localStorage`（永久）、`sessionStorage`（会话级）

7. **其他**：Geolocation 地理定位、拖放 API（`draggable`）、WebSocket、History API（`pushState`/`replaceState`）

8. **DOM 查询新增**：
```javascript
document.querySelector('.box')
document.querySelectorAll('li')
```

9. **Web Workers**：在独立线程运行 JS，不阻塞主线程，适合 CPU 密集型计算

10. **`<template>` 标签**：定义不立即渲染的 HTML 模板，是 Vue/React 等框架组件模板的 HTML 基础

**移除的元素**：
- 纯表现性标签（功能由 CSS 替代）：`basefont`、`font`、`s`、`strike`、`tt`、`u`、`big`、`center`
- 影响无障碍的框架标签：`frame`、`frameset`、`noframes`

---

### 响应式图片怎么做？`<picture>` 和 `srcset` 有什么用？

普通的 `<img src="...">` 在所有设备上加载同一张图，既浪费流量（移动端加载了大图），也可能显示效果差（高清屏看低分辨率图）。

**`srcset` + `sizes`（同一图片的不同分辨率版本）**：

```html
<img
  src="photo-800.jpg"
  srcset="
    photo-400.jpg  400w,
    photo-800.jpg  800w,
    photo-1600.jpg 1600w
  "
  sizes="
    (max-width: 600px) 100vw,
    (max-width: 1200px) 50vw,
    800px
  "
  alt="风景图"
/>
```

浏览器根据当前视口宽度和 `sizes` 规则，自动选择最合适的图片源，无需 JS。

**`<picture>`（不同场景用完全不同的图片）**：

```html
<!-- 场景一：根据屏幕尺寸切换不同裁剪比例 -->
<picture>
  <source media="(max-width: 600px)" srcset="photo-square.jpg">
  <source media="(min-width: 601px)" srcset="photo-landscape.jpg">
  <img src="photo-landscape.jpg" alt="风景图">
</picture>

<!-- 场景二：使用现代格式，不支持时降级 -->
<picture>
  <source type="image/avif" srcset="photo.avif">
  <source type="image/webp" srcset="photo.webp">
  <img src="photo.jpg" alt="风景图">  <!-- 最终降级 -->
</picture>
```

`<picture>` 里必须有 `<img>` 作为最终降级，且 `alt` 写在 `<img>` 上。

**`srcset` vs `<picture>` 的区别**：
- `srcset`：同一图片的不同分辨率版本，让浏览器自动选最优，**浏览器有选择权**
- `<picture>`：完全不同的图片，你用 `media` / `type` 精确控制哪种情况用哪张，**开发者有控制权**

### Canvas 和 SVG 有什么区别？

| 特性 | Canvas | SVG |
|---|---|---|
| 渲染方式 | 逐像素渲染，位图 | 基于 XML 的矢量图 |
| 分辨率 | 依赖分辨率，放大会失真 | 不依赖分辨率，无限放大不失真 |
| 事件支持 | 不支持事件（整个 canvas 是一个元素） | 每个图形元素都可绑定事件 |
| DOM 操作 | 不支持 | 支持，每个图形在 DOM 中 |
| 性能 | 适合频繁重绘的场景（游戏） | 适合大渲染区域（地图、图表） |
| 文本渲染 | 较弱 | 较强 |
| 保存格式 | 可导出为 PNG/JPG | 本身就是 XML，可作为文件保存 |

选择建议：
- **游戏、图像密集型应用**：Canvas
- **需要交互的图表、地图、图标**：SVG

---

## 浏览器兼容与标准

### 如何处理 HTML5 新标签的兼容问题？

对于 IE8 及以下不识别 HTML5 新语义标签的问题，有两种方案：

**方案一**：用 JavaScript 手动创建元素让浏览器识别

```javascript
document.createElement('header')
document.createElement('nav')
// 创建后还需要设置 display: block
```

**方案二**：引入 html5shim 库（推荐）

```html
<!--[if lt IE 9]>
  <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
<![endif]-->
```

现代项目中 IE8 已几乎不需要兼容，这两种方案作为了解即可。

### Quirks 模式和 Standards 模式有什么区别？

见上文"严格模式和混杂模式有什么区别"。

### 浏览器乱码的原因和解决办法？

**原因**：
- 页面源码编码（如 GBK）和内容编码（如 UTF-8）不一致
- 数据库存储编码和页面显示编码不一致
- 浏览器未能自动检测到正确编码

**解决办法**：
- HTML 文件保存为 UTF-8 编码，并在 `<head>` 中声明：
```html
<meta charset="UTF-8">
```
- 数据库和后端统一使用 UTF-8
- 如果已出现乱码，在浏览器中手动选择"编码"菜单切换

### 为什么要遵守 Web 标准？

1. **一致性**：各浏览器统一执行 W3C 规范，减少兼容性 bug
2. **团队协作**：统一标准降低沟通和维护成本
3. **跨平台**：标准化代码可在 PC、手机、平板等设备正确显示
4. **降低维护成本**：标准代码可读性高，接手项目时上手快
5. **SEO 友好**：语义正确的 HTML 更易被搜索引擎抓取

# HTML 面试题

## 1. `defer` 和 `async` 的区别，对页面渲染的影响

**定义**

`defer` 和 `async` 都让 `<script>` 异步下载，不阻塞 HTML 解析。区别在于执行时机：

- `defer`：下载完后等 HTML 完全解析完（DOMContentLoaded 触发前）才执行，多个 defer 脚本按顺序执行
- `async`：下载完立即执行，不保证顺序，执行时会暂停 HTML 解析

**执行时序对比**

```
普通 script：  HTML解析 ——[暂停]—— 下载+执行 —— 继续解析HTML
defer：        HTML解析 ══════════════════════ 解析完成 → 执行
                          ↑同时下载
async：        HTML解析 ══════[暂停执行]══════ 继续解析
                          ↑下载完立即执行
```

**核心差异**

| | `defer` | `async` |
|--|---------|---------|
| 下载方式 | 异步并行 | 异步并行 |
| 执行时机 | HTML 解析完成后 | 下载完立即执行 |
| 执行顺序 | 保证按顺序 | 不保证顺序 |
| 是否阻塞解析 | 不阻塞 | 执行时阻塞 |
| DOMContentLoaded | 在其之前执行 | 不一定 |

**使用场景**

- `defer`：有依赖关系的脚本、需要操作 DOM 的业务脚本（如 Vue/React 应用入口）
- `async`：无依赖的独立脚本（埋点、广告、Google Analytics）

**为什么要有这两个属性**

默认 `<script>` 是同步的：浏览器解析到 script 标签时必须停下来下载并执行，才能继续解析 HTML。这导致脚本阻塞页面渲染，用户看到白屏。`defer`/`async` 是浏览器对这个问题的两种异步解决方案，区别在于"能不能等"。

> `defer` 是"等我解析完你再跑"，`async` 是"你下好了就跑，我不管"。有依赖关系用 defer，独立脚本用 async。

---

## 2. `localStorage` / `sessionStorage` / `cookie` / `IndexedDB` 区别

**存储大小**

| | `cookie` | `localStorage` | `sessionStorage` | `IndexedDB` |
|--|---------|----------------|-----------------|-------------|
| 大小限制 | 4KB | 5MB | 5MB | 无实际限制（GB级）|
| 生命周期 | 可设过期时间 | 永久（手动清除）| 标签页关闭即清除 | 永久 |
| 随请求发送 | ✅（自动携带）| ❌ | ❌ | ❌ |
| 跨标签页共享 | ✅ | ✅ | ❌ | ✅ |
| 服务端可访问 | ✅ | ❌ | ❌ | ❌ |
| API 易用性 | 繁琐 | 简单 | 简单 | 复杂（异步）|

**各自的定位**

- **cookie**：设计初衷是服务端通信，携带身份信息（session id、token）。存储用户数据是滥用，安全隐患多（CSRF、XSS）
- **localStorage**：持久化的客户端存储，适合用户偏好、主题、缓存数据
- **sessionStorage**：会话级存储，适合表单草稿、单次流程中间状态（不同标签页数据隔离）
- **IndexedDB**：浏览器内置数据库，支持事务、索引、大量结构化数据，适合离线应用、PWA

**cookie 的重要属性**

```
Set-Cookie: token=xxx; HttpOnly; Secure; SameSite=Strict; Max-Age=86400
```

- `HttpOnly`：JS 无法读取，防 XSS 窃取
- `Secure`：只通过 HTTPS 发送
- `SameSite`：控制跨站携带，防 CSRF（`Strict`/`Lax`/`None`）
- `Max-Age`/`Expires`：过期时间，不设则是会话 cookie

> cookie 是给服务端用的，localStorage/sessionStorage 是给客户端用的，IndexedDB 是客户端数据库。按场景选型，不要用 localStorage 存 token。

---

## 3. 跨标签页通信有哪些方案

**方案一：BroadcastChannel（推荐）**

同源标签页之间广播消息，最简洁：

```js
// 发送方
const bc = new BroadcastChannel('app');
bc.postMessage({ type: 'logout' });

// 接收方
const bc = new BroadcastChannel('app');
bc.onmessage = (e) => console.log(e.data);
```

**方案二：localStorage + storage 事件**

写入 localStorage 时，同源其他标签页会触发 `storage` 事件：

```js
// 发送方
localStorage.setItem('msg', JSON.stringify({ type: 'update', ts: Date.now() }));

// 接收方
window.addEventListener('storage', (e) => {
  if (e.key === 'msg') console.log(JSON.parse(e.newValue));
});
```

注意：当前标签页写入不触发自身的 storage 事件，只触发其他标签页。

**方案三：SharedWorker**

多个标签页共享同一个 Worker 线程，通过它中转消息：

```js
const worker = new SharedWorker('worker.js');
worker.port.postMessage('hello');
worker.port.onmessage = (e) => console.log(e.data);
```

适合需要共享状态的复杂场景，但兼容性略差（Safari 支持较晚）。

**方案四：Service Worker**

Service Worker 可以向所有受控页面广播：

```js
// Service Worker 内
self.clients.matchAll().then(clients => {
  clients.forEach(client => client.postMessage({ type: 'update' }));
});
```

**方案五：window.opener / postMessage**

页面 A 通过 `window.open` 打开页面 B，可以通过 `window.opener` 相互引用：

```js
// 子页面向父页面发消息
window.opener.postMessage('hello', 'https://example.com');
```

**方案六：轮询 + 服务端（跨域场景）**

不同源标签页无法用上述方案，只能通过服务端中转（WebSocket、SSE、轮询）。

**对比选型**

| 方案 | 同源 | 简单度 | 实时性 |
|------|------|--------|--------|
| BroadcastChannel | ✅ | ⭐⭐⭐ | 高 |
| localStorage 事件 | ✅ | ⭐⭐ | 高 |
| SharedWorker | ✅ | ⭐ | 高 |
| WebSocket | 跨域 ✅ | ⭐ | 高 |

> 同源优先用 BroadcastChannel，简单直接；需要兼容旧浏览器用 localStorage + storage 事件；跨域场景走服务端 WebSocket。

---

## 4. `src` 和 `href` 的区别

**本质区别**

- `src`（source）：**替换当前元素**。浏览器遇到 src 时会暂停其他资源下载，下载并执行 src 指向的资源
- `href`（hypertext reference）：**建立关联**。浏览器不会暂停处理，并行下载 href 指向的资源

**为什么 script 用 src 会阻塞**

`<script src="...">` 使用 src，浏览器必须下载并执行完 JS 才能继续解析 HTML。这是因为 JS 可能修改 DOM，必须同步执行。而 `<link href="...">` 加载 CSS 不会阻塞 HTML 解析（但会阻塞渲染）。

**常见用法对比**

| 标签 | 属性 | 说明 |
|------|------|------|
| `<script>` | `src` | 引入并执行 JS，阻塞解析 |
| `<img>` | `src` | 嵌入图片，替换元素位置 |
| `<iframe>` | `src` | 嵌入另一页面 |
| `<link>` | `href` | 关联 CSS，不阻塞解析 |
| `<a>` | `href` | 超链接跳转 |

> src 是"把它嵌进来"，会暂停解析；href 是"跟它建立联系"，不暂停。所以 CSS 用 link+href 不阻塞，JS 用 script+src 会阻塞。

---

## 5. HTML 语义化的意义，常用语义化标签

**什么是语义化**

用正确含义的 HTML 标签描述内容，而不是一切都用 `<div>` + class 堆砌。

**为什么重要**

- **SEO**：搜索引擎爬虫通过标签理解页面结构和权重，`<h1>` 比 `<div class="title">` 权重高
- **可访问性**：屏幕阅读器（盲人辅助工具）依赖语义标签理解页面结构，`<nav>` 让它知道这是导航区
- **可维护性**：代码可读性更高，团队协作时不需要靠猜 class 名理解结构
- **浏览器默认样式**：语义标签自带合理的浏览器默认样式和行为（如 `<button>` 天然支持键盘 Enter 触发）

**常用语义化标签**

```
页面结构：
<header>    页眉/区块头部
<nav>       导航栏
<main>      页面主内容（每页唯一）
<aside>     侧边栏/补充内容
<footer>    页脚/区块底部
<section>   独立的主题区块
<article>   独立的完整内容（博客文章、评论）

内容语义：
<h1>~<h6>   标题层级
<p>         段落
<ul><ol><li> 列表
<figure>    图文组合
<figcaption> 图片说明
<time>      时间（机器可读）
<address>   联系信息
<mark>      高亮/标记
<strong>    重要内容（加粗）
<em>        强调内容（斜体）
```

**`<article>` vs `<section>` 的区别**

- `<article>`：可以独立存在、独立传播的内容（一篇文章、一条评论），拿出来放到其他地方仍然有意义
- `<section>`：页面的一个主题区块，与上下文相关，不能独立存在

> 语义化不是给人看的，是给机器看的——搜索引擎、屏幕阅读器、浏览器都依赖标签语义理解页面。能用语义标签就不用 div。

---

## 6. 浏览器从输入 URL 到页面渲染发生了什么

**完整流程**

```
1. URL 解析
   ↓
2. DNS 解析（域名 → IP）
   ↓
3. 建立 TCP 连接（三次握手）
   ↓
4. TLS 握手（HTTPS）
   ↓
5. 发送 HTTP 请求
   ↓
6. 服务器处理并返回响应
   ↓
7. 浏览器解析 HTML，构建 DOM 树
   ↓
8. 解析 CSS，构建 CSSOM 树
   ↓
9. 合并 DOM + CSSOM → Render Tree（渲染树---只含可见节点，display:none 被排除）
   ↓
10. Layout（布局/回流）：计算每个节点的位置和大小
    ↓
11. Paint（绘制）：将节点按图层绘制为像素
    ↓
12. Composite（合成）：多图层由 GPU 合并，显示到屏幕
```

**各阶段深度说明**

- **DNS 解析**：先查浏览器缓存 → 操作系统缓存 → hosts 文件 → 本地 DNS 服务器 → 根域名服务器递归查询
- **TCP 三次握手**：SYN → SYN+ACK → ACK，建立可靠连接
- **HTML 解析**：遇到 `<script>` 暂停解析（除非 defer/async），遇到 CSS 不暂停解析但暂停渲染
- **渲染树**：只包含可见节点，`display:none` 的节点不在渲染树里，`visibility:hidden` 在
- **Layout**：计算几何信息（位置、大小），CSS 改变触发 Layout 代价最高
- **Composite**：GPU 加速的层（`transform`、`opacity`、`will-change`）跳过 Layout 和 Paint，直接合成，性能最好

**关键细节**

- CSS 不阻塞 DOM 解析，但阻塞渲染（Render Tree 需要 CSSOM）
- 普通 <script> 阻塞 DOM 解析（需等脚本下载 + 执行完毕）
- display: none 的元素不进入 Render Tree，但仍在 DOM 中
- visibility: hidden 的元素进入 Render Tree，只是不可见

**性能优化关键点**

- DNS 预解析：`<link rel="dns-prefetch" href="//cdn.example.com">`
- 减少重排：批量修改 DOM，使用 `transform` 代替 `top/left`
- 关键资源预加载：`<link rel="preload">`
- HTTP/2 多路复用减少 TCP 连接数

> URL 到渲染经历：DNS解析 → TCP连接 → HTTP请求/响应 → HTML解析建DOM → CSS解析建CSSOM → 合并渲染树 → Layout → Paint → Composite。每一步都是性能优化的切入点。

为什么把 <script> 放 </body> 前？
→ 避免阻塞 DOM 解析，让用户尽早看到页面内容，同时脚本执行时 DOM 已存在，无需等 DOMContentLoaded。

![image-20261107212816181](/Users/zz/Library/Application Support/typora-user-images/image-20261107212816181.png)

---

## 7. `meta` 标签常用属性，viewport 怎么配置

**常用 meta 标签**

```html
<!-- 字符编码，必须放在 <head> 最前面 -->
<meta charset="UTF-8">

<!-- 移动端视口配置 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- SEO：页面描述（搜索引擎摘要）-->
<meta name="description" content="页面描述，建议 150 字以内">

<!-- SEO：关键词（现代搜索引擎基本忽略）-->
<meta name="keywords" content="关键词1,关键词2">

<!-- 禁止搜索引擎索引 -->
<meta name="robots" content="noindex,nofollow">

<!-- IE 兼容模式，使用最新渲染引擎 -->
<meta http-equiv="X-UA-Compatible" content="IE=edge">

<!-- 禁止自动识别电话号码（移动端）-->
<meta name="format-detection" content="telephone=no">

<!-- Open Graph：社交分享时的标题/图片 -->
<meta property="og:title" content="页面标题">
<meta property="og:image" content="https://example.com/image.jpg">
```

**viewport 详解**

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

各属性含义：

| 属性 | 说明 |
|------|------|
| `width=device-width` | 视口宽度等于设备宽度（不设则默认 980px，内容会缩小）|
| `initial-scale=1.0` | 初始缩放比例为 1，不放大不缩小 |
| `maximum-scale=1.0` | 最大缩放比例（禁止放大）|
| `user-scalable=no` | 禁止用户手动缩放（注意：影响可访问性，不推荐）|

**为什么移动端要配置 viewport**

不配置时，移动浏览器默认将视口设为 980px 再缩放到屏幕宽度，导致内容很小。设置 `width=device-width` 后，CSS 的 `100vw` 才真正等于屏幕宽度，媒体查询才能按预期工作。

> `meta charset` 和 `meta viewport` 是每个 HTML 文档的必配项，前者防乱码，后者防移动端内容缩小。

---

## 8. `preload` 和 `prefetch` 的区别

**定义**

两者都是资源提示（Resource Hints），告诉浏览器提前下载资源，但优先级和时机不同：

- `preload`：**当前页面**会用到的关键资源，立即高优先级下载
- `prefetch`：**未来页面**可能用到的资源，空闲时低优先级下载

**使用方式**

```html
<!-- preload：当前页面的关键字体，提前下载防止 FOIT -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>

<!-- preload：首屏关键图片 -->
<link rel="preload" href="hero.jpg" as="image">

<!-- prefetch：下一页可能用到的脚本 -->
<link rel="prefetch" href="/next-page.js">
```

**`as` 属性的作用**

`as` 告诉浏览器资源类型，使其设置正确的请求头（Accept）、优先级、CSP 策略。不写 `as` 会导致资源被下载两次（一次 preload、一次实际使用时再请求）。

**对比**

| | `preload` | `prefetch` |
|--|-----------|------------|
| 优先级 | 高（与页面关键资源同级）| 低（空闲时）|
| 使用时机 | 当前页面立即需要 | 未来导航可能需要 |
| 不使用会有警告 | ✅（Chrome 控制台警告）| ❌ |
| 适用场景 | 字体、首屏图片、关键 CSS | 下一页的 JS/CSS |

**常见误区**

- `preload` 只是下载，不执行。JS 文件 preload 后还需要 `<script src>` 才会执行
- 字体 preload 必须加 `crossorigin`，否则会下载两次（字体请求默认匿名跨域）

> `preload` 是"我现在要用，先下"；`prefetch` 是"我以后可能要用，有空下"。preload 影响当前页性能，prefetch 优化未来页加载速度。

---

## 9. `iframe` 的缺点，什么场景下用

**缺点**

- **阻塞父页面 onload**：iframe 加载完成前，父页面的 `onload` 事件不会触发，影响页面加载指标
- **SEO 不友好**：搜索引擎爬虫不抓取 iframe 内容，或权重极低
- **样式隔离是双刃剑**：iframe 内外样式完全隔离，跨域时无法控制 iframe 内部样式和尺寸，自适应高度困难
- **跨域通信复杂**：父子页面跨域时只能通过 `postMessage`，调试困难
- **安全问题**：点击劫持（Clickjacking）攻击常用 iframe，需要设置 `X-Frame-Options: SAMEORIGIN` 防护
- **性能开销**：每个 iframe 都是独立的浏览上下文，有独立的 JS 运行环境、内存占用较高

**防点击劫持**

```html
<!-- 服务端响应头：禁止被 iframe 嵌入 -->
X-Frame-Options: SAMEORIGIN

<!-- 或 CSP -->
Content-Security-Policy: frame-ancestors 'self'
```

**合理使用场景**

- **第三方内容隔离**：嵌入地图（Google Maps）、支付组件、广告、视频播放器——用 iframe 隔离第三方代码，防止污染主页面
- **微前端架构**：老项目改造时，用 iframe 隔离不同技术栈的子应用（qiankun 的 iframe 模式）
- **沙箱环境**：在线代码编辑器（CodeSandbox、JSFiddle）用 iframe 运行用户代码，防止恶意代码影响主页面
- **打印**：通过 iframe 实现局部打印

> iframe 缺点多（阻塞 onload、SEO 差、通信复杂），但"隔离"能力是它的核心价值。第三方内容、沙箱运行、微前端是合理场景。

---

## 10. Web Worker 是什么，解决了什么问题

**定义**

Web Worker 是浏览器提供的多线程能力，允许在主线程之外创建独立线程执行 JS，两者通过消息传递通信。

**解决的问题**

JS 是单线程的，耗时的计算（大数据处理、图像处理、加密解密）会阻塞主线程，导致页面卡顿无响应（掉帧）。Web Worker 把这些计算移到独立线程，主线程保持流畅。

**基本使用**

```js
// main.js（主线程）
const worker = new Worker('worker.js');

worker.postMessage({ data: largeArray });  // 发消息给 Worker

worker.onmessage = (e) => {
  console.log('结果：', e.data);  // 接收 Worker 返回的结果
};

// worker.js（Worker 线程）
self.onmessage = (e) => {
  const result = heavyComputation(e.data);  // 耗时计算
  self.postMessage(result);  // 把结果发回主线程
};
```

**限制**

- 无法访问 DOM（没有 `document`、`window`）
- 无法访问 `localStorage`（可以用 `IndexedDB`）
- 与主线程通信是**拷贝传值**（结构化克隆），大数据传递开销大（可用 `Transferable` 对象零拷贝转移所有权）

**零拷贝传输（Transferable）**

```js
const buffer = new ArrayBuffer(1024 * 1024);  // 1MB
// 转移所有权，主线程不再拥有 buffer，性能好
worker.postMessage(buffer, [buffer]);
```

**种类**

| 类型 | 说明 |
|------|------|
| Dedicated Worker | 专属于一个页面，页面关闭即销毁 |
| Shared Worker | 多个页面共享同一个 Worker（可用于跨标签页通信）|
| Service Worker | 拦截网络请求，实现离线缓存（PWA 核心）|

> Web Worker 把耗时计算移出主线程，解决 JS 单线程的计算阻塞问题。代价是无法操作 DOM，与主线程通信靠消息传递。Service Worker 是特殊的 Worker，专门做网络代理和离线缓存。

---

## 8. 从拿到 HTML 开始，浏览器渲染侧做了哪些事？`DOMContentLoaded` 和 `load` 事件分别在哪个时机触发？

**完整渲染流水线**

```
HTML 下载
    ↓
解析 HTML → 构建 DOM 树
    ↓（遇到 CSS 并行下载，遇到 script 阻塞）
解析 CSS → 构建 CSSOM 树
    ↓
DOM + CSSOM → Render Tree（只含可见节点，display:none 被排除）
    ↓
Layout（布局/回流）：计算每个节点的位置和尺寸
    ↓
Paint（绘制）：将节点按图层绘制为像素
    ↓
Composite（合成）：多图层由 GPU 合并，上屏显示
```

**关键细节**

- CSS 不阻塞 DOM 解析，但阻塞渲染（Render Tree 需要 CSSOM）
- 普通 `<script>` 阻塞 DOM 解析（需等脚本下载 + 执行完毕）
- `display: none` 的元素不进入 Render Tree，但仍在 DOM 中
- `visibility: hidden` 的元素进入 Render Tree，只是不可见

**`DOMContentLoaded` vs `load`**

| 事件 | 触发时机 | 此时状态 |
|------|----------|---------|
| `DOMContentLoaded` | DOM 解析完成 + 同步/defer 脚本执行完毕 | DOM 可操作，图片/字体/样式表可能还在加载 |
| `load` | 页面所有资源加载完成 | 图片、字体、iframe、外部 CSS 全部就绪 |

```js
document.addEventListener('DOMContentLoaded', () => {
  // DOM 可用，可以操作节点
  // 但 img.naturalWidth 可能还是 0（图片未加载完）
});

window.addEventListener('load', () => {
  // 所有资源就绪，图片尺寸可读，字体已渲染
});
```

> 为什么把 `<script>` 放 `</body>` 前：避免阻塞 DOM 解析，让用户尽早看到页面内容，同时脚本执行时 DOM 已存在，无需等 `DOMContentLoaded`。

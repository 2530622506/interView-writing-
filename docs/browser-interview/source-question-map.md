# 原始浏览器面试题去向索引

这份索引回答一个很实际的问题：原文里写得不错的题有没有丢，重复或不准确的内容又是怎么处理的。

- 原始文件：`/Users/zz/Downloads/2024年前端面试---浏览器篇.md`
- 审计时规模：1,868 行，约 92,655 个字符；
- 审计时 SHA-256：`a203763e593e3f94b169a28c5c3a7b55d8e0b97eb09e2f76f1e39aef58c60be5`；
- 原文件保持只读，重构结果全部位于当前目录；
- 原文 34 张 Yuque CDN 外链图未直接搬运，改用 Mermaid 和本地 SVG；
- 原文约 740 处 font 富文本标签残留未保留。

## 1. 状态说明

| 状态 | 含义 |
|---|---|
| 保留 | 原题本身有价值，主线和核心结论继续保留 |
| 合并 | 与其他题重复，合并到一个权威章节，避免多次背同一答案 |
| 重写 | 问题保留，但原答案存在术语、边界、时效或结构问题，重新组织 |
| 补充 | 原文覆盖不足，加入现代浏览器高价值内容 |
| 删除 / 降级 | 与浏览器前端主线弱相关，或内容更适合操作系统专题，只在索引说明 |

## 2. 全局迁移地图

| 原文范围 | 原文主题 | 主要去向 |
|---:|---|---|
| 1～352 | 浏览器缓存、刷新、浏览器指纹 | [缓存](./browser-cache.md)、[存储与安全](./browser-storage-and-security.md) |
| 353～747 | Cookie、Web Storage、Token、localForage、IndexedDB | [存储与安全](./browser-storage-and-security.md) |
| 748～889 | Web Worker、SharedWorker（原文误写）、Service Worker | [Worker 与离线](./browser-workers-and-offline.md) |
| 890～1496 | URL 全流程、网络、TLS、导航、渲染、性能追问 | [网络与导航](./browser-network-navigation.md)为主，交叉到缓存、渲染、进程、性能 |
| 1497～1608 | SSR / CSR、渲染流程、资源阻塞、关键渲染路径 | [渲染流水线](./browser-rendering-pipeline.md)、[性能实践](./browser-performance-practice.md) |
| 1609～1868 | 进程线程、IPC、标签页通信、Service Worker、操作系统偏题 | [进程与 Event Loop](./browser-process-event-loop.md)、[Worker 与离线](./browser-workers-and-offline.md)；偏 OS 内容降级 |

## 3. 缓存区段：1～352 行

| 原题 / 内容 | 行号 | 处理 | 去向与说明 |
|---|---:|---|---|
| 浏览器缓存总述 | 1～51 | 合并、重写 | [缓存决策树](./browser-cache.md#1-先看缓存决策树)。删除多次重复定义，先回答“能否存、是否新鲜、是否验证” |
| 强缓存与协商缓存区别 | 52～156 | 保留、重写 | [强缓存和协商缓存](./browser-cache.md#1-先看缓存决策树)。明确这是中文教学分类，不是规范中的两种存储介质 |
| 启发式缓存 | 157～165 | 保留、补充 | [启发式缓存](./browser-cache.md#23-启发式缓存)。强调不可把估算新鲜期当发布策略 |
| ETag 用途和生成 | 166～184 | 保留、重写 | [ETag 与 Last-Modified](./browser-cache.md#3-etag-与-last-modified)。修正“ETag 一定是哈希”的绝对说法 |
| 如何设置强缓存与协商缓存 | 185～214 | 合并 | [Cache-Control](./browser-cache.md#2-cache-control-到底怎么读)和[发布策略](./browser-cache.md#7-发布策略为什么文件名加哈希比清缓存靠谱) |
| 项目中协商缓存场景 | 215～222 | 保留、扩展 | HTML 验证、API 条件请求、CDN / ETag 一致性都放入缓存专题 |
| 什么场景用强缓存 / 协商缓存 | 223～233 | 合并、重写 | 用“HTML 短缓存或验证 + hash 静态资源长期缓存”替代泛化口诀 |
| Logo 变更后如何让旧强缓存失效 | 234～236 | 保留 | [内容哈希与版本化 URL](./browser-cache.md#7-发布策略为什么文件名加哈希比清缓存靠谱) |
| 如何判断同一个请求 | 237～241 | 重写、补充 | 融入缓存键、URL、方法、`Vary`、分区与请求上下文说明，不再简化为只比较 URL |
| 为什么需要浏览器缓存 | 242～252 | 保留、压缩 | 缓存专题开篇与 CDN / 发布场景中体现，不单独堆优势列表 |
| F5、强制刷新、地址栏回车区别 | 253～262 | 保留、重写 | [刷新差异](./browser-cache.md#5-刷新重新加载强制重新加载)。明确浏览器 / 版本差异，以 Network 实测为准 |
| 浏览器指纹 | 263～352 | 重写、迁移 | 放入安全与隐私边界，不再和 HTTP Cache 混写；不提供可直接滥用的跟踪实现 |

### 本区修正点

- 修正 `Expires` 与 `Last-Modified` 的原文拼写错误；
- 不再把 Memory Cache / Disk Cache 等同于强缓存 / 协商缓存；
- 补充 `no-cache` 与 `no-store`、`immutable`、`stale-*`、Cache Storage、BFCache；
- 增加可运行 ETag / 304 实验和 chunk 发布事故处理。

## 4. 存储区段：353～747 行

| 原题 / 内容 | 行号 | 处理 | 去向与说明 |
|---|---:|---|---|
| Cookie、LocalStorage、SessionStorage 区别 | 353～476 | 保留、重写 | [存储能力对比](./browser-storage-and-security.md#1-常用存储能力对比)。容量不写死，加入同步 / 异步、作用域和安全模型 |
| Cookie、Session、Token 区别 | 477～537 | 保留、重写 | [Cookie、Session、Token](./browser-storage-and-security.md#23-cookiesessiontoken-不是同一维度)。按机制、状态和凭证三个维度拆开 |
| localForage 与 LocalStorage | 538～667 | 降级、合并 | 只在 IndexedDB 章节说明 localForage 是封装库，不让库 API 抢占浏览器原生能力主线 |
| Vue 推荐 Pinia 管理 localForage | 668～708 | 删除 / 降级 | 属于特定框架状态管理组合，不是通用浏览器面试核心；避免形成无依据“推荐” |
| Cookie 字段及作用 | 709～724 | 保留、补充 | [Cookie 属性](./browser-storage-and-security.md#21-常见属性)。补齐 SameSite、Secure、HttpOnly、Partitioned 和 Cookie 前缀 |
| 前端存储方式 | 725～731 | 合并 | 统一进能力对比与选型决策树 |
| IndexedDB 特点 | 732～747 | 保留、深化 | [IndexedDB](./browser-storage-and-security.md#4-indexeddb浏览器里的异步事务数据库)。补充事务、升级阻塞和多标签页边界 |

### 本区新增内容

- Cache Storage 与 IndexedDB 的职责差异；
- Storage quota / eviction 不背固定数字；
- Same-Origin Policy、CORS、CSP、XSS、CSRF；
- `__Host-` / `__Secure-` Cookie 前缀；
- CHIPS 与 Storage Partitioning 的实现范围；
- 存储选型 Mermaid 决策树；
- IndexedDB 最小事务示例。

## 5. Worker 区段：748～889 行

| 原题 / 内容 | 行号 | 处理 | 去向与说明 |
|---|---:|---|---|
| Web Worker、SharedWorker、Service Worker 区别（原文术语混写） | 748～889 | 保留、重写 | [Worker 能力对比](./browser-workers-and-offline.md#1-能力对比)。统一使用标准名称 `SharedWorker` |
| Web Worker 使用方式 | 748～889 内 | 保留、深化 | [Web Worker 最小示例](./browser-workers-and-offline.md#21-最小可运行示例)，包含 3 个文件、运行方式和预期现象 |
| SharedWorker | 748～889 内 | 补充 | [SharedWorker](./browser-workers-and-offline.md#4-sharedworker多个页面共享一个执行环境)，补 port 模型和生命周期边界 |
| Service Worker | 748～889 内 | 重写、扩展 | [Service Worker](./browser-workers-and-offline.md#5-service-worker可编程网络代理)，补注册、install、waiting、activate 和请求拦截 |

### 本区新增内容

- structured clone、Transferable、`SharedArrayBuffer` 的边界；
- Service Worker 生命周期 Mermaid；
- Cache First、Network First、Stale While Revalidate 等策略；
- `skipWaiting()` 导致新旧版本撕裂的风险；
- 离线最小工程与升级流程；
- Worker 取消、过期结果丢弃和资源清理。

## 6. URL 全流程区段：890～1496 行

原文这一段主线完整，是本次重构明确保留的核心。处理方式不是缩成“八步口诀”，而是保留链路优势，并补上短路分支和现代协议边界。

| 原题 / 内容 | 行号 | 处理 | 去向与说明 |
|---|---:|---|---|
| 从 URL 输入到页面展现全过程 | 890～904 | **核心保留、深度重写** | [URL 核心题](./browser-network-navigation.md#2-核心题从-url-输入到页面展现)，提供 30 秒、3～5 分钟、高级追问三层答案 |
| 用户输入、搜索关键字、URL 识别 | 905～925 | 保留、补充 | 输入分流、URL 解析、同文档导航、`beforeunload` 边界 |
| 域名解析到 IP | 926～960 | 保留、重写 | [DNS](./browser-network-navigation.md#第三步dns-把主机名解析成可连接地址)，补 IPv6、DoH、SVCB / HTTPS 记录边界，不背固定查找顺序 |
| 查找强制缓存 | 935～940 | 合并、修正顺序 | URL 文中只保留缓存短路节点，权威解释跳转[缓存专题](./browser-cache.md) |
| TCP 队列、建立 TCP 连接 | 961～989 | 保留、重写 | 说明连接复用、HTTP/2、HTTP/3；不假设每次新建 TCP |
| 为什么 TCP 三次握手，两次 / 四次行不行 | 990～1008 | 保留 | [TCP 追问](./browser-network-navigation.md#为什么-tcp-是三次握手)，压缩为能力确认和序列号同步主线 |
| 发送请求、接收响应 | 1009～1022 | 保留、补充 | 增加重定向、Content-Type、安全响应头和流式处理 |
| 协商缓存、ETag 与 Last-Modified | 1023～1041 | 合并、术语修正 | 权威答案迁入[缓存专题](./browser-cache.md#3-etag-与-last-modified) |
| HTTP 拓展知识 | 1042～1059 | 重写 | 现代化为 HTTP/1.1、HTTP/2、HTTP/3 与 QUIC 对比 |
| 关闭 TCP、四次挥手、2MSL | 1060～1106 | 降级、修正 | 保留为追问，但强调连接通常复用，HTTP/3 不走 TCP 四次挥手 |
| 提交文档阶段 | 1107～1120 | 保留、深化 | [导航提交](./browser-network-navigation.md#第六步提交导航)，补 Browser process、Renderer、Site Isolation 和 IPC 边界 |
| 浏览器渲染阶段 | 1121～1169 | 合并 | URL 专题保留摘要，完整内容迁入[渲染流水线](./browser-rendering-pipeline.md) |
| 页面渲染阻塞、问题与方案 | 1170～1197 | 重写 | [CSS 与 JavaScript 阻塞关系](./browser-rendering-pipeline.md#4-css-和-javascript-到底阻塞什么) |
| TLS 握手 | 1198～1221 | 保留、重写 | [TLS](./browser-network-navigation.md#tls-做了什么)。不再表述为简单“交换对称密钥” |
| `requestAnimationFrame` 解决卡顿 | 1223～1234 | 重写、纠偏 | [rAF](./browser-process-event-loop.md#7-requestanimationframe-在哪一段)。明确 rAF 只安排时机，不会自动减少工作 |
| `async` / `defer` | 1235～1238 | 保留、深化 | [脚本对比表](./browser-rendering-pipeline.md#43-asyncdefer-与-module)，补 module 和 top-level await 边界 |
| `transform` 动画 | 1239～1246 | 保留、纠偏 | [动画与合成](./browser-rendering-pipeline.md#7-动画为什么优先-transform)，补图层和 GPU 内存成本 |
| CSSOM 是否阻塞 DOM | 1247～1267 | 保留、重写 | 区分 HTML parser、render blocking、脚本等待样式表三个概念 |
| 页面渲染优化 | 1268～1279 | 合并、场景化 | 渲染专题与[性能闭环](./browser-performance-practice.md) |
| 缓存发生在哪个阶段 | 1280～1282 | 重写 | 说明每个 fetch 都可能独立做缓存决策，不是全页面一次检查 |
| DNS 是否解析端口 | 1283～1285 | 保留 | [URL / DNS 边界](./browser-network-navigation.md#3-urlorigin-和-site-别混在一起)：端口来自 URL 或 scheme 默认值 |
| DNS、TCP、HTTP 优化 | 1286～1308 | 重写、现代化 | 预连接、连接复用、HTTP/2 / 3、CDN、压缩、优先级，不再把 keep-alive 简化为前端请求头技巧 |
| 常见 HTTP 请求头 | 1309～1341 | 降级、融合 | 不单独背头字段大全，按缓存、安全、内容协商和 CORS 场景出现 |
| 出题角度汇总 | 1342～1385 | 合并 | 重组到总纲 P0 / P1 / P2 和各专题追问 |
| POST 与 GET 区别 | 1386～1413 | 降级 | 属于 HTTP 基础，保留缓存语义边界，不在浏览器专题重复背“长度 / 安全性”旧口诀 |
| GPU 进程、渲染进程协调和通信 | 1414～1436 | 保留、深化 | [多进程与帧流水线](./browser-process-event-loop.md)，引用本地进程架构 SVG 和帧流水线 SVG |
| 回流、重绘及优化 | 1437～1487 | 保留、重写 | [回流、重绘、合成](./browser-rendering-pipeline.md#6-回流重绘合成怎么回答)，补 forced layout 实验和 DevTools 验证 |
| 原参考资料 | 1488～1496 | 替换 | 每篇使用 WHATWG、W3C、RFC、MDN、Chrome Developers、web.dev 等就近官方资料 |

### URL 核心题新增分支

- 连接池与连接复用；
- Service Worker 和 HTTP Cache 的请求分支；
- HTTP/2 与 HTTP/3 / QUIC；
- 重定向与导航提交边界；
- preload scanner 与流式解析；
- BFCache 直接恢复整页；
- 首屏出现、事件完成和可交互不是同一个时间点；
- Performance Navigation Timing 最小观察代码。

## 7. 渲染区段：1497～1608 行

| 原题 / 内容 | 行号 | 处理 | 去向与说明 |
|---|---:|---|---|
| SSR 与 CSR 区别 | 1497～1507 | 保留、重写 | [SSR 与 CSR](./browser-rendering-pipeline.md#11-ssr-与-csr-放在渲染链里理解)。避免“SSR 一定更快”的绝对结论 |
| 浏览器渲染过程 | 1508～1522 | 保留、深化 | [完整渲染流水线](./browser-rendering-pipeline.md#5-一帧是怎么生成的) |
| 浏览器渲染优化 | 1523～1568 | 合并、场景化 | 布局抖动、合成动画、containment、图片字体和 DevTools 定位 |
| 遇到 JS 文件如何处理 | 1569～1571 | 保留、补充 | 经典脚本、`async`、`defer`、module 对比 |
| 文档预解析 | 1572～1574 | 保留、深化 | [Preload Scanner](./browser-rendering-pipeline.md#preload-scanner-能做什么)，说明能力边界 |
| CSS 如何阻塞文档解析 | 1575～1577 | 重写、纠偏 | CSS 通常不直接阻塞 DOM parser，但会阻塞渲染并可能通过同步脚本间接阻塞 parser |
| 优化关键渲染路径 | 1578～1598 | 保留、扩展 | 关键 CSS、资源优先级、LCP 分解、脚本执行成本 |
| 什么情况阻塞渲染 | 1599～1608 | 合并 | 统一进入资源阻塞关系，不重复罗列 |

## 8. 进程线程区段：1609～1868 行

| 原题 / 内容 | 行号 | 处理 | 去向与说明 |
|---|---:|---|---|
| 进程与线程概念 | 1609～1657 | 保留、压缩 | [进程和线程](./browser-process-event-loop.md#2-进程和线程怎么区别)，放在浏览器上下文解释 |
| 进程与线程区别 | 1658～1664 | 合并 | 不重复操作系统定义，强调地址空间、共享、IPC 和故障边界 |
| 浏览器渲染进程有哪些线程 | 1665～1687 | 保留、重写 | [关键线程](./browser-process-event-loop.md#3-渲染进程里有哪些关键线程)，说明清单不是跨版本固定事实 |
| 进程之间通信方式 | 1688～1723 | 重写、聚焦 | [浏览器 IPC](./browser-process-event-loop.md#9-ipc-怎么理解)。删除与浏览器题关联弱的 IPC 大全 |
| 僵尸进程、孤儿进程 | 1724～1727 | 删除 / 降级 | 操作系统进程管理题，不纳入浏览器主线 |
| 死锁产生与解决 | 1728～1760 | 降级 | 通用并发题；只在 Worker / 共享内存边界提醒同步复杂度 |
| 多标签页通信 | 1761～1768 | 保留、深化 | [标签页通信](./browser-process-event-loop.md#8-标签页之间怎么通信)，对比 BroadcastChannel、storage、Worker、postMessage、服务端 |
| Service Worker 理解 | 1769～1812 | 合并、重写 | 迁入[Worker 与离线](./browser-workers-and-offline.md#5-service-worker可编程网络代理) |
| 多线程、读写一致性、PV 信号量 | 1813～1847 | 删除 / 降级 | 属于通用并发 / 操作系统题；浏览器部分改讲 Worker 消息、Transferable 和 SharedArrayBuffer 边界 |
| 物理地址到逻辑地址 | 1848～1868 | 删除 | 与前端浏览器面试主线无直接关系 |

### 本区新增内容

- Chromium 多进程架构本地图；
- Event Loop、task、microtask、rendering opportunity；
- Promise、timer、rAF 的准确边界；
- microtask starvation 与主动让出主线程；
- Long Task、INP 与主线程竞争；
- 垃圾回收、内存泄漏与证据链；
- 安全的 `postMessage` origin 校验。

## 9. 原文缺失、这次补齐的高价值题

| 新增主题 | 文档 | 为什么补 |
|---|---|---|
| HTTP/2、HTTP/3、QUIC | [网络与导航](./browser-network-navigation.md) | 旧答案只按 TCP + HTTP/1.1 讲完整链路，会对现代连接行为过度绝对化 |
| BFCache | [网络与导航](./browser-network-navigation.md)、[性能实践](./browser-performance-practice.md) | 它会直接短路常规加载链，也是返回体验的重要优化 |
| Event Loop | [进程与 Event Loop](./browser-process-event-loop.md) | 原文几乎缺失，但它连接脚本执行、渲染和交互延迟 |
| module script / top-level await | [渲染流水线](./browser-rendering-pipeline.md) | 只讲 `async` / `defer` 已不足以覆盖现代项目 |
| Cookie SameSite / Partitioned | [存储与安全](./browser-storage-and-security.md) | 登录、嵌入和第三方 Cookie 策略的高频现代边界 |
| CORS、CSP、XSS、CSRF | [存储与安全](./browser-storage-and-security.md) | 存储位置不能脱离威胁模型单独讨论 |
| Storage Partitioning | [存储与安全](./browser-storage-and-security.md) | 第三方嵌入场景已经不能假设跨站共享统一存储 |
| Structured Clone / Transferable | [Worker 与离线](./browser-workers-and-offline.md) | 决定 Worker 通信成本，能解释“为什么多线程不一定更快” |
| Service Worker 更新与版本撕裂 | [Worker 与离线](./browser-workers-and-offline.md) | 只会 Cache First 容易造成线上长期旧资源 |
| LCP、INP、CLS | [性能实践](./browser-performance-practice.md) | 把“性能优化建议”变成用户指标和证据闭环 |
| 内存泄漏定位 | [性能实践](./browser-performance-practice.md) | 补齐长时间运行页面的常见场景题 |

## 10. 主题唯一归属

为了防止 8 篇文档再次变成重复拼接，核心概念只在一个专题完整回答：

| 概念 | 权威专题 | 其他文档怎么处理 |
|---|---|---|
| URL 全流程 | [网络与导航](./browser-network-navigation.md) | 总纲只放 30 秒骨架，渲染 / 缓存细节跳转 |
| HTTP Cache | [缓存](./browser-cache.md) | 网络专题只说请求分支 |
| Cookie / Storage / Web 安全 | [存储与安全](./browser-storage-and-security.md) | Worker 只提醒缓存用户隔离 |
| DOM 到像素 | [渲染流水线](./browser-rendering-pipeline.md) | 网络专题只说导航提交后的摘要 |
| 进程线程 / Event Loop | [进程与 Event Loop](./browser-process-event-loop.md) | 渲染专题只引用 rAF 和主线程时机 |
| Worker / Service Worker | [Worker 与离线](./browser-workers-and-offline.md) | 缓存专题只对比 Cache Storage |
| Web Vitals / 性能诊断 | [性能实践](./browser-performance-practice.md) | 各专题只给与当前机制相关的优化线索 |

## 11. 审计结论

原文最值得保留的是“从 URL 输入到页面展现”的完整意识，以及缓存、渲染、进程线程的题目密度。本次重构保留了这些主干，但做了四件事：

1. 把重复答案合成唯一权威章节；
2. 把缓存位置、CSS 阻塞、Worker 名称、协议版本等不准确表述改正；
3. 用 Event Loop、HTTP/3、BFCache、现代 Cookie、安全和 Web Vitals 补齐 2026 年面试需要的边界；
4. 删除富文本残留、外部图片依赖和偏操作系统题，让复习路线重新围绕浏览器真实链路展开。

# 原题归并映射与纠错记录

> 来源：`2024年前端面试---网络安全、HTTP协议.md`。本页只记录旧题如何迁移，不重复专题答案。

处理方式说明：

- **保留**：主题独立，重写后保留；
- **合并**：与其他重复题合并成一个完整知识节点；
- **拆分**：一道题包含多个主题，分别归入不同章节；
- **纠错**：标题或核心表述存在误导，按正确边界重写；
- **删除**：只有空标题、装饰内容或被完整替代，不再单独成题。

## 1. 59 个原始标题的去向

| 编号 | 原行 | 原题 | 处理 | 新位置 | 说明 |
|---|---:|---|---|---|---|
| Q01 | L1 | TCP UDP 区别 | 保留并纠错 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md)：“TCP 与 UDP” | 删除“UDP 一定更快”等绝对化表述，补充 QUIC 反例 |
| Q02 | L84 | HTTP 和 HTTPS 区别 | 合并 | [05 HTTPS 与 TLS](./05-https-tls-and-certificates.md)：“HTTP 与 HTTPS” | 与“HTTPS 如何保证数据安全”“说下 HTTPS”等重复题合并；更新 TLS 版本基线 |
| Q03 | L111 | HTTP 无状态中的状态是什么 | 保留 | [02 HTTP 语义](./02-http-semantics-and-messages.md)：“HTTP 无状态” | 区分业务持久化、会话状态和协议关联 |
| Q04 | L117 | HTTPS 如何保证数据安全 | 合并 | [05 HTTPS 与 TLS](./05-https-tls-and-certificates.md) | 拆清加密、完整性与认证职责 |
| Q05 | L122 | HTTPS 是否无懈可击 | 保留 | [05 HTTPS 与 TLS](./05-https-tls-and-certificates.md)：“HTTPS 仍挡不住什么” | 补充 XSS、越权、终端与供应链边界 |
| Q06 | L127 | HTTP/2 是什么、如何改进 | 合并 | [04 HTTP 版本](./04-http-versions-and-performance.md)：“HTTP/2” | 纠正“HTTP/2 自带安全性”等模糊表述 |
| Q07 | L132 | 说下 HTTPS | 合并 | [05 HTTPS 与 TLS](./05-https-tls-and-certificates.md) | 作为 HTTPS 总览的一部分 |
| Q08 | L153 | HTTPS 握手过程 | 合并并更新 | [05 HTTPS 与 TLS](./05-https-tls-and-certificates.md)：“TLS 1.3 完整握手” | 不再只讲旧版 RSA 握手 |
| Q09 | L165 | GET 和 POST 区别 | 保留并纠错 | [02 HTTP 语义](./02-http-semantics-and-messages.md)：“GET、POST、PUT” | 删除固定长度、POST 天然加密等伪区别 |
| Q10 | L188 | POST 和 PUT 区别 | 保留 | [02 HTTP 语义](./02-http-semantics-and-messages.md) | 从目标 URI 和幂等语义解释 |
| Q11 | L194 | POST 为什么多发 OPTIONS | 纠错 | [02 HTTP 语义](./02-http-semantics-and-messages.md)与[06 浏览器安全](./06-browser-security-boundaries.md) | 不是 POST 天生多一次，而是 CORS 预检条件触发 |
| Q12 | L205 | HTTP 常见请求方法 | 保留 | [02 HTTP 语义](./02-http-semantics-and-messages.md) | 增加安全、幂等、可缓存三个维度 |
| Q13 | L222 | 队头阻塞 | 保留并拆层 | [04 HTTP 版本](./04-http-versions-and-performance.md)：“队头阻塞发生在哪一层” | 区分 HTTP/1.1 消息层与 TCP 传输层 |
| Q14 | L238 | Connection: keep-alive | 保留 | [02 HTTP 语义](./02-http-semantics-and-messages.md)：“持久连接” | 区分 HTTP keep-alive、TCP keepalive、应用心跳 |
| Q15 | L257 | 常见 HTTP 请求头和响应头 | 重组 | [02 HTTP 语义](./02-http-semantics-and-messages.md) | 按职责分组，不继续堆字段字典 |
| Q16 | L353 | XSS、CSRF、DDoS 原理和避免方式 | 拆分 | [07 Web 攻击](./07-web-attacks-and-defenses.md) | 三种攻击的能力和防线完全不同 |
| Q17 | L429 | 安全沙箱 Sandbox | 保留并扩展 | [06 浏览器安全](./06-browser-security-boundaries.md)：“iframe、sandbox 与 postMessage” | 补充危险权限组合与消息校验 |
| Q18 | L434 | 点击劫持 | 保留 | [07 Web 攻击](./07-web-attacks-and-defenses.md)：“点击劫持” | 使用 CSP `frame-ancestors` 为主线 |
| Q19 | L468 | CDN 劫持 | 保留并扩展 | [07 Web 攻击](./07-web-attacks-and-defenses.md)：“DNS/CDN 劫持” | 增加账户、证书、源站和供应链边界 |
| Q20 | L490 | CSP | 保留并深化 | [06 浏览器安全](./06-browser-security-boundaries.md)：“CSP” | 增加 nonce/hash、Report-Only、`frame-ancestors` |
| Q21 | L498 | 中间人攻击 | 保留 | [05 HTTPS 与 TLS](./05-https-tls-and-certificates.md)：“抵抗中间人攻击” | 明确证书信任被破坏时的例外 |
| Q22 | L514 | HTTP 状态码 | 重组 | [02 HTTP 语义](./02-http-semantics-and-messages.md)：“状态码” | 按类别和工程语义组织 |
| Q23 | L555 | 101 Switching Protocols | 保留 | [02 HTTP 语义](./02-http-semantics-and-messages.md)与[08 实时通信](./08-realtime-communication.md) | 关联经典 WebSocket Upgrade |
| Q24 | L608 | 307、303、302 区别 | 保留并扩展 | [02 HTTP 语义](./02-http-semantics-and-messages.md)：“重定向” | 加入 308 与方法保留规则 |
| Q25 | L625 | 206 Partial Content 场景 | 保留 | [02 HTTP 语义](./02-http-semantics-and-messages.md)：“206” | 补充 Range 和 Content-Range 报文 |
| Q26 | L655 | TCP 三次握手和四次挥手 | 合并 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md) | 与后续握手、挥手相关题归成完整连接生命周期 |
| Q27 | L656 | 建立 TCP 连接 | 合并 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md)：“三次握手” | 删除重复定义 |
| Q28 | L663 | 三次握手建立连接 | 合并 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md) | 保留流程图和序列号主线 |
| Q29 | L679 | 为什么三次不是四次 | 保留 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md) | 从必要确认闭环解释 |
| Q30 | L691 | 三次握手能携带数据吗 | 保留并限定 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md) | 区分普通 ACK 与 TCP Fast Open |
| Q31 | L695 | 空标题 | 删除 | — | 富文本导出产生的无意义标题 |
| Q32 | L708 | 四次挥手关闭连接 | 合并 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md)：“四次挥手” | 强调 TCP 全双工半关闭 |
| Q33 | L748 | 为什么四次挥手 | 保留 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md) | ACK 和 FIN 可在特定条件下合并 |
| Q34 | L755 | 为什么等待 2MSL | 保留并纠错 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md)：“TIME_WAIT” | 不写死所有系统等待秒数 |
| Q35 | L769 | HTTP 三次握手 | 纠错并合并 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md) | 改为 TCP 建连；HTTP/3 不使用 TCP 握手 |
| Q36 | L775 | HTTP 四次挥手 | 纠错并合并 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md) | 改为 TCP 连接关闭 |
| Q37 | L787 | HTTP 1.0、2.0、3.0 区别 | 纠错并扩展 | [04 HTTP 版本](./04-http-versions-and-performance.md) | 加入 HTTP/1.1，统一写作 HTTP/2、HTTP/3 |
| Q38 | L859 | HTTP/2 和 HTTP/1.1 显著不同 | 合并 | [04 HTTP 版本](./04-http-versions-and-performance.md) | 纳入二进制分帧、多路复用和 HPACK |
| Q39 | L884 | 对 HTTP/2 的理解 | 合并并深化 | [04 HTTP 版本](./04-http-versions-and-performance.md) | 补充流量控制、部署现实和剩余问题 |
| Q40 | L952 | HTTP/3 解决什么问题 | 保留并深化 | [04 HTTP 版本](./04-http-versions-and-performance.md)：“HTTP/3 与 QUIC” | 纠正“UDP 所以不可靠” |
| Q41 | L967 | 空标题 | 删除 | — | 富文本导出产生的无意义标题 |
| Q42 | L970 | 对称加密和非对称加密 | 保留并扩展 | [05 HTTPS 与 TLS](./05-https-tls-and-certificates.md)：“四种密码学能力” | 加入哈希、签名和现代密钥交换职责 |
| Q43 | L998 | HTTPS 如何保证安全 | 合并 | [05 HTTPS 与 TLS](./05-https-tls-and-certificates.md) | 与前面的 HTTPS 总览和安全机制题统一 |
| Q44 | L1030 | HTTPS 握手和证书验证 | 合并并更新 | [05 HTTPS 与 TLS](./05-https-tls-and-certificates.md) | 采用 TLS 1.3 主线 |
| Q45 | L1043 | CA 证书可以伪造吗 | 保留 | [05 HTTPS 与 TLS](./05-https-tls-and-certificates.md)：“CA 证书可以伪造吗” | 区分生成证书与获得系统信任 |
| Q46 | L1048 | 如何判断证书合法有效 | 保留 | [05 HTTPS 与 TLS](./05-https-tls-and-certificates.md)：“浏览器验证证书” | 增加 SAN、链、用途、私钥证明和吊销 |
| Q47 | L1053 | 输入 URL 后 HTTP 请求过程 | 保留并扩展 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md)：“输入 URL 后” | 加入缓存、Service Worker、QUIC 和并发复用边界 |
| Q48 | L1058 | OSI 七层、TCP 五层 | 保留并纠错 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md)：“分层地图” | 分层是参考模型，不是自然定律 |
| Q49 | L1083 | TCP/UDP 属于哪一层 | 合并 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md) | 归入传输层定位 |
| Q50 | L1086 | TCP/UDP 优缺点 | 合并 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md)：“TCP 与 UDP” | 从应用承担成本角度重写 |
| Q51 | L1121 | TCP/UDP 使用场合 | 合并 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md) | 增加 DNS、音视频、QUIC 场景 |
| Q52 | L1128 | PPP 属于哪一层 | 保留但降级 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md)：“PPP” | 属于数据链路层，非前端高频重点 |
| Q53 | L1133 | TCP 保证可靠的方法 | 保留 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md)：“可靠传输” | 串起确认、重传、窗口和拥塞控制 |
| Q54 | L1144 | 滑动窗口原理 | 保留 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md) | 区分 `rwnd` 与 `cwnd` |
| Q55 | L1172 | 拥塞控制 | 保留并限定 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md) | 不把 Reno 教材流程说成唯一现代实现 |
| Q56 | L1210 | WebSocket 理解 | 保留并深化 | [08 实时通信](./08-realtime-communication.md)：“WebSocket” | 增加鉴权、心跳、背压、重连和 H2/H3 建连 |
| Q57 | L1259 | 短轮询、长轮询、SSE、WebSocket | 保留并扩展 | [08 实时通信](./08-realtime-communication.md) | 增加 WebTransport 和选型树 |
| Q58 | L1327 | 正向代理和反向代理 | 保留并扩展 | [03 缓存、CDN 与代理](./03-http-cache-cdn-and-proxy.md) | 加入 API Gateway、缓存和安全边界 |
| Q59 | L1343 | HTTP/HTTPS 协议总结 | 拆分并替代 | [知识总纲](./README.md)和全部专题 | 原总结包含重复和过时结论，改为知识地图与专题导航 |

## 2. 新增主题

| 新增主题 | 所在专题 | 增加原因 |
|---|---|---|
| DNS 完整解析链与 DNS 安全 | [01 网络基础](./01-network-foundation-and-request-lifecycle.md) | 原文只在 URL 流程和代理处零散出现 |
| HTTP 方法的安全、幂等、可缓存三维模型 | [02 HTTP 语义](./02-http-semantics-and-messages.md) | 避免 GET/POST 伪区别 |
| `Vary`、`stale-while-revalidate`、Service Worker 双层缓存 | [03 缓存](./03-http-cache-cdn-and-proxy.md) | 中高级前端排查旧资源必须理解 |
| QPACK、ALPN、连接迁移、0-RTT 重放 | [04 HTTP 版本](./04-http-versions-and-performance.md) | 补足 HTTP/3 原理和工程边界 |
| TLS 1.3 当前 RFC 基线、前向保密、会话恢复、HSTS | [05 HTTPS](./05-https-tls-and-certificates.md) | 原文主要停留在旧版握手口诀 |
| Origin/Site 区别、SRI、安全响应头、Cookie 前缀与分区 | [06 浏览器安全](./06-browser-security-boundaries.md) | 补足现代浏览器安全边界 |
| SSRF、开放重定向、文件上传、供应链风险 | [07 Web 攻击](./07-web-attacks-and-defenses.md) | 原文攻击面过于集中在 XSS/CSRF/DDoS |
| 背压、幂等、消息顺序、WebTransport | [08 实时通信](./08-realtime-communication.md) | 从协议区别提升到生产选型 |

## 3. 被纠正的高风险说法

1. “HTTPS 的安全机制严格属于 OSI 传输层”改为描述真实协议栈，不机械归层。
2. “HTTP 三次握手/四次挥手”改为 TCP 连接管理，并说明 HTTP/3 使用 QUIC。
3. “POST 一定比 GET 安全、GET 有统一长度上限”改为语义和实现约束。
4. “POST 会多一次 OPTIONS”改为满足条件的跨源非简单请求触发 CORS 预检。
5. “HTTP/2 支持加密通信，因此天然更安全”改为规范能力与浏览器 TLS 部署现实的区别。
6. “HTTP/3 基于 UDP，所以不可靠”改为 QUIC 在 UDP 上实现可靠传输、拥塞控制和安全。
7. “`no-cache` 表示不缓存”改为可以存储，但复用前必须验证。
8. “HTTPS 可以防所有中间人和 Web 攻击”改为说明信任存储、终端、应用漏洞和供应链边界。
9. “CORS 可以阻止攻击者请求接口”改为浏览器读取边界，服务端仍需鉴权和 CSRF 防御。
10. “HttpOnly 可以防 XSS”改为只能降低 Cookie 被直接读取的风险。

返回：[知识总纲](./README.md)

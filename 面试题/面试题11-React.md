# React 面试题（中大厂 2024–2026 调研版）

---

## 一、Hooks 原理

### Hooks 为什么不能在条件语句或循环中调用？

**参考答案：**

1. **存储结构决定顺序依赖**：React 将每个组件的所有 Hook 调用结果以**单向链表**的形式存储在 Fiber 节点的 `memoizedState` 字段上，链表节点结构为 `{ memoizedState, queue, next }`。

2. **每次渲染按固定顺序读取**：组件每次重渲染时，React 从链表头部开始，按照 Hook 调用顺序依次取出对应节点的数据（state、effect deps 等）。这要求每次渲染 Hook 的调用数量和顺序完全一致。

3. **条件调用导致顺序错乱**：
```jsx
// ❌ 错误示例
function App({ flag }) {
  if (flag) {
    const [a] = useState(0)  // 条件下才调用
  }
  const [b] = useState('')   // 链表位置在 flag=false 时变为第 1 个，错误
}
// flag 从 true 变 false 时，第 2 个 useState 的链表节点
// 被当成第 1 个读取，数据错位
```

4. **React 的规避措施**：React 在开发模式下通过 eslint-plugin-react-hooks 的 `rules-of-hooks` 规则静态检测，并在运行时抛出错误提示。

---

### useState 的 dispatch 触发后，state 在当前执行上下文中为什么还是旧值（闭包陷阱）？

**参考答案：**

1. **闭包捕获机制**：函数组件每次渲染本质上是一次函数调用，当前渲染中的 state 值被该次渲染的闭包捕获。dispatch 只是将新的更新（update）加入 Hook 的更新队列（`queue.pending`），不修改当前闭包已捕获的 state 值。

2. **下次渲染才生效**：React 调度后，下次重新执行组件函数时，才会从 Hook 链表中读取新的 state 值。

3. **典型问题场景**：
```jsx
function Counter() {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    setCount(count + 1)
    console.log(count)  // 仍然是 0，不是 1
    // 因为 count 是当前渲染闭包中的值
  }
}
```

4. **定时器里的闭包陷阱**（大厂高频考法，有完整代码题）：
```jsx
const [count, setCount] = useState(0)

useEffect(() => {
  const timer = setInterval(() => {
    console.log(count)       // 永远打印 0
    setCount(count + 1)      // 永远是 0 + 1，不会递增
  }, 1000)
  return () => clearInterval(timer)
}, [])  // 依赖为空，effect 只执行一次，定时器回调捕获的 count 永远是初始值 0
```
   - 这是闭包陷阱最典型的考法：`useEffect` 依赖为空时只在挂载时执行一次，定时器回调捕获的 `count` 永远是初始值 `0`（闭包快照）

5. **三种修复方案**：
   - **函数式更新**（最优）：`setCount(prev => prev + 1)`，prev 始终是最新值，不依赖闭包
   - **依赖加 count**：`[count]`，effect 在 count 变化时重新执行（副作用：定时器每次 reset）
   - **useRef 保存最新值**：`const countRef = useRef(count); countRef.current = count`，定时器里读 `countRef.current`

6. **其他解决方案**：
   - **useReducer**：将逻辑集中在 reducer 中，避免闭包依赖

---

### useEffect 与 useLayoutEffect 的区别？

**参考答案：**

1. **执行时机不同**：
   - `useEffect`：在浏览器**完成绘制（paint）之后**异步执行，不阻塞渲染
   - `useLayoutEffect`：在 React 完成 DOM 变更后、浏览器**绘制之前**同步执行，会阻塞渲染

2. **执行顺序**：
```
React 更新 DOM → useLayoutEffect 同步执行 → 浏览器绘制 → useEffect 异步执行
```

3. **使用场景**：
   - `useEffect`：绝大多数副作用（数据请求、事件订阅、日志上报等），不需要同步读取 DOM
   - `useLayoutEffect`：需要在绘制前读取/修改 DOM 尺寸或位置，防止闪烁（如 Tooltip 定位、动画初始化）

4. **SSR 注意事项**：`useLayoutEffect` 在服务端（Node.js）没有 DOM，会产生 warning。SSR 场景应用 `useEffect` 替代，或用 `useIsomorphicLayoutEffect`（判断环境选择使用哪个）。

---

### useEffect 的依赖数组是如何比较的？为什么不能放对象/函数作依赖？

**参考答案：**

1. **比较方式**：React 使用 `Object.is`（类似 `===`，但处理了 `NaN` 和 `+0/-0`）对依赖数组中的每个元素进行**浅比较**。

2. **对象/函数的问题**：每次渲染都会创建新的对象/函数引用，`Object.is` 比较引用地址，即使内容相同，结果也是 `false`，导致 effect 每次都执行：
```jsx
// ❌ 每次渲染 options 都是新对象，effect 每次都触发
useEffect(() => {
  fetchData(options)
}, [options])  // options = { page: 1 } 每次都是新引用
```

3. **解决方案**：
   - 用 `useMemo` 稳定对象引用：`const options = useMemo(() => ({ page }), [page])`
   - 将对象的基本类型字段分别放入依赖：`[page, size]`
   - 用 `useCallback` 稳定函数引用
   - 将对象/函数移入 effect 内部（不放依赖数组）

---

### useRef 和 useState 的区别？useRef 的值为什么不触发重渲染？

**参考答案：**

1. **核心区别**：
   - `useState`：值变更会触发组件重渲染，是 React 响应式系统的一部分
   - `useRef`：返回一个**可变的 ref 对象** `{ current: value }`，修改 `current` **不触发重渲染**

2. **原理**：`useRef` 返回的对象在整个组件生命周期中保持同一个引用，React 不追踪 `ref.current` 的变化，因此修改它不会触发重渲染。

3. **适用场景**：
   - 存储定时器 ID、DOM 节点引用、第三方库实例等需要跨渲染保留但不需要触发渲染的值
   - 在 effect/事件中获取最新 state/props（配合 `countRef.current = count` 同步更新）
   - 缓存上一次的值（`usePrevious` 实现）

4. **与普通变量的区别**：普通变量每次渲染重新创建（不跨渲染保留），useRef 的值跨渲染持久存在。

---

### 如何手写一个 usePrevious hook？

**参考答案：**

```jsx
import { useRef, useEffect } from 'react'

function usePrevious(value) {
  const ref = useRef(undefined)

  // effect 在渲染后执行，所以 ref.current 在本次渲染中
  // 仍然是上一次的值，effect 执行后才更新为当前值
  useEffect(() => {
    ref.current = value
  })

  return ref.current  // 返回上一次渲染的值
}

// 使用示例
function Counter() {
  const [count, setCount] = useState(0)
  const prevCount = usePrevious(count)

  return <p>当前: {count}，上次: {prevCount}</p>
}
```

**关键点**：
1. `useEffect` 不传依赖数组，每次渲染后都执行
2. 渲染阶段读取 `ref.current`（旧值），effect 阶段更新 `ref.current`（新值）
3. 因此函数执行期间 `ref.current` 永远比当前 value 滞后一次

---

### 如何手写一个 useDebounce / useThrottle hook？

**参考答案：**

**useDebounce**（值防抖）：
```jsx
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)  // cleanup 取消上次的定时器
  }, [value, delay])

  return debouncedValue
}
```

**useThrottle**（函数节流）：
```jsx
function useThrottle(fn, delay = 300) {
  const lastTime = useRef(0)

  return useCallback((...args) => {
    const now = Date.now()
    if (now - lastTime.current >= delay) {
      lastTime.current = now
      fn(...args)
    }
  }, [fn, delay])
}
```

**关键点**：
- `useDebounce` 利用 cleanup 函数取消上次定时器，value 变化时重新计时
- `useThrottle` 用 `useRef` 存储上次执行时间，避免每次渲染重置

---

### useCallback / useMemo 一定能优化性能吗？什么情况下反而有副作用？

**参考答案：**

1. **不一定能优化**，它们本身有额外开销：
   - 需要分配内存存储缓存值
   - 每次渲染执行依赖数组的浅比较
   - 增加代码复杂度

2. **有效的使用场景**：
   - `React.memo` 包裹的子组件接收函数/对象 prop → 用 `useCallback`/`useMemo` 稳定引用，避免子组件不必要重渲染
   - 昂贵的计算（如大列表过滤、复杂数学运算）→ 用 `useMemo` 缓存结果

3. **反而增加开销的场景**：
   - 子组件没有用 `React.memo`：父组件每次渲染子组件都会重渲染，稳定引用没有意义
   - 计算本身很轻量（如 `count + 1`）：比较开销 > 计算开销
   - 依赖频繁变化：缓存命中率低，等于白做

4. **React Compiler（React 19）的影响**：Compiler 可以自动分析组件并插入 memoization，大多数场景下无需手写。但对于特殊边界情况（Compiler 无法分析的场景）仍需手动优化。

---

### useReducer 和 useState 的区别？什么场景下选 useReducer？

**参考答案：**

1. **本质关系**：`useState` 是 `useReducer` 的简化版，内部实际用 `useReducer` 实现。

2. **核心区别**：

| | useState | useReducer |
|---|---|---|
| 更新方式 | 直接设置新值 | dispatch action，reducer 计算新值 |
| 逻辑位置 | 分散在各事件处理函数 | 集中在 reducer |
| 适合场景 | 独立的简单状态 | 多个状态联动、复杂状态逻辑 |

3. **选 useReducer 的场景**：
   - 多个状态字段相互依赖（如表单 `{ value, error, touched, isSubmitting }`）
   - 状态更新逻辑复杂，有多种 action 类型
   - 需要将状态逻辑从组件中抽离（方便测试）
   - 需要将 dispatch 传递给深层子组件（dispatch 引用稳定，不像 setState 函数）

---

### 如何在 useEffect 中安全地获取最新 state？

**参考答案：**

1. **问题根源**：effect 内部通过闭包捕获了创建时的 state 值，后续 state 更新不会更新闭包中的值。

2. **方案一：useRef 同步最新值**（最通用）
```jsx
const [count, setCount] = useState(0)
const countRef = useRef(count)
countRef.current = count  // 每次渲染同步更新 ref

useEffect(() => {
  const timer = setInterval(() => {
    console.log(countRef.current)  // 始终是最新值
  }, 1000)
  return () => clearInterval(timer)
}, [])  // 依赖数组为空，effect 只执行一次
```

3. **方案二：函数式更新**（适合只需要基于旧值计算）
```jsx
useEffect(() => {
  const timer = setInterval(() => {
    setCount(prev => prev + 1)  // prev 是最新值，不依赖闭包
  }, 1000)
  return () => clearInterval(timer)
}, [])
```

4. **方案三：将 state 加入依赖数组**：effect 在 state 变化时重新执行，闭包获得最新值（需注意 cleanup + 重新注册副作用的开销）。

---

### React 18 自动批量更新（Auto Batching）和 React 17 有何区别？

**参考答案：**

1. **React 17 的批量更新**：只在 React 的**合成事件**和**生命周期钩子**内自动批处理多次 setState，在 setTimeout、Promise、原生事件处理函数中**不批处理**（每次 setState 都触发一次重渲染）：
```jsx
// React 17：在 setTimeout 中，触发 2 次重渲染
setTimeout(() => {
  setCount(c => c + 1)  // 触发渲染
  setFlag(f => !f)       // 再触发渲染
}, 100)
```

2. **React 18 的自动批量更新**：无论在哪里调用多次 setState（setTimeout、Promise、原生事件、fetch 回调等），都会自动批处理，合并为**一次重渲染**：
```jsx
// React 18：只触发 1 次重渲染
setTimeout(() => {
  setCount(c => c + 1)
  setFlag(f => !f)
}, 100)
```

3. **如何退出批处理**：使用 `ReactDOM.flushSync` 强制立即同步渲染：
```jsx
import { flushSync } from 'react-dom'
flushSync(() => setCount(c => c + 1))  // 立即触发渲染
flushSync(() => setFlag(f => !f))       // 再次立即触发渲染
```

4. **使用新版本的前提**：需使用 `ReactDOM.createRoot` 替代 `ReactDOM.render`（legacy mode 不启用此特性）。

---

### useState 的初始值什么时候只执行一次？惰性初始化是什么？

**参考答案：**

1. **初始值只在首次渲染生效**：`useState(initialValue)` 中的 `initialValue` 只在组件**第一次渲染**时使用，后续重渲染直接读取 Hook 链表中存储的当前值，初始值参数被忽略。

2. **问题场景**：如果初始值是一个**耗时计算**，每次渲染都会执行这个计算，但结果只有第一次有用，造成浪费：
```jsx
// ❌ 每次渲染都执行 heavyCompute()，但结果只有首次用到
const [value, setValue] = useState(heavyCompute())
```

3. **惰性初始化（Lazy Initialization）**：传入一个**函数**而非值，React 只在首次渲染时调用该函数：
```jsx
// ✅ heavyCompute 只执行一次
const [value, setValue] = useState(() => heavyCompute())

// 常见场景：从 localStorage 读取初始值
const [theme, setTheme] = useState(() => {
  return localStorage.getItem('theme') ?? 'light'
})
```

4. **原理**：React 内部判断传入的是否为函数，是则调用 `initialState()` 获取值，否则直接用 `initialState`。

---

### useState 的更新是同步还是异步的？

**参考答案：**

1. **高频代码考题**（连续两次 setState 最终加几？）：
```jsx
const [count, setCount] = useState(0)

const handleClick = () => {
  setCount(count + 1)
  setCount(count + 1)
  // 结果：只 +1，不是 +2
  // 两次调用都捕获同一闭包里的旧值 count=0，等价于执行两次 setCount(0 + 1)
}
```
   - 如何让它真的加 2？用函数式更新：`setCount(prev => prev + 1)` × 2，prev 始终是最新值

2. **setState 本身是同步的**：调用 `setState` 这个操作是同步执行的（立即将 update 加入队列），但**状态值的变更和重渲染是异步触发**的（批处理后统一执行）。

2. **在合成事件/生命周期中**：多次 setState 被批处理，最终只触发一次重渲染：
```jsx
function handleClick() {
  setCount(c => c + 1)
  setCount(c => c + 1)
  // 只触发一次重渲染，count + 2
  console.log(count)  // 仍是旧值，重渲染还未发生
}
```

3. **React 18 之后**：所有场景（包括 setTimeout、Promise、原生事件）都自动批处理，更新统一在下一个微任务中执行。

4. **强制同步更新**（极少用）：React 18 提供 `flushSync`：
```jsx
import { flushSync } from 'react-dom'

flushSync(() => {
  setCount(c => c + 1)  // 立即触发同步重渲染
})
// 此时 DOM 已更新
```

5. **函数式更新保证拿到最新值**：当多次更新依赖前一个状态时，必须用函数式更新，避免批处理中读到旧值：
```jsx
// ❌ 批处理中两次都读同一个 count 快照
setCount(count + 1)
setCount(count + 1)  // 结果：只 +1

// ✅ 函数式更新，prev 始终是最新值
setCount(prev => prev + 1)
setCount(prev => prev + 1)  // 结果：+2
```

---

### useState 和 class 组件 this.setState 的区别？

**参考答案：**

1. **合并行为不同**：
   - `this.setState` 是**浅合并**，只更新传入的字段，其他字段保留
   - `useState` 的 setter 是**完全替换**，需要手动展开旧状态：
```jsx
// class 组件：浅合并
this.setState({ name: 'Alice' })  // age 保留不变

// hooks：完全替换，需手动合并
setUser(prev => ({ ...prev, name: 'Alice' }))
```

2. **异步回调**：
   - `this.setState(updater, callback)` 第二个参数是更新完成的回调
   - `useState` 没有回调，需用 `useEffect` 监听状态变化替代

3. **闭包 vs this**：
   - class 组件通过 `this.state` 获取最新值（this 是可变的）
   - hooks 组件通过闭包捕获，每次渲染的 state 是独立的快照

4. **批处理时机**：React 18 之前 hooks 和 class 组件在异步场景行为不同，React 18 后统一自动批处理。

---

### useState 的 bail-out 机制是什么？直接修改对象 state 为何不触发渲染？

**参考答案：**

1. **bail-out 的含义**：React 在 `setState` 时，如果新旧值**相同**，会跳过渲染（bail-out），不触发组件更新。

2. **判断方式**：React 使用 `Object.is` 比较新旧值（类似 `===`，但对 `NaN` 和 `+0/-0` 有不同处理）：
```jsx
const [count, setCount] = useState(0)
setCount(0)  // Object.is(0, 0) === true → bail-out，不渲染
```

3. **直接 mutate 对象不触发渲染**（大厂高频考题）：
```jsx
const [obj, setObj] = useState({ a: 1 })

// ❌ 直接修改属性再 set，引用没变，bail-out，不渲染
obj.a = 2
setObj(obj)  // Object.is(obj, obj) === true → 不渲染！

// ❌ setObj(obj)，引用相同，也不渲染
setObj(obj)

// ✅ 正确做法：创建新对象
setObj({ ...obj, a: 2 })  // 新引用，触发渲染
setObj(prev => ({ ...prev, a: 2 }))  // 函数式写法
```

4. **数组同理**：
```jsx
const [list, setList] = useState([1, 2, 3])

// ❌ 直接 push 再 set，引用没变
list.push(4)
setList(list)  // 不渲染！

// ✅ 创建新数组
setList([...list, 4])
setList(prev => [...prev, 4])
```

5. **bail-out 源码位置**：`dispatchSetState` → 计算 `eagerState` → `Object.is(eagerState, currentState)` → 相同则直接返回，不进入调度流程。

---

## 二、Fiber 架构

### React Fiber 是什么？解决了 React 15 stack reconciler 的什么问题？

**参考答案：**

1. **React 15 的问题**：使用递归的 stack reconciler 进行同步 diff，一旦开始就**无法中断**，大量节点更新时会长时间占用主线程，阻塞浏览器绘制和用户交互，导致页面卡顿掉帧。

2. **Fiber 的核心思想**：将渲染工作拆分为可中断的**工作单元（work unit）**，每个 Fiber 节点代表一个工作单元，完成一个后可以把控制权交还给浏览器，在空闲时继续处理下一个。

3. **Fiber 节点的关键字段**：
   - `type`：组件类型（函数/类/字符串）
   - `stateNode`：对应的真实 DOM 节点或组件实例
   - `child`、`sibling`、`return`：构成 Fiber 树的链接（子节点、兄弟节点、父节点）
   - `memoizedState`：存储 Hooks 链表
   - `flags`（旧称 `effectTag`）：标记需要执行的 DOM 操作类型

4. **调度机制**：React 自己实现了 Scheduler，使用 MessageChannel 在每帧的空闲时间（约 5ms 时间片）执行工作，时间片用完后暂停，让出主线程。

5. **两个阶段**：
   - **render 阶段（可中断）**：遍历 Fiber 树，计算变更，构建 workInProgress tree
   - **commit 阶段（不可中断）**：将变更一次性应用到真实 DOM

---

### Fiber 双缓存（current tree / workInProgress tree）如何实现无闪烁更新？

**参考答案：**

1. **双缓存的含义**：React 同时维护两棵 Fiber 树：
   - **current tree**：当前屏幕上渲染的内容对应的 Fiber 树
   - **workInProgress tree**：正在后台构建的新 Fiber 树

2. **更新流程**：
   - React 基于 current tree 构建 workInProgress tree（可以中断/恢复）
   - workInProgress 节点通过 `alternate` 指针互相引用 current 节点，方便复用
   - 全部构建完成后，在 commit 阶段**原子性地切换**：`root.current = workInProgress`
   - 原来的 workInProgress tree 变成新的 current tree，旧 current tree 成为下次更新的 workInProgress

3. **无闪烁的原因**：整个 render 阶段在内存中进行，用户始终看到 current tree 的内容，只有 commit 阶段完成后才一次性切换，类似图形学中的"双缓冲"技术。

4. **中断恢复的能力**：render 阶段可以被高优先级更新打断，丢弃当前 workInProgress tree，从 current tree 重新开始构建。因为 current tree 始终完好，不影响用户看到的界面。

---

### render 阶段和 commit 阶段各做什么？哪个可以中断？哪个不能？

**参考答案：**

1. **render 阶段（可中断）**：
   - 遍历 Fiber 树，对每个节点执行 `beginWork`（向下处理子节点）和 `completeWork`（向上收集副作用）
   - 调用组件的 render 函数/函数组件本体，执行 Hooks
   - 对比新旧 Fiber，打上 `flags` 标记（Placement/Update/Deletion 等）
   - 构建 workInProgress tree
   - **可以中断**：因为只是内存中的计算，不涉及真实 DOM，中断后可以从断点继续或重新开始

2. **commit 阶段（不可中断）**：分三个子阶段同步执行：
   - **before mutation**：调用 `getSnapshotBeforeUpdate`，异步调度 `useEffect`
   - **mutation**：根据 flags 执行真实 DOM 操作（插入、更新、删除），执行 `useLayoutEffect` 的 cleanup
   - **layout**：执行 `useLayoutEffect` 的 effect，更新 ref，调用 `componentDidMount/Update`
   - **不可中断**：DOM 操作必须一次性完成，中途中断会导致 UI 不一致

3. **执行完 commit 后**：异步调度执行 `useEffect`（在下一次浏览器绘制后）。

---

### React Scheduler 为什么用 MessageChannel 而不是 rAF 或 setTimeout？

**参考答案：**

1. **不用 requestAnimationFrame（rAF）的原因**：
   - rAF 在页面不可见（后台标签页）时停止触发，会暂停 React 的调度
   - rAF 的触发频率与屏幕刷新率绑定（60fps = 16.7ms），不够灵活
   - rAF 只在浏览器环境可用，不支持 Node.js（SSR 场景）

2. **不用 setTimeout(fn, 0) 的原因**：
   - 浏览器对 `setTimeout` 有最小延迟限制（通常 4ms），且嵌套 setTimeout 后延迟会增加到 4ms 以上
   - 4ms 的固定延迟比 React 希望的 5ms 时间片更不精确
   - 属于宏任务，执行时机比 MessageChannel 更晚

3. **MessageChannel 的优势**：
   - 触发的是宏任务，但比 setTimeout(fn, 0) 延迟更低（接近 0ms）
   - 在页面不可见时仍然正常触发
   - 跨浏览器行为一致
   - 本质上发一条消息给自己（`port.postMessage`），在当前宏任务结束后立即触发下一个宏任务

4. **时间片机制**：Scheduler 在每个 MessageChannel 回调中执行约 5ms 的工作，超时则停止，发送下一条消息，让出主线程给浏览器处理绘制和事件。

---

### Lane 优先级模型是什么？如何用二进制位掩码表示优先级？

**参考答案：**

1. **Lane 模型的背景**：React 18 引入，替代之前基于 expirationTime 的优先级系统，解决了多个更新同时处于同一优先级时难以区分批次的问题。

2. **核心思想**：用 32 位整数的每个二进制位（lane）代表一个优先级通道，多个更新可以同时属于不同 lane：
```js
// 优先级从高到低（部分）
SyncLane            = 0b0000000000000000000000000000001  // 同步（最高）
InputContinuousLane = 0b0000000000000000000000000000100  // 连续输入（如 mousemove）
DefaultLane         = 0b0000000000000000000000000010000  // 普通更新
TransitionLane1     = 0b0000000000000000000000001000000  // useTransition
IdleLane            = 0b0100000000000000000000000000000  // 空闲（最低）
```

3. **位运算操作**：
   - **合并多个 lane**：`pendingLanes = lane1 | lane2`（按位或）
   - **检测是否包含某 lane**：`pendingLanes & SyncLane`（按位与，非零则包含）
   - **移除已处理的 lane**：`pendingLanes &= ~processedLanes`（按位与非）
   - **获取最高优先级 lane**：`getHighestPriorityLane = lanes & -lanes`（利用补码取最低位）

4. **优势**：一次渲染可以处理多个不同 lane 的更新（批量处理），比 expirationTime 模型更灵活。

---

### 高优先级更新如何"打断"低优先级更新？Starvation（饥饿）问题怎么解决？

**参考答案：**

1. **打断流程**：
   - 低优先级更新（如 transition）正在 render 阶段执行
   - 高优先级更新（如用户输入）进入调度队列
   - Scheduler 检测到有更高优先级任务，中断当前 render 阶段（丢弃 workInProgress tree）
   - 优先处理高优先级更新，完成 commit
   - 重新从头构建，将低优先级更新重新调度

2. **重渲染的幂等要求**：因为低优先级的 render 阶段可能被执行多次（每次被打断后重新执行），render 阶段必须是**纯函数/幂等**的，不能有副作用（这也是 StrictMode 双调用检测的原因）。

3. **Starvation（饥饿）问题**：低优先级更新持续被高优先级更新打断，导致永远无法完成。

4. **解决方案**：每个更新在加入队列时记录一个**过期时间（expirationTime）**，Scheduler 在调度时检查已过期的任务，将其强制提升到最高优先级（`SyncLane`），保证所有更新最终都能完成。

---

### Fiber 节点上的 effectList 是什么？React 18 为何去掉了它？

**参考答案：**

1. **effectList 的作用（React 17 及之前）**：在 render 阶段的 `completeWork` 中，每个有副作用（flags 非空）的 Fiber 节点被收集到父节点的 `effectList` 链表中，commit 阶段只需遍历 `effectList`，不需要遍历整棵树，提升了 commit 阶段的效率。

2. **React 18 为何去掉**：
   - 引入并发模式后，一棵子树可能被 Suspense 挂起，effectList 中的节点可能属于还未"就绪"的子树，需要额外处理，逻辑复杂
   - React 18 改为在 commit 阶段**递归遍历整棵 Fiber 树**，通过 `subtreeFlags`（子树副作用标记）快速跳过无副作用的子树分支，兼顾了性能和正确性
   - `subtreeFlags` 是 `flags` 的向上传播：子树有副作用，父节点的 `subtreeFlags` 就非零，commit 时可以快速判断是否需要进入子树

---

## 三、diff 算法

### React diff 算法的三个核心策略/假设是什么？

**参考答案：**

1. **Tree diff（跨层级策略）**：
   - 假设：跨层级的节点移动极少发生
   - 做法：只对同一层级的节点进行比较，不做跨层级移动
   - 效果：将 O(n³) 的树比较降低为 O(n)

2. **Component diff（组件策略）**：
   - 假设：同类型组件产生相似的树结构，不同类型产生不同结构
   - 做法：同类型组件继续比较子树（复用 Fiber 节点）；不同类型直接**销毁旧组件及其子树**，重新创建
   - 注意：即使两个不同类型的组件渲染出相同的 DOM，也会完全重建

3. **Element diff（列表策略）**：
   - 假设：同层级节点可以通过 key 唯一标识
   - 做法：通过 key 匹配新旧节点，识别移动/新增/删除操作，最小化 DOM 操作
   - 没有 key 时按顺序比较，有 key 时构建 `key → oldFiber` 的 Map 进行查找

---

### key 为什么不推荐用 index？会带来哪些具体问题？

**参考答案：**

1. **根本原因**：key 是 React diff 算法识别节点的唯一标识，当列表发生增删时，用 index 作 key 会导致 key 值重新分配，React 将错误地复用旧的 Fiber 节点。

2. **具体问题一：状态错位**
```jsx
// 列表：[A(key=0), B(key=1), C(key=2)]
// 删除 A 后：[B(key=0), C(key=1)]
// React 认为 key=0 的节点从 A 变成了 B，会 patch A → B
// 但如果 A 有内部状态（如输入框内容），该状态会残留在 B 上
```

3. **具体问题二：性能下降**：本应"删除 A，B 和 C 不动"，却变成"B patch 到位置0，C patch 到位置1"，额外执行了两次 DOM 更新。

4. **具体问题三：动画/过渡异常**：使用 `<TransitionGroup>` 等动画组件时，key 不稳定导致动画触发错误的元素。

5. **正确选择**：使用数据中的唯一标识（如数据库 `id` 字段），无唯一 id 时用 `name + type` 等组合，静态列表（永不增删排序）才可以用 index。

---

### React 和 Vue3 的 diff 算法有何不同？各自的权衡是什么？

**参考答案：**

1. **React 的 diff 算法**：
   - **单端从左向右**遍历新节点列表，对每个新节点在旧节点中查找（通过 key Map）
   - 找到可复用节点则移动（只向右移动，不向左）
   - 遍历完后，剩余旧节点删除，剩余新节点插入
   - **不使用最长递增子序列（LIS）**，移动操作相对较多

2. **Vue3 的 diff 算法**：
   - **双端预处理**：先比较头头、尾尾，快速处理前置/后置相同节点
   - 乱序部分使用**最长递增子序列（LIS）**找出不需要移动的节点集合
   - 只移动不在 LIS 中的节点，**最小化 DOM 移动次数**

3. **性能对比**：
   - 纯 diff 性能：Vue3 > React（LIS 优化减少移动次数）
   - 实际场景：React 的 Fiber 架构可中断渲染，整体用户体验并不落后

4. **各自的权衡**：
   - React 选择简单实现：与 Fiber 增量渲染模型更契合，实现简单，维护成本低
   - Vue3 选择最优 diff：模板编译可预知动态节点，配合 PatchFlag 使 diff 范围更小，纯运行时 diff 性能更优

---

### React diff 为什么不用最长递增子序列（LIS）优化？

**参考答案：**

1. **Fiber 架构的约束**：React 的 Fiber 是单向链表，节点只有 `child`、`sibling`、`return` 指针，没有像数组那样的随机访问能力，LIS 算法需要对节点序列进行索引操作，与 Fiber 链表结构不匹配。

2. **可中断性的影响**：Fiber 的 render 阶段可以中断后重新执行，LIS 的计算状态难以在中断后恢复，增加了实现复杂度。

3. **权衡取舍**：React 团队认为在实际应用中，列表的大规模乱序重排并不常见，简单实现带来的维护优势大于 LIS 在极端场景下的性能优势。

4. **Vue3 能用 LIS 的原因**：Vue3 是同步渲染，diff 不会中断，且有编译时优化（静态节点提升 + PatchFlag）减少了需要 diff 的节点数量，LIS 在更小的乱序集合上运行，实际效果更好。

---

## 四、性能优化

### React 中避免不必要重渲染的完整方案？

**参考答案：**

1. **`React.memo`**：对函数组件进行 props 浅比较，props 未变则跳过重渲染
```jsx
const Child = React.memo(({ value, onClick }) => <div onClick={onClick}>{value}</div>)
```

2. **`useMemo` / `useCallback`**：稳定传给子组件的对象/函数引用，配合 `React.memo` 生效

3. **状态下沉**：将状态移到真正需要它的最小组件内，避免高层组件 state 变化导致整棵子树重渲染

4. **组件拆分**：将频繁更新的部分拆为独立组件，隔离更新范围

5. **Context 拆分**：避免一个大 Context 对象，按功能域拆分多个 Context，减少无关消费者重渲染

6. **React 18 自动批量更新**：多次 setState 合并为一次渲染（createRoot 模式自动启用）

7. **`useTransition`**：将非紧急更新（如搜索结果渲染）标记为 transition，优先保证用户交互响应

8. **`React.lazy` + 路由懒加载**：减少首屏 bundle 体积，加快初始渲染

---

### React.memo 的浅比较原理？什么情况下无效？

**参考答案：**

1. **浅比较原理**：`React.memo` 对前后两次 props 的每个字段进行 `Object.is` 比较（类似 `===`）。所有字段都相等则跳过重渲染；任意字段不等则重新渲染。

2. **无效的情况**：
   - **父组件每次渲染创建新对象/数组/函数作为 prop**：
   ```jsx
   <Child style={{ color: 'red' }} />  // 每次都是新对象，memo 无效
   <Child onClick={() => doSomething()} />  // 每次都是新函数
   ```
   - **解决**：用 `useMemo`/`useCallback` 稳定这些引用

3. **自定义比较函数**：第二个参数可传入自定义比较函数：
```jsx
const Child = React.memo(Component, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id  // true 表示相同，跳过渲染
})
```

4. **不适用于 Context**：`React.memo` 只对比 props，如果组件消费了 Context，Context 变化仍会触发重渲染。

---

### Context 导致全量重渲染的原因？如何解决（4 种方案）？

**参考答案：**

**原因**：Context 没有细粒度订阅能力，`value` 对象引用变化时，所有 `useContext(MyContext)` 的消费者都会重渲染，不管它们是否真正用到了变化的那部分数据。

**4 种解决方案**：

1. **拆分 Context**：按职责拆成多个 Context，消费者只订阅需要的：
```jsx
const UserContext = createContext()    // 用户信息
const ThemeContext = createContext()   // 主题
// 主题变化不影响用户信息消费者
```

2. **`useMemo` 缓存 value 对象**：避免父组件重渲染时 value 引用变化：
```jsx
const value = useMemo(() => ({ user, login, logout }), [user])
<UserContext.Provider value={value}>
```

3. **`use-context-selector`（第三方库）**：类似 Redux 的 selector 模式，只在消费的具体字段变化时重渲染：
```jsx
const user = useContextSelector(UserContext, ctx => ctx.user)
```

4. **用 Zustand / Jotai 替代 Context**：这类库内置细粒度订阅，组件只在订阅的 state 切片变化时重渲染，是大型应用的推荐方案。

---

### React.lazy + Suspense 代码分割的原理？（throw Promise 机制）

**参考答案：**

1. **`React.lazy` 的实现**：返回一个特殊的 "lazy" 组件对象，包含状态机：
```js
// 伪代码
function lazy(importFn) {
  let status = 'pending'
  let result
  const promise = importFn().then(
    module => { status = 'fulfilled'; result = module.default },
    error => { status = 'rejected'; result = error }
  )
  return {
    $$typeof: REACT_LAZY_TYPE,
    _payload: { _status: status, _result: result || promise },
    _init: () => { /* 根据 status 返回值或 throw */ }
  }
}
```

2. **throw Promise 机制**：当 lazy 组件渲染时，如果模块还未加载完（`status = 'pending'`），会 **throw 出 Promise**。React 的 reconciler 在 render 阶段捕获这个 throw，向上查找最近的 `<Suspense>` 边界。

3. **Suspense 的处理**：
   - 找到 Suspense 后，展示 `fallback` 内容
   - 订阅被 throw 的 Promise
   - Promise resolve 后，React 重新触发该子树的渲染

4. **与错误处理的区别**：throw 的是 Promise 时，React 当作"挂起"处理（Suspense）；throw 的是 Error 时，React 当作错误处理（ErrorBoundary）。

---

### 虚拟列表如何在 React 中实现？react-window 的原理？

**参考答案：**

1. **核心思想**：只渲染可视区域内的列表项，用 CSS 定位撑开容器到完整高度，形成正常的滚动体验。

2. **关键计算**：
```jsx
const ITEM_HEIGHT = 50
const CONTAINER_HEIGHT = 600
const BUFFER = 3

function VirtualList({ items }) {
  const [scrollTop, setScrollTop] = useState(0)

  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER)
  const visibleCount = Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT) + BUFFER * 2
  const endIndex = Math.min(items.length, startIndex + visibleCount)

  const visibleItems = items.slice(startIndex, endIndex)
  const offsetY = startIndex * ITEM_HEIGHT  // 渲染区域距顶部的偏移

  return (
    <div style={{ height: CONTAINER_HEIGHT, overflow: 'auto' }}
         onScroll={e => setScrollTop(e.target.scrollTop)}>
      {/* 撑开到完整高度 */}
      <div style={{ height: items.length * ITEM_HEIGHT, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, i) => (
            <div key={item.id} style={{ height: ITEM_HEIGHT }}>{item.name}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

3. **react-window 的原理**：与上述思路相同，额外提供：
   - 定高列表（`FixedSizeList`）和不定高列表（`VariableSizeList`）
   - 不定高列表通过 `itemSize` 回调函数获取每项高度，内部维护位置缓存
   - 横向滚动（`FixedSizeGrid`）

4. **不定高的难点**：需要维护每项的 top 位置缓存数组，用二分查找定位 startIndex，并在渲染后用 `ResizeObserver` 修正实际高度。

---

### React Profiler API 如何定位性能瓶颈？

**参考答案：**

1. **`<Profiler>` 组件**：包裹需要分析的子树，提供 `onRender` 回调：
```jsx
<Profiler id="UserList" onRender={(
  id,           // "UserList"
  phase,        // "mount" 或 "update"
  actualDuration,  // 本次渲染耗时（ms）
  baseDuration,    // 不使用 memo 时的估算耗时
  startTime,
  commitTime
) => {
  if (actualDuration > 16) {
    console.warn(`${id} 渲染耗时 ${actualDuration}ms，超过 16ms`)
  }
}}>
  <UserList />
</Profiler>
```

2. **React DevTools Profiler**：可视化工具，录制一次交互，查看：
   - 每次 commit 的时间和原因
   - 火焰图：各组件渲染耗时
   - 排名图：渲染最慢的组件
   - 组件重渲染原因（props/state/hooks/context 变化）

3. **定位流程**：
   - 用 DevTools Profiler 录制典型操作
   - 查找排名靠前的慢组件
   - 分析重渲染原因（是否因 props 引用变化？Context 变化？）
   - 针对性使用 memo/useMemo/Context 拆分优化

4. **配合 Performance 面板**：分析 Long Task（> 50ms 的主线程阻塞），结合 React 组件的调用栈定位具体瓶颈。

---

### React Compiler（React 19）自动 memoize 后，useMemo/useCallback 还有意义吗？

**参考答案：**

1. **React Compiler 的能力**：静态分析组件代码，自动在需要的地方插入 memoization，相当于编译器帮你写 useMemo/useCallback，大多数常见场景无需手写。

2. **仍有意义的场景**：
   - **Compiler 无法分析的情况**：使用了动态导入、复杂的第三方库、非标准 JS 语法时，Compiler 可能无法安全地自动优化
   - **显式语义**：手写 `useMemo` 可以明确表达"这个值的计算很昂贵，需要缓存"，便于代码阅读和维护
   - **跨模块共享的稳定引用**：如将函数传给非 React 的事件系统，需要显式稳定引用

3. **当前现状**（2025）：React Compiler 仍处于逐步推广阶段，非所有项目都启用。未使用 Compiler 的项目仍需手写优化。

4. **建议**：启用 Compiler 后，优先信任 Compiler 的自动优化，删除不必要的手写 memo；遇到 Compiler 无法处理的场景再手动干预。

---

## 五、并发特性

### useTransition 和 useDeferredValue 的区别和使用场景？

**参考答案：**

1. **`useTransition`**（主动标记，调用方控制）：
   - 将状态更新标记为低优先级 transition，不阻塞用户交互
   - 返回 `[isPending, startTransition]`，`isPending` 可用于显示 loading 状态
```jsx
const [isPending, startTransition] = useTransition()

function handleSearch(value) {
  setInputValue(value)  // 高优先级：输入框立即更新
  startTransition(() => {
    setSearchResults(filterData(value))  // 低优先级：结果延迟更新
  })
}
```

2. **`useDeferredValue`**（被动接收，消费方控制）：
   - 接收一个值，返回该值的"延迟副本"，当值频繁变化时，渲染使用的是稳定后的值
   - 适合消费方无法控制触发时机的场景（如接收父组件 prop）
```jsx
function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query)
  // 即使 query 频繁变化，列表渲染使用 deferredQuery，延迟后才更新
  return <ExpensiveList query={deferredQuery} />
}
```

3. **核心区别**：
   - `useTransition`：主动包裹 setState 调用（需要能访问 setState）
   - `useDeferredValue`：被动接收值（不需要访问 setState，适合封装的子组件）

---

### React 18 并发渲染和 React 17 同步渲染的本质区别？

**参考答案：**

1. **React 17 同步渲染**：一旦开始 render 阶段，必须一次性完成整棵树的 diff，不可中断，高优先级任务（如用户输入）必须等待。

2. **React 18 并发渲染**：render 阶段**可以被中断、暂停、恢复或丢弃**，React 可以在渲染中途响应高优先级更新：
   - 低优先级更新（transition）暂停 → 处理高优先级输入 → 恢复或重新渲染低优先级

3. **带来的新特性**：
   - `useTransition` / `useDeferredValue`：标记低优先级更新
   - `Suspense` 流式 SSR：服务端可以流式传输 HTML
   - 自动批量更新（Auto Batching）

4. **带来的副作用与注意事项**：
   - 同一次 render 的 state 一致性：React 保证 commit 阶段的 state 是一致的快照，但 render 阶段可能读取同一 state 多次
   - **组件可能被渲染多次**：render 被打断后重新执行，render 函数必须是纯函数（无副作用）
   - `useEffect` 等副作用只在 commit 阶段稳定执行，不受中断影响

5. **启用方式**：必须使用 `ReactDOM.createRoot`，使用 `ReactDOM.render`（legacy 模式）不启用并发特性。

---

### 并发模式下组件可能被渲染多次，StrictMode 为什么有意双调用？

**参考答案：**

1. **并发模式的问题**：render 阶段可中断重执行，意味着同一组件的函数体可能在一次更新中执行多次。如果 render 函数有副作用（如修改外部变量、发起请求），会出现意外行为。

2. **StrictMode 的目的**：在**开发模式**下，故意将以下函数调用两次，暴露不纯的组件：
   - 函数组件的函数体
   - `useState`/`useReducer`/`useMemo` 的初始化函数
   - `render` 方法（类组件）
   - `shouldComponentUpdate`（类组件）

3. **正确反应**：纯函数（相同输入 → 相同输出，无副作用）被调用两次结果不变，双调用不影响功能；有副作用的组件会表现出问题（如数据重复请求、计数器 +2），便于开发者发现并修复。

4. **生产模式不双调用**：StrictMode 的双调用只在开发模式生效，不影响生产性能。

---

### React 19 的 use hook 解决了什么问题？为什么能在条件语句中调用？

**参考答案：**

1. **`use` 解决的两个问题**：
   - **`use(Promise)`**：在渲染中直接读取 Promise 的值，配合 Suspense 展示加载态，无需 useEffect + setState 的异步数据加载模板代码
   - **`use(Context)`**：可以在条件语句中读取 Context（普通 Hooks 不能在条件中调用）

2. **`use(Promise)` 示例**：
```jsx
function UserProfile({ id }) {
  const user = use(fetchUser(id))  // Promise，Suspense 在 pending 时展示 fallback
  return <div>{user.name}</div>
}
```

3. **为什么能在条件语句中调用**：普通 Hooks（useState/useEffect）不能在条件中调用是因为它们依赖**固定顺序**的链表。`use` 不是普通 Hook，它是 React reconciler 的内置原语：
   - `use(Promise)` 通过 throw Promise 机制触发 Suspense，React 在 reconciler 层捕获
   - `use(Context)` 的实现不依赖 Hook 链表的固定顺序，而是直接查找 Context 值
   - 因此可以在条件/循环中调用，但**不能在普通函数或事件处理函数中调用**（只能在组件/自定义 Hook 内）

---

### React 19 的 useOptimistic 是什么？乐观更新失败如何自动回滚？

**参考答案：**

1. **乐观更新的场景**：用户点击"点赞"后立即在 UI 显示已点赞，同时发起网络请求。如果请求失败，恢复为未点赞状态，提升感知性能。

2. **传统手写乐观更新的问题**：需要手动管理"乐观状态"和"真实状态"，以及失败时的回滚逻辑，代码繁琐。

3. **`useOptimistic` 的用法**：
```jsx
function LikeButton({ postId, initialLiked }) {
  const [liked, setLiked] = useState(initialLiked)
  const [optimisticLiked, setOptimisticLiked] = useOptimistic(liked)

  async function handleLike() {
    setOptimisticLiked(!liked)  // 立即更新 UI（乐观值）
    try {
      const result = await toggleLike(postId)
      setLiked(result.liked)    // 用服务端真实结果更新
    } catch {
      // 不需要手动回滚，useOptimistic 在 action 完成后自动恢复到 liked 的真实值
    }
  }
}
```

4. **自动回滚原理**：`useOptimistic` 与 React Transitions/Actions 深度集成。当关联的异步 action 完成（无论成功还是失败）后，optimistic state 自动恢复为底层的真实 state（第一个参数）。失败时不需要手写 catch 中的回滚逻辑。

---

### React 19 的 useActionState 和 useFormStatus 解决了什么问题？

**参考答案：**

1. **`useActionState`**：简化表单 action 的状态管理（loading、error、result）：
```jsx
async function submitForm(prevState, formData) {
  try {
    const result = await createUser(formData)
    return { success: true, user: result }
  } catch (e) {
    return { error: e.message }
  }
}

function Form() {
  const [state, action, isPending] = useActionState(submitForm, null)
  return (
    <form action={action}>
      <input name="name" />
      <button disabled={isPending}>提交</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  )
}
```

2. **`useFormStatus`**：在表单子组件中获取父表单的提交状态，无需 prop drilling：
```jsx
function SubmitButton() {
  const { pending } = useFormStatus()  // 感知父 <form> 的提交状态
  return <button disabled={pending}>{pending ? '提交中...' : '提交'}</button>
}
```

3. **解决的核心问题**：
   - 消除手写 `isLoading`/`error`/`data` 状态 + try/catch 的样板代码
   - `useFormStatus` 解决了表单子组件无法感知父表单状态的问题（不需要通过 props 传递 isPending）

---

### React 19 的 Actions / Server Actions 机制？

**参考答案：**

1. **Client Actions**：React 19 中，`<form>` 的 `action` 属性可以接受一个异步函数，React 自动管理 pending 状态：
```jsx
<form action={async (formData) => {
  await submitData(formData)
}}>
```

2. **Server Actions**：在 Next.js App Router 等支持 RSC 的框架中，通过 `'use server'` 指令标记的函数可以在客户端直接调用，React 自动处理序列化和网络传输：
```js
// app/actions.js
'use server'
export async function createUser(formData) {
  const name = formData.get('name')
  await db.users.create({ name })
  revalidatePath('/users')
}

// 客户端组件直接调用
import { createUser } from './actions'
<form action={createUser}>...</form>
```

3. **核心价值**：
   - 客户端无需手写 fetch + JSON.stringify + 错误处理
   - Server Action 可以直接访问数据库、文件系统，无需中间 API 路由
   - 与 `useActionState`、`useOptimistic` 深度集成，实现完整的全栈交互

4. **安全注意事项**：Server Action 的函数参数来自用户输入，必须做服务端验证，不能信任客户端传来的数据。

---

## 六、状态管理

### Redux 的单向数据流原理？中间件（middleware）的实现原理（compose + currying）？

**参考答案：**

1. **单向数据流**：
```
UI 触发 Action → dispatch(action) → Reducer(state, action) → 新 state → 重渲染 UI
```
所有状态变更必须通过 dispatch action，reducer 是纯函数，保证可预测性。

2. **中间件的作用**：在 dispatch 和 reducer 之间插入逻辑（日志、异步处理、错误上报等）。

3. **中间件的签名**：
```js
const logger = store => next => action => {
  console.log('dispatching', action)
  const result = next(action)  // 调用下一个中间件或原始 dispatch
  console.log('next state', store.getState())
  return result
}
```
三层柯里化：`store`（Redux store）→ `next`（下一个 dispatch）→ `action`（当前 action）

4. **`compose` 的实现**：将多个中间件组合成一个：
```js
function compose(...fns) {
  return fns.reduce((f, g) => (...args) => f(g(...args)))
}
// compose(f, g, h)(x) 等价于 f(g(h(x)))
```

5. **`applyMiddleware` 的实现**：
```js
function applyMiddleware(...middlewares) {
  return createStore => (reducer, preloadedState) => {
    const store = createStore(reducer, preloadedState)
    const chain = middlewares.map(m => m(store))
    const dispatch = compose(...chain)(store.dispatch)
    return { ...store, dispatch }
  }
}
```

---

### Redux Toolkit 相比原始 Redux 改进了什么？

**参考答案：**

1. **`createSlice`**：自动生成 action creators 和 reducer，消除大量样板代码：
```js
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: state => { state.value++ },  // 用 Immer 实现"可变"写法
    decrement: state => { state.value-- },
  }
})
export const { increment, decrement } = counterSlice.actions
```

2. **内置 Immer**：reducer 中可以直接"修改" state（实际生成新对象），不需要手写展开运算符

3. **`createAsyncThunk`**：标准化异步操作，自动生成 pending/fulfilled/rejected action：
```js
const fetchUser = createAsyncThunk('users/fetch', async (id) => {
  return await api.getUser(id)
})
```

4. **`configureStore`**：自动配置 Redux DevTools、redux-thunk 中间件，简化 store 创建

5. **`createEntityAdapter`**：为 CRUD 操作提供标准化的 reducer 和 selector 工具

---

### Zustand 为什么不需要 Provider？它的订阅机制是什么？

**参考答案：**

1. **不需要 Provider 的原因**：Zustand 的 store 是**模块级单例**，通过 `create` 创建后存储在模块闭包中，组件直接通过 `useStore` hook 访问，不需要 React Context 的 Provider 机制来传递。

2. **订阅机制**：
```js
// 简化版 Zustand 实现
function create(initializer) {
  let state = initializer(setState, getState)
  const listeners = new Set()

  function setState(partial) {
    state = { ...state, ...(typeof partial === 'function' ? partial(state) : partial) }
    listeners.forEach(listener => listener(state))
  }

  function subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  // useStore hook
  function useStore(selector = s => s) {
    return useSyncExternalStore(subscribe, () => selector(state))
  }

  return useStore
}
```

3. **细粒度订阅（selector）**：组件通过 selector 只订阅需要的状态切片，只有该切片变化时才重渲染：
```js
// 只有 count 变化时重渲染，name 变化不影响
const count = useCounterStore(state => state.count)
```

4. **内部使用 `useSyncExternalStore`（React 18）**：保证并发模式下状态一致性（Tearing 问题）。

---

### Jotai / Recoil 的原子化状态理念和 Redux 有什么本质区别？

**参考答案：**

1. **Redux 的集中式模型**：
   - 全部状态在一棵状态树中管理
   - 适合全局共享状态、需要完整可追踪历史的场景
   - 缺点：小更新也需要通过整个状态树，selector 设计不当导致大范围重渲染

2. **原子化状态（Jotai/Recoil）的理念**：
   - 状态被拆分为独立的**原子（atom）**，每个 atom 是最小状态单位
   - 组件只订阅需要的 atom，atom 变化只触发订阅该 atom 的组件
   - atom 之间可以组合（`derived atom`），构建响应式依赖图

3. **Jotai 示例**：
```jsx
const countAtom = atom(0)               // 基础 atom
const doubleAtom = atom(get => get(countAtom) * 2)  // 派生 atom

function Counter() {
  const [count, setCount] = useAtom(countAtom)  // 只订阅 count
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

4. **选型建议**：
   - 全局共享、需要 devtools 追踪 → Redux/Zustand
   - 组件树局部状态、细粒度响应式 → Jotai/Recoil
   - 轻量全局状态、无需 Provider → Zustand

---

### Redux 和 Zustand/Jotai 如何做选型？

**参考答案：**

| 维度 | Redux (Toolkit) | Zustand | Jotai |
|---|---|---|---|
| 学习曲线 | 较高 | 低 | 低 |
| 样板代码 | 少（RTK 后） | 极少 | 极少 |
| 调试工具 | 完善（DevTools） | 支持 DevTools | 支持 DevTools |
| 性能 | 需合理设计 selector | 内置 selector 细粒度 | 原子级细粒度 |
| 异步处理 | createAsyncThunk | 直接在 action 写 async | 异步 atom |
| 适用规模 | 大型复杂应用 | 中小型~大型 | 中小型 |

**选择建议**：
- 大型团队、需要严格的状态管理规范、已有 Redux 生态 → Redux Toolkit
- 追求简洁、中小型项目、需要细粒度订阅 → Zustand
- 状态较分散、需要原子级响应式、React Suspense 深度集成 → Jotai

---

### Redux 的 connect vs useSelector 的性能差异？

**参考答案：**

1. **`connect`（HOC 方式，React-Redux v7 前主流）**：
   - 通过高阶组件包裹，每次 store 变化都执行 `mapStateToProps`
   - 内部用浅比较决定是否重渲染被包裹的组件
   - 缺点：HOC 嵌套层级深，调试困难；每次 store 变化都执行 mapStateToProps 有轻微开销

2. **`useSelector`（Hooks 方式，现代推荐）**：
   - 直接在组件内通过 selector 订阅状态
   - 每次 store 变化执行 selector，用 `===` 比较返回值，不同才触发重渲染
   - 性能关键点：selector 应返回稳定引用（用 `reselect` 创建记忆化 selector），避免每次返回新对象

3. **`useSelector` 的潜在问题**：
```jsx
// ❌ 每次都返回新数组，组件每次 store 变化都重渲染
const items = useSelector(state => state.items.filter(i => i.active))

// ✅ 用 reselect 记忆化
const selectActiveItems = createSelector(
  state => state.items,
  items => items.filter(i => i.active)
)
const items = useSelector(selectActiveItems)
```

4. **总结**：`useSelector` 代码更简洁，与 Hooks 生态一致，是现代 React-Redux 的推荐方式。合理设计 selector（用 reselect）后性能与 `connect` 相当甚至更优。

---

## 七、SSR / RSC / 工程化

### React Server Components（RSC）和传统 SSR 的区别？

**参考答案：**

1. **传统 SSR（如 Next.js Pages Router）**：
   - 服务端执行组件代码，生成完整 HTML 字符串
   - 客户端下载**全部**组件的 JS bundle，进行 hydration（注水），让页面变得可交互
   - 缺点：即使服务端渲染的组件不需要交互，它的 JS 代码也会被发送到客户端

2. **React Server Components**：
   - **Server Component**：只在服务端执行，输出是序列化的 React 树（RSC Payload，非 HTML），**不包含在 JS bundle 中**，客户端不下载其 JS
   - **Client Component**：标记 `'use client'`，照常发送 JS 到客户端，正常 hydration
   - 两者可以混用，Server Component 可以直接访问数据库/文件系统

3. **核心优势**：
   - 零 JS bundle：Server Component 的代码永远不发送到客户端
   - 直接数据访问：无需 API 层，Server Component 直接查数据库
   - 自动代码分割：Client Component 按需加载

4. **限制**：
   - Server Component 不能用 `useState`/`useEffect` 等 Hooks
   - Server Component 不能访问浏览器 API（window/document）
   - Server Component 不能绑定事件处理函数

---

### Server Component 和 Client Component 的边界如何划分？

**参考答案：**

1. **默认规则**：在 Next.js App Router 中，所有组件默认是 **Server Component**，需要客户端能力的组件在文件顶部加 `'use client'` 指令。

2. **何时用 Client Component**（需要 `'use client'`）：
   - 使用 useState/useReducer/useEffect 等 React Hooks
   - 绑定事件处理函数（onClick、onChange 等）
   - 访问浏览器 API（window/localStorage/geolocation）
   - 使用依赖浏览器环境的第三方库

3. **何时保持 Server Component**：
   - 数据获取（直接访问数据库/文件系统）
   - 纯展示组件（无交互）
   - 访问服务端敏感信息（API 密钥、环境变量）
   - 大型静态内容（减少 bundle 体积）

4. **组合模式**：Server Component 可以将 Client Component 作为子组件，但反过来不行（Client Component 不能直接渲染 Server Component，但可以通过 children prop 接收）：
```jsx
// ✅ Server Component 作为 Client Component 的 children 传入
<ClientLayout>
  <ServerSidebar />  {/* 服务端渲染，通过 children 传入 */}
</ClientLayout>
```

---

### RSC 的 Streaming（流式渲染）怎么工作？

**参考答案：**

1. **传统 SSR 的问题**：必须等待所有数据获取完毕，才能生成完整 HTML 发送，TTFB（首字节时间）很长。

2. **Streaming 的工作原理**：
   - 服务端先发送页面的"骨架"（shell），浏览器立即开始渲染和解析
   - 包含 `<Suspense>` 的异步数据部分先展示 fallback
   - 异步数据就绪后，服务端通过同一个 HTTP 连接（Transfer-Encoding: chunked）流式传输剩余内容
   - React 在客户端将流式内容替换 fallback

3. **Next.js 中的使用**：
```jsx
// app/page.jsx
export default function Page() {
  return (
    <>
      <StaticHeader />  {/* 立即发送 */}
      <Suspense fallback={<Loading />}>
        <SlowDataComponent />  {/* 数据就绪后流式传输 */}
      </Suspense>
    </>
  )
}
```

4. **优势**：
   - TTFB 极低（立即发送 shell）
   - 用户更快看到有意义的内容（渐进式加载）
   - 慢查询不阻塞快查询的渲染
   - 配合 React 19 的 `use(Promise)` 可以在 Server Component 中并发获取多个数据源

---

### Next.js App Router 和 Pages Router 的核心区别？

**参考答案：**

1. **路由结构**：
   - Pages Router：`pages/` 目录，每个文件对应一个路由，`_app.js` 包裹所有页面
   - App Router：`app/` 目录，`page.jsx` 对应页面，`layout.jsx` 对应共享布局，支持嵌套布局

2. **组件模型**：
   - Pages Router：所有组件默认 Client Component，SSR 通过 `getServerSideProps` 实现
   - App Router：默认 Server Component，需要客户端能力才加 `'use client'`

3. **数据获取**：
   - Pages Router：`getStaticProps`/`getServerSideProps`（页面级）
   - App Router：直接在 Server Component 中 `async/await`，支持组件级数据获取

4. **其他差异**：

| | Pages Router | App Router |
|---|---|---|
| 渲染模式 | SSR/SSG/ISR | Server Component + Streaming |
| 缓存 | 手动控制 | 细粒度缓存策略（fetch cache） |
| 路由处理 | API Routes | Route Handlers + Server Actions |
| 学习曲线 | 较低 | 较高（需理解 RSC 模型） |

---

### React hydration 是什么？hydration 失败怎么排查？

**参考答案：**

1. **hydration 的定义**：SSR 后，客户端 React 接管服务端生成的 HTML，将组件树与已有 DOM 关联起来，绑定事件处理函数，使页面变得可交互的过程。

2. **hydration 的工作方式**：React 不重新创建 DOM，而是遍历已有 DOM 结构，与 Virtual DOM 进行对比。如果匹配则复用 DOM 节点，只绑定事件；如果不匹配则产生 hydration mismatch 警告并重新渲染该部分。

3. **常见 hydration 失败原因**：
   - 服务端/客户端使用了不确定性值（`Math.random()`/`Date.now()`/`new Date()`）
   - 访问了仅客户端可用的 API（`window.innerWidth`、`localStorage`）
   - 时区差异导致时间显示不同
   - 第三方脚本修改了 DOM

4. **排查方法**：
   - 查看控制台的 "Hydration failed" 警告，React 会指出不匹配的节点
   - 对比"查看页面源代码"（服务端 HTML）与 React DevTools 中实际渲染的结构
   - 常用解决：将仅客户端代码放入 `useEffect`；使用 `<ClientOnly>` 包裹；用 `suppressHydrationWarning` 抑制已知的动态内容（如时间戳）

---

### React 19 的 use server 和 use client 指令的作用？

**参考答案：**

1. **`'use client'`**：
   - 放在文件顶部，标记该文件中的组件为 **Client Component**
   - 该文件的代码会被打包进客户端 JS bundle，在浏览器中执行
   - 可以使用 Hooks、事件处理、浏览器 API
   - 是 Server Component 树中"客户端子树"的入口边界

2. **`'use server'`**：
   - 放在文件顶部或函数内部，标记为 **Server Action**
   - 该函数只在服务端执行，不进入客户端 bundle
   - 客户端调用时，React 自动序列化参数、发送网络请求、反序列化结果
   - 必须是 `async` 函数

3. **边界规则**：
   - `'use client'` 文件中不能直接渲染 Server Component（但可以通过 props/children 接收）
   - `'use server'` 函数可以从 Client Component 中调用（通过网络），也可以从 Server Component 直接调用（直接执行）

4. **安全注意事项**：Server Action 暴露为 HTTP 端点，所有参数都需要在服务端进行权限校验和输入验证，不能假设调用方是可信的。

---

## 八、手写实现题

### 手写 useState 简版实现（链表 + 闭包）

```js
let workInProgressHook = null  // 当前正在处理的 hook
let currentHook = null         // 对应的旧 hook（update 阶段）
let isMount = true             // 是否是首次渲染

// 模拟 Fiber 节点，存储 hooks 链表
const fiber = {
  stateNode: App,  // 对应的组件函数
  memoizedState: null  // hooks 链表头
}

function useState(initialState) {
  let hook

  if (isMount) {
    // mount 阶段：创建新的 hook 节点
    hook = {
      memoizedState: typeof initialState === 'function' ? initialState() : initialState,
      queue: { pending: null },
      next: null
    }
    // 追加到链表末尾
    if (!fiber.memoizedState) {
      fiber.memoizedState = hook
    } else {
      workInProgressHook.next = hook
    }
    workInProgressHook = hook
  } else {
    // update 阶段：取出对应的旧 hook
    hook = workInProgressHook
    workInProgressHook = workInProgressHook.next

    // 处理更新队列
    let baseState = hook.memoizedState
    if (hook.queue.pending) {
      let update = hook.queue.pending.next  // 环形链表，从第一个 update 开始
      do {
        const action = update.action
        baseState = typeof action === 'function' ? action(baseState) : action
        update = update.next
      } while (update !== hook.queue.pending.next)
      hook.queue.pending = null
    }
    hook.memoizedState = baseState
  }

  function dispatch(action) {
    // 将 action 加入更新队列（环形链表）
    const update = { action, next: null }
    if (!hook.queue.pending) {
      update.next = update
    } else {
      update.next = hook.queue.pending.next
      hook.queue.pending.next = update
    }
    hook.queue.pending = update
    // 触发重渲染
    schedule()
  }

  return [hook.memoizedState, dispatch]
}

function schedule() {
  // 重置指针，进入 update 阶段
  workInProgressHook = fiber.memoizedState
  isMount = false
  fiber.stateNode()  // 重新执行组件函数
}
```

---

### 手写 useEffect 简版实现（依赖比较 + 清理函数）

```js
function useEffect(callback, deps) {
  let hook

  if (isMount) {
    hook = {
      memoizedState: {
        deps: null,
        cleanup: undefined
      },
      next: null
    }
    // 挂到链表...（同 useState）
    workInProgressHook = hook
    // mount 阶段：标记需要执行 effect
    hook.memoizedState.deps = deps
    // 在 commit 阶段执行（简化：直接执行）
    queueMicrotask(() => {
      hook.memoizedState.cleanup = callback()
    })
  } else {
    hook = workInProgressHook
    workInProgressHook = workInProgressHook.next

    const prevDeps = hook.memoizedState.deps

    // 比较依赖是否变化
    const hasChanged = deps == null  // 没有传依赖数组，每次都执行
      || prevDeps == null
      || deps.some((dep, i) => !Object.is(dep, prevDeps[i]))

    if (hasChanged) {
      // 先执行旧的 cleanup
      if (hook.memoizedState.cleanup) {
        hook.memoizedState.cleanup()
      }
      hook.memoizedState.deps = deps
      queueMicrotask(() => {
        hook.memoizedState.cleanup = callback()
      })
    }
  }
}
```

---

### 手写 usePrevious

```js
function usePrevious(value) {
  const ref = useRef(undefined)

  useEffect(() => {
    ref.current = value
    // 不返回 cleanup，不传依赖（每次渲染后都更新）
  })

  return ref.current  // 本次渲染返回上次的值
}

// 使用
const [count, setCount] = useState(0)
const prevCount = usePrevious(count)
// 点击后：count = 1, prevCount = 0
```

---

### 手写 useDebounce / useThrottle

**useDebounce（防抖值）**：
```js
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)  // 每次 value 变化，清除上次定时器
  }, [value, delay])

  return debouncedValue
}
```

**useThrottle（节流函数）**：
```js
function useThrottle(fn, delay = 300) {
  const lastTimeRef = useRef(0)
  const timerRef = useRef(null)

  return useCallback((...args) => {
    const now = Date.now()
    const remaining = delay - (now - lastTimeRef.current)

    if (remaining <= 0) {
      // 距上次执行已超过 delay，立即执行
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      lastTimeRef.current = now
      fn(...args)
    } else {
      // 在时间窗口内，延迟到窗口结束时执行（确保最后一次调用被执行）
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        lastTimeRef.current = Date.now()
        fn(...args)
      }, remaining)
    }
  }, [fn, delay])
}
```

---

### 手写简版 Redux（createStore + subscribe + dispatch）

```js
function createStore(reducer, preloadedState, enhancer) {
  // 支持 applyMiddleware 作为第二或第三参数
  if (typeof preloadedState === 'function' && !enhancer) {
    enhancer = preloadedState
    preloadedState = undefined
  }

  if (enhancer) {
    return enhancer(createStore)(reducer, preloadedState)
  }

  let state = preloadedState
  let listeners = []
  let isDispatching = false

  function getState() {
    if (isDispatching) throw new Error('不能在 reducer 中调用 getState')
    return state
  }

  function subscribe(listener) {
    if (isDispatching) throw new Error('不能在 reducer 中调用 subscribe')
    listeners.push(listener)
    return function unsubscribe() {
      listeners = listeners.filter(l => l !== listener)
    }
  }

  function dispatch(action) {
    if (isDispatching) throw new Error('不能在 reducer 中调用 dispatch')
    try {
      isDispatching = true
      state = reducer(state, action)
    } finally {
      isDispatching = false
    }
    listeners.forEach(listener => listener())
    return action
  }

  // 触发初始 action，让 reducer 返回初始 state
  dispatch({ type: '@@INIT' })

  return { getState, subscribe, dispatch }
}

// 使用示例
const store = createStore((state = { count: 0 }, action) => {
  switch (action.type) {
    case 'INCREMENT': return { count: state.count + 1 }
    case 'DECREMENT': return { count: state.count - 1 }
    default: return state
  }
})

store.subscribe(() => console.log(store.getState()))
store.dispatch({ type: 'INCREMENT' })  // { count: 1 }
```

---

### 手写 compose 函数（Redux 中间件核心）

```js
// compose(f, g, h)(x) => f(g(h(x)))
function compose(...fns) {
  if (fns.length === 0) return x => x
  if (fns.length === 1) return fns[0]

  return fns.reduce((f, g) => (...args) => f(g(...args)))
}

// 验证
const add1 = x => x + 1
const double = x => x * 2
const square = x => x * x

const transform = compose(add1, double, square)
console.log(transform(3))  // add1(double(square(3))) = add1(double(9)) = add1(18) = 19

// Redux applyMiddleware 中的用法
function applyMiddleware(...middlewares) {
  return createStore => (reducer, preloadedState) => {
    const store = createStore(reducer, preloadedState)
    let dispatch = () => { throw new Error('不能在构建中间件时 dispatch') }

    const middlewareAPI = {
      getState: store.getState,
      dispatch: action => dispatch(action)
    }

    // 每个中间件获得 middlewareAPI，返回 next => action => ... 函数
    const chain = middlewares.map(middleware => middleware(middlewareAPI))

    // 从右到左组合：最右边的先执行，最左边的最外层
    dispatch = compose(...chain)(store.dispatch)

    return { ...store, dispatch }
  }
}

// 中间件示例（logger）
const logger = ({ getState }) => next => action => {
  console.log('before', getState())
  const result = next(action)
  console.log('after', getState())
  return result
}
```

---

## 附：近三年考察趋势总结

| 维度 | 2022–2023 | 2024 | 2025–2026 |
|------|-----------|------|-----------|
| Hooks 原理 | 使用规则、闭包陷阱 | 链表实现、自定义 Hook | 同上 + React Compiler |
| Fiber 架构 | 概念介绍 | 双缓存、中断恢复 | Lane 模型细节 |
| diff 算法 | 三策略 | 对比 Vue3 diff | 同上 |
| 性能优化 | memo/useMemo | 状态下沉、Context 拆分 | Compiler 自动优化 |
| 状态管理 | Redux 原理 | Zustand/Jotai 对比 | 原子化状态 |
| 并发特性 | 几乎不考 | useTransition 入门 | 深度追问 + React 19 新 API |
| RSC / Server Actions | 不考 | 概念了解 | 字节/阿里 P7 高频必问 |
| React 19 新 Hooks | 不考 | useOptimistic 了解 | use/useActionState/Actions 全线考 |

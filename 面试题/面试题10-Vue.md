# Vue 面试题


---

## 一、响应式原理

### 1. Vue2 和 Vue3 响应式的区别（defineProperty vs Proxy）

**参考答案：**

1. **实现方式不同**
   - Vue2 用 `Object.defineProperty` 逐个劫持对象属性的 getter/setter，初始化时递归遍历所有嵌套属性
   - Vue3 用 `Proxy` 代理整个对象，只需一层代理，嵌套对象懒代理（访问时才代理）

2. **局限性差异**
   - `defineProperty` 无法检测属性的**新增和删除**，需要用 `Vue.set()`/`$set()` 补丁
   - `defineProperty` 无法直接检测**数组下标**修改（`arr[0] = 1`）和 `length` 变更，Vue2 通过重写 7 个变异方法绕过
   - `Proxy` 可以拦截 13 种操作，天然支持属性新增/删除、数组下标、`length` 修改

3. **性能差异**
   - Vue2 初始化时对整个对象深度递归遍历，大对象初始化开销大
   - Vue3 `Proxy` 是懒代理，只有真正访问到嵌套属性时才递归代理，初始化更快

4. **代码示例**
```js
// Vue2 的问题
const vm = new Vue({ data: { obj: { a: 1 } } })
vm.obj.b = 2  // ❌ 不响应，需要 Vue.set(vm.obj, 'b', 2)
vm.arr[0] = 'x'  // ❌ 不响应

// Vue3 用 Proxy 天然支持
const state = reactive({ obj: { a: 1 }, arr: [1, 2] })
state.obj.b = 2  // ✅ 响应
state.arr[0] = 'x'  // ✅ 响应
```

---

### 2. Proxy 相比 defineProperty 有哪些优势？

**参考答案：**

1. **监听能力更强**
   - 可以监听属性**新增**（set trap 捕获新属性赋值）
   - 可以监听属性**删除**（deleteProperty trap）
   - 可以监听**数组下标**赋值和 `length` 变更

2. **拦截操作更全面**：支持 13 种 trap，包括 `get`/`set`/`has`/`deleteProperty`/`ownKeys`/`apply`/`construct` 等，`defineProperty` 只能劫持 get/set

3. **懒代理性能更优**：嵌套对象在访问时才递归代理（`get` trap 中判断返回值是否为对象，是则 `reactive` 包裹），而非初始化时全量递归

4. **代码更简洁**：一个 Proxy 代理整个对象，无需对每个 key 分别调用 `defineProperty`

5. **与 Reflect 配合**：使用 `Reflect.get/set` 确保 this 指向正确，避免 `defineProperty` 中 `this` 绑定问题

```js
// Proxy 实现
const handler = {
  get(target, key) {
    track(target, key)
    const res = Reflect.get(target, key)
    // 懒代理：嵌套对象在访问时才包裹
    return isObject(res) ? reactive(res) : res
  },
  set(target, key, value) {
    Reflect.set(target, key, value)
    trigger(target, key)
    return true
  }
}
```

---

### 3. Vue3 的 track / trigger 机制？依赖如何收集？

**参考答案：**

1. **整体流程**：响应式系统的核心是"读时收集依赖，写时派发更新"
   - `effect(fn)` 执行时设置全局 `activeEffect = fn`，然后执行 fn
   - fn 执行过程中读取响应式数据，触发 `get` trap → 调用 `track`
   - 数据变更时触发 `set` trap → 调用 `trigger`，执行收集到的 effect

2. **track 依赖收集**
```js
// 数据结构：WeakMap<target, Map<key, Set<effect>>>
const targetMap = new WeakMap()

function track(target, key) {
  if (!activeEffect) return  // 非 effect 内的读取不收集
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  dep.add(activeEffect)  // 将当前 effect 加入该属性的依赖集合
}
```

3. **trigger 派发更新**
```js
function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)
  effects?.forEach(effect => {
    if (effect.scheduler) effect.scheduler()  // computed/watch 走调度器
    else effect()  // 普通 effect 直接执行
  })
}
```

4. **为什么用 WeakMap**：target 是对象引用，WeakMap 允许 GC 在 target 不再被引用时自动释放依赖，避免内存泄漏

5. **调度器（scheduler）的作用**：computed 和 watch 的 effect 有 scheduler，数据变更时不立即执行 effect 本身，而是走调度逻辑（computed 标记 dirty，watch 加入异步队列）

---

### 4. `ref` 和 `reactive` 的区别？

**参考答案：**

1. **适用类型**
   - `ref`：适用任意类型，包括基本类型（string/number/boolean）和对象
   - `reactive`：只适用**对象类型**（object/array/Map/Set），对基本类型无效

2. **访问方式**
   - `ref` 通过 `.value` 访问，模板中自动解包（不需要写 `.value`）
   - `reactive` 直接访问属性，无需 `.value`

3. **实现原理**
   - `ref` 内部对基本类型用对象包裹 `{ value: ... }`，用 getter/setter 拦截；对象类型内部仍调用 `reactive`
   - `reactive` 直接用 `Proxy` 代理对象

4. **解构行为**
   - `reactive` 对象解构会失去响应性，需用 `toRefs`
   - `ref` 本身就是一个响应式 ref 对象，可以直接赋值传递

5. **使用选择**
   - 基本类型必须用 `ref`
   - 表单数据、大对象推荐 `reactive`
   - 单个值、Composable 返回值推荐 `ref`（灵活传递不丢响应性）

---

### 5. `reactive` 解构后失去响应式的原因？如何解决？

**参考答案：**

1. **根本原因**：`reactive` 的响应性依赖 `Proxy` 的 `get` trap 在访问属性时触发 `track`。解构本质是**赋值操作**，将 Proxy 对象某个属性的当前值赋给一个新的局部变量，这个变量是普通值，不再经过 Proxy，因此失去响应性。

```js
const state = reactive({ count: 0, name: 'Vue' })

// ❌ 解构后失去响应性
const { count, name } = state
// count 和 name 只是普通变量，修改 state.count 不会同步到 count

// ✅ 方案1：toRefs 解构
const { count, name } = toRefs(state)
// count 和 name 是 ref 对象，count.value 保持响应性

// ✅ 方案2：不解构，直接用
state.count++
```

2. **`toRefs` 的原理**：对 reactive 对象的每个属性创建一个 `ref`，该 ref 的 getter/setter 指向原 reactive 对象的对应属性，保持了响应性链接

3. **Vue 3.5 的新解法**：在 `defineProps` 中解构 props 时，编译器自动将解构后的变量替换为对 `props.xxx` 的访问，保留响应性（仅限 props，不适用普通 reactive）

---

### 6. `computed` 缓存原理？和 `watch` 底层调度有何不同？

**参考答案：**

1. **computed 的缓存机制**
   - 内部是一个带调度器 `scheduler` 的懒执行 effect，有 `dirty` 标记（初始为 `true`）
   - 第一次访问 `.value`：`dirty === true`，执行 getter 计算，结果缓存，`dirty = false`
   - 依赖未变时再次访问：`dirty === false`，直接返回缓存值，不重新计算
   - 依赖变更时：调度器（scheduler）将 `dirty` 置为 `true`，**不立即重算**，下次访问才重算
   - 如果新旧值相同（用 `===` 比较），不触发依赖它的 effect 更新（避免不必要渲染）

2. **computed 的懒执行**：创建时不立即执行 getter，只有被访问时才执行（相比 `watchEffect` 立即执行）

3. **watch 的调度**
   - watch 的 effect 有 scheduler，依赖变更时将回调加入**异步队列**（`queueJob`）
   - 在下一个微任务中批量执行（flush 策略默认 `'pre'`，在组件更新前执行）
   - 可配置 `flush: 'post'`（组件更新后）或 `flush: 'sync'`（同步立即执行）

4. **本质区别**：computed 是**同步派生值**（访问时才计算），watch 是**异步副作用**（变更后异步执行回调）

---

### 7. `watchEffect` 和 `watch` 的区别，依赖收集方式差异？

**参考答案：**

| | `watch` | `watchEffect` |
|---|---|---|
| 依赖声明 | 显式声明侦听源 | 自动收集同步路径上的依赖 |
| 执行时机 | 惰性（默认源变了才执行） | 立即执行一次 |
| 旧值访问 | 可访问 oldValue/newValue | 不能 |
| 清理副作用 | onCleanup 参数 | onCleanup 参数 |

1. **依赖收集的关键差异**：`watchEffect` 在执行 effect 函数时，自动收集**同步代码路径**上读取到的所有响应式数据作为依赖。但 `await` 后的代码是异步的，不在同步收集范围内。

```js
// 隐蔽 bug：await 后的响应式读取不会被收集
watchEffect(async () => {
  const res = await fetch(url)       // await 打断了同步收集
  console.log(state.count)           // ❌ state.count 不会被收集为依赖
})

// 正确做法：在 await 之前读取响应式数据
watchEffect(async () => {
  const count = state.count          // ✅ 同步读取，被收集
  const res = await fetch(`/api?count=${count}`)
})
```

2. **watch 的精确控制**：watch 明确指定侦听源，只有源变化才触发，避免意外依赖

```js
// watch 可以访问旧值
watch(
  () => state.count,
  (newVal, oldVal) => {
    console.log(`${oldVal} → ${newVal}`)
  },
  { immediate: true, deep: false }
)
```

3. **适用场景**：副作用与某响应式数据紧密相关用 `watchEffect`；需要旧值对比、精确控制触发时机用 `watch`

---

### 8. Vue2 数组变更检测为何重写数组方法？Vue3 如何解决？

**参考答案：**

1. **Vue2 的问题根源**：`Object.defineProperty` 只能劫持对象属性的 get/set，而数组的 `push`/`pop`/`splice` 等操作不会触发对应下标的 setter，因此无法感知变更

2. **Vue2 的解决方案**：对数组的原型进行拦截，重写 7 个变异方法：
   - `push`、`pop`、`shift`、`unshift`、`splice`、`sort`、`reverse`
   - 创建新原型对象，继承 `Array.prototype`，重写这 7 个方法：先执行原始操作，再手动调用 `dep.notify()` 触发更新

3. **Vue2 仍然无法响应的操作**（需用 `$set` 或替换整个数组）：
   - `arr[0] = 'new'`（下标直接赋值）
   - `arr.length = 0`（修改 length）

4. **Vue3 的解决方案**：`Proxy` 的 `set` trap 可以捕获任何形式的赋值，包括数组下标赋值和 `length` 修改，天然支持，无需额外处理：

```js
const arr = reactive([1, 2, 3])
arr[0] = 10      // ✅ Proxy set trap 捕获，触发响应
arr.length = 1   // ✅ Proxy set trap 捕获，触发响应
arr.push(4)      // ✅ 触发多次 set（index 3 和 length），Vue3 内部去重处理
```

---

### 9. `setup()` 中 `props` 解构为什么会丢失响应性？

**参考答案：**

1. **原因**：`props` 是用 `shallowReactive` 包裹的响应式对象（浅响应式）。直接解构 `const { title } = props` 是赋值操作，将当前值赋给局部变量，断开了与 Proxy 的联系，后续 props 更新不会同步到解构出的变量。

2. **解决方案**
```ts
// ❌ 直接解构，失去响应性
const { title } = props

// ✅ 方案1：toRefs 解构
const { title } = toRefs(props)
// title 是 ref，title.value 保持响应性

// ✅ 方案2：toRef 单个属性
const title = toRef(props, 'title')

// ✅ 方案3：Vue 3.5+ 响应式 props 解构（编译器处理）
const { title = 'default' } = defineProps<{ title?: string }>()
// 编译器将 title 替换为 props.title 的访问
```

3. **Vue 3.5 的响应式 props 解构原理**：编译阶段将解构变量的使用替换为对 `props.xxx` 的访问，不是真正的 JS 解构，而是编译器语法糖

---

### 10. Vue 3.5 响应式性能提升 56% 的核心原因？

**参考答案：**

1. **旧版本的问题**：Vue 3.4 及之前版本用 `Set` 存储每个 Dep 的订阅者，用 `Set` 存储每个 Sub（effect）的依赖，Set 内部用哈希表实现，增删查都有哈希计算开销，且内存碎片化。

2. **Vue 3.5 的双向链表方案**：引入 `Link` 节点构建双向链表结构：
   - `Dep`（响应式属性）维护一个纵向链表（`subs`），连接所有订阅它的 Sub
   - `Sub`（effect/computed/watch）维护一个横向链表（`deps`），连接所有被它依赖的 Dep
   - `Link` 节点同时属于两个链表，维护 4 个指针：`nextSub`/`prevSub`（纵向）+ `nextDep`/`prevDep`（横向）

```
       Sub A     Sub B     Sub C
         |         |         |
Dep1  Link1  -- Link2  -- Link3
         |         |         |
Dep2  Link4  ------+   -- Link5
```

3. **版本计数（version counter）优化**：每次 trigger 时递增版本号，Sub 在重新收集依赖时通过比较版本号跳过未变更的依赖，避免重复派发

4. **性能提升原因**：
   - 链表操作（指针跳转）比哈希表操作更快，内存局部性更好
   - 减少了临时对象的创建（不再需要每次收集都创建新的 Set 元素）
   - 版本计数避免了不必要的依赖重新收集

---

## 二、nextTick

### 11. `nextTick` 的原理是什么？

**参考答案：**

1. **为什么需要 nextTick**：Vue 的 DOM 更新是**异步批量**的。数据变更后不立即更新 DOM，而是将所有变更收集到一个队列，在下一个微任务中批量执行，避免同一 tick 内多次修改数据导致多次渲染。

2. **nextTick 的作用**：将回调延迟到下一次 DOM 更新之后执行，确保能拿到更新后的 DOM。

3. **Vue2 降级策略**（从上到下依次尝试）：
   - `Promise.then`（微任务，首选）
   - `MutationObserver`（微任务，兼容）
   - `setImmediate`（宏任务，IE/Node）
   - `setTimeout`（宏任务，兜底）

4. **Vue3 的简化**：直接用 `Promise.then`，移除降级逻辑（现代浏览器全面支持 Promise）

```ts
// Vue3 源码简化版
const resolvedPromise = Promise.resolve()
let currentFlushPromise: Promise<void> | null = null

export function nextTick(fn?: () => void): Promise<void> {
  const p = currentFlushPromise || resolvedPromise
  return fn ? p.then(fn) : p
}
```

5. **使用场景**：在修改数据后立即获取更新后的 DOM 尺寸、操作 DOM 元素等

```ts
state.list = newData
await nextTick()
// 此时 DOM 已更新，可以安全操作 DOM
const height = listEl.value.scrollHeight
```

---

### 12. Vue 为什么把 DOM 更新设计成异步的？

**参考答案：**

1. **避免重复渲染**：同一个 tick 内可能多次修改数据，如果每次修改都立即更新 DOM，会导致大量无意义的中间状态渲染，性能极差。

```js
// 如果同步更新，以下代码会触发 3 次 DOM 更新
count.value = 1   // 渲染一次
count.value = 2   // 再渲染一次
count.value = 3   // 再渲染一次

// 异步批量更新：3 次赋值在同一 tick，只渲染最终状态 3，触发一次 DOM 更新
```

2. **去重机制**：Vue 将 effect 加入 Set 去重的 queue，同一 effect 不会重复入队，保证每个组件只更新一次。

3. **排序保证**：flush 时按 effect 的 id 从小到大排序，确保父组件在子组件之前更新（父组件 id 更小），避免子组件拿到过期 props。

4. **与 JavaScript 单线程模型契合**：利用微任务队列，在当前同步代码全部执行完后、下一个宏任务前批量处理 DOM 更新，兼顾性能和时机。

---

### 13. `nextTick` 内部的 flush 队列机制（queueFlush / flushJobs）

**参考答案：**

1. **完整流程**：
```
数据变更
  → trigger
  → queueJob(effect)  将 effect 加入 queue（Set 去重）
  → queueFlush()      如果没在 flush 中，调度 flushJobs
  → Promise.then(flushJobs)  下一微任务执行
  → flushJobs()       按 id 排序，执行所有 job
  → flushPostFlushCbs() 执行 postFlush 回调（nextTick 的回调在这里）
```

2. **queueFlush 的防重复调度**：
```js
let isFlushing = false
let isFlushPending = false

function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}
```

3. **flushJobs 的排序**：
```js
function flushJobs() {
  queue.sort((a, b) => getId(a) - getId(b))  // id 小的先执行（父组件先于子组件）
  // 执行所有 job
  // 执行完后 flushPostFlushCbs
}
```

4. **三类回调的执行顺序**：
   - `pre` flush（默认）：组件更新前（watch 默认）
   - 组件更新（渲染 effect）
   - `post` flush：组件更新后（`watch({ flush: 'post' })` 和 `nextTick` 回调）

---

### 14. `nextTick` 和 `Promise.then` 执行顺序？

**参考答案：**

1. **都是微任务**，执行顺序取决于**入队顺序**：

```js
// 数据变更后，手动 Promise 在 nextTick 之前
count.value = 1  // 触发 queueFlush，将 flushJobs 加入微任务队列（位置1）
Promise.resolve().then(() => console.log('A'))  // 加入微任务队列（位置2）
nextTick(() => console.log('B'))  // nextTick 的回调在 flushJobs 内部的 postFlush 阶段

// 执行顺序：flushJobs（DOM更新）→ A → B
// 实际输出：A 先于 B
```

2. **关键结论**：
   - `nextTick` 的回调在 `flushJobs` 完成（DOM 更新完）之后才执行
   - 在同一个数据变更之后创建的 `Promise.then` 会在 nextTick 回调之前执行
   - 如果 `Promise.resolve().then` 在数据变更之前，则在 flushJobs 之前执行

3. **实际意义**：`nextTick` 保证的是"DOM 更新完成后"，不是"下一个微任务"

---

### 15. 在 `created` 钩子里能用 `nextTick` 获取 DOM 吗？

**参考答案：**

1. **可以**。虽然 `created` 时 DOM 还未挂载（`mounted` 之后才挂载），但 `nextTick` 会等到 **DOM 挂载并更新完成后**才执行回调，所以能获取到 DOM。

2. **原理**：组件的挂载过程（`mount`）本身会触发渲染 effect，这个 effect 会在 nextTick 的微任务队列中执行，执行完后 DOM 就已经存在了，nextTick 的回调在 postFlush 阶段执行，自然能获取到 DOM。

```ts
export default {
  created() {
    this.$nextTick(() => {
      // ✅ 此时 DOM 已挂载，可以访问
      console.log(this.$el.innerHTML)
    })
  }
}
```

3. **推荐做法**：需要操作 DOM 的逻辑优先放在 `mounted` 钩子，语义更清晰，`created` 里用 `nextTick` 虽然可行但非惯用法。

---

## 三、虚拟 DOM 与 Diff 算法

### 16. Vue2 双端 diff 和 Vue3 快速 diff 算法的区别？

**参考答案：**

1. **Vue2 双端 diff（四指针算法）**
   - 维护新旧各一对头尾指针（oldStart/oldEnd/newStart/newEnd）
   - 每轮按顺序尝试：头头比、尾尾比、旧头新尾比、旧尾新头比
   - 命中则移动对应节点和指针；未命中则在旧节点中遍历查找 key 匹配的节点
   - 循环直到某一方指针交叉结束

```
旧：A B C D
新：D B A C

第1轮：头头(A≠D)不中 → 尾尾(D=D)中！D不动，旧尾--，新尾--
第2轮：头头(A≠C)不中 → 尾尾(C=C)中！C不动
... 以此类推
```

2. **Vue3 快速 diff（最优解算法）**
   - 预处理：从头部开始比较相同节点，从尾部开始比较相同节点，快速跳过不变部分
   - 简单情况处理：剩余全为新增或全为删除，直接 mount/unmount
   - 乱序处理：为新节点建立 `key → index` 的 Map，遍历旧节点找出可复用节点，对可复用节点的 newIndex 序列求**最长递增子序列（LIS）**，LIS 中的节点不需要移动，其余节点按 LIS 位置插入

3. **差异总结**

| | Vue2 双端 diff | Vue3 快速 diff |
|---|---|---|
| 算法 | 四指针双端比较 | 预处理 + LIS |
| DOM 移动次数 | 较多 | 最少（LIS 保证） |
| 时间复杂度 | O(n) | O(n log n)（LIS 用二分） |
| 适用场景 | 通用 | 大量乱序节点更优 |

---

### 17. key 的作用？为什么不推荐用 index 作 key？

**参考答案：**

1. **key 的作用**：key 是 diff 算法中识别 VNode 的**唯一标识**，相同 key 的新旧节点会尝试复用（patch），不同 key 的节点会销毁重建。有了 key，diff 从 O(n²) 降到 O(n)。

2. **不推荐 index 的原因**：列表增删时 index 重新分配，导致 diff 将错误的旧节点与新节点关联：

```html
<!-- 初始：[A, B, C]，key 分别是 0, 1, 2 -->
<!-- 删除 A 后：[B, C]，key 变成 0, 1 -->
<!-- diff 认为 key=0 的节点从 A 变成了 B，会 patch A→B，而不是删除 A -->
```

3. **实际问题场景**：
   - **表单输入**：删除第一项后，第二项的输入框内容残留在第一项位置（因为 DOM 被复用）
   - **动画状态**：Transition 动画错乱
   - **性能**：复用了错误的 DOM，导致大量 patch 操作而非简单移动

4. **正确 key 的选择**：业务唯一 id（如数据库主键 `item.id`），若无唯一 id 用 `item.name + item.type` 等组合

---

### 18. Vue3 diff 中最长递增子序列（LIS）解决了什么问题？

**参考答案：**

1. **问题背景**：在乱序 diff 中，需要将旧节点重新排列成新节点的顺序，每次 DOM 移动都有性能开销，目标是**最小化 DOM 移动次数**。

2. **LIS 的作用**：LIS（最长递增子序列）找出在新节点序列的旧 index 映射中，哪些节点的相对顺序本来就是正确的（不需要移动）。只需移动不在 LIS 中的节点。

3. **具体流程**：
```
旧节点：[A, B, C, D, E]  →  index: [0,1,2,3,4]
新节点：[D, A, B, C, E]

建立 newIndexToOldIndexMap（新index → 旧index）:
D(new:0) → old:3
A(new:1) → old:0
B(new:2) → old:1
C(new:3) → old:2
E(new:4) → old:4

旧 index 序列：[3, 0, 1, 2, 4]
LIS = [0, 1, 2, 4]（对应 A, B, C, E）

→ A B C E 不需要移动，只需将 D 移动到最前面
→ 只 1 次 DOM 移动！（暴力做法需要多次移动）
```

4. **为什么用二分查找优化 LIS**：LIS 算法用贪心 + 二分，时间复杂度 O(n log n)，比 O(n²) 的朴素算法更快

---

### 19. 虚拟 DOM 一定比直接操作真实 DOM 快吗？

**参考答案：**

1. **不一定**。虚拟 DOM 的优势不是"快"，而是**可维护性和跨平台**。

2. **虚拟 DOM 的开销**：每次渲染需要创建大量 VNode 对象，执行 diff 算法比对新旧 VNode 树，这些都是 JS 层面的额外开销

3. **虚拟 DOM 更慢的场景**：简单、少量的 DOM 操作（如改一个文本），直接 `el.textContent = 'xxx'` 比经历 VNode 创建 → diff → patch 更快。

4. **虚拟 DOM 更有优势的场景**：
   - 复杂页面，数据变化时避免全量 DOM 重建（只更新变化部分）
   - 批量更新：多次数据变更合并为一次 DOM 更新
   - 跨平台：同一套 VNode 描述可以渲染到 DOM、Canvas、Native 等

5. **核心价值**：虚拟 DOM 提供了一层抽象，让开发者用声明式写 UI，框架负责最优的 DOM 更新策略，**在中大型应用中综合性能更好**，而不是让每次操作都更快。

---

### 20. 什么是 patchFlag？静态提升（hoistStatic）做了什么？

**参考答案：**

**patchFlag（补丁标记）：**

1. **作用**：编译时对动态节点打上位运算标记，运行时 diff 根据标记**只处理真正动态的部分**，跳过不必要的比较。

2. **标记值**（位运算，可组合）：
   - `1 (TEXT)`：动态文本内容
   - `2 (CLASS)`：动态 class
   - `4 (STYLE)`：动态 style
   - `8 (PROPS)`：动态命名 props
   - `16 (FULL_PROPS)`：包含动态 key 的 props
   - `-1 (HOISTED)`：静态节点，完全跳过 diff
   - `-2 (BAIL)`：退出优化模式，走完整 diff

3. **运行时效果**：
```js
// 编译后的代码（简化）
createVNode("div", { class: _ctx.cls, style: _ctx.style }, _ctx.text, 6 /* CLASS | STYLE */)
// 运行时只对比 class 和 style，跳过其他属性
```

**静态提升（hoistStatic）：**

1. **作用**：将**完全静态的节点**（没有任何动态绑定）提升到渲染函数外部，只在模块初始化时创建一次，每次渲染直接复用引用。

2. **效果**：
```js
// 未提升（每次渲染都创建新 VNode）
function render() {
  return createVNode('div', null, [
    createVNode('span', null, 'Static Text'),  // 每次都创建
    createVNode('p', null, dynamic.value)
  ])
}

// 提升后
const hoisted = createVNode('span', null, 'Static Text')  // 只创建一次
function render() {
  return createVNode('div', null, [
    hoisted,  // 直接复用引用
    createVNode('p', null, dynamic.value)
  ])
}
```

3. **静态 props 提升**：不只是节点，静态的 props 对象也会被提升（如 `{ class: 'btn', id: 'x' }`）

---

## 四、Vue3 编译优化

### 21. Vue3 编译阶段的完整优化链路？

**参考答案：**

1. **静态节点提升（hoistStatic）**：静态 VNode 和静态 props 提到渲染函数外，只创建一次，每次渲染复用引用

2. **PatchFlag 标记**：编译时分析每个动态节点的动态部分（text/class/style/props），打上位运算标记，运行时只对比有标记的属性，跳过静态属性的比较

3. **BlockTree 动态子树追踪**：
   - 编译时将含有动态内容的节点标记为 Block 节点
   - Block 节点在创建时主动收集其子树内所有动态后代节点到 `dynamicChildren` 数组
   - diff 时直接遍历 `dynamicChildren`，跳过静态子树，将 O(n) diff 降为 O(动态节点数)

4. **事件处理函数缓存（cacheHandlers）**：
```js
// 未缓存：每次渲染创建新函数
// 缓存后：
_cache[0] || (_cache[0] = $event => handleClick($event))
// 第一次创建后缓存，后续直接复用同一个函数引用
```

5. **`v-memo` 指令（手动优化）**：
```html
<!-- 只有 item.id 或 item.name 变化时才重新渲染该子树 -->
<div v-memo="[item.id, item.name]">
  <!-- 大量静态内容 -->
</div>
```

6. **Fragment 支持**：Vue3 允许多根节点（Fragment），减少不必要的包装 div，降低 DOM 层级

---

### 22. template 如何编译成 render 函数？经历哪几个阶段？

**参考答案：**

1. **三个阶段**

   **① parse（解析）**：template 字符串 → AST
   - 词法分析：将 HTML 字符串解析为 token（开始标签、文本、结束标签、注释等）
   - 语法分析：基于 HTML 规范构建节点树（AST）
   - 处理 Vue 特有语法：`{{ }}` 插值、指令、动态属性等

   **② transform（转换/优化）**：AST → 优化后的 AST
   - 应用各类转换插件（指令处理器、v-if/v-for 转换器等）
   - 静态分析：标记纯静态节点（`PatchFlags.HOISTED`）
   - 分析动态节点，打 PatchFlag
   - 建立 Block Tree，标记动态子节点收集点
   - 提升静态节点（hoistStatic）

   **③ generate（代码生成）**：优化后的 AST → render 函数字符串
   - 将 AST 节点转换为 `createVNode`/`createBlock` 等调用的代码字符串
   - 生成的代码通过 `new Function` 或直接 eval 得到可执行的 render 函数

2. **完整示例**
```html
<!-- template -->
<div :class="cls">{{ text }}</div>

<!-- 编译后的 render 函数（简化） -->
function render(_ctx) {
  return createElementVNode("div",
    { class: _ctx.cls },
    toDisplayString(_ctx.text),
    6 /* CLASS | TEXT */
  )
}
```

3. **Vite/webpack 中的编译时机**：构建时通过 `@vitejs/plugin-vue` 或 `vue-loader` 完成编译，浏览器运行时只有 Runtime-only 版本（不含编译器）

---

### 23. `v-if` 和 `v-for` 哪个优先级更高？为什么不能同时用？

**参考答案：**

1. **优先级**：
   - **Vue3**：`v-if` 优先级**高于** `v-for`
   - **Vue2**：`v-for` 优先级**高于** `v-if`（两者相反）

2. **同时使用的问题**

   Vue3 中 `v-if` 先执行，此时 `v-for` 的循环变量（如 `item`）还未定义，会报错 `item is not defined`

   Vue2 中 `v-for` 先执行，相当于每次循环都执行一次 `v-if` 判断，性能浪费

3. **正确解决方案**

   方案一：用 `<template>` 将 `v-for` 和 `v-if` 分层
   ```html
   <template v-if="showList">
     <li v-for="item in list">{{ item.name }}</li>
   </template>
   ```

   方案二：用 `computed` 提前过滤数据（推荐）
   ```js
   const visibleList = computed(() => list.filter(item => item.visible))
   ```

---

### 24. Runtime-only 和 Runtime+Compiler 版本的区别？

**参考答案：**

1. **Runtime-only（运行时版）**：
   - 不包含模板编译器，template 在构建阶段已由 vue-loader/vite 编译为 render 函数
   - 体积更小（约少 30%，约少 10KB gzip）
   - 日常开发 99% 用这个版本（通过脚手架创建的项目默认使用）

2. **Runtime+Compiler（完整版）**：
   - 包含运行时模板编译器，可以在浏览器中动态编译 template 字符串
   - 使用场景：CDN 直接引入 Vue 且在 HTML 中写 template；运行时动态生成并编译模板字符串

3. **关键区别**：
```js
// ❌ Runtime-only 不支持：运行时编译 template 字符串
const app = createApp({ template: '<div>{{ msg }}</div>' })

// ✅ Runtime-only 支持：render 函数（已是编译产物）
const app = createApp({
  render() { return h('div', this.msg) }
})
```

---

### 25. SFC 是如何被 Vite / webpack 处理的？

**参考答案：**

1. **处理工具**：Vite 用 `@vitejs/plugin-vue`，webpack 用 `vue-loader`

2. **处理流程**（以 Vite 为例）：
   - **`<template>`**：调用 `@vue/compiler-sfc` 的 `compileTemplate`，编译为 render 函数，打 PatchFlag/静态提升等优化
   - **`<script setup>`**：调用 `compileScript`，转换宏命令（defineProps/defineEmits/defineExpose），输出标准 setup() 函数
   - **`<style scoped>`**：给每个选择器添加 `[data-v-xxxxxx]` 属性选择器，同时给模板元素添加对应属性，确保样式作用域隔离

3. **Vite 的额外优化**：
   - 开发时利用浏览器原生 ESM，按需编译（不打包），修改一个文件只重新编译该文件
   - HMR（热更新）粒度到组件内部（只替换 script/template/style 中变化的部分）

---

## 五、Composition API 与 Vue3 新特性

### 26. Composition API 相比 Options API 解决了什么问题？

**参考答案：**

1. **逻辑复用问题**：
   - Options API 用 mixin 复用：多个 mixin 混入时有命名冲突风险，数据来源不清晰
   - Composition API 用 Composable 函数：返回值命名明确，来源一目了然，无冲突

2. **代码组织问题**：
   - Options API 按选项类型（data/methods/computed/watch）分割代码，一个功能的相关代码分散在各处
   - Composition API 按业务逻辑组织，同一功能的代码可以写在一起，内聚性更好

3. **TypeScript 支持**：
   - Options API 中 this 的类型推断复杂，需要 defineComponent 包裹
   - Composition API 全是函数调用，TS 天然支持，类型推断更准确

```ts
// Composable：职责清晰，来源完全清晰
const { data, loading, error } = useRequest(() => fetchUser(id))
const { x, y } = useMouse()
const { isDark, toggle } = useDarkMode()
```

---

### 27. `<script setup>` 的编译产物是什么？

**参考答案：**

1. **本质**：`<script setup>` 是编译器语法糖，等价于在 `setup()` 函数中写代码

2. **编译转换规则**：
   - 顶层声明的变量、函数、import 自动暴露给模板（不需要 return）
   - `defineProps`/`defineEmits`/`defineExpose`/`withDefaults` 等编译器宏在编译时处理，运行时不存在
   - 组件引入后自动注册，不需要 components 选项

3. **编译前后对比**：
```vue
<!-- 编译前 -->
<script setup>
import { ref } from 'vue'
import MyComp from './MyComp.vue'
const props = defineProps<{ title: string }>()
const count = ref(0)
defineExpose({ count })
</script>

<!-- 编译后（简化） -->
<script>
export default {
  components: { MyComp },
  props: { title: String },
  setup(props, { expose }) {
    const count = ref(0)
    expose({ count })
    return { count }
  }
}
</script>
```

4. **性能优势**：编译器可以做更多静态分析优化；运行时不需要额外的开发时元数据

---

### 28. `defineProps<T>()` 和 `defineProps({...})` 的区别？

**参考答案：**

1. **运行时写法** `defineProps({ title: String, age: Number })`：
   - 有运行时 props 校验（类型不匹配会警告）
   - TypeScript 类型推断体验较差（需要手写类型映射）

2. **泛型写法** `defineProps<{ title: string; age?: number }>()`：
   - 只有编译期类型校验（TS 检查），无运行时开销
   - 完整的 TS 类型支持，编辑器提示准确
   - 需要 `withDefaults` 配合设置默认值：
   ```ts
   const props = withDefaults(
     defineProps<{ size?: string; color?: string }>(),
     { size: 'md', color: 'blue' }
   )
   ```

3. **Vue 3.5 新特性——响应式 props 解构**：
```ts
// Vue 3.5+ 可以直接解构，编译器保证响应性
const { size = 'md', title } = defineProps<{ size?: string; title: string }>()
// 等价于访问 props.size 和 props.title，不是真正的 JS 解构
```

4. **推荐选择**：使用 TypeScript 时优先泛型写法；需要运行时校验（如组件库）时用运行时写法

---

### 29. `defineModel<T>()` 替代 v-model 手动实现（Vue 3.4+）

**参考答案：**

1. **传统 v-model 实现**（繁琐）：
```ts
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
```

2. **defineModel 简化后**（Vue 3.4+）：
```ts
// 子组件
const model = defineModel<string>()
// model.value 直接读写，内部自动处理 props/emit

// 带配置
const model = defineModel<string>({ required: true, default: '' })

// 命名 v-model
const title = defineModel<string>('title')
const content = defineModel<string>('content')
```

3. **父组件使用不变**：
```html
<MyInput v-model="value" />
<MyEditor v-model:title="title" v-model:content="content" />
```

4. **原理**：`defineModel` 是编译器宏，展开后等价于 `defineProps({ modelValue })` + `defineEmits(['update:modelValue'])`，并返回一个可读写的 computed ref

---

### 30. `Teleport` 用来解决什么问题？

**参考答案：**

1. **问题背景**：Modal、Toast、Tooltip 等弹层组件需要渲染到 `body` 或特定容器下，才能脱离父元素的 `overflow: hidden`、`z-index` 层叠上下文限制。

2. **Teleport 的解决方式**：将组件内的 DOM 渲染到指定的外部 DOM 节点，同时保留组件的逻辑关系（响应式、事件、Composition API 等不变）

```html
<Teleport to="body">
  <div class="modal" v-if="isOpen">
    <p>{{ title }}</p>
    <button @click="isOpen = false">关闭</button>
  </div>
</Teleport>
```

3. **注意事项**：
   - `to` 属性指向目标 DOM 选择器或 DOM 元素
   - 多个 Teleport 指向同一目标时，按顺序追加
   - 事件冒泡遵循 Vue 组件树，不遵循 DOM 树（Teleport 后的事件仍会冒泡到 Vue 父组件）
   - SSR 时需要客户端激活（hydration）

---

### 31. `Suspense` 是什么？和异步组件怎么配合？

**参考答案：**

1. **Suspense 的作用**：为组件树中的异步依赖提供等待状态，在所有异步操作完成前显示 fallback 内容

2. **两个插槽**：`#default`（内容加载完显示）和 `#fallback`（加载中显示的占位）

3. **配合 defineAsyncComponent**：
```vue
<Suspense>
  <template #default>
    <AsyncUserProfile />
  </template>
  <template #fallback>
    <LoadingSpinner />
  </template>
</Suspense>
```

4. **配合 async setup()**：Suspense 也支持 setup 函数中含有 `await` 的组件，父组件用 Suspense 包裹等待 setup 完成

5. **错误处理**：配合 `onErrorCaptured` 钩子捕获异步错误

---

### 32. 如何封装一个通用的 Composable？和 mixin 的区别？

**参考答案：**

**封装 useRequest 示例**：
```ts
function useRequest<T>(fetcher: () => Promise<T>, options?: { immediate?: boolean }) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function execute() {
    loading.value = true
    error.value = null
    try {
      data.value = await fetcher()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  if (options?.immediate !== false) execute()

  return { data, loading, error, execute }
}

// 使用
const { data: users, loading, error, execute: refetch } = useRequest(fetchUsers)
```

**Composable vs Mixin 对比**：

| | Composable | Mixin |
|---|---|---|
| 来源清晰度 | ✅ 明确（变量名自定义） | ❌ this.xxx 来源不明 |
| 命名冲突 | ✅ 无（局部变量） | ❌ 多 mixin 易冲突 |
| 传参 | ✅ 函数参数 | ❌ 不支持 |
| TypeScript | ✅ 完整支持 | ❌ this 类型推断差 |
| 调试 | ✅ 调用栈清晰 | ❌ 难以追踪 |

---

### 33. `setup()` 的执行时机在生命周期的哪个阶段？

**参考答案：**

1. **时机**：`setup()` 在组件实例创建后、`beforeCreate` 和 `created` 之间执行

2. **执行时能做什么**：
   - ✅ 可以访问 props（第一个参数）
   - ✅ 可以调用 Composition API（ref/reactive/computed/watch 等）
   - ✅ 可以使用 inject
   - ❌ 不能访问 `this`（setup 中 this 是 undefined）
   - ❌ 不能访问 DOM（`$el` 为 undefined，DOM 未挂载）

3. **与 Options API 的关系**：setup() 先于其他 options 执行，setup 返回的属性可在 Options API 中通过 this 访问

---

## 六、组件通信

### 34. 组件通信方式汇总

**参考答案：**

| 方式 | 方向 | 适用场景 | 注意事项 |
|------|------|----------|----------|
| `props` / `emit` | 父→子 / 子→父 | 直接父子组件 | 单向数据流，子组件不能直接修改 props |
| `v-model` / `defineModel` | 父子双向 | 表单组件封装 | 本质是 props + emit 的语法糖 |
| `$refs` / `defineExpose` | 父→子实例 | 父调子方法 | 避免过度使用，增加耦合 |
| `provide` / `inject` | 祖先→后代 | 跨层级传递 | 传递响应式数据需传 ref/reactive |
| `Pinia` | 任意 | 全局/复杂状态 | 首选方案 |
| `mitt`（EventBus） | 任意 | 简单跨组件事件 | 注意及时 off 防内存泄漏 |
| `$attrs` | 父→子（透传） | 高阶组件封装 | Vue3 包含事件监听器 |

**选择原则**：父子直接通信 → props/emit；深层嵌套 → Pinia；跨层级但不全局 → provide/inject；简单事件 → mitt

---

### 35. `v-model` 在 Vue3 中的变化？如何使用多个 v-model？

**参考答案：**

1. **Vue2 和 Vue3 的差异**：
   - Vue2：`v-model` 等价于 `:value` + `@input`
   - Vue3：`v-model` 等价于 `:modelValue` + `@update:modelValue`，通过 `v-model:name` 语法多绑定

2. **自定义组件上的 v-model**：
```vue
<!-- 父组件 -->
<MyInput v-model="text" />
<!-- 等价于 -->
<MyInput :modelValue="text" @update:modelValue="text = $event" />

<!-- 子组件 -->
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [val: string] }>()
```

3. **多个 v-model**：
```vue
<UserForm
  v-model:username="form.username"
  v-model:email="form.email"
/>
<!-- 子组件声明对应的 props 和 emits 即可 -->
```

4. **v-model 修饰符**：Vue3 支持自定义修饰符，子组件通过 `modelModifiers` prop 接收

---

### 36. `$attrs` 在 Vue3 中的变化？

**参考答案：**

1. **Vue3 中 `$attrs` 的变化**：
   - Vue2：`$attrs` 只包含非 prop 的**属性**，事件监听器在 `$listeners` 中
   - Vue3：`$attrs` 包含所有非 prop/emits 声明的属性，**包括事件监听器**（`$listeners` 已移除）

2. **属性透传（Fallthrough）**：单根组件 `$attrs` 自动应用到根元素；`inheritAttrs: false` 关闭自动应用，手动控制透传位置

3. **手动透传的场景**（封装基础组件时常用）：
```vue
<script setup>
defineOptions({ inheritAttrs: false })
</script>

<template>
  <div class="wrapper">
    <input v-bind="$attrs" />  <!-- 透传到 input 而非外层 div -->
  </div>
</template>
```

4. **useAttrs() 在 setup 中使用**：
```ts
import { useAttrs } from 'vue'
const attrs = useAttrs()  // 响应式的 $attrs
```

---

### 37. provide/inject 的响应式传递注意事项？

**参考答案：**

1. **传递普通值不响应式**：
```ts
// ❌ 传递普通值，后代无法感知变化
provide('count', count.value)  // 传的是当前值快照

// ✅ 传递 ref，后代 inject 后仍响应式
provide('count', count)        // 传的是 ref 对象引用
```

2. **避免后代直接修改注入值**（维护单向数据流）：
```ts
provide('count', readonly(count))               // 防止后代直接修改
provide('incrementCount', () => count.value++)  // 暴露修改方法
```

3. **provide/inject vs Pinia 的选择**：
   - 组件库内部的跨层级传递（如 Form → FormItem）→ provide/inject
   - 全局业务状态（用户信息、主题等）→ Pinia

4. **App 级别的 provide**：`app.provide('globalConfig', config)`，所有组件均可 inject

---

### 38. `defineExpose` 的作用？

**参考答案：**

1. **背景**：`<script setup>` 组件默认是"关闭"的，父组件通过 `$refs` 拿到的组件实例无法访问内部的任何变量和方法。

2. **defineExpose 的作用**：显式声明要对外暴露的属性和方法：
```vue
<script setup>
const count = ref(0)
function focus() { inputRef.value?.focus() }
defineExpose({ focus, count })
</script>
```

3. **父组件访问**：
```vue
<script setup>
const myComp = ref<InstanceType<typeof MyComp>>()
myComp.value?.focus()  // 调用子组件暴露的方法
</script>
<template>
  <MyComp ref="myComp" />
</template>
```

4. **最佳实践**：只暴露必要的接口，不要暴露内部响应式状态，避免破坏单向数据流

---

## 七、生命周期

### 39. Vue2 和 Vue3 生命周期钩子的对应关系

**参考答案：**

| Vue2 | Vue3 (Options API) | Vue3 (Composition API) |
|------|-------------------|------------------------|
| beforeCreate | beforeCreate | ——（setup 替代） |
| created | created | ——（setup 替代） |
| beforeMount | beforeMount | onBeforeMount |
| mounted | mounted | onMounted |
| beforeUpdate | beforeUpdate | onBeforeUpdate |
| updated | updated | onUpdated |
| beforeDestroy | beforeUnmount | onBeforeUnmount |
| destroyed | unmounted | onUnmounted |
| activated | activated | onActivated |
| deactivated | deactivated | onDeactivated |
| errorCaptured | errorCaptured | onErrorCaptured |

**重命名说明**：Vue3 将 `beforeDestroy` 改为 `beforeUnmount`，`destroyed` 改为 `unmounted`，命名更准确（组件"卸载"而非"销毁"）

---

### 40. 父子组件的创建和挂载顺序？

**参考答案：**

1. **挂载阶段**（由外到内创建，由内到外挂载）：
```
父 beforeCreate → 父 created → 父 beforeMount
  子 beforeCreate → 子 created → 子 beforeMount → 子 mounted
父 mounted
```

2. **更新阶段**（由外到内触发，由内到外完成）：
```
父 beforeUpdate → 子 beforeUpdate → 子 updated → 父 updated
```

3. **卸载阶段**（由外到内开始，由内到外完成）：
```
父 beforeUnmount → 子 beforeUnmount → 子 unmounted → 父 unmounted
```

4. **理解方式**：挂载阶段父组件要等子组件渲染完才能完成自身渲染，所以子 mounted 先触发；卸载同理。

---

### 41. `keep-alive` 的 activated / deactivated 钩子何时触发？

**参考答案：**

1. **触发时机**：
   - `activated`：被 keep-alive 缓存的组件**被显示**时触发（包括首次渲染）
   - `deactivated`：被 keep-alive 缓存的组件**被隐藏**（切走）时触发

2. **首次进入 vs 再次进入**：
   - 首次进入：`created` → `mounted` → `activated`
   - 切走：`deactivated`（不触发 beforeUnmount/unmounted，组件缓存，不销毁）
   - 再次进入：`activated`（不触发 created/mounted，直接复用缓存）
   - 真正销毁（超过 max 被淘汰）：`unmounted`

3. **常见使用场景**：
```ts
onActivated(() => {
  fetchData()                          // 每次进入刷新数据
  listEl.value.scrollTop = savedScrollTop  // 恢复滚动位置
})

onDeactivated(() => {
  savedScrollTop = listEl.value.scrollTop  // 保存滚动位置
  videoEl.value?.pause()               // 暂停播放
})
```

---

## 八、状态管理（Pinia / Vuex）

### 42. Pinia 相比 Vuex 的核心优势？

**参考答案：**

1. **无 mutations，代码更简洁**：Vuex 需要 action → commit mutation → 修改 state 三层，Pinia 直接在 action 中修改 state

2. **完整 TypeScript 支持**：store 的 state/getters/actions 类型自动推导，无需手动声明

3. **模块化更自然**：Vuex 需要 `namespaced: true` 和 modules 嵌套，Pinia 每个 store 就是一个独立模块，天然扁平

4. **更轻量**：Pinia 约 1KB gzip，Vuex 4 约 2.5KB gzip

5. **支持 setup store**：
```ts
// Setup Store（Composition API 风格，更灵活）
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const double = computed(() => count.value * 2)
  function increment() { count.value++ }
  return { count, double, increment }
})
```

---

### 43. Pinia 没有 mutation，直接修改 state 为何可以？

**参考答案：**

1. **技术可行性**：Pinia 的 state 是 `reactive` 对象，Vue 的响应式系统可以追踪任何对 reactive 对象的修改，不需要额外的 mutation 层来触发视图更新。

2. **Vuex 需要 mutation 的历史原因**：通过 mutation 这个"门卫"统一修改 state，方便 devtools 拦截和记录每次变更的完整快照。

3. **Pinia 如何做到 devtools 追踪**：直接在 Vue devtools 的响应式追踪层面监听 state 变化，既保留了调试能力，又消除了样板代码。

4. **$patch 批量修改**：多个属性一起改时推荐用 `$patch`，devtools 会将其记录为一次操作：
```ts
store.$patch({ count: 10, name: 'new' })
store.$patch((state) => {
  state.list.push({ id: 1 })
  state.count++
})
```

---

### 44. `storeToRefs` 的原理？为什么直接解构 store 会失去响应性？

**参考答案：**

1. **直接解构失去响应性的原因**：store 对象本质上是 reactive 代理，解构 `const { count } = store` 等于取当前值赋给局部变量，断开与 Proxy 的联系。

2. **storeToRefs 的作用**：将 store 的每个 state 属性和 getter 转为 ref，解构后仍保持响应性。

3. **源码原理**（简化）：
```ts
function storeToRefs(store) {
  const refs = {}
  for (const key in store) {
    const value = store[key]
    if (isRef(value) || isReactive(value)) {
      refs[key] = toRef(store, key)  // 创建指向 store[key] 的 ref
    }
  }
  return refs
}
```

4. **注意**：`storeToRefs` 只转换 state 和 getters，不转换 actions。actions 直接从 store 解构即可：
```ts
const { count, userName } = storeToRefs(userStore)  // state/getters
const { login, logout } = userStore                  // actions 直接解构
```

---

### 45. Pinia 在 SSR（Nuxt3）中的状态序列化问题

**参考答案：**

1. **问题背景**：SSR 中服务端渲染 HTML 时有一份 Pinia state，客户端接管（hydration）时需要用相同的 state 初始化，否则导致 hydration mismatch。

2. **Nuxt3 的处理流程**：
   - 服务端：通过 `pinia.state.value` 获取当前 state 快照
   - 序列化：用 `devalue` 库序列化为 JSON，注入到 HTML 的 `__NUXT__` payload 中
   - 客户端：hydration 时从 `window.__NUXT__` 读取 payload，调用 `pinia.state.value = payload.pinia` 恢复 state
   - 客户端 store 已有正确初始值，不需要重新请求数据

3. **避免 hydration mismatch 的注意事项**：
   - 不要在 store 中使用 `Math.random()`/`Date.now()` 等不确定性操作
   - 服务端专有逻辑要用 `import.meta.server` 判断
   - 异步数据在服务端用 `useAsyncData`/`useFetch` 获取

4. **每个请求独立 Pinia 实例**：SSR 中每个请求要有独立的 Pinia 实例，防止不同用户的 state 互相污染，Nuxt3 自动处理了这一点。

---

## 九、性能优化

### 46. 首屏加载慢怎么排查和优化？

**参考答案：**

**排查步骤**：
1. Chrome DevTools → Network 面板：查看资源大小、请求数量、加载耗时
2. Chrome DevTools → Performance 面板：录制首屏加载，分析 JS 执行、渲染时间
3. Lighthouse：获取 FCP/LCP/TTI 等指标和优化建议
4. webpack-bundle-analyzer / rollup-plugin-visualizer：分析打包体积

**优化方案**：

1. **代码分割**：路由懒加载 `() => import('./views/Home.vue')`、组件异步加载 `defineAsyncComponent`、第三方库按需引入

2. **资源优化**：Gzip/Brotli 压缩、静态资源 CDN、图片懒加载 + WebP 格式、字体子集化

3. **渲染优化**：SSR（Nuxt）或预渲染（ViteSSG）提前生成 HTML；骨架屏减少白屏感知

4. **缓存策略**：JS/CSS 文件内容 hash 命名配合强缓存；API 请求结果缓存（SWR 策略）

---

### 47. 如何实现虚拟列表？定高和不定高分别怎么处理？

**参考答案：**

**定高虚拟列表**：

1. **核心思路**：只渲染可视区域内的条目，用 transform: translateY 定位，容器高度 = itemHeight × totalCount 撑开滚动条

2. **关键计算**：
```ts
const ITEM_HEIGHT = 50
const BUFFER = 3  // 上下各多渲染几条，防止快速滚动白屏

const startIndex = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / ITEM_HEIGHT) - BUFFER)
)
const endIndex = computed(() =>
  Math.min(list.length, startIndex.value + visibleCount + BUFFER * 2)
)
const visibleItems = computed(() => list.slice(startIndex.value, endIndex.value))
const offsetY = computed(() => startIndex.value * ITEM_HEIGHT)
```

**不定高虚拟列表**：

1. **预估高度阶段**：先假设每项高度为 `estimatedHeight`，计算初始位置缓存

2. **实际高度修正**：条目渲染后，用 `ResizeObserver` 获取实际高度，更新位置缓存

3. **位置缓存数组**：维护 `positions` 数组，每项包含 `{ top, bottom, height }`，用**二分查找**定位 `startIndex`

4. **滚动锚定**：当上方未渲染条目高度修正时，调整 `scrollTop` 补偿偏差，防止视图跳动

---

### 48. keep-alive 的 LRU 淘汰策略怎么实现？

**参考答案：**

1. **LRU（最近最少使用）的原理**：缓存容量有限时，优先淘汰最久未被访问的条目

2. **Vue 的实现**：
```ts
const cache = new Map()  // key → vnode
const keys = new Set()   // 维护访问顺序

function cacheVNode(vnode, key) {
  if (cache.has(key)) {
    // 命中缓存：将 key 移到末尾（标记为最近使用）
    keys.delete(key)
    keys.add(key)
  } else {
    cache.set(key, vnode)
    keys.add(key)
    // 超出 max：删除最久未使用的（keys 的第一个）
    if (max && keys.size > max) {
      const oldest = keys.values().next().value
      keys.delete(oldest)
      cache.delete(oldest)
      unmount(cache.get(oldest))
    }
  }
}
```

3. **key 的生成**：默认用组件的 name，`include`/`exclude` 用于过滤哪些组件参与缓存

4. **Map 实现 LRU**：利用 Map 的**插入顺序**特性，访问时删除再重新插入（移到末尾），最旧的自然在 `map.keys().next()` 位置

---

### 49. `v-memo` + `shallowRef` + 编译优化的综合方案

**参考答案：**

1. **`v-memo`**（Vue 3.2+）：手动控制子树的重渲染条件
```html
<!-- 只有 item.id 或 selected 变化时才重新渲染该行 -->
<tr v-for="item in list" :key="item.id" v-memo="[item.id, item === selected]">
  <td>{{ item.name }}</td>
</tr>
```
   - 适合：大列表 + 列表项有大量内容但变化频率低的场景
   - 原理：将 deps 数组与上次渲染时比较，全部相同则跳过该子树的 diff

2. **`shallowRef` / `shallowReactive`**：只追踪顶层引用变化
```ts
const bigData = shallowRef<BigData>(initialData)
// 更新时替换引用（触发响应），而非修改内部属性
bigData.value = { ...bigData.value, updatedField: 'new' }
```

3. **组合策略**：
   - 数据层：大对象用 `shallowRef`，减少响应式代理开销
   - 模板层：稳定行用 `v-memo`，减少 diff 范围
   - 编译层：Vue3 自动的 PatchFlag/BlockTree 优化
   - 渲染层：用 `markRaw` 标记不需要响应式的数据（如图表实例、第三方库对象）

---

## 十、路由（Vue Router）

### 50. hash 路由和 history 路由的区别？

**参考答案：**

| | hash 模式 | history 模式 |
|---|---|---|
| URL 格式 | `https://example.com/#/home` | `https://example.com/home` |
| 实现原理 | 监听 `hashchange` 事件 | HTML5 History API（`pushState`/`popstate`） |
| 服务器配置 | 不需要 | 需要配置 fallback（所有路径返回 index.html） |
| SEO | 不友好（爬虫忽略 hash） | 友好 |
| 刷新 | 不会 404 | 无配置时会 404 |

**history 模式 nginx 配置**：
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

- **hash 原理**：`#` 后面的内容不发送到服务器，前端监听 `hashchange` 事件响应路由变化
- **history 原理**：`pushState` 改变 URL 但不发请求，刷新时浏览器真正请求该路径，需服务器配置 fallback

---

### 51. 路由导航守卫执行顺序？

**参考答案：**

完整执行顺序（从 A 路由跳转到 B 路由）：

1. **`beforeRouteLeave`**（A 组件内）：即将离开 A，可以弹出确认框，`return false` 取消导航
2. **`beforeEach`**（全局）：最常用，做登录鉴权、权限校验
3. **`beforeEnter`**（B 路由独享）：针对特定路由的守卫
4. **解析异步路由组件**（如果 B 是懒加载的）
5. **`beforeRouteEnter`**（B 组件内）：B 组件实例还未创建，无法访问 `this`
6. **`beforeResolve`**（全局）：所有组件内守卫和异步组件解析完后调用
7. 导航确认，执行 DOM 更新
8. **`afterEach`**（全局）：导航完成后，常用于埋点统计
9. **`beforeRouteEnter` 的 `next(vm => ...)` 回调**：组件挂载后执行

**记忆技巧**：离开旧的 → 全局检查 → 路由检查 → 进入新的 → 全局确认 → 完成后钩子

---

### 52. 动态路由如何实现按角色/权限加载菜单？

**参考答案：**

1. **登录后动态添加路由**：
```ts
async function generateRoutes(roles: string[]) {
  const accessRoutes = await fetchUserRoutes(roles)
  // 或前端根据角色过滤路由表
  accessRoutes.forEach(route => router.addRoute(route))
  return accessRoutes
}
```

2. **刷新时的重新加载问题**（关键）：
```ts
router.beforeEach(async (to, from, next) => {
  if (!userStore.isLoggedIn) {
    if (to.path !== '/login') return next('/login')
    return next()
  }

  if (!permissionStore.routesLoaded) {
    await permissionStore.generateRoutes(userStore.roles)
    // 重新导航，确保能匹配到新加入的路由
    return next({ ...to, replace: true })
  }

  next()
})
```

3. **菜单生成**：动态路由配置中加入 `meta.title`/`meta.icon`/`meta.hidden` 等字段，根据路由表递归生成侧边栏菜单

---

## 十一、SSR / Nuxt3（2025–2026）

### 53. Nuxt3 中 `useFetch` 和 `$fetch` 的区别？

**参考答案：**

1. **`$fetch`**：Nuxt3 内置的 HTTP 客户端（基于 ofetch），是底层请求函数：
   - SSR 时服务端调用一次，客户端 hydration 后组件重新挂载会**再调用一次**（重复请求）
   - 适合：在事件处理函数（如点击提交）中使用

2. **`useFetch`**：= `useAsyncData` + `$fetch` 的组合，专为 SSR 设计：
   - SSR 时服务端请求一次，结果序列化进 payload（`__NUXT__`）
   - 客户端 hydration 时从 payload 读取数据，**不重复请求**
   - 返回 `{ data, pending, error, refresh }` 响应式对象
   - 适合：页面初始数据加载

```ts
// 推荐：用 useFetch 获取页面初始数据
const { data: users, pending, error } = await useFetch('/api/users')

// 适合：用 $fetch 处理用户操作
async function handleSubmit() {
  await $fetch('/api/users', { method: 'POST', body: formData })
}
```

3. **避免双重请求的策略**：
   - 页面初始数据用 `useFetch`/`useAsyncData`
   - 不要在 `onMounted` 中重复发起服务端已请求的数据
   - 使用 `useFetch` 的 `key` 参数确保同一请求在多个组件间共享缓存

---

### 54. Vue 的 hydration mismatch 怎么排查？

**参考答案：**

1. **什么是 hydration mismatch**：SSR 时服务端生成的 HTML 与客户端 Vue 接管时期望渲染的 VNode 不一致，Vue 会警告并重新渲染该部分（可能导致页面闪烁）

2. **常见原因及解决**：

   - **使用了不确定性 API**：
   ```ts
   // ❌ 服务端和客户端生成不同的随机值
   const id = Math.random()
   // ✅ 用 useId() 或服务端生成确定性 id
   ```

   - **访问了仅客户端可用的 API**：
   ```ts
   // ❌ 服务端没有 window
   const width = window.innerWidth
   // ✅ 在 onMounted 中访问
   const width = ref(0)
   onMounted(() => { width.value = window.innerWidth })
   ```

   - **`<ClientOnly>` 组件**：将纯客户端的内容包裹，SSR 时不渲染：
   ```html
   <ClientOnly>
     <BrowserOnlyChart />
   </ClientOnly>
   ```

3. **排查流程**：
   - 控制台查看 hydration 警告（Vue 会指出具体 DOM 节点）
   - 对比服务端返回的 HTML（查看页面源代码）和客户端实际渲染结果
   - 用 `v-if="false"` 二分法逐步排查问题组件

---

## 十二、自定义渲染器

### 55. 如何用 `createRenderer` 实现跨端适配？

**参考答案：**

1. **原理**：Vue3 将渲染器与框架核心解耦，`@vue/runtime-core` 提供响应式、Composition API、组件生命周期等核心能力，`createRenderer` 允许自定义宿主平台的节点操作接口。

2. **实现步骤**：
```ts
import { createRenderer } from '@vue/runtime-core'

const renderer = createRenderer({
  createElement(type: string) {
    const tagMap = { div: 'view', span: 'text', p: 'text' }
    return { type: tagMap[type] || type, props: {}, children: [] }
  },
  insert(el, parent, anchor) {
    const index = anchor ? parent.children.indexOf(anchor) : -1
    if (index === -1) parent.children.push(el)
    else parent.children.splice(index, 0, el)
  },
  remove(el) {
    const parent = el.parent
    if (parent) {
      const i = parent.children.indexOf(el)
      parent.children.splice(i, 1)
    }
  },
  patchProp(el, key, prevVal, nextVal) {
    if (key.startsWith('on')) {
      const eventMap = { onClick: 'bindtap', onInput: 'bindinput' }
      el.props[eventMap[key] || key] = nextVal
    } else {
      el.props[key] = nextVal
    }
  },
  createText: (text) => ({ type: 'text', text }),
  setText: (node, text) => { node.text = text },
  setElementText: (el, text) => { el.children = [{ type: 'text', text }] },
  parentNode: (node) => node.parent,
  nextSibling: (node) => { /* ... */ },
})

const app = renderer.createApp(RootComponent)
app.mount(rootContainer)
```

3. **复用的核心能力**：响应式系统、Composition API、生命周期钩子、指令系统（v-if/v-for/v-model）、组件系统

4. **实际应用**：`@vue/runtime-dom`（官方 DOM 渲染器）、uni-app 的 Vue3 模式、Canvas 渲染等

---

## 十三、手写实现题

### 56. 手写简版响应式系统（track/trigger/effect）

```ts
let activeEffect: (() => void) | null = null
const targetMap = new WeakMap<object, Map<string | symbol, Set<() => void>>>()

function track(target: object, key: string | symbol) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  dep.add(activeEffect)
}

function trigger(target: object, key: string | symbol) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  depsMap.get(key)?.forEach(effect => effect())
}

function effect(fn: () => void) {
  activeEffect = fn
  fn()  // 执行时自动收集依赖
  activeEffect = null
}

function reactive<T extends object>(raw: T): T {
  return new Proxy(raw, {
    get(target, key) {
      track(target, key)
      const res = Reflect.get(target, key)
      // 嵌套对象懒代理
      return typeof res === 'object' && res !== null ? reactive(res) : res
    },
    set(target, key, value) {
      Reflect.set(target, key, value)
      trigger(target, key)
      return true
    }
  })
}

// 简版 computed
function computed<T>(getter: () => T) {
  let value: T
  let dirty = true
  effect(() => { dirty = true })
  return {
    get value() {
      if (dirty) {
        dirty = false
        value = getter()
      }
      return value
    }
  }
}

// 使用示例
const state = reactive({ count: 0 })
effect(() => {
  console.log(`count: ${state.count}`)  // 自动收集 count 依赖
})
state.count++  // 触发 effect，输出 'count: 1'
```

---

### 57. 手写 EventBus（on/off/emit/once）

```ts
type Handler = (...args: any[]) => void

class EventBus {
  private events = new Map<string, Set<Handler>>()

  on(event: string, handler: Handler): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(handler)
    // 返回取消订阅函数
    return () => this.off(event, handler)
  }

  off(event: string, handler: Handler): void {
    this.events.get(event)?.delete(handler)
  }

  emit(event: string, ...args: any[]): void {
    this.events.get(event)?.forEach(handler => {
      try {
        handler(...args)
      } catch (e) {
        console.error(`EventBus handler error for "${event}":`, e)
      }
    })
  }

  once(event: string, handler: Handler): () => void {
    const wrapper: Handler = (...args) => {
      handler(...args)
      this.off(event, wrapper)
    }
    return this.on(event, wrapper)
  }

  clear(event?: string): void {
    if (event) this.events.delete(event)
    else this.events.clear()
  }
}

export const bus = new EventBus()

// 使用示例
const unsubscribe = bus.on('user:login', (user) => {
  console.log('用户登录:', user.name)
})

bus.once('app:ready', () => console.log('应用就绪'))
bus.emit('user:login', { name: 'Alice' })

// 组件卸载时取消订阅，防止内存泄漏
onUnmounted(() => unsubscribe())
```

---

## 附：已趋向淘汰的考点

| 考点 | 淘汰原因 |
|------|----------|
| Vue2 EventBus（`$on/$off`） | Vue3 已移除，改用 mitt |
| Vuex mutations 写法 | Pinia 官方推荐，Vuex 已停维护 |
| Vue2 过滤器 filter | Vue3 已移除 |
| `keyCode` 键盘修饰符 | Vue3 已移除 |
| Vue2 mixin 复用模式 | Composable 已完全替代 |
| Vue CLI 配置 | Vite 成主流，webpack 题逐年减少 |

---

## 附：三年考察重心变化

```
2022–2023  Vue2→Vue3 迁移、基础响应式、Vuex
2024       Composition API 深度、TS 集成、Pinia 替代 Vuex
2025–2026  Vue3.5 内部原理、编译优化全链路、SSR+Nuxt3、defineModel 新语法
2026 信号  AI 场景结合题（流式 SSR + hydration 一致性）
```

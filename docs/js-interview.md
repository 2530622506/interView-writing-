# JavaScript 面试题整理

## 面向对象与设计模式

### 面向过程和面向对象有什么区别？

**面向过程（PO）**：程序由一系列函数按顺序执行，数据和操作分离。适合小型简单程序，效率高，但耦合度高、扩展性差。

```javascript
// 面向过程
function calculateArea(radius) {
  return Math.PI * radius * radius;
}
const area = calculateArea(5);
```

**面向对象（OO）**：把事物抽象成对象，给对象赋属性和方法，让对象执行自己的方法。

```javascript
// 面向对象
class Circle {
  constructor(radius) {
    this.radius = radius;
  }
  calculateArea() {
    return Math.PI * this.radius * this.radius;
  }
}
const circle = new Circle(5);
```

**OOP 三大特性**：
- **封装**：数据和方法绑定在一起，隐藏内部实现
- **继承**：子类可以继承父类的属性和方法，实现代码复用
- **多态**：同一方法在不同对象上产生不同行为

优点：低耦合、易扩展、易维护；缺点：效率比面向过程低。

### 常见设计模式有哪些？

**发布-订阅模式（观察者模式）**：对象间一对多的依赖关系，当一个对象状态改变时，所有依赖它的对象都收到通知。

**单例模式**：确保一个类只有一个实例，提供一个全局访问点。

```javascript
class Singleton {
  static instance = null;
  static getInstance() {
    if (!this.instance) {
      this.instance = new Singleton();
    }
    return this.instance;
  }
}
```

**工厂模式**：根据参数创建不同类型的对象，封装对象创建逻辑。

---

## 数据类型

### JavaScript 有哪些数据类型？

**7 种原始类型**（存储在栈中，按值访问）：
- `boolean`
- `null`
- `undefined`
- `number`（范围 -2^53 到 2^53）
- `string`
- `Symbol`（ES6，独一无二的值，常用作对象属性键）
- `BigInt`（任意长度整数，用 `n` 后缀表示，如 `123n`）

**引用类型**（存储在堆中，栈中存指针）：
- `Object`（包含 Function、Array、Date、RegExp、Map、Set 等）

**存储区别**：
- 基本类型：栈内存自动分配和释放，直接存值
- 引用类型：堆内存动态分配，不自动释放；栈中只存堆地址的引用指针

### 类型检测有哪些方法？各有什么优缺点？

**1. `typeof`**

```javascript
typeof 1           // 'number'
typeof 'hello'     // 'string'
typeof undefined   // 'undefined'
typeof true        // 'boolean'
typeof Symbol()    // 'symbol'
typeof null        // 'object'  ← 历史 bug
typeof []          // 'object'
typeof {}          // 'object'
typeof function(){} // 'function'
typeof NaN         // 'number'
```

原理：JS 中值用二进制表示，低 3 位为 0 表示对象。`null` 的机器码全为 0，被误判为 `'object'`。

缺点：无法区分 null 和对象，无法区分数组和对象。

**2. `instanceof`**

原理：顺着原型链查找，判断构造函数的 `prototype` 是否在对象的原型链上。

```javascript
[] instanceof Array   // true
{} instanceof Object  // true
'hello' instanceof String // false（原始类型不在原型链上）
```

缺点：不能检测原始类型；原型链可被修改导致结果不准确。

手写实现：

```javascript
function myInstanceof(object, constructor) {
  while (object !== null) {
    if (object.__proto__ === constructor.prototype) return true;
    object = object.__proto__;
  }
  return false;
}
```

**3. `Object.prototype.toString.call()`（最全面）**

```javascript
Object.prototype.toString.call(1)        // '[object Number]'
Object.prototype.toString.call('hello')  // '[object String]'
Object.prototype.toString.call([])       // '[object Array]'
Object.prototype.toString.call(null)     // '[object Null]'
Object.prototype.toString.call(new Date()) // '[object Date]'
```

原理：每个继承 Object 的对象都有 `toString`，未重写时返回 `[object 类型]`。数组等对象重写了 `toString`，需要用 `call` 借用 `Object.prototype.toString`。

**4. `constructor` 属性**

```javascript
let a = new Array();
a.constructor === Array // true
```

缺点：`null` 和 `undefined` 没有 `constructor`；类继承时检测结果可能不准确。

**5. `Array.isArray()`**：专用判断数组，最精准。

**封装工具函数**：

```javascript
function getType(obj) {
  const originType = Object.prototype.toString.call(obj);
  const spaceIndex = originType.indexOf(' ');
  return originType.slice(spaceIndex + 1, -1).toLowerCase();
}

getType([])     // 'array'
getType(null)   // 'null'
getType(new Date()) // 'date'
```

### `==`、`===`、`Object.is()` 有什么区别？

- **`==`（宽松相等）**：先判断类型，类型不同则进行一次隐式类型转换后再比较
- **`===`（严格相等）**：类型不同直接返回 false，不进行类型转换
- **`Object.is()`**：在 `===` 基础上特殊处理了 `NaN` 和 `-0/+0`

```javascript
'1' == 1         // true（字符串转数字）
'1' === 1        // false（类型不同）
NaN == NaN       // false
NaN === NaN      // false
Object.is(NaN, NaN)  // true  ← 特殊处理
+0 === -0        // true
Object.is(+0, -0)    // false ← 特殊处理
null == undefined     // true
null === undefined    // false
```

`==` 转换规则：
1. 字符串和数字：字符串转数字
2. 布尔值：布尔值先转数字
3. `null` 和 `undefined`：相互相等，与其他值都不等
4. 对象和非对象：对象调用 `ToPrimitive` 转换后比较

### `null` 和 `undefined` 有什么区别？

- **`null`**："没有对象"，该处不应该有值。用于作为函数参数表示无对象、作为原型链终点、初始化将来要存对象的变量。`typeof null === 'object'`（历史 bug）
- **`undefined`**："没有值"，该处应该有值但还没定义。变量声明未赋值、函数参数未传入、对象属性不存在、函数无返回值。`typeof undefined === 'undefined'`

```javascript
null == undefined   // true
null === undefined  // false
```

记忆：null 是"空指针"（有意设为空），undefined 是"还没定义"（意外缺失）。

### 为什么 0.1 + 0.2 !== 0.3？如何解决？

原因：JS 中 Number 遵循 IEEE 754 双精度标准（64位：1位符号 + 11位指数 + 52位尾数），十进制小数转二进制时发生精度截断：

```javascript
0.1 + 0.2 // 0.30000000000000004
0.5 + 0.5 // 1（0.5 能被二进制精确表示）
```

追问：`console.log(0.1)` 为什么还是显示 `0.1`？因为打印时会将二进制转回十进制字符串，这个过程取了近似值。

**解决方案**：

```javascript
// 方案一：放大为整数计算
(0.1 * 1000 + 0.2 * 1000) / 1000 === 0.3 // true

// 方案二：toFixed 取近似值
parseFloat((0.1 + 0.2).toFixed(1)) // 0.3

// 方案三：使用 bignumber.js 等库
const x = new BigNumber(0.1);
x.plus(0.2).equals(0.3) // true
```

---

## 数组与对象操作

### 数组常见方法有哪些？哪些会改变原数组？

**会改变原数组**：`push`、`pop`、`shift`、`unshift`、`splice`、`sort`、`reverse`、`fill`、`copyWithin`

**不改变原数组**：`slice`、`concat`、`join`、`map`、`filter`、`forEach`、`find`、`findIndex`、`indexOf`、`includes`、`some`、`every`、`reduce`、`flat`、`flatMap`

**核心方法对比**：

```javascript
// splice：增删改，会改变原数组，返回被删除元素
arr.splice(index, deleteCount, ...items)

// slice：截取，不改变原数组，返回新数组
arr.slice(start, end)  // 不含 end

// concat：合并数组，不改变原数组
[1,2].concat([3,4])  // [1,2,3,4]

// join：数组转字符串
[1,2,3].join('-')  // '1-2-3'
```

**遍历方法及返回值**：

| 方法 | 返回值 | 说明 |
|---|---|---|
| `forEach` | undefined | 无法 break，不可链式 |
| `map` | 新数组（每个元素经过变换） | 长度不变 |
| `filter` | 新数组（满足条件的元素） | 长度可能减少 |
| `reduce` | 单个累计值 | 可用于求和、展平等 |
| `some` | boolean | 有一项满足返回 true |
| `every` | boolean | 全部满足才返回 true |
| `find` | 第一个满足条件的元素 | 找不到返回 undefined |
| `findIndex` | 第一个满足条件的下标 | 找不到返回 -1 |

### `map` 和 `filter` 有什么区别？

- **`map`**：对每个元素做变换，返回等长的新数组
- **`filter`**：过滤出满足条件的元素，返回可能更短的新数组

```javascript
[1, 2, 3].map(v => v * 2)           // [2, 4, 6]
[1, 2, 3, 4].filter(v => v % 2 === 0) // [2, 4]
```

### `for`、`for...in`、`for...of`、`forEach` 有什么区别？

| 特性 | `for` | `for...in` | `for...of` | `forEach` |
|---|---|---|---|---|
| 遍历对象 | 需配合 Object.keys() | 可以 | 需配合 Object.entries() | 不可 |
| 遍历数组 | 可以（索引） | 可以（索引，不推荐） | 可以（值） | 可以（值） |
| 原型链 | 不涉及 | 会遍历（可用 hasOwnProperty 过滤） | 不涉及 | 不涉及 |
| break/continue | 支持 | 支持 | 支持 | 不支持 |
| 异步 await | 支持 | 支持 | 支持 | 不等待 |

**for...in** 遍历对象的**键名（属性名）**，适合遍历对象；数组用它会遍历原型链上的可枚举属性，不推荐。

**for...of** 遍历可迭代对象的**值**，适合数组、字符串、Set、Map、Generator；普通对象没有实现迭代器，不能直接用。

```javascript
const obj = { a: 1, b: 2 };
for (const key in obj) console.log(key);  // 'a', 'b'

const arr = [1, 2, 3];
for (const val of arr) console.log(val); // 1, 2, 3
```

### 遍历对象的方法有哪些？

| 方法 | 自身可枚举 | 自身不可枚举 | Symbol | 原型链 |
|---|---|---|---|---|
| `for...in` | ✓ | ✗ | ✗ | ✓ |
| `Object.keys()` | ✓ | ✗ | ✗ | ✗ |
| `Object.getOwnPropertyNames()` | ✓ | ✓ | ✗ | ✗ |
| `Object.getOwnPropertySymbols()` | ✓（Symbol） | ✓（Symbol） | ✓ | ✗ |
| `Reflect.ownKeys()` | ✓ | ✓ | ✓ | ✗ |

### 如何判断空数组和空对象？

```javascript
// 空数组
Array.isArray(arr) && arr.length === 0

// 空对象
Object.keys(obj).length === 0

// 更健壮的空对象判断
function isEmpty(obj) {
  if (obj === null || obj === undefined) return true;
  if (typeof obj !== 'object') return true;
  return Object.keys(obj).length === 0;
}
```

### 如何打乱数组元素？

**Fisher-Yates 洗牌算法**（正确且均匀）：

```javascript
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
```

注意：`arr.sort(() => Math.random() - 0.5)` 虽然简洁，但结果分布不均匀，生产环境不推荐。

### 数组扁平化有哪些方式？

```javascript
const arr = [1, [2, [3, [4]]]];

// 方案一：flat（ES2019）
arr.flat(Infinity)  // [1, 2, 3, 4]

// 方案二：递归
function flatten(arr) {
  return arr.reduce((acc, val) =>
    Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val), []);
}

// 方案三：toString + split（仅适用于数字数组）
arr.toString().split(',').map(Number)
```

---

## ES6+ 新特性

### ES6 有哪些新特性？

- **`let` / `const`**：块级作用域，解决 var 的变量提升和作用域污染问题
- **新数据类型**：`Symbol`、`Map`、`Set`、`WeakMap`、`WeakSet`
- **模板字符串**：反引号，支持多行和嵌入表达式 `${}`
- **解构赋值**：从数组/对象提取值
- **扩展运算符 `...`**：展开数组/对象
- **箭头函数**：`this` 不绑定自身，继承外层
- **Promise**：解决回调地狱
- **class**：OOP 语法糖
- **模块化**：`import` / `export`
- **Proxy / Reflect**：对象代理和反射
- **Generator**：生成器函数，`yield` 挂起执行
- **`Object.assign()`**：对象浅合并

### `Set` 和 `Map` 是什么？

**Set**：类似数组，但成员值**唯一**，常用于数组去重。

```javascript
const set = new Set([1, 2, 2, 3]);
console.log([...set])  // [1, 2, 3]

// 常用方法
set.add(4)
set.has(2)    // true
set.delete(2)
set.size      // 当前元素数量
```

**Set 实现集合运算（高频追问）**：

```javascript
const a = new Set([1, 2, 3, 4]);
const b = new Set([3, 4, 5, 6]);

// 并集 Union
const union = new Set([...a, ...b]);           // {1,2,3,4,5,6}

// 交集 Intersection
const intersection = new Set([...a].filter(x => b.has(x))); // {3,4}

// 差集 Difference（a 有 b 没有）
const difference = new Set([...a].filter(x => !b.has(x)));  // {1,2}
```

**Map**：键值对集合，键可以是**任意类型**（Object 的键只能是 string/Symbol）。

```javascript
const map = new Map();
map.set('name', '张三')
map.set({ id: 1 }, 'value')  // 对象作为键

map.get('name')    // '张三'
map.has('name')    // true
map.size           // 键值对数量
```

**Map vs Object**：

| 特性 | Map | Object |
|---|---|---|
| 键类型 | 任意类型 | String / Symbol |
| 大小 | `size` 属性 | 需手动计算 |
| 遍历 | `for...of`、`forEach` | `for...in` |
| 插入顺序 | 有序 | 随机（整数键会排序） |
| JSON 序列化 | 不支持（直接变 `{}`） | 支持 |
| 查找性能（理想情况） | O(1) | O(1) |

追问：Map 时间复杂度为何有时是 O(n)？当哈希冲突严重时，同一个桶中的键形成链表，查找退化为 O(n)；若用红黑树处理冲突则为 O(log n)。

### `WeakSet` 和 `WeakMap` 是什么？

两者都使用**弱引用**，对象作为键/值时不阻止垃圾回收，适合存储不需要手动管理生命周期的对象（如 DOM 节点）。

**WeakSet**：只能存对象，没有 `size`，不能遍历，方法只有 `add`、`has`、`delete`。

**WeakMap**：键只能是对象（null 除外），值可以任意类型，没有 `size`，不能遍历，方法只有 `get`、`set`、`has`、`delete`。

**为什么不能遍历**：弱引用随时可能被 GC 回收，遍历时状态不稳定，无法保证一致性。

**使用场景**：WeakMap 常用于存储与 DOM 元素关联的私有数据，元素被移除后关联数据自动回收，不泄漏内存。

### `Reflect` 和 `Proxy` 是什么？

**Proxy**：对对象操作的拦截器，可以拦截对象的读写、删除、枚举等操作。Vue 3 响应式系统的底层就是基于 Proxy。

```javascript
const handler = {
  get(target, key) {
    console.log(`读取 ${key}`);
    return Reflect.get(target, key);
  },
  set(target, key, value) {
    console.log(`设置 ${key} = ${value}`);
    return Reflect.set(target, key, value);
  }
};
const proxy = new Proxy({}, handler);
proxy.name = '张三';  // 触发 set
proxy.name;           // 触发 get
```

**Reflect**：提供与 Proxy handlers 一一对应的 13 个静态方法，用于对对象执行底层操作。

- 所有方法都是静态方法，类似 `Math`
- 与 `Object.*` 功能相近，但行为更规范：如 `Object.defineProperty` 失败会抛出异常，`Reflect.defineProperty` 返回 `false`
- 在 Proxy handler 中配合使用，保持对象的默认行为

```javascript
Reflect.get(target, key)
Reflect.set(target, key, value)
Reflect.has(target, key)
Reflect.ownKeys(target)
```

---

## 深拷贝与浅拷贝

### 深拷贝和浅拷贝有什么区别？

根本原因：引用类型存储的是指针，浅拷贝只复制指针，两个变量指向同一块内存。

**浅拷贝**：只复制一层，嵌套对象仍共享引用。

```javascript
const original = { a: 1, b: { c: 2 } };

// 浅拷贝方法
const copy1 = { ...original };
const copy2 = Object.assign({}, original);

copy1.b.c = 99;
console.log(original.b.c); // 99（被影响了）
```

**深拷贝**：递归复制所有层级，新旧对象完全独立。

```javascript
// 方案一：JSON（最简单，有缺陷）
JSON.parse(JSON.stringify(obj))

// JSON 的缺陷：
// - undefined、function、Symbol 丢失
// - Date 变字符串
// - RegExp、Map、Set 变空对象 {}
// - NaN、Infinity 变 null
// - 循环引用报错

// 方案二：structuredClone（ES2022，推荐！）
const copy = structuredClone(obj);
// 原生支持 Date、RegExp、Map、Set、循环引用，不支持 function

// 方案三：递归 + Map 解决循环引用
function deepCopy(obj, map = new Map()) {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (map.has(obj)) return map.get(obj);

  const clone = Array.isArray(obj) ? [] : {};
  map.set(obj, clone);

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepCopy(obj[key], map);
    }
  }
  return clone;
}

// 方案四：lodash.cloneDeep（生产推荐，支持最全面）
import cloneDeep from 'lodash/cloneDeep';
```

**追问：`structuredClone` 和 `JSON.parse(JSON.stringify())` 有什么区别？**

| 特性 | JSON 方案 | structuredClone |
|---|---|---|
| Date | 变字符串 | 保留 Date 对象 |
| RegExp / Map / Set | 变 `{}` | 正确保留 |
| undefined / Symbol | 丢失 | 丢失 |
| function | 丢失 | 丢失（抛错） |
| 循环引用 | 报错 | 支持 |
| 浏览器兼容性 | 全支持 | Chrome 98+，Node 17+ |

---

## 异步与事件循环

### JavaScript 为什么是单线程的？

JS 最初设计用于浏览器操作 DOM，如果多线程同时操作 DOM 会产生竞态问题（一个线程删了节点，另一个线程在修改它）。为避免这类问题，JS 被设计为单线程。

虽然 HTML5 引入了 Web Worker 支持多线程，但 Worker 线程无法操作 DOM，主线程依然是单线程模型。

### 什么是事件循环（Event Loop）？

JS 是单线程的，但浏览器/Node.js 提供了异步能力。事件循环是实现异步的核心机制。

```
┌─────────────────────────────────────────────────────────┐
│                    调用栈 (Call Stack)                   │
│  同步代码在这里执行，LIFO 结构，栈空才会取任务            │
└────────────────────────┬────────────────────────────────┘
                         │ 栈清空
                         ▼
┌─────────────────────────────────────────────────────────┐
│              微任务队列 (Microtask Queue)                │
│   Promise.then / catch / finally                        │
│   MutationObserver                                      │
│   queueMicrotask()                                      │
│  ← 每次宏任务执行完后，先把微任务队列清空到底 →           │
└────────────────────────┬────────────────────────────────┘
                         │ 微任务清空后
                         ▼
┌─────────────────────────────────────────────────────────┐
│              宏任务队列 (MacroTask Queue)                │
│   setTimeout / setInterval                              │
│   I/O 事件、UI 渲染、MessageChannel                     │
│  ← 每次只取一个宏任务执行，执行完再清空微任务 →           │
└─────────────────────────────────────────────────────────┘
```

**执行顺序**：同步代码 → 清空所有微任务 → 一个宏任务 → 清空所有微任务 → 下一个宏任务 → …

```javascript
console.log('1');                          // 同步

setTimeout(() => console.log('2'), 0);    // 宏任务

Promise.resolve()
  .then(() => console.log('3'))           // 微任务
  .then(() => console.log('4'));          // 微任务（链式，第二个微任务）

console.log('5');                          // 同步

// 输出顺序：1 → 5 → 3 → 4 → 2
// 解释：
// 同步：1, 5
// 微任务（栈清空后立刻）：3, 4（链式 .then 会把下一个 then 推入微任务队列）
// 宏任务（微任务队列清空后）：2
```

**包含 async/await 的例子（高频考题）**：

```javascript
async function fn() {
  console.log('A');
  await Promise.resolve();   // await 相当于 .then，之后的代码是微任务
  console.log('B');
}

console.log('1');
fn();
console.log('2');

// 输出：1 → A → 2 → B
// await 遇到后，'B' 被推进微任务队列
// 同步代码执行完（输出 2）后，才执行微任务（输出 B）
```

### `setTimeout` 准确吗？

不准确。原因：
1. `setTimeout(fn, 0)` 最小延迟实际是 **4ms**（浏览器规定最小间隔）
2. 如果主线程有大量同步任务阻塞，定时器会延迟执行
3. 页面处于后台标签页时，浏览器降低定时器频率（节能）

`setInterval` 同样不准确，且如果回调执行时间超过间隔，会产生回调堆积问题。

精确计时用 `requestAnimationFrame`（帧同步，约 16ms）或 Web Worker 内的 `setInterval`（不受主线程阻塞）。

### `setTimeout`、`Promise`、`async/await` 有什么区别？

- **setTimeout**：宏任务，放入宏任务队列，等所有微任务执行完再执行
- **Promise.then**：微任务，当前宏任务结束后立即执行
- **async/await**：语法糖，`await` 后面相当于 `Promise.then` 的回调（微任务）

```javascript
async function test() {
  console.log('1');
  await Promise.resolve();
  console.log('2');  // 微任务
}

test();
console.log('3');
// 输出：1 → 3 → 2
```

### Node.js 事件循环和浏览器有什么区别？

Node.js 的事件循环基于 libuv 库，分为 6 个阶段，顺序执行：

```
┌─────────────────────────────────────────┐
│               timers 阶段               │ ← 执行 setTimeout / setInterval 到期回调
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           I/O callbacks 阶段            │ ← 执行上一轮遗留的 I/O 错误回调
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           idle, prepare 阶段            │ ← 内部使用，忽略
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│               poll 阶段                 │ ← 等待新的 I/O 事件（核心阶段）
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│              check 阶段                 │ ← 执行 setImmediate 回调
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          close callbacks 阶段           │ ← 执行关闭事件回调（如 socket.on('close')）
└─────────────────┬───────────────────────┘
                  │
    ← 每个阶段切换时，先清空 nextTick 队列和 Promise 微任务 →
                  │
            循环回 timers
```

**Node.js 特有**：
- `setImmediate`：在 check 阶段执行，当前 I/O 回调结束后立即执行
- `process.nextTick`：不属于任何阶段，**在当前操作完成后、下一阶段开始前立即执行**，优先级高于 Promise.then

**执行优先级**：`process.nextTick` > `Promise.then` > `setImmediate` > `setTimeout`

**关键陷阱**：
```javascript
// setImmediate vs setTimeout(fn, 0) 的顺序并不确定
setTimeout(() => console.log('setTimeout'), 0);
setImmediate(() => console.log('setImmediate'));
// 在主模块中：顺序不确定（受操作系统计时器精度影响）
// 在 I/O 回调中：setImmediate 一定在 setTimeout 之前
```

```javascript
// process.nextTick 递归调用会"饿死"事件循环其他阶段
process.nextTick(function loop() {
  process.nextTick(loop);
  // 其他所有 I/O、定时器永远无法执行！
});
```

**与浏览器的核心区别**：
- 浏览器的宏任务/微任务模型简单：宏任务 → 清空微任务 → 下一宏任务
- Node.js 有 6 个阶段，每个阶段切换时才清空微任务，而不是每个任务后都清

---

## 作用域、闭包与 this

### 什么是变量提升？`let`、`const`、`var` 有什么区别？

**变量提升**：`var` 声明的变量在代码执行前被提升到函数/全局作用域顶部，赋值不提升，默认值为 `undefined`。

```javascript
console.log(a);  // undefined（不会报错）
var a = 1;

console.log(b);  // ReferenceError（TDZ）
let b = 2;
```

| 特性 | `var` | `let` | `const` |
|---|---|---|---|
| 作用域 | 函数/全局 | 块级 | 块级 |
| 变量提升 | 是（初始化为 undefined） | TDZ（声明前不可用） | TDZ（声明前不可用） |
| 重复声明 | 允许 | 不允许 | 不允许 |
| 重新赋值 | 允许 | 允许 | 不允许 |
| 绑定到 window | 是 | 否 | 否 |

**TDZ（暂时性死区）**：`let`/`const` 声明的变量在声明语句之前不可访问，访问会抛出 ReferenceError。

**`const` 对象的属性可以修改吗？**

可以。`const` 只保证变量本身（指针）不被重新赋值，但指针指向的对象内容可以修改：

```javascript
const obj = { a: 1 };
obj.a = 2;     // 允许
obj = {};      // TypeError: Assignment to constant variable
```

### 什么是 `this`？

`this` 是函数执行时的上下文对象，其值在**运行时**动态绑定，取决于函数的调用方式：

1. **默认绑定**：普通函数调用，严格模式为 `undefined`，非严格模式为全局对象
2. **隐式绑定**：作为对象方法调用，`this` 指向调用该方法的对象
3. **显式绑定**：通过 `call`、`apply`、`bind` 指定 `this`
4. **new 绑定**：构造函数调用，`this` 指向新创建的实例
5. **箭头函数**：没有自己的 `this`，继承外层词法作用域的 `this`

优先级：new > 显式 > 隐式 > 默认

### 普通函数和箭头函数有什么区别？

| 特性 | 普通函数 | 箭头函数 |
|---|---|---|
| `this` | 动态绑定（调用时决定） | 词法绑定（定义时继承外层） |
| `arguments` 对象 | 有 | 没有（用 `...rest` 代替） |
| `prototype` | 有 | 没有 |
| 能否作构造函数 | 能（`new`） | 不能（没有 prototype） |
| `call/apply/bind` | 可以改变 this | 无法改变 this |

箭头函数适合需要保持外层 `this` 的回调场景（如 setTimeout 内访问组件实例）。

### `call`、`apply`、`bind` 有什么区别？哪个性能更好？

三者都用于**显式绑定 this**：

- **`call(thisArg, arg1, arg2, ...)`**：立即执行，参数逐个传入
- **`apply(thisArg, [args])`**：立即执行，参数以数组传入
- **`bind(thisArg, arg1, ...)`**：返回绑定了 this 的新函数，不立即执行

```javascript
fn.call(obj, 1, 2, 3);
fn.apply(obj, [1, 2, 3]);
const bound = fn.bind(obj, 1, 2, 3);
bound();  // 执行
```

性能：`call` > `apply`，因为 `apply` 需要额外解析数组参数。

**手写 call**：

```javascript
Function.prototype.myCall = function(context = window, ...args) {
  // this 是调用 myCall 的函数
  const fn = Symbol('fn');   // 唯一 key，防止覆盖原有属性
  context[fn] = this;        // 把函数挂到 context 上
  const result = context[fn](...args);  // 隐式绑定：this → context
  delete context[fn];        // 清理
  return result;
};

// 验证
function greet(greeting) { return `${greeting}, ${this.name}`; }
greet.myCall({ name: '张三' }, 'Hello');  // 'Hello, 张三'
```

**手写 apply**：

```javascript
Function.prototype.myApply = function(context = window, args = []) {
  const fn = Symbol('fn');
  context[fn] = this;
  const result = context[fn](...args);
  delete context[fn];
  return result;
};
```

**手写 bind**：

```javascript
Function.prototype.myBind = function(context, ...outerArgs) {
  const self = this;
  return function BoundFn(...innerArgs) {
    // 如果作为构造函数 new BoundFn() 调用，this 指向新实例，忽略绑定的 context
    if (this instanceof BoundFn) {
      return new self(...outerArgs, ...innerArgs);
    }
    return self.apply(context, [...outerArgs, ...innerArgs]);
  };
};
```

追问：**bind 后的函数再 bind 能改变 this 吗？**

不能。第一次 bind 已经硬绑定了 this，后续的 bind 无法覆盖。内部使用 apply/call 时 context 已经固定为第一次绑定的值。

### 什么是闭包？有什么场景？有什么缺点？

**闭包**：函数可以访问其定义时所在词法作用域中的变量，即使该函数在其词法作用域之外执行。

简单说：**闭包 = 函数 + 它能访问的外部变量**。

```javascript
function counter() {
  let count = 0;
  return {
    increment: () => ++count,
    get: () => count
  };
}
const c = counter();
c.increment();
c.get();  // 1
// count 变量通过闭包被保留，外部无法直接访问
```

**使用场景**：
- 模块化：封装私有变量和方法
- 防抖/节流
- 函数柯里化
- 缓存计算结果（memoize）

**缺点**：闭包引用的变量不会被 GC 回收，使用不当会导致内存泄漏。

**如何避免内存泄漏**：使用完毕后将引用设为 `null`。

```javascript
let closure = makeHeavyClosure();
closure.doWork();
closure = null;  // 释放引用，GC 可以回收
```

#### 经典陷阱：var 循环闭包问题（高频考题）

```javascript
// 问题：输出 5 个 5，而不是 0 1 2 3 4
for (var i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 0);
}
// 输出：5 5 5 5 5
```

原因：`var` 没有块级作用域，所有回调共享同一个 `i`。循环结束时 `i = 5`，所有回调执行时读取的都是 5。

**三种修复方案**：

```javascript
// 方案一：用 let（最简单，推荐）
for (let i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 0);
}
// let 每次循环创建独立的块级作用域，每个回调持有自己的 i

// 方案二：IIFE 立即执行函数（ES5 时代方案）
for (var i = 0; i < 5; i++) {
  (function(j) {
    setTimeout(() => console.log(j), 0);
  })(i);  // 把 i 作为参数传入，创建独立作用域
}

// 方案三：bind 传参
for (var i = 0; i < 5; i++) {
  setTimeout(console.log.bind(null, i), 0);
}
```

### 什么是垃圾回收（GC）？

JS 引擎自动管理内存，不需要的对象会被垃圾回收器回收。

**内存生命周期**：分配 → 使用 → 释放

**两种算法**：

1. **引用计数**（旧）：对象被引用计数加 1，引用失效减 1，计数为 0 时回收。缺陷：循环引用无法回收（A 引用 B，B 引用 A，两者计数永远不为 0）

2. **标记清除**（现代主流）：从根对象出发，标记所有可达对象，未被标记的对象被回收。解决了循环引用问题。

**内存泄漏常见场景**：
- 意外的全局变量（忘记用 var/let/const 声明）
- 未清除的定时器或事件监听器
- 闭包引用了不再需要的大对象
- 遗忘的 DOM 引用（变量引用了已移除的 DOM 节点）

---

## 原型与继承

### 什么是原型链？

每个对象都有一个内部槽 `[[Prototype]]`，指向它的原型对象，原型对象也有自己的 `[[Prototype]]`，层层向上，直到 `null`，这条链叫**原型链**。`__proto__` 是访问 `[[Prototype]]` 的非标准属性，推荐用 `Object.getPrototypeOf()` 访问。

查找属性时，先在对象自身查找，找不到就沿原型链向上查找。

```
实例 p（new Person('张三')）
    │
    │  __proto__  （即 [[Prototype]]）
    ▼
Person.prototype          ← greet 方法在这里
    │
    │  __proto__
    ▼
Object.prototype          ← hasOwnProperty、toString 等在这里
    │
    │  __proto__
    ▼
   null                   ← 链终点
```

```javascript
function Person(name) { this.name = name; }
Person.prototype.greet = function() { return `Hi, I'm ${this.name}`; };

const p = new Person('张三');

p.greet();         // 自身没有 → 沿链找到 Person.prototype.greet
p.hasOwnProperty   // 自身没有 → Person.prototype 没有 → 找到 Object.prototype.hasOwnProperty

p.__proto__ === Person.prototype           // true
Person.prototype.__proto__ === Object.prototype // true
Object.prototype.__proto__ === null        // true
```

**`Object.create(null)` 创建的对象**：没有原型，因此也没有 `hasOwnProperty`、`toString` 等方法，常用作纯粹的键值字典，不受原型链污染。

```javascript
const dict = Object.create(null);
dict.key = 'value';
dict.hasOwnProperty // undefined，没有这个方法
```

追问：**`Function.__proto__ === Function.prototype`**，函数既是对象又是函数，`Function` 是自身的实例，这是 JS 原型体系中唯一的"自举"现象。

### `new` 操作符做了什么？

```javascript
function myNew(Constructor, ...args) {
  // 1. 创建空对象，原型指向构造函数的 prototype
  const obj = Object.create(Constructor.prototype);
  // 2. 执行构造函数，this 指向新对象
  const result = Constructor.apply(obj, args);
  // 3. 如果构造函数返回对象则使用它，否则返回新对象
  return result instanceof Object ? result : obj;
}
```

1. 创建新的空对象
2. 将新对象的 `__proto__` 指向构造函数的 `prototype`
3. 以新对象为 `this` 执行构造函数
4. 如果构造函数显式返回对象，则返回该对象；否则返回新对象

### 如何实现继承？

**ES6 class（推荐）**：

```javascript
class Animal {
  constructor(name) { this.name = name; }
  speak() { console.log(`${this.name} makes a sound`); }
}

class Dog extends Animal {
  speak() { console.log(`${this.name} barks`); }
}

const dog = new Dog('Rex');
dog.speak();         // Rex barks
dog instanceof Animal  // true
```

**ES5 组合继承**：

```javascript
function Animal(name) { this.name = name; }
Animal.prototype.speak = function() { console.log(this.name); };

function Dog(name, breed) {
  Animal.call(this, name);   // 继承实例属性
  this.breed = breed;
}
Dog.prototype = Object.create(Animal.prototype);  // 继承原型方法
Dog.prototype.constructor = Dog;  // 修正 constructor
```

---

## 模块化

### CommonJS 和 ES Module 有什么区别？

| 特性 | CommonJS（Node.js） | ES Module（ESM） |
|---|---|---|
| 语法 | `require()` / `module.exports` | `import` / `export` |
| 加载时机 | 运行时动态加载 | 编译时静态分析 |
| 导出值 | 值的拷贝 | 值的引用（live binding） |
| 顶层 `this` | `module.exports` | `undefined` |
| 循环依赖 | 加载已执行的部分 | 静态分析，允许但需注意 |
| Tree Shaking | 不支持（动态加载） | 支持（静态结构） |
| 同步/异步 | 同步 | 异步（可用 `import()` 动态导入） |

```javascript
// CommonJS
const fs = require('fs');
module.exports = { myFunc };

// ESM
import fs from 'fs';
export const myFunc = () => {};
export default myFunc;
```

**重要区别**：CommonJS `require` 导出的是值的拷贝，修改导出的变量不影响已导入的值；ESM 导出的是实时绑定，原始值改变，引用它的地方也会跟着改变。

---

## 浏览器与 DOM

### CSS 阻塞 DOM 解析吗？

理解这个问题，需要先了解浏览器的**渲染流程**：

```
HTML 字节流
    │
    ▼
┌─────────────┐        ┌─────────────┐
│  Parse HTML  │        │  Parse CSS  │
│  构建 DOM 树 │        │ 构建 CSSOM  │
└──────┬──────┘        └──────┬──────┘
       │                      │
       └──────────┬───────────┘
                  ▼
          ┌─────────────┐
          │ Render Tree  │ ← DOM + CSSOM 合并
          └──────┬──────┘
                 ▼
          ┌─────────────┐
          │   Layout    │ ← 计算每个节点的位置和大小
          └──────┬──────┘
                 ▼
          ┌─────────────┐
          │    Paint    │ ← 绘制像素
          └──────┬──────┘
                 ▼
          ┌─────────────┐
          │  Composite  │ ← GPU 合成各层
          └─────────────┘
```

基于这个流程：

- **CSS 不阻塞 DOM 解析**：DOM 和 CSSOM 是并行构建的
- **CSS 阻塞页面渲染**：Render Tree 需要等 CSSOM 构建完成才能合并，所以 CSS 未加载完不显示页面
- **JS 阻塞 DOM 解析**：浏览器遇到 `<script>` 标签，会暂停 DOM 解析，等 JS 下载并执行完再继续。原因：JS 可能调用 `document.write()` 修改文档流，因此必须同步执行

**CSS 也会间接阻塞 JS 执行**：如果 JS 位于 CSS 之后，浏览器必须等 CSSOM 构建完，确保 JS 能读到正确的样式信息，再执行 JS。

这也是页面优化的理论基础：
- `<link>` 放 `<head>` 里尽早加载 CSS
- `<script>` 放 `</body>` 前，或使用 `defer`/`async`

追问：**`transform` 动画为什么不触发重排？**  
因为 `transform` 和 `opacity` 的变化跳过了 Layout 和 Paint 阶段，直接在 Composite（合成）阶段由 GPU 处理，代价最低。

### `script` 标签的 `defer` 和 `async` 有什么区别？

两者都是**异步下载**，不阻塞 HTML 解析。区别在于执行时机：

```
普通 script：
HTML解析 ──▶ [暂停] ──▶ 下载JS ──▶ 执行JS ──▶ 继续解析HTML
                       ↑ 阻塞

async：
HTML解析 ══════════════════════════════════════▶
               ↓ 并行下载
JS下载    ══════════▶ 立即执行 ──▶（可能中断HTML解析）
               ↑ 谁先下完谁先跑，顺序不可控

defer：
HTML解析 ══════════════════════════════════════▶ 解析完成
               ↓ 并行下载                              ↓
JS下载    ══════════▶ ← 等HTML解析完成 → 按顺序执行 ──▶ DOMContentLoaded
               ↑ 顺序可控，DOM 已就绪
```

| 特性 | 普通 `<script>` | `async` | `defer` |
|---|---|---|---|
| 下载 | 阻塞解析 | 并行下载 | 并行下载 |
| 执行时机 | 立即（阻塞解析） | 下载完立即执行 | HTML 解析完后 |
| 执行顺序 | 顺序 | 无序（谁先下完谁先跑） | 按 HTML 中顺序 |
| DOMContentLoaded | 之前 | 无关 | 之前 |
| 适用场景 | — | 独立第三方脚本（统计、广告） | 依赖 DOM 或有依赖关系的脚本 |

同时设置 `defer` 和 `async` 时，`async` 优先级更高。`defer` 只对外部脚本有效，内联脚本无效。

### 什么是重排（Reflow）和重绘（Repaint）？

- **重排（Reflow）**：布局改变，浏览器重新计算元素的位置和大小。代价最高，触发条件：修改宽高、改变字体大小、增删 DOM、调整窗口大小等
- **重绘（Repaint）**：元素外观改变但不影响布局，浏览器重新绘制像素。触发条件：修改颜色、背景色、visibility 等

**关键结论**：重绘不一定触发重排，但重排一定触发重绘。

**如何减少重排**：
- 批量修改样式，用 class 切换而不是逐条修改 style
- 使用 `display: none` 隐藏元素后批量操作再显示（离线操作）
- 使用 `DocumentFragment` 批量操作 DOM
- 避免频繁读取触发重排的属性（`offsetWidth`、`scrollTop` 等），缓存值
- 使用 `transform` 和 `opacity` 代替 top/left（触发 GPU 合成，不重排）
- 不用 `table` 布局（任何单元格改动都可能触发整个表格重排）

### 什么是虚拟 DOM？虚拟 DOM 一定比真实 DOM 快吗？

**虚拟 DOM（Virtual DOM）**：用 JS 对象描述真实 DOM 结构的轻量级副本。框架（React/Vue）维护一棵虚拟 DOM 树，状态更新时先对比新旧虚拟 DOM（Diff），再将差异应用到真实 DOM（Patch），减少不必要的 DOM 操作。

**虚拟 DOM 不一定更快**：
- 对于简单、少量操作：直接操作真实 DOM 更快（虚拟 DOM 有对比开销）
- 对于复杂、大量操作：虚拟 DOM 通过批量更新和最小化操作更快
- 虚拟 DOM 的真正价值是**开发体验**：声明式编程、数据驱动视图、跨平台（SSR、Native），性能只是副产品

### 什么是事件冒泡和事件捕获？

**DOM 事件流三阶段**：
1. **捕获阶段**：从 window → document → html → ... → 目标元素（从外到内）
2. **目标阶段**：事件到达目标元素
3. **冒泡阶段**：从目标元素 → ... → document → window（从内到外）

```javascript
// 第三个参数：false（默认）= 冒泡阶段触发，true = 捕获阶段触发
el.addEventListener('click', handler, false);  // 冒泡
el.addEventListener('click', handler, true);   // 捕获

// 阻止冒泡
event.stopPropagation();
// 阻止默认行为
event.preventDefault();
```

**事件委托**：利用冒泡原理，将子元素的事件处理器挂在父元素上，通过 `event.target` 判断实际触发元素。

```javascript
// 给父元素绑定，处理所有子元素的点击
list.addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    console.log(e.target.textContent);
  }
});
```

优点：减少事件监听器数量、自动处理动态新增的子元素、节省内存。

### 什么是跨域？如何解决？

浏览器的**同源策略**：协议、域名、端口三者必须完全一致，否则请求被限制。

**为什么会发两个请求（预检请求）**：对于非简单请求（PUT/DELETE/自定义 Header/Content-Type 非表单类型），浏览器先发 `OPTIONS` 预检请求，确认服务器是否允许跨域，通过后再发真实请求。

**解决方案**：

1. **CORS（推荐）**：服务器设置响应头
```
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, POST, PUT
```

2. **代理服务器**：开发时 Webpack DevServer 配置代理，生产时 Nginx 反向代理（代理不受同源策略限制）

3. **JSONP**：利用 `<script>` 标签不受同源限制，只支持 GET 请求，已较少使用

---

## 网络与存储

### `cookie`、`sessionStorage`、`localStorage` 有什么区别？

| 特性 | cookie | localStorage | sessionStorage |
|---|---|---|---|
| 存储大小 | ~4KB | ~5-10MB | ~5-10MB |
| 生命周期 | 可设置过期时间 | 永久（手动清除） | 会话级（关闭标签页清除） |
| 服务器通信 | 每次请求自动携带 | 不发送 | 不发送 |
| 作用域 | 可跨子域 | 同源共享 | 当前标签页 |
| 跨域 | 不支持 | 不支持 | 不支持 |

**如何查看 localStorage 剩余空间**：可以用 try/catch 包裹 `setItem` 捕获 `QuotaExceededError`，但无法直接读取剩余量。

### `token` 相关

**token 包含哪些信息（以 JWT 为例）**：
- Header：算法和类型（`{"alg":"HS256","typ":"JWT"}`）
- Payload：用户信息（id、角色、过期时间等）
- Signature：签名（防篡改）

**为什么要加盐**：密码存储时加盐（随机字符串拼接密码再哈希），防止彩虹表攻击（预计算的哈希值字典）。不加盐的话，相同密码哈希值相同，攻击者可以用彩虹表反向查找原文。

**token 存在哪里**：
- `localStorage`：简单，但有 XSS 攻击风险（JS 可读取）
- `cookie`（设置 `HttpOnly` + `Secure`）：JS 无法读取（防 XSS），但需防范 CSRF

**cookie vs token**：
- cookie 由服务器设置，自动携带，是状态的（服务器需维护 session）
- token 由客户端存储，手动携带（Authorization header），是无状态的（服务器只验证签名）

---

## 性能优化

### 节流（Throttle）和防抖（Debounce）是什么？有什么区别？

**防抖（Debounce）**：一段时间内只执行最后一次触发。适合输入框搜索、窗口 resize 最终值。

```javascript
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
```

**节流（Throttle）**：固定时间间隔内只执行一次。适合滚动事件、鼠标移动、高频点击。

```javascript
function throttle(fn, interval) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}
```

区别：防抖是"最后说话算"，节流是"定时执行"。

---

## 函数进阶

### 什么是函数柯里化？

柯里化（Currying）：将接受多个参数的函数转化为接受单个参数的函数链，返回结果是接受余下参数的函数。

```javascript
// 普通函数
function add(a, b, c) { return a + b + c; }

// 柯里化后
const curryAdd = a => b => c => a + b + c;
curryAdd(1)(2)(3)  // 6

// 通用柯里化实现
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...args2) {
      return curried.apply(this, args.concat(args2));
    };
  };
}
```

**用途**：参数复用（固定部分参数）、延迟执行、函数组合。

### 什么是迭代器和生成器？

**迭代器（Iterator）**：实现了 `next()` 方法的对象，每次调用返回 `{ value, done }`。

```javascript
function makeIterator(arr) {
  let index = 0;
  return {
    next() {
      return index < arr.length
        ? { value: arr[index++], done: false }
        : { value: undefined, done: true };
    }
  };
}
```

**可迭代对象**：实现了 `[Symbol.iterator]()` 方法的对象，该方法返回一个迭代器。数组、字符串、Map、Set 都是可迭代对象，for...of 依赖这个接口。

**普通对象没有部署迭代器接口**，因为对象属性没有顺序，不适合迭代，如果需要可以手动实现。

**生成器（Generator）**：通过 `function*` 定义，用 `yield` 暂停执行，返回一个同时是迭代器和可迭代对象的生成器对象。

```javascript
function* range(start, end) {
  for (let i = start; i < end; i++) {
    yield i;
  }
}

for (const val of range(0, 3)) {
  console.log(val);  // 0, 1, 2
}
```

`yield` 工作原理：生成器函数遇到 `yield` 时挂起，返回 yield 后的值；调用 `next()` 时从上次暂停位置继续执行。

### `for await...of` 有什么作用？

用于遍历**异步可迭代对象**（如 Promise 数组、异步生成器），顺序等待每个 Promise resolve。

```javascript
const promises = [
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3)
];

async function test() {
  for await (const p of promises) {
    console.log(p);  // 顺序输出 1, 2, 3
  }
}
```

---

## 其他

### 什么是执行上下文？

执行上下文是 JS 代码执行时的环境，包含：
- **变量对象（VO）**：存储变量声明、函数声明、函数参数
- **作用域链**：当前上下文及所有父级上下文变量对象的列表
- **this**：当前上下文的 this 值

**类型**：全局执行上下文（只有一个）、函数执行上下文（调用时创建）、eval 执行上下文

**执行栈（调用栈）**：管理执行上下文的 LIFO 栈，代码执行时入栈，执行完出栈。

**生命周期**：创建阶段（确定 this、创建作用域链、初始化变量）→ 执行阶段（赋值、执行代码）→ 销毁阶段

### 词法作用域和动态作用域有什么区别？

**JS 使用词法作用域（静态作用域）**：作用域在**定义时**确定，与调用位置无关。

**动态作用域**：作用域在**调用时**确定，根据调用栈决定（Bash、Perl 某些情况）。

```javascript
let x = 1;
function outer() {
  let x = 10;
  inner();  // 词法作用域：输出 1（inner 定义时 x = 1）
}
function inner() { console.log(x); }
outer();
```

虽然 `inner` 在 `outer` 内调用，但 `inner` 定义时的作用域链不包含 `outer`，所以 `x` 取全局的 `1`。

### `Object.entries()`、`Object.values()`、`Object.keys()` 的区别？

```javascript
const obj = { a: 1, b: 2 };

Object.keys(obj)    // ['a', 'b'] — 键数组
Object.values(obj)  // [1, 2] — 值数组
Object.entries(obj) // [['a', 1], ['b', 2]] — 键值对数组

// 常用于转 Map
const map = new Map(Object.entries(obj));

// 常用于遍历对象
for (const [key, value] of Object.entries(obj)) {
  console.log(`${key}: ${value}`);
}
```

三者都只返回**自身可枚举属性**，不含原型链和不可枚举属性。

### Web Worker、Service Worker 有什么区别？

**Web Worker**：在后台独立线程运行 JS，不能操作 DOM，通过 `postMessage` 与主线程通信。适合 CPU 密集型计算（加密、图像处理）。

**Service Worker**：浏览器和网络之间的代理，运行在独立线程，可拦截网络请求、缓存资源、实现离线访问、推送通知。是 PWA 的核心。

两者都不能操作 DOM，都通过消息传递通信，但作用完全不同。

### 自定义事件是什么？

```javascript
// 创建自定义事件
const event = new CustomEvent('myEvent', {
  detail: { message: '自定义数据' },
  bubbles: true,  // 是否冒泡
  cancelable: true
});

// 监听
document.addEventListener('myEvent', (e) => {
  console.log(e.detail.message);
});

// 触发
document.dispatchEvent(event);
```

---

## Vue 相关

### Vue 中 `key` 的作用是什么？

`key` 是 Vue 的 Diff 算法用于识别节点的唯一标识符。

作用：
1. **高效更新**：Diff 时通过 key 精确找到对应节点，复用已有 DOM，避免不必要的创建/销毁
2. **保持状态**：key 相同的节点会被复用，key 改变则强制重新创建（可用来重置组件状态）

为什么不推荐用 index 作 key：当列表发生增删或排序时，index 对应的数据发生变化，Vue 会认为节点类型未变只需更新，但实际上需要更换，导致状态错误或性能下降（如带有输入状态的列表项位置错乱）。

### `mapState`、`mapGetters`、`mapActions`、`mapMutations` 是什么？

这四个都是 Vuex 提供的**辅助函数**，用于简化在组件中访问 Vuex store 的代码：

```javascript
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex';

export default {
  computed: {
    // 将 store.state.count 映射为组件的 this.count
    ...mapState(['count', 'userInfo']),

    // 将 store.getters.doubleCount 映射为 this.doubleCount
    ...mapGetters(['doubleCount', 'filteredList']),
  },
  methods: {
    // 将 store.commit('increment') 映射为 this.increment()
    ...mapMutations(['increment', 'decrement']),

    // 将 store.dispatch('fetchUser') 映射为 this.fetchUser()
    ...mapActions(['fetchUser', 'submitForm']),
  }
};
```

区别：
- `mapState` / `mapGetters` → `computed`（读数据）
- `mapMutations` → `methods`（同步修改，对应 mutation）
- `mapActions` → `methods`（异步操作，对应 action）

# JavaScript 进阶面试题

---

## 一、执行机制与作用域

### 1. `this` 的指向规则

**什么是 `this`**

`this` 是函数执行时的上下文对象，其值在运行时动态绑定，取决于函数的调用方式（箭头函数除外，它在定义时捕获外层 `this`）。同一个函数，调用方式不同，`this` 指向就不同。

**五种情况**

- **默认绑定**：普通函数调用，`this` 指向全局对象（浏览器是 `window`，严格模式下是 `undefined`）
- **隐式绑定**：对象方法调用，`this` 指向调用它的对象

```js
const obj = { name: 'Tom', sayHi() { console.log(this.name); } };
obj.sayHi(); // 'Tom'，this → obj
const fn = obj.sayHi;
fn(); // undefined，this → window（丢失绑定）
```

- **显式绑定**：`call`/`apply`/`bind` 手动指定 `this`
- **new 绑定**：构造函数调用，`this` 指向新创建的实例
- **箭头函数**：没有自己的 `this`，继承外层作用域的 `this`，且无法被 `call`/`apply`/`bind` 改变

```js
const obj = {
  name: 'Tom',
  sayHi: () => console.log(this.name), // 箭头函数，this → 外层（window）
  sayHi2() {
    const inner = () => console.log(this.name); // 继承 sayHi2 的 this → obj
    inner();
  }
};
obj.sayHi();  // undefined
obj.sayHi2(); // 'Tom'
```

**优先级**：new > 显式 > 隐式 > 默认

> `this` 不是在定义时确定的，是在调用时确定的（箭头函数除外，它在定义时捕获外层 `this`）。

---

### 2. `var`、`let`、`const` 的区别

**四个维度对比**

| 维度 | `var` | `let` | `const` |
|------|-------|-------|---------|
| 作用域 | 函数作用域 | 块级作用域 | 块级作用域 |
| 变量提升 | 有提升，值为 `undefined` | 有 TDZ，访问报错 | 有 TDZ，访问报错 |
| 重复声明 | 可以 | 不可以 | 不可以 |
| 挂载 window | 是 | 否 | 否 |
| 重新赋值 | 可以 | 可以 | 不可以（引用不可变）|

**变量提升 vs 暂时性死区（TDZ）**

```js
console.log(a); // undefined（var 提升）
var a = 1;

console.log(b); // ReferenceError（TDZ，声明前不可访问）
let b = 1;
```

**`const` 的注意点**

`const` 保证的是引用不变，不是值不变。对象属性可以修改：

```js
const obj = { a: 1 };
obj.a = 2;  // ✅ 合法，改的是属性
obj = {};   // ❌ 报错，引用不能变
```

> `var` 是函数作用域、有提升、可重复声明、会挂 window；`let/const` 是块级作用域、有 TDZ 不能提前访问、不可重复声明、不挂 window。`const` 额外要求声明时必须赋值且引用不可变，但对象属性可以改。

---

### 3. 闭包

**定义**

闭包是指有权访问另一个函数作用域中变量的函数。本质是：函数执行后，其内部作用域没有被销毁，因为被外部引用着。

```js
function outer() {
  let count = 0;
  return function inner() {   // inner 就是闭包
    count++;
    return count;
  };
}
const counter = outer();
counter(); // 1
counter(); // 2
```

`outer` 执行完后，`count` 本该被回收，但 `inner` 持有它的引用，所以 `count` 一直存活。

**形成条件**

- 函数嵌套函数
- 内层函数引用了外层函数的变量
- 内层函数被返回到外部或被外部持有

**使用场景**

**场景一：数据私有化**

```js
function createCounter() {
  let count = 0;
  return {
    increment: () => ++count,
    getCount: () => count
  };
}
const c = createCounter();
c.increment();          // 1
console.log(c.count);  // undefined，外部无法直接访问
```

**场景二：防抖 / 节流**

```js
function debounce(fn, delay) {
  let timer = null;        // timer 被闭包持有，跨调用保持状态
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
```

**场景三：柯里化 / 参数缓存**

```js
function add(a) {
  return function(b) {
    return a + b;  // a 被闭包缓存
  };
}
const add5 = add(5);
add5(3);  // 8
```

**场景四：for 循环 + setTimeout 经典题**

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);  // 3 3 3（var 共享一个 i）
}

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);  // 0 1 2（let 每轮新建块级作用域）
}
```

**缺点：内存泄漏**

原因：闭包持有外层作用域变量的引用，导致外层函数执行完后作用域不能被 GC 回收。

```js
function bind() {
  const el = document.getElementById('huge');
  element.addEventListener('click', () => console.log(el));
  // element 移除后没 removeEventListener → el 一直被引用 → 泄漏
}
```

解决方法：用完切断引用赋值为 `null`，让 GC 知道这块内存可回收。

> 闭包是"有权访问另一个函数作用域变量的函数"，本质是函数执行后其作用域因被引用而未被销毁。常用在数据私有化、防抖节流、柯里化。缺点是持有引用导致内存不能回收，用完切断引用即可解决。

---

## 二、原型与继承

### 4. 原型和原型链，`instanceof` 的工作原理

**什么是原型**

每个函数都有 `prototype` 属性，存放所有实例共享的方法。用构造函数创建实例时，实例的 `__proto__` 指向构造函数的 `prototype`。

```js
function Person(name) {
  this.name = name;
}
Person.prototype.sayHi = function() {
  console.log('hi', this.name);
};

const p = new Person('Tom');
p.sayHi();  // 'hi Tom'，方法在原型上，不在实例上
```

**关键三角关系**

```js
p.__proto__ === Person.prototype         // true
Person.prototype.constructor === Person  // true
Person.__proto__ === Function.prototype  // true
```

**什么是原型链**

每个 JS 对象都有一个内部属性 [[Prototype]]（可通过 __proto__ 或 Object.getPrototypeOf() 访问），指向它的原型对象。访问属性时，引擎沿这条链逐级向上查找，一直找到 `Object.prototype`，直到为 `null` 为止：

```js
p.__proto__                             // Person.prototype
p.__proto__.__proto__                   // Object.prototype
p.__proto__.__proto__.__proto__         // null（原型链尽头）
```

查找到 `null` 还没找到，返回 `undefined`。

**`instanceof` 工作原理**

沿左边对象的原型链往上找，看有没有等于右边构造函数的 `prototype`：

```js
p instanceof Person
// 等价于：p.__proto__ === Person.prototype → true
```

**手写实现**

```js
function myInstanceof(obj, Constructor) {
  let proto = Object.getPrototypeOf(obj);
  while (proto !== null) {
    if (proto === Constructor.prototype) return true;
    proto = Object.getPrototypeOf(proto);  // 沿链往上
  }
  return false;
}
```

> 原型是构造函数上存放共享方法的对象，实例通过 `__proto__` 指向它；原型链是多个原型首尾相连形成的查找链，终点是 `null`。`instanceof` 就是沿原型链找有没有目标构造函数的 `prototype`。

---

### 5. JS 继承的多种方式

**什么是继承**

继承是让一个对象/类获取另一个对象/类的属性和方法的机制，目的是代码复用。JS 没有传统的类继承，底层基于原型链实现，ES6 的 `class` 是语法糖，本质仍是原型链。

**原型链继承**

```js
function Child() {}
Child.prototype = new Parent();
// ❌ 缺点：引用类型属性共享，不能向父传参
```

**构造函数继承**

```js
function Child(...args) {
  Parent.call(this, ...args);
}
// ❌ 缺点：无法继承父类原型上的方法
```

**组合继承**

```js
function Child(...args) {
  Parent.call(this, ...args);  // 继承属性
}
Child.prototype = new Parent();
Child.prototype.constructor = Child;
// ❌ 缺点：调用了两次 Parent 构造函数
```

**寄生组合继承（最优，ES6 前推荐）**

```js
function Child(...args) {
  Parent.call(this, ...args);
}
Child.prototype = Object.create(Parent.prototype); // 不调用 Parent 构造函数
Child.prototype.constructor = Child;
// ✅ 只调用一次 Parent，原型链正确，引用属性不共享
```

**ES6 class（现代推荐）**

```js
class Child extends Parent {
  constructor(...args) {
    super(...args);  // 必须先调用 super
    this.extra = 'extra';
  }
}
// ✅ 语法简洁，底层仍是寄生组合继承
```

**对比总结**

| 方式 | 继承属性 | 继承方法 | 引用共享 | 调用父构造 |
|------|---------|---------|---------|-----------|
| 原型链 | ✅ | ✅ | ❌ 共享 | 1次 |
| 构造函数 | ✅ | ❌ | ✅ | 1次 |
| 组合 | ✅ | ✅ | ✅ | 2次 |
| 寄生组合 | ✅ | ✅ | ✅ | 1次 |
| class | ✅ | ✅ | ✅ | 1次 |

> 实际开发用 ES6 class，面试问原理时说寄生组合继承，它只调用一次父构造函数且原型链正确。

---

### 6. `new` 操作符做了什么，手写 `myNew`

**`new` 的四个步骤**

1. 创建一个空对象
2. 将空对象的 `__proto__` 指向构造函数的 `prototype`
3. 以新对象为 `this` 执行构造函数
4. 如果构造函数返回对象则取该对象，否则返回新建的对象

**手写实现**

```js
function myNew(constructor, ...args) {
  // 1. 创建对象并接原型
  const obj = Object.create(constructor.prototype);
  // 2. 绑定 this 执行构造函数
  const result = constructor.apply(obj, args);
  // 3. 处理返回值（null 的 typeof 是 object，用 instanceof 更准确）
  return result instanceof Object ? result : obj;
}

// 测试
function Person(name, age) {
  this.name = name;
  this.age = age;
}
const p = myNew(Person, 'Jerry', 22);
console.log(p); // Person { name: 'Jerry', age: 22 }
```

**关键细节**

- 用 `Object.create(constructor.prototype)` 而非手动设 `__proto__`（更规范）
- 返回值判断用 `instanceof Object` 而非 `typeof === 'object'`，避免 `null` 的 typeof 也是 `'object'` 的坑

> `new` 做四件事：建空对象、接原型、绑 `this` 执行构造函数、处理返回值（构造函数返回对象就取它，否则返回新对象）。

---

### 7. `call`、`apply`、`bind` 的区别，手写 `myBind`

**三者区别**

| | `call` | `apply` | `bind` |
|--|--------|---------|--------|
| 执行时机 | 立即执行 | 立即执行 | 返回新函数，不立即执行 |
| 参数方式 | 逐个传入 | 数组传入 | 逐个传入（支持预设参数） |
| 返回值 | 函数执行结果 | 函数执行结果 | 绑定好 this 的新函数 |

```js
fn.call(ctx, arg1, arg2)
fn.apply(ctx, [arg1, arg2])
const bound = fn.bind(ctx, arg1)
bound(arg2)  // 之后调用
```

**手写 `myBind`**

```js
Function.prototype.myBind = function(context, ...args1) {
  if (typeof this !== 'function') {
    throw new TypeError('Bind must be called on a function');
  }

  const self = this;
  const boundFunction = function(...args2) {
    const args = args1.concat(args2);
    // new 调用时 this 是新实例，不应被绑定的 context 覆盖
    const ctx = this instanceof boundFunction
      ? this
      : (context == null ? globalThis : context);
    return self.apply(ctx, args);
  };

  // 保留原型链，支持 new 调用
  boundFunction.prototype = Object.create(self.prototype);

  return boundFunction;
};
```

**关键细节**

- `this instanceof boundFunction`：判断是否通过 `new` 调用，`new` 调用时 `this` 应指向新实例而非绑定的 `context`
- `context == null ? globalThis : context`：比 `context || globalThis` 更严谨，避免 `0`、`''` 等 falsy 值被误判
- `Object.create(self.prototype)`：保留原型链，支持 `new bound()` 的实例正确继承

> `call` 和 `apply` 立即执行，区别只在传参方式（逐个 vs 数组）；`bind` 不立即执行，返回新函数，常用于预设 `this` 和部分参数（柯里化）。

---

## 三、异步与事件循环

### 8. 浏览器事件循环（Event Loop）

**题目**

请介绍浏览器的事件循环（Event Loop）机制，宏任务和微任务分别有哪些？

**参考答案**

JavaScript 是单线程语言，通过事件循环实现非阻塞异步。核心执行流程：

```
1. 执行调用栈（Call Stack）中的同步代码
2. 同步代码执行完毕后，清空所有微任务队列
3. 浏览器判断是否需要渲染更新
4. 从宏任务队列取出一个任务执行
5. 重复步骤 2-4
```

> 核心口诀：**一个宏任务 → 清空所有微任务 → 渲染 → 下一个宏任务**

**任务分类**

| 类型 | 常见示例 |
|------|---------|
| **宏任务** | `script`（整体代码）、`setTimeout`、`setInterval`、I/O、UI 渲染事件、`setImmediate`（Node.js） |
| **微任务** | `Promise.then/catch/finally`、`async/await`（await 后的代码）、`MutationObserver`、`queueMicrotask()`、`process.nextTick`（Node.js，优先级最高） |

**一句话记忆法**：宏任务是"下一轮"，微任务是"这一轮结束前必须先清干净"。

**基础例子**

```js
console.log('start');          // 同步

setTimeout(() => {
  console.log('setTimeout');  // 宏任务
}, 0);

Promise.resolve().then(() => {
  console.log('promise');     // 微任务
});

console.log('end');            // 同步

// 输出：start → end → promise → setTimeout
```

**Node.js 补充**（有后端经验可提）

微任务执行优先级：`process.nextTick > Promise.then > setImmediate`（宏任务）。`process.nextTick` 有自己独立的队列，在 Promise 微任务之前执行。

> Event Loop 的核心不是"任务有哪些"，而是"循环怎么跑"——每个宏任务后必须清空微任务队列，再渲染，再取下一个宏任务。

---

### 9. 事件循环综合代码题

**题目**

说出以下代码的输出顺序，并解释原因。

```js
console.log('1');

setTimeout(() => {
  console.log('2');
  Promise.resolve().then(() => console.log('3'));
}, 0);

Promise.resolve().then(() => {
  console.log('4');
  setTimeout(() => console.log('5'), 0);
});

console.log('6');
```

**参考答案**

**输出顺序**：`1 → 6 → 4 → 2 → 3 → 5`

**执行过程拆解**

第一轮（同步代码）：

1. `console.log('1')` → 同步，直接输出 `1`
2. `setTimeout(..., 0)` → 宏任务，进入宏任务队列（记为宏 A）
3. `Promise.resolve().then(...)` → 微任务，进入微任务队列（记为微 A）
4. `console.log('6')` → 同步，直接输出 `6`

此时调用栈空，开始清微任务队列：

5. 执行微 A：`console.log('4')` → 输出 `4`，内部的 `setTimeout` 进入宏任务队列（记为宏 B）

微任务清空，取下一个宏任务：

6. 执行宏 A：`console.log('2')` → 输出 `2`，内部的 `Promise.then` 进入微任务队列（记为微 B）

宏 A 执行完，清微任务：

7. 执行微 B：`console.log('3')` → 输出 `3`

取下一个宏任务：

8. 执行宏 B：`console.log('5')` → 输出 `5`

**关键点**：

- 每个宏任务执行完后，必须清空当前所有微任务，再取下一个宏任务
- 微任务里产生的微任务，在当前轮就会清完，不会拖到下一轮
- 宏任务里产生的宏任务，进入队列等待下一轮

> 解这类题的套路：先把同步代码跑完，再清微任务；每取一个宏任务，跑完再清它产生的微任务，逐轮推进。

---

### 10. Promise 状态机与静态方法

**什么是 Promise**

Promise 是异步操作的一种解决方案，比传统的回调函数更清晰、更易组合。它代表一个尚未完成但未来会出结果的操作，通过链式调用（`.then`/`.catch`）解决回调地狱问题。

**三种状态**

`pending`（等待）→ `fulfilled`（成功）或 `rejected`（失败），状态一旦改变不可逆。

**四个静态方法对比**

| 方法 | 说明 | 失败处理 |
|------|------|----------|
| `Promise.all(arr)` | 全部成功才 resolve，返回结果数组 | 任一失败立即 reject |
| `Promise.race(arr)` | 第一个完成（无论成败）就返回 | 第一个失败就 reject |
| `Promise.allSettled(arr)` | 等全部完成，返回每个的状态和值 | 不会 reject，全部等完 |
| `Promise.any(arr)` | 任一成功就 resolve | 全部失败才 reject |

**手写 `Promise.all`**

```js
Promise.myAll = function(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let count = 0;
    const total = promises.length;

    if (total === 0) return resolve([]);

    promises.forEach((p, i) => {
      Promise.resolve(p).then(val => {
        results[i] = val;   // 保留顺序，不能用 push
        count++;
        if (count === total) resolve(results);
      }).catch(reject);     // 任一失败直接 reject
    });
  });
};
```

**手写 `Promise.race`**

```js
Promise.myRace = function(promises) {
  return new Promise((resolve, reject) => {
    promises.forEach(p => {
      Promise.resolve(p).then(resolve).catch(reject);
    });
  });
};
```

> `all` 是"全员到齐才开始"，`race` 是"谁先到用谁"，`allSettled` 是"等所有人结束不管成败"，`any` 是"有一个成功就行"。

---

### 11. `async/await` 的错误处理

**什么是 async/await**

`async/await` 是 ES2017 引入的异步语法糖，基于 Promise 实现，让异步代码写起来像同步代码，解决了 `.then` 链式调用嵌套层深、可读性差的问题。`async` 函数总是返回一个 Promise，`await` 暂停执行直到 Promise 完成。

**三种方式**

**方式一：`try/catch`（推荐）**

```js
async function fetchData() {
  try {
    const res = await fetch('/api/data');
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('请求失败:', e);
  }
}
```

**方式二：`.catch()` 链式**

```js
async function fetchData() {
  const data = await fetch('/api/data').catch(e => {
    console.error(e);
    return null;  // 返回兜底值，不中断后续流程
  });
  if (!data) return;
  // 继续处理
}
```

**方式三：封装 `to` 工具函数（Go 风格，多 await 场景更清晰）**

```js
const to = (promise) => promise.then(data => [null, data]).catch(err => [err, null]);

async function fetchData() {
  const [err, data] = await to(fetch('/api/data'));
  if (err) { console.error(err); return; }
  // 使用 data
}
```

**常见陷阱：`await` 并行变串行**

```js
// ❌ 串行，总耗时 = a + b
const a = await fetchA();
const b = await fetchB();

// ✅ 并行，总耗时 = max(a, b)
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

> `async/await` 是 Promise 的语法糖，错误处理优先用 `try/catch`，多个独立异步操作用 `Promise.all` 并行而非串行 `await`。

---

### 12. `setTimeout` 为什么会有延迟

**核心原因**

`setTimeout` 的 delay 是最早入队时间，不是准确执行时间。回调要等：

```
1. 当前同步代码执行完（调用栈清空）
2. 微任务全部清空（Promise.then 等）
3. 宏任务队列排队，轮到 setTimeout 回调
4. 才真正执行
```

```js
setTimeout(() => console.log('macro'), 0);
Promise.resolve().then(() => console.log('micro'));
// 输出：micro → macro（微任务先于宏任务）
```

**导致延迟更大的原因**

| 原因 | 说明 |
|------|------|
| 调用栈未清空 | 前面有耗时同步代码 |
| 微任务积压 | 大量 Promise 链 |
| 宏任务队列积压 | 前面有其他 setTimeout 排队 |
| 浏览器最小延迟 | 嵌套超过 5 层后强制 4ms |
| 页面后台节流 | 非激活标签页节流到 1000ms+ |

> `setTimeout` 的 delay 是最早入队时间，不是准确执行时间。真正执行要等调用栈清空 → 微任务清空 → 宏任务队列轮到它。加上浏览器 4ms 最小延迟、后台节流等，实际时间通常大于设定值。

---

### 13. `requestAnimationFrame` vs `setTimeout`

| 维度 | `setTimeout` | `requestAnimationFrame` |
|------|-------------|------------------------|
| 执行时机 | 宏任务队列，不稳定 | 浏览器每次重绘前，约 16.7ms（60fps） |
| 精度 | 受事件循环影响，有延迟 | 由浏览器控制，与屏幕刷新同步 |
| 后台节流 | 非激活标签页节流 1000ms | 后台暂停，不执行 |
| 适用场景 | 延时执行、轮询 | 动画、视觉更新 |

**为什么用 `rAF` 做动画更好**

`setTimeout(fn, 16)` 虽然近似 60fps，但实际执行时机和屏幕刷新不同步，可能在两帧之间执行，导致画面撕裂或跳帧。`rAF` 由浏览器保证在每帧重绘前执行，天然同步。

```js
function animate() {
  el.style.transform = `translateX(${x++}px)`;
  if (x < 300) {
    requestAnimationFrame(animate); // 下一帧继续
  }
}
requestAnimationFrame(animate);
```

**后台节流的价值**：切到其他标签页时 `rAF` 自动暂停，不消耗 CPU，`setTimeout` 继续跑。

> `rAF` 是"跟着屏幕走"，`setTimeout` 是"跟着时钟走"。做动画用 `rAF`，做定时任务用 `setTimeout`。

---

## 四、类型与内存

### 14. 类型判断

**三种方式对比**

| 方法 | 能判断 | 局限 |
|------|--------|------|
| `typeof` | 基本类型（null 除外） | `typeof null === 'object'`，无法区分数组和对象 |
| `instanceof` | 引用类型，判断原型链 | 跨 iframe 失效，不能判断基本类型 |
| `Object.prototype.toString` | 所有类型 | 写法麻烦 |

```js
typeof 'str'        // 'string'
typeof null         // 'object'（历史 bug）
typeof []           // 'object'（无法区分）
[] instanceof Array // true
Object.prototype.toString.call([])   // '[object Array]'
Object.prototype.toString.call(null) // '[object Null]'
```

**手写 `getType`**

```js
function getType(val) {
  if (val === null) return 'null';
  if (typeof val !== 'object') return typeof val;
  return Object.prototype.toString.call(val).slice(8, -1).toLowerCase();
  // '[object Array]' → 'array'
}

getType(null)      // 'null'
getType(1)         // 'number'
getType([])        // 'array'
getType({})        // 'object'
getType(new Date)  // 'date'
```

> 判断基本类型用 `typeof`，判断引用类型用 `Object.prototype.toString`，`instanceof` 适合判断自定义类实例。

---

### 15. `==` 和 `===` 的区别，`[] == ![]` 的推导

**区别**

- `===`：严格相等，不做类型转换，类型不同直接 false
- `==`：宽松相等，先做隐式类型转换，再比较

**`==` 隐式转换核心规则**

| 情况 | 规则 |
|------|------|
| 有 `boolean` | 先把 `boolean` 转 `number`（true→1，false→0）|
| `string` vs `number` | 把 `string` 转 `number` |
| 对象 vs 原始值 | 对象调用 `valueOf()` 或 `toString()` 转原始值 |
| `null == undefined` | `true`，其他情况不等于任何值 |
| 有 `NaN` | 永远 `false`，`NaN != NaN` |

**`[] == ![]` 完整推导**

```
[] == ![]
→ [] == false          // ![] 先算，[] 是真值，取反得 false
→ [] == 0              // false 转 number → 0
→ "" == 0              // [] 转 primitive → [].toString() → ""
→ 0 == 0               // "" 转 number → 0
→ true
```

> `==` 比较前做隐式类型转换，`===` 不转换，类型不同直接 false。`[] == ![]` 结果是 true，推导链：`![]` 得 false → false 转 0 → `[]` 转空字符串 → 空字符串转 0 → `0 == 0`。

---

### 16. `Map` vs `WeakMap`，`Set` vs `WeakSet`

**Map vs 普通对象**

| | 普通对象 | Map |
|--|---------|-----|
| key 类型 | 只能是字符串/Symbol | 任意类型（对象、函数等） |
| 有序性 | 不保证 | 插入顺序 |
| 大小 | 手动 `Object.keys().length` | `.size` |
| 迭代 | 需转换 | 直接 `for...of` |

**WeakMap 的特点**

- key 只能是对象（不能是基本类型）
- key 是弱引用，key 对象被 GC 时，WeakMap 里对应的条目自动消失
- 不可迭代（没有 `forEach`/`size`）
- 场景：存储 DOM 节点的私有数据，节点删除后自动回收，不用手动清理

```js
const cache = new WeakMap();
function process(el) {
  if (cache.has(el)) return cache.get(el);
  const result = heavyCompute(el);
  cache.set(el, result);
  return result;
}
// el 被移除后，cache 里的条目自动回收，不会内存泄漏
```

**Set vs WeakSet**

- `Set`：任意类型，可迭代，值唯一
- `WeakSet`：只能存对象，弱引用，不可迭代，常用于记录"已处理过的对象"

> `WeakMap`/`WeakSet` 的核心价值是弱引用——key/value 不阻止 GC，适合存与 DOM 或临时对象关联的数据，避免内存泄漏。

---

### 17. 垃圾回收机制与内存泄漏

**什么是垃圾回收**

垃圾回收（GC）是 JS 引擎自动管理内存的机制，负责识别并释放不再被引用的对象所占用的内存，开发者无需手动释放。但自动回收并不代表没有内存问题——被意外持有引用的对象无法被回收，就形成内存泄漏。

**两种算法**

**标记清除（现代浏览器主流）**：从根对象（window）出发，标记所有可达对象，未被标记的清除。解决了引用计数的循环引用问题。

**引用计数（已淘汰）**：对象有引用就计数+1，引用消失-1，计数为0时回收。缺陷是循环引用永远不会被回收：

```js
function leak() {
  const a = {};
  const b = {};
  a.ref = b;
  b.ref = a;  // 互相引用，引用计数永远不为0
}
```

**常见内存泄漏场景**

- **全局变量**：未用 `var`/`let`/`const` 声明，意外创建全局变量
- **定时器未清理**：`setInterval` 回调里引用了外部变量，定时器不清除则一直存活
- **事件监听未移除**：DOM 移除了但监听没 `removeEventListener`
- **闭包**：闭包持有大对象引用，该大对象永远不会被回收
- **脱离 DOM 的引用**：JS 变量持有已从 DOM 树移除的节点引用

```js
// ❌ 定时器泄漏
const data = heavyData;
setInterval(() => console.log(data), 1000);  // data 一直被持有

// ✅ 清理
const timer = setInterval(() => console.log(data), 1000);
clearInterval(timer);
```

> 现代浏览器用标记清除，循环引用不再是问题。内存泄漏的主要来源是定时器、事件监听、闭包未及时切断引用。

---

## 五、手写与函数式

### 18. 防抖和节流

**什么是防抖和节流**

防抖（debounce）和节流（throttle）都是控制高频事件触发频率的优化手段，本质是对函数调用加限制，避免短时间内大量执行带来的性能问题。

**区别**

- **防抖（debounce）**：事件触发后等待 n 毫秒再执行，期间再次触发则重新计时。适合搜索输入、表单验证。
- **节流（throttle）**：n 毫秒内只执行一次，无论触发多少次。适合滚动、resize、按钮防重复点击。

**手写防抖**

```js
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// 使用
const search = debounce((val) => console.log('搜索:', val), 500);
input.addEventListener('input', e => search(e.target.value));
```

**手写节流（时间戳版）**

```js
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

**手写节流（定时器版）**

```js
function throttle(fn, interval) {
  let timer = null;
  return function(...args) {
    if (!timer) {
      timer = setTimeout(() => {
        fn.apply(this, args);
        timer = null;
      }, interval);
    }
  };
}
```

时间戳版：立即执行，最后一次可能不执行；定时器版：延迟执行，最后一次一定执行。

> 防抖是"等你停下来再做"，节流是"不管你怎么触发，我按固定频率做"。

---

### 19. 发布订阅 vs 观察者模式，手写 EventEmitter

**两者区别**

| | 观察者模式 | 发布订阅模式 |
|--|-----------|-------------|
| 耦合度 | 观察者和被观察者直接依赖 | 通过事件中心解耦，发布者和订阅者互不认识 |
| 通信 | 被观察者直接通知观察者 | 通过事件中心中转 |
| 典型场景 | Vue 响应式（Watcher/Dep） | EventEmitter、消息队列 |

**手写 EventEmitter**

```js
class EventEmitter {
  constructor() {
    this._events = {};  // { eventName: [fn1, fn2, ...] }
  }

  // 订阅
  on(event, fn) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(fn);
    return this;  // 支持链式调用
  }

  // 只订阅一次
  once(event, fn) {
    const wrapper = (...args) => {
      fn.apply(this, args);
      this.off(event, wrapper);
    };
    wrapper._originFn = fn;  // 存原函数，方便 off 移除
    this.on(event, wrapper);
    return this;
  }

  // 发布
  emit(event, ...args) {
    const fns = this._events[event];
    if (!fns || fns.length === 0) return false;
    fns.forEach(fn => fn.apply(this, args));
    return true;
  }

  // 取消订阅
  off(event, fn) {
    if (!this._events[event]) return this;
    if (!fn) {
      this._events[event] = [];  // 不传 fn 则移除该事件所有监听
    } else {
      this._events[event] = this._events[event].filter(
        f => f !== fn && f._originFn !== fn
      );
    }
    return this;
  }
}

// 使用
const emitter = new EventEmitter();
emitter.on('data', (val) => console.log('收到:', val));
emitter.emit('data', 42);  // 收到: 42
```

> 观察者模式是发布者直接通知观察者（紧耦合）；发布订阅通过事件中心解耦，发布者和订阅者互不认识（松耦合）。

---

### 20. 柯里化，手写通用柯里化

**定义**：把接收多个参数的函数转化为接收单一参数的函数序列。`f(a,b,c)` → `f(a)(b)(c)`。

**用途**：参数复用、延迟计算、函数组合。

```js
// 普通函数
const add = (a, b, c) => a + b + c;

// 柯里化后
const curriedAdd = curry(add);
curriedAdd(1)(2)(3);  // 6
curriedAdd(1, 2)(3);  // 6
curriedAdd(1)(2, 3);  // 6
```

**手写通用柯里化**

```js
function curry(fn) {
  return function curried(...args) {
    // 参数够了直接执行
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    // 参数不够，返回函数继续收集
    return function(...moreArgs) {
      return curried.apply(this, args.concat(moreArgs));
    };
  };
}

// 使用
const add = (a, b, c) => a + b + c;
const curriedAdd = curry(add);
curriedAdd(1)(2)(3);   // 6
curriedAdd(1, 2)(3);   // 6

// 参数复用场景
const addTen = curriedAdd(10);
addTen(5)(3);  // 18
```

> 柯里化的核心是"参数不够就继续等"，靠递归收集参数，等参数数量达到原函数的 `length` 才真正执行。

---

### 21. 数组方法手写

**手写 `reduce`**

```js
Array.prototype.myReduce = function(fn, initialValue) {
  const arr = this;
  let acc = initialValue !== undefined ? initialValue : arr[0];
  const startIdx = initialValue !== undefined ? 0 : 1;

  for (let i = startIdx; i < arr.length; i++) {
    acc = fn(acc, arr[i], i, arr);
  }
  return acc;
};

[1, 2, 3].myReduce((acc, cur) => acc + cur, 0); // 6
```

**手写 `flat`**

```js
Array.prototype.myFlat = function(depth = 1) {
  const flatten = (arr, d) => {
    return arr.reduce((acc, cur) => {
      if (Array.isArray(cur) && d > 0) {
        acc.push(...flatten(cur, d - 1));
      } else {
        acc.push(cur);
      }
      return acc;
    }, []);
  };
  return flatten(this, depth);
};

[1, [2, [3, [4]]]].myFlat(2); // [1, 2, 3, [4]]
```

**手写 `Array.from`**

```js
Array.myFrom = function(arrayLike, mapFn) {
  const arr = [];
  const len = arrayLike.length;
  for (let i = 0; i < len; i++) {
    arr.push(mapFn ? mapFn(arrayLike[i], i) : arrayLike[i]);
  }
  return arr;
};

Array.myFrom('abc'); // ['a', 'b', 'c']
Array.myFrom({ length: 3 }, (_, i) => i * 2); // [0, 2, 4]
```

> `reduce` 是数组方法的"万能工具"，`flat`/`flatMap` 用于处理嵌套结构，`Array.from` 把类数组和可迭代对象转为真数组。

---

## 六、模块化与 JS API

### 22. CommonJS 和 ES Module 的区别

| 维度 | CommonJS | ES Module |
|------|----------|-----------|
| 语法 | `require` / `module.exports` | `import` / `export` |
| 加载时机 | 运行时动态加载 | 编译时静态分析 |
| 输出 | 值的拷贝 | 值的引用（live binding） |
| 异步 | 不支持 | 支持（`import()`） |
| 环境 | Node.js | 浏览器 + Node.js |
| `this` | `module.exports` | `undefined` |

**关键区别：输出的是拷贝还是引用**

```js
// CommonJS
let count = 0;
module.exports = { count, add: () => count++ };
// 引入方拿到的 count 是拷贝，add() 执行后引入方的 count 不变

// ES Module
export let count = 0;
export const add = () => count++;
// 引入方拿到的是 live binding，add() 执行后引入方的 count 会变
```

**为什么 ES Module 能 Tree-shaking，CommonJS 不行**

ES Module 是静态结构，编译时就能确定哪些导出被使用，未使用的代码可以被 Rollup/Webpack 剔除。CommonJS 是动态的（可以条件 `require`），编译时无法分析。

> CommonJS 是"运行时拷贝"，ES Module 是"编译时引用"。ES Module 支持 Tree-shaking 是因为依赖关系在编译时就确定了。

---

### 23. `Proxy` vs `Object.defineProperty`

| 维度 | `Object.defineProperty` | `Proxy` |
|------|------------------------|---------|
| 拦截粒度 | 单个属性 | 整个对象 |
| 数组支持 | 需要特殊处理（Vue2 hack） | 原生支持 |
| 新增属性 | 无法监听（Vue2 需 `$set`） | 自动监听 |
| 删除属性 | 无法监听 | 可以拦截 `deleteProperty` |
| 性能 | 初始化递归遍历属性 | 懒代理，访问时才递归 |
| 兼容性 | IE8+ | IE 不支持，无法 polyfill |

**`Object.defineProperty` 的局限（Vue2 的痛点）**

```js
// 无法监听数组索引赋值和 length 变化
arr[0] = 'new';   // 不触发响应
arr.length = 0;   // 不触发响应

// 无法监听新增属性
obj.newKey = 'val'; // 不触发响应，需要 Vue.set()
```

**`Proxy` 的优势**

```js
const handler = {
  get(target, key) { /* 拦截读取 */ },
  set(target, key, val) { /* 拦截赋值，包括新增属性 */ },
  deleteProperty(target, key) { /* 拦截删除 */ },
  has(target, key) { /* 拦截 in 操作符 */ },
};
const proxy = new Proxy(target, handler);
```

> Vue3 用 `Proxy` 替代 `Object.defineProperty` 的核心原因：能监听数组变化、能监听属性新增/删除，且是懒代理性能更好。

---

### 24. `Symbol` 的使用场景

**特点**：每个 Symbol 都是唯一的，`Symbol('a') !== Symbol('a')`，不能用 `new`。

**场景一：对象属性唯一 key，防止属性名冲突**

```js
const KEY = Symbol('key');
const obj = { [KEY]: 'value' };
// 外部无法通过字符串访问，也不会与其他属性冲突
```

**场景二：定义常量，避免魔法字符串**

```js
const STATUS = {
  PENDING: Symbol('pending'),
  DONE: Symbol('done'),
  FAIL: Symbol('fail'),
};
```

**场景三：实现私有属性（非真正私有，但难以访问）**

Symbol 属性不会出现在 `for...in`、`Object.keys()`、`JSON.stringify()` 中，只能通过 `Object.getOwnPropertySymbols()` 获取。

**场景四：内置 Symbol（`Symbol.iterator` 等）**

```js
class Range {
  constructor(start, end) { this.start = start; this.end = end; }
  [Symbol.iterator]() {
    let cur = this.start;
    const end = this.end;
    return { next: () => cur <= end ? { value: cur++, done: false } : { done: true } };
  }
}
for (const n of new Range(1, 3)) console.log(n); // 1 2 3
```

> Symbol 的核心价值是"唯一性"，用于防属性名冲突、定义内部常量、实现自定义迭代器等协议。

---

### 25. 事件委托

**定义**

事件委托利用事件冒泡原理，把监听绑在父元素上，通过 `e.target` 判断真正触发的子元素，从而代理子元素的事件处理。

```js
ul.addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    console.log(e.target.textContent);
  }
});
```

- `e.target`：真正点击的元素（子元素）
- `e.currentTarget`：绑定监听的元素（父元素 `ul`）

**解决了什么问题**

- 减少事件绑定数量：100 个 `li` 只绑 1 个 `ul`，内存从 100 降到 1
- 动态增删元素自动生效：后加的 `li` 不用重新绑监听，父级监听自动覆盖

**局限**

- `focus`、`blur` 等不冒泡的事件不能委托（可用 `focusin`/`focusout` 替代）
- 层级太深时，`e.target` 判断要写清条件，否则点错层级会误触发

> 事件委托利用冒泡，把监听绑在父元素上，用 `e.target` 判断真正触发的子元素。好处是减少绑定数量 + 动态增删元素自动生效。局限是不冒泡的事件（如 focus）不能委托。

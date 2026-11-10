# JavaScript 基础面试题

## 1. `var`、`let`、`const` 的区别

### 四个维度对比

| 维度 | `var` | `let` | `const` |
|------|-------|-------|---------|
| 作用域 | 函数作用域 | 块级作用域 | 块级作用域 |
| 变量提升 | 有提升，值为 `undefined` | 有 TDZ，访问报错 | 有 TDZ，访问报错 |
| 重复声明 | 可以 | 不可以 | 不可以 |
| 挂载 window | 是 | 否 | 否 |
| 重新赋值 | 可以 | 可以 | 不可以（引用不可变）|

### 变量提升 vs 暂时性死区（TDZ）

```js
console.log(a); // undefined（var 提升）
var a = 1;

console.log(b); // ReferenceError（TDZ，声明前不可访问）
let b = 1;
```

### `const` 的注意点

`const` 保证的是引用不变，不是值不变。对象属性可以修改：

```js
const obj = { a: 1 };
obj.a = 2;  // ✅ 合法，改的是属性
obj = {};   // ❌ 报错，引用不能变
```

### 一句话总结

> `var` 是函数作用域、有提升、可重复声明、会挂 window；`let/const` 是块级作用域、有 TDZ 不能提前访问、不可重复声明、不挂 window。`const` 额外要求声明时必须赋值且引用不可变，但对象属性可以改。

---

## 2. 闭包

### 定义

闭包是指有权访问另一个函数作用域中变量的函数。本质是：**函数执行后，其内部作用域没有被销毁，因为被外部引用着**。

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

### 形成条件

- 函数嵌套函数
- 内层函数引用了外层函数的变量
- 内层函数被返回到外部或被外部持有

### 使用场景

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

### 优点

- 缓存作用域变量，跨调用保持状态
- 私有化数据，避免全局污染
- 实现模块化、柯里化等高阶函数

### 缺点：内存泄漏

**原因**：闭包持有外层作用域变量的引用，导致外层函数执行完后作用域不能被 GC 回收。

**真实泄漏场景**：事件监听未移除，闭包里的 DOM 引用一直存活。

```js
function bind() {
  const el = document.getElementById('huge');
  element.addEventListener('click', () => console.log(el));
  // element 移除后没 removeEventListener → el 一直被引用 → 泄漏
}
```

**解决方法**：用完切断引用赋值为 `null`，让 GC 知道这块内存可回收。

### 一句话总结

> 闭包是"有权访问另一个函数作用域变量的函数"，本质是函数执行后其作用域因被引用而未被销毁。常用在数据私有化、防抖节流、柯里化。缺点是持有引用导致内存不能回收，用完切断引用即可解决。

---

## 3. `==` 和 `===` 的区别，`[] == ![]` 的推导

### 区别

- `===`：严格相等，**不做类型转换**，类型不同直接 false
- `==`：宽松相等，**先做隐式类型转换**，再比较

### `==` 隐式转换核心规则

| 情况 | 规则 |
|------|------|
| 有 `boolean` | 先把 `boolean` 转 `number`（true→1，false→0）|
| `string` vs `number` | 把 `string` 转 `number` |
| 对象 vs 原始值 | 对象调用 `valueOf()` 或 `toString()` 转原始值 |
| `null == undefined` | `true`，其他情况不等于任何值 |
| 有 `NaN` | 永远 `false`，`NaN != NaN` |

### `[] == ![]` 完整推导

```
[] == ![]
→ [] == false          // ![] 先算，[] 是真值，取反得 false
→ [] == 0              // false 转 number → 0
→ "" == 0              // [] 转 primitive → [].toString() → ""
→ 0 == 0               // "" 转 number → 0
→ true
```

### 一句话总结

> `==` 比较前做隐式类型转换，`===` 不转换，类型不同直接 false。`[] == ![]` 结果是 true，推导链：`![]` 得 false → false 转 0 → `[]` 转空字符串 → 空字符串转 0 → `0 == 0`。

---

## 4. 原型和原型链，`instanceof` 的工作原理

### 原型（Prototype）

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

**关键三角关系：**

```js
p.__proto__ === Person.prototype         // true
Person.prototype.constructor === Person  // true
Person.__proto__ === Function.prototype  // true
```

### 原型链（Prototype Chain）

访问属性时，先找实例本身，找不到就顺着 `__proto__` 往上找，一直找到 `Object.prototype`，再往上就是 `null`：

```js
p.__proto__                             // Person.prototype
p.__proto__.__proto__                   // Object.prototype
p.__proto__.__proto__.__proto__         // null（原型链尽头）
```

查找到 `null` 还没找到，返回 `undefined`。

### `instanceof` 工作原理

沿左边对象的原型链往上找，看有没有等于右边构造函数的 `prototype`：

```js
p instanceof Person
// 等价于：p.__proto__ === Person.prototype → true
```

**手写实现：**

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

### 一句话总结

> 原型是构造函数上存放共享方法的对象，实例通过 `__proto__` 指向它；原型链是多个原型首尾相连形成的查找链，终点是 `null`。`instanceof` 就是沿原型链找有没有目标构造函数的 `prototype`。

---

## 5. `new` 操作符做了什么，手写 `myNew`

### `new` 的四个步骤

1. 创建一个空对象
2. 将空对象的 `__proto__` 指向构造函数的 `prototype`
3. 以新对象为 `this` 执行构造函数
4. 如果构造函数返回对象则取该对象，否则返回新建的对象

### 手写实现

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

### 关键细节

- 用 `Object.create(constructor.prototype)` 而非手动设 `__proto__`（更规范）
- 返回值判断用 `instanceof Object` 而非 `typeof === 'object'`，避免 `null` 的 typeof 也是 `'object'` 的坑

### 一句话总结

> `new` 做四件事：建空对象、接原型、绑 `this` 执行构造函数、处理返回值（构造函数返回对象就取它，否则返回新对象）。

---

## 6. 事件委托

### 定义

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

### 解决了什么问题

- **减少事件绑定数量**：100 个 `li` 只绑 1 个 `ul`，内存从 100 降到 1
- **动态增删元素自动生效**：后加的 `li` 不用重新绑监听，父级监听自动覆盖

```js
// ❌ 不用委托：新增 li 要重新绑
li.addEventListener('click', handler);

// ✅ 委托：新增 li 自动生效
ul.addEventListener('click', handler);
```

### 局限

- `focus`、`blur` 等不冒泡的事件不能委托（可用 `focusin`/`focusout` 替代）
- 层级太深时，`e.target` 判断要写清条件，否则点错层级会误触发

### 一句话总结

> 事件委托利用冒泡，把监听绑在父元素上，用 `e.target` 判断真正触发的子元素。好处是减少绑定数量 + 动态增删元素自动生效。局限是不冒泡的事件（如 focus）不能委托。

---

## 7. `setTimeout` 为什么会有延迟

### 核心原因

`setTimeout` 的 delay 是**最早入队时间**，不是准确执行时间。回调要等：

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

### 导致延迟更大的原因

| 原因 | 说明 |
|------|------|
| 调用栈未清空 | 前面有耗时同步代码 |
| 微任务积压 | 大量 Promise 链 |
| 宏任务队列积压 | 前面有其他 setTimeout 排队 |
| 浏览器最小延迟 | 嵌套超过 5 层后强制 4ms |
| 页面后台节流 | 非激活标签页节流到 1000ms+ |

### 一句话总结

> `setTimeout` 的 delay 是最早入队时间，不是准确执行时间。真正执行要等调用栈清空 → 微任务清空 → 宏任务队列轮到它。加上浏览器 4ms 最小延迟、后台节流等，实际时间通常大于设定值。

---

## 8. `call`、`apply`、`bind` 的区别，手写 `myBind`

### 三者区别

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

### 手写 `myBind`

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
      : (context == null ? globalThis : context);  // null/undefined 时指向全局
    return self.apply(ctx, args);
  };

  // 保留原型链，支持 new 调用
  boundFunction.prototype = Object.create(self.prototype);

  return boundFunction;
};
```

### 关键细节

- `this instanceof boundFunction`：判断是否通过 `new` 调用，`new` 调用时 `this` 应指向新实例而非绑定的 `context`
- `context == null ? globalThis : context`：比 `context || globalThis` 更严谨，避免 `0`、`''` 等 falsy 值被误判
- `Object.create(self.prototype)`：保留原型链，支持 `new bound()` 的实例正确继承

### 一句话总结

> `call` 和 `apply` 立即执行，区别只在传参方式（逐个 vs 数组）；`bind` 不立即执行，返回新函数，常用于预设 `this` 和部分参数（柯里化）。

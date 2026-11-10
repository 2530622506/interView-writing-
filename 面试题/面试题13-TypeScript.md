# TypeScript 面试题（中大厂 2024–2026 调研版）

---

## 一、类型系统基础

### `type` 和 `interface` 的区别？

**参考答案：**

1. **声明合并**：`interface` 支持同名声明自动合并，`type` 不支持（重复声明报错）：
```ts
interface User { name: string }
interface User { age: number }
// 合并为 { name: string; age: number }

type User = { name: string }
type User = { age: number } // ❌ 报错：标识符重复
```

2. **扩展方式**：
   - `interface` 用 `extends` 继承，支持多继承
   - `type` 用 `&` 交叉类型合并，也可以 `extends` 泛型约束
```ts
interface A extends B, C {}  // interface 多继承
type A = B & C               // type 交叉合并
```

3. **能描述的类型范围**：
   - `type` 可以描述**任意类型**：联合类型、元组、基本类型别名、条件类型等
   - `interface` 只能描述**对象结构**（含函数、类）
```ts
type ID = string | number          // ✅ type 可以
type Pair = [string, number]       // ✅ type 可以
interface ID = string | number     // ❌ interface 不支持
```

4. **`implements` 实现**：类可以 `implements` 一个 `interface` 或 `type`（对象类型），两者效果相同：
```ts
interface Shape { area(): number }
type Shape2 = { area(): number }
class Circle implements Shape {}   // ✅
class Circle2 implements Shape2 {} // ✅
```

5. **计算属性**：`type` 支持映射类型和条件类型，`interface` 不支持：
```ts
type Keys = 'a' | 'b'
type Obj = { [K in Keys]: string }  // ✅ type 支持映射
```

6. **实践建议**：
   - 公共 API / 组件 Props 用 `interface`（支持声明合并，利于扩展）
   - 内部工具类型、联合类型、复杂类型计算用 `type`
   - 团队统一规范比个人偏好更重要

---

### `any` / `unknown` / `never` / `void` 的区别？

**参考答案：**

1. **`any`**：关闭类型检查，可以赋值给任何类型，也可以接收任何类型。是类型系统的"逃生舱"，滥用会失去 TS 的保护：
```ts
const x: any = 'hello'
const n: number = x  // ✅ 不报错，但运行时可能出错
x.foo.bar.baz        // ✅ 不报错
```

2. **`unknown`**：类型安全的 `any`，可以接收任何值，但**使用前必须收窄类型**：
```ts
const x: unknown = 'hello'
const n: number = x        // ❌ 报错：不能直接赋值
if (typeof x === 'string') {
  x.toUpperCase()          // ✅ 收窄后可以使用
}
```

3. **`never`**：类型系统的"底类型"，表示永远不会有值。用于：
   - 永远不会返回的函数（抛出异常或无限循环）
   - 条件类型中过滤（`T extends U ? T : never`）
   - 穷举检查（exhaustive check）
```ts
function fail(msg: string): never { throw new Error(msg) }
type NonString<T> = T extends string ? never : T
```

4. **`void`**：表示函数没有返回值（返回 `undefined`）。`void` 和 `undefined` 的区别：`void` 允许函数返回 `undefined`，但调用者不应依赖返回值：
```ts
function log(): void { console.log('hi') }
const arr: number[] = []
arr.forEach((x): void => { /* 可以有 return */ })  // forEach 回调是 void
```

---

### `const` 和 `readonly` 的区别？

**参考答案：**

1. **作用域不同**：
   - `const`：运行时**变量绑定**约束，变量不能被重新赋值
   - `readonly`：编译时**属性**约束，对象属性不能被修改

2. **`const` 不阻止深层修改**：
```ts
const obj = { name: 'Alice' }
obj.name = 'Bob'    // ✅ 允许，const 只约束变量本身
obj = {}            // ❌ 不允许，不能重新赋值
```

3. **`readonly` 只约束编译时**：
```ts
interface User { readonly name: string }
const u: User = { name: 'Alice' }
u.name = 'Bob'  // ❌ 编译报错
// 但运行时可以强制修改（不推荐）
```

4. **`ReadonlyArray<T>`**：禁止 `push`/`pop`/`splice` 等变异方法，比 `readonly T[]` 更严格（两者等价）

5. **`as const`**：将对象/数组所有属性递归标记为 `readonly`，同时推断字面量类型：
```ts
const config = { env: 'prod', port: 3000 } as const
// 类型：{ readonly env: 'prod'; readonly port: 3000 }
```

---

### 协变（covariant）、逆变（contravariant）、双变是什么？

**参考答案：**

1. **基本概念**：描述类型在子类型关系中的"方向性"。若 `Dog extends Animal`：
   - **协变**：`Dog[]` 也是 `Animal[]` 的子类型（方向一致）
   - **逆变**：`(x: Animal) => void` 是 `(x: Dog) => void` 的子类型（方向相反）
   - **双变**：两个方向都成立（不安全）

2. **函数参数是逆变的**（开启 `strictFunctionTypes` 后）：
```ts
type Handler<T> = (val: T) => void

const animalHandler: Handler<Animal> = (a) => a.eat()
const dogHandler: Handler<Dog> = (d) => d.bark()

// 赋值给需要 Handler<Dog> 的位置：
// ✅ animalHandler 可以用，因为能处理更宽泛的 Animal，必然能处理 Dog
// ❌ dogHandler 不安全，如果传入非 Dog 的 Animal 会出错
let handler: Handler<Dog> = animalHandler  // ✅ 逆变允许
let handler2: Handler<Animal> = dogHandler // ❌ 逆变不允许
```

3. **函数返回值是协变的**：
```ts
type Producer<T> = () => T
// Dog 是 Animal 的子类型
// Producer<Dog> 是 Producer<Animal> 的子类型（协变）
let p: Producer<Animal> = (() => new Dog())  // ✅
```

4. **方法签名（shorthand）是双变的**（即使开了 `strictFunctionTypes`）：
```ts
interface Obj {
  method(val: Dog): void      // shorthand，双变（不安全但 TS 保留兼容性）
  fn: (val: Dog) => void      // 属性函数，逆变（严格）
}
```

5. **实用记忆口诀**：输入位置逆变（越宽越好），输出位置协变（越窄越好）。

---

### 枚举 vs `const` 枚举 vs `as const` 对象的区别？

**参考答案：**

1. **普通枚举**：编译为 JS 对象，支持双向映射（数字枚举可通过值反查 key）：
```ts
enum Direction { Up = 1, Down }
// 编译为：
// { Up: 1, Down: 2, 1: 'Up', 2: 'Down' }
Direction[1] // 'Up'（反向映射）
```

2. **`const` 枚举**：编译时**内联消除**，不生成任何 JS 代码，性能更好：
```ts
const enum Direction { Up = 1, Down }
const d = Direction.Up  // 编译为：const d = 1
// 不能用 Direction[1] 反向查找（已消除）
```

3. **`as const` 对象**：保留字面量类型，同时保持普通对象结构：
```ts
const Direction = { Up: 1, Down: 2 } as const
type DirectionValue = typeof Direction[keyof typeof Direction]  // 1 | 2
// 无双向映射，但可以被 tree-shaking，更符合模块化
```

4. **选择建议**：
   - 需要运行时双向映射 → 普通枚举
   - 只需要类型常量，追求零 bundle 体积 → `const` 枚举（注意跨模块限制）
   - 与 JSON 互操作、Tree-shaking → `as const` 对象

---

### `?.` / `??` / `!.` / `as` 的语义和区别？

**参考答案：**

1. **`?.`（可选链）**：安全访问可能为 `null`/`undefined` 的属性/方法，遇到 null/undefined 短路返回 `undefined`：
```ts
const name = user?.profile?.name  // 不会抛出 TypeError
user?.greet()                     // 方法也适用
arr?.[0]                          // 数组下标访问
```

2. **`??`（空值合并）**：只有左侧为 `null` 或 `undefined` 时才取右侧值，与 `||` 的区别是 `||` 对 `0`/`''`/`false` 也取右侧：
```ts
const count = value ?? 0   // value 为 null/undefined 时才取 0
const count2 = value || 0  // value 为 0 时也取 0（可能是 bug）
```

3. **`!.`（非空断言）**：告诉 TS 该值不为 `null`/`undefined`，**运行时不做任何检查**，用错会导致运行时错误：
```ts
const el = document.getElementById('app')!
el.style.color = 'red'  // TS 不报错，但若实际为 null 则运行时崩溃
```

4. **`as`（类型断言）**：强制指定类型，绕过类型检查，同样**运行时无保证**：
```ts
const input = document.querySelector('input') as HTMLInputElement
input.value  // TS 认为是 HTMLInputElement

// 双重断言（先 as unknown 再 as 目标）用于完全不兼容的类型
const x = someValue as unknown as SpecificType
```

---

### `Pick`、`Omit`、`Exclude` 的用法和区别？

**参考答案：**

三者都是内置工具类型，但操作对象不同：

1. **`Pick<T, K>`**：从对象类型 `T` 中**选取**指定的键，生成新类型：
```ts
interface User {
  id: number
  name: string
  email: string
  password: string
}

type PublicUser = Pick<User, 'id' | 'name' | 'email'>
// 结果：{ id: number; name: string; email: string }
// 常用场景：接口返回值只暴露部分字段
```

2. **`Omit<T, K>`**：从对象类型 `T` 中**排除**指定的键，生成新类型（`Pick` 的反向操作）：
```ts
type SafeUser = Omit<User, 'password'>
// 结果：{ id: number; name: string; email: string }
// 常用场景：去掉敏感字段、创建表单时去掉 id 等自动生成字段

type CreateUserDTO = Omit<User, 'id'>
// 新建用户时不需要传 id
```

3. **`Exclude<T, U>`**：从**联合类型** `T` 中排除能赋值给 `U` 的类型成员（操作联合类型，不是对象）：
```ts
type Status = 'active' | 'inactive' | 'deleted'
type VisibleStatus = Exclude<Status, 'deleted'>
// 结果：'active' | 'inactive'

type NonNullable<T> = Exclude<T, null | undefined>
// 去掉联合类型中的 null 和 undefined
```

4. **三者的核心区别**：

| 工具类型 | 操作对象 | 作用 |
|---------|---------|------|
| `Pick<T, K>` | 对象类型的键 | 选取指定键 |
| `Omit<T, K>` | 对象类型的键 | 排除指定键 |
| `Exclude<T, U>` | 联合类型的成员 | 排除可赋值给 U 的成员 |

5. **`Omit` 的底层实现**（依赖 `Pick` + `Exclude`）：
```ts
type MyOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
// 先用 Exclude 从 keyof T 中排除 K，再用 Pick 选取剩余的键
```

6. **`Extract<T, U>`**（与 `Exclude` 相对，选取能赋值给 U 的成员）：
```ts
type StringOrNumber = string | number | boolean
type OnlyStringOrNumber = Extract<StringOrNumber, string | number>
// 结果：string | number
```

7. **常见实战组合**：
```ts
// 更新接口：所有字段变可选，但保留 id 为必填
type UpdateUserDTO = Partial<Omit<User, 'id'>> & Pick<User, 'id'>

// 从路由配置中提取只有权限字段的类型
type PermissionRoute = Pick<Route, 'path' | 'permission' | 'roles'>
```

---

## 二、泛型

### 什么是泛型约束？`extends` 在泛型和条件类型中的两种不同含义？

**参考答案：**

1. **泛型约束**：用 `extends` 限制泛型参数必须满足某个类型结构，避免访问不存在的属性：
```ts
// 没有约束：T 可以是任何类型，访问 .length 报错
function getLength<T>(val: T): number {
  return val.length  // ❌ T 不一定有 length
}

// 加约束：T 必须有 length 属性
function getLength<T extends { length: number }>(val: T): number {
  return val.length  // ✅
}

getLength('hello')    // ✅ string 有 length
getLength([1, 2, 3])  // ✅ array 有 length
getLength(123)        // ❌ number 没有 length
```

2. **`extends` 在泛型约束中**：约束类型上界，`T extends U` 表示"T 必须是 U 的子类型"：
```ts
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  // K 必须是 T 的键，否则报错
}
```

3. **`extends` 在条件类型中**：是条件判断，不是约束：
```ts
type IsString<T> = T extends string ? 'yes' : 'no'
// T extends string 是"T 是否可以赋值给 string"的运行时判断
type A = IsString<'hello'>  // 'yes'
type B = IsString<number>   // 'no'
```

4. **关键区别**：

| | 泛型约束 `<T extends U>` | 条件类型 `T extends U ? X : Y` |
|---|---|---|
| 位置 | 尖括号内 | 类型表达式中 |
| 含义 | 限制 T 的范围 | 条件分支判断 |
| 触发时机 | 传入类型参数时校验 | 类型计算时求值 |

---

### 泛型分配条件类型（Distributive Conditional Types）是什么？如何关闭分配？

**参考答案：**

1. **什么是分配条件类型**：当条件类型的检查类型是**裸类型参数**（naked type parameter）时，TypeScript 会对联合类型逐个成员分配计算，再将结果合并为联合类型：
```ts
type ToArray<T> = T extends any ? T[] : never

type A = ToArray<string | number>
// 分配展开：ToArray<string> | ToArray<number>
// 结果：string[] | number[]

// 对比不分配的直觉结果：(string | number)[]（实际不是这个）
```

2. **分配条件的触发条件**：
   - 检查类型必须是**裸类型参数**（不能被包装）
   - 必须在条件类型中直接使用（不能在元组或其他结构中）

3. **如何关闭分配**：用 `[]` 包裹，使其不再是裸类型参数：
```ts
type ToArray<T> = [T] extends [any] ? T[] : never

type A = ToArray<string | number>
// 不分配：[string | number] extends [any]
// 结果：(string | number)[]
```

4. **实用场景**：`Exclude` 利用分配特性过滤联合类型：
```ts
type MyExclude<T, U> = T extends U ? never : T
type Result = MyExclude<'a' | 'b' | 'c', 'a'>
// 分配：('a' extends 'a' ? never : 'a') | ('b' extends 'a' ? never : 'b') | ('c' extends 'a' ? never : 'c')
// = never | 'b' | 'c'
// = 'b' | 'c'
```

5. **`IsNever` 的陷阱**：`never extends never` 不会分配（never 是空联合类型，分配结果为 never），所以检测 never 必须关闭分配：
```ts
type IsNever<T> = [T] extends [never] ? true : false  // ✅
type IsNever2<T> = T extends never ? true : false      // ❌ 对 never 永远返回 never
```

---

### `infer` 关键字的作用？用 infer 实现 `ReturnType`、`Parameters`、`PromiseValue`

**参考答案：**

1. **`infer` 的作用**：在条件类型的 `extends` 子句中，声明一个待推断的类型变量，让 TypeScript 自动推断并捕获该位置的类型：
```ts
// 没有 infer：无法提取函数返回值类型
type GetReturn<T> = T extends (...args: any) => ??? // 无法填

// 有 infer：TS 自动推断 R 为返回值类型
type GetReturn<T> = T extends (...args: any) => infer R ? R : never
```

2. **实现 `ReturnType`**：
```ts
type MyReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : never

type R1 = MyReturnType<() => string>      // string
type R2 = MyReturnType<(x: number) => boolean>  // boolean
```

3. **实现 `Parameters`**：
```ts
type MyParameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never

type P1 = MyParameters<(x: string, y: number) => void>  // [string, number]
```

4. **实现 `PromiseValue`（递归解包）**：
```ts
type PromiseValue<T> =
  T extends Promise<infer R>
    ? PromiseValue<R>  // 递归，处理 Promise<Promise<string>>
    : T

type V1 = PromiseValue<Promise<string>>           // string
type V2 = PromiseValue<Promise<Promise<number>>>  // number
```

5. **`infer` 在逆变位置的合并行为**：在同一个联合类型的不同逆变位置推断时，会得到交叉类型（用于实现 `UnionToIntersection`）：
```ts
// 函数参数是逆变位置，多个推断取交叉
type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void
    ? I
    : never
```

---

### 用泛型实现函数重载的类型推导？

**参考答案：**

1. **函数重载声明**：多个签名声明 + 一个实现签名（实现签名对外不可见）：
```ts
function process(input: string): string
function process(input: number): number
function process(input: string | number): string | number {
  return typeof input === 'string' ? input.toUpperCase() : input * 2
}
const r1 = process('hello')  // 类型：string
const r2 = process(42)       // 类型：number
```

2. **用条件类型实现类型安全的"重载"**（更灵活）：
```ts
type ProcessReturn<T extends string | number> =
  T extends string ? string : number

function process<T extends string | number>(input: T): ProcessReturn<T> {
  return (typeof input === 'string'
    ? input.toUpperCase()
    : input * 2) as ProcessReturn<T>
}

const r1 = process('hello')  // 推断为 string
const r2 = process(42)       // 推断为 number
```

3. **注意**：实现签名的参数类型必须是所有重载签名的兼容超集，返回值同理。

---

### TypeScript 5.0 `const` 类型参数（`<const T>`）的作用？

**参考答案：**

1. **问题背景**：泛型推断默认会"拓宽"字面量类型：
```ts
function route<T extends string>(path: T) { return path }
const r = route('/user/list')  // T 推断为 string，不是字面量 '/user/list'
```

2. **`<const T>` 解决方案**：强制泛型推断保持字面量收窄，效果等同于调用时传 `as const`：
```ts
function route<const T extends string>(path: T) { return path }
const r = route('/user/list')  // T 推断为 '/user/list'（字面量）
```

3. **对对象/数组也有效**：
```ts
function config<const T>(opts: T) { return opts }
const c = config({ env: 'prod', port: 3000 })
// T 推断为 { readonly env: 'prod'; readonly port: 3000 }
```

4. **使用场景**：路由类型系统、配置对象类型推断、需要精确字面量类型的工厂函数。

---

## 三、内置工具类型手写实现

### 手写实现 `MyPartial<T>` / `MyRequired<T>` / `MyReadonly<T>`

```ts
// 所有属性变可选
type MyPartial<T> = {
  [K in keyof T]?: T[K]
}

// 所有属性变必选（-? 移除可选修饰符）
type MyRequired<T> = {
  [K in keyof T]-?: T[K]
}

// 所有属性变只读
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K]
}

// 使用示例
interface User { name: string; age?: number }
type PartialUser = MyPartial<User>    // { name?: string; age?: number }
type RequiredUser = MyRequired<User>  // { name: string; age: number }
type ReadonlyUser = MyReadonly<User>  // { readonly name: string; readonly age?: number }
```

**关键点**：
- `[K in keyof T]` 遍历 T 的所有键
- `?` 添加可选，`-?` 移除可选
- `readonly` 添加只读，`-readonly` 移除只读

---

### 手写实现 `MyPick<T, K>` / `MyOmit<T, K>` / `MyRecord<K, V>`

```ts
// 挑选指定属性
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P]
}

// 排除指定属性（先 Exclude 键，再 Pick）
type MyOmit<T, K extends keyof T> = {
  [P in Exclude<keyof T, K>]: T[P]
}
// 或者：MyPick<T, Exclude<keyof T, K>>

// 构造键值映射
type MyRecord<K extends keyof any, V> = {
  [P in K]: V
}

// 示例
interface User { name: string; age: number; email: string }
type NameAndAge = MyPick<User, 'name' | 'age'>    // { name: string; age: number }
type WithoutEmail = MyOmit<User, 'email'>          // { name: string; age: number }
type StringMap = MyRecord<'a' | 'b', string>       // { a: string; b: string }
```

---

### 手写实现 `MyExclude<T, U>` / `MyExtract<T, U>` / `MyNonNullable<T>`

```ts
// 从 T 中排除可赋值给 U 的类型
type MyExclude<T, U> = T extends U ? never : T

// 从 T 中提取可赋值给 U 的类型
type MyExtract<T, U> = T extends U ? T : never

// 移除 null 和 undefined
type MyNonNullable<T> = T extends null | undefined ? never : T

// 示例
type A = MyExclude<'a' | 'b' | 'c', 'a'>        // 'b' | 'c'
type B = MyExtract<string | number | boolean, string | number>  // string | number
type C = MyNonNullable<string | null | undefined>  // string
```

---

### 手写实现 `MyReturnType<T>` / `MyParameters<T>` / `MyInstanceType<T>`

```ts
// 获取函数返回值类型
type MyReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : never

// 获取函数参数类型（元组）
type MyParameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never

// 获取构造函数实例类型
type MyInstanceType<T extends new (...args: any) => any> =
  T extends new (...args: any) => infer R ? R : never

// 示例
function greet(name: string, age: number): string { return '' }
type R = MyReturnType<typeof greet>    // string
type P = MyParameters<typeof greet>   // [name: string, age: number]

class Dog { bark() {} }
type D = MyInstanceType<typeof Dog>   // Dog
```

---

### 手写实现 `Awaited<T>`（递归解包 Promise）

```ts
type MyAwaited<T> =
  T extends Promise<infer R>
    ? MyAwaited<R>  // 递归解包，处理嵌套 Promise
    : T

// 示例
type A = MyAwaited<Promise<string>>                    // string
type B = MyAwaited<Promise<Promise<number>>>            // number
type C = MyAwaited<string>                             // string（非 Promise 直接返回）

// 注意：TS 4.5+ 内置的 Awaited 还处理了 PromiseLike（thenable 对象），更完整
```

---

### 手写实现 `DeepReadonly<T>` / `DeepPartial<T>`（递归版本）

```ts
// 递归 readonly：对象类型递归处理，基础类型直接返回
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]              // 函数不递归
      : DeepReadonly<T[K]>
    : T[K]
}

// 递归 partial
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepPartial<T[K]>
    : T[K]
}

// 示例
interface Config {
  server: { host: string; port: number }
  db: { url: string }
}
type ReadonlyConfig = DeepReadonly<Config>
// { readonly server: { readonly host: string; readonly port: number }; readonly db: { readonly url: string } }
```

---

## 四、类型体操（区分度题）

### 实现 `UnionToIntersection<U>`（联合转交叉，利用逆变）

**参考答案：**

```ts
type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void
    ? I
    : never

// 示例
type A = UnionToIntersection<{ a: string } | { b: number }>
// { a: string } & { b: number }
```

**原理分析**（面试关键）：

1. **第一步**：利用分配条件类型，将联合类型展开为函数参数类型的联合：
   - `U = { a: string } | { b: number }`
   - `U extends any ? (x: U) => void : never` 分配展开为：
   - `((x: { a: string }) => void) | ((x: { b: number }) => void)`

2. **第二步**：利用**函数参数的逆变性**，从函数参数联合类型中 `infer` 交叉类型：
   - 多个函数类型的联合 `((x: A) => void) | ((x: B) => void)` 的参数位置是逆变的
   - 在逆变位置上 `infer` 多个类型时，TypeScript 会取**交叉类型**（A & B）
   - 所以 `infer I` 得到 `{ a: string } & { b: number }`

3. **核心记忆**：协变位置取联合，逆变位置取交叉。

---

### 实现 `TupleToUnion<T>`（元组转联合）

```ts
type TupleToUnion<T extends any[]> = T[number]

// 原理：用数字索引类型访问元组，TS 会返回所有数字下标对应类型的联合
type A = TupleToUnion<[string, number, boolean]>  // string | number | boolean
```

---

### 实现 `LengthOfString<S>`（字符串长度，模板字面量 + 递归）

```ts
type LengthOfString<S extends string, Acc extends any[] = []> =
  S extends `${infer _}${infer Rest}`
    ? LengthOfString<Rest, [...Acc, unknown]>  // 每次消耗一个字符，Acc 增加一项
    : Acc['length']                             // 递归到空字符串时，返回累积数组长度

type A = LengthOfString<'hello'>  // 5
type B = LengthOfString<''>       // 0
```

**原理**：TS 无法直接获取字符串字面量的长度，通过模板字面量拆分字符 + 累积数组计数的方式间接实现。

---

### 实现 `Flatten<T>`（递归展平元组）

```ts
type Flatten<T extends any[]> =
  T extends [infer First, ...infer Rest]
    ? First extends any[]
      ? [...Flatten<First>, ...Flatten<Rest>]  // First 是数组，递归展平
      : [First, ...Flatten<Rest>]               // First 不是数组，保留
    : []  // 空数组

type A = Flatten<[1, [2, 3], [4, [5, 6]]]>  // [1, 2, 3, 4, 5, 6]
```

---

### 实现 `IsNever<T>`（为什么不能直接 `T extends never`？）

**参考答案：**

```ts
// ❌ 错误实现：对 never 永远返回 never
type IsNever_Wrong<T> = T extends never ? true : false
type A = IsNever_Wrong<never>  // never（不是 true）

// ✅ 正确实现：关闭分配
type IsNever<T> = [T] extends [never] ? true : false
type B = IsNever<never>   // true
type C = IsNever<string>  // false
```

**原因**：`never` 是空联合类型，分配条件类型对空联合类型分配的结果是 `never`（分配 0 次），所以 `T extends never ? true : false` 当 T = never 时直接返回 `never`，永远不会到达 `true` 分支。用 `[T] extends [never]` 关闭分配后，就是普通的类型判断，能正确返回 `true`。

---

### 实现 `IsAny<T>`（`0 extends (T & 1)` 原理解释）

**参考答案：**

```ts
type IsAny<T> = 0 extends (T & 1) ? true : false

type A = IsAny<any>     // true
type B = IsAny<string>  // false
type C = IsAny<never>   // false
```

**原理**：
- `any & 1` = `any`（any 和任何类型的交叉仍是 any）
- `0 extends any` = `true`（0 可以赋值给 any）
- 对于非 any 类型，`string & 1 = never`，`0 extends never = false`
- 这利用了 `any` 特殊的类型系统语义：**any 同时是所有类型的子类型和超类型**，这使得 `0 extends (any & 1)` 为 true，而其他类型不满足。

---

## 五、模板字面量类型

### 实现 `CamelToSnake<S>`（驼峰转下划线）

```ts
type CamelToSnake<S extends string> =
  S extends `${infer Head}${infer Tail}`
    ? Head extends Uppercase<Head>          // Head 是大写字母
      ? Head extends Lowercase<Head>        // 排除非字母（数字等大小写相同）
        ? `${Head}${CamelToSnake<Tail>}`
        : `_${Lowercase<Head>}${CamelToSnake<Tail>}`
      : `${Head}${CamelToSnake<Tail>}`
    : S

type A = CamelToSnake<'helloWorld'>    // 'hello_world'
type B = CamelToSnake<'getUserName'>   // 'get_user_name'
```

---

### 实现路由参数提取 `ExtractParams<'/user/:id/:name'>`

```ts
type ExtractParams<T extends string> =
  T extends `${infer _}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<`/${Rest}`>
    : T extends `${infer _}:${infer Param}`
    ? Param
    : never

type A = ExtractParams<'/user/:id/profile/:name'>  // 'id' | 'name'
type B = ExtractParams<'/post/:postId'>             // 'postId'
type C = ExtractParams<'/static/file'>              // never
```

---

### 用模板字面量类型实现 `EventName` 约束

```ts
type EventName = `on${Capitalize<string>}`

// 更精确的版本：限制具体事件名
type DOMEvent = 'click' | 'focus' | 'blur' | 'change'
type EventHandler = `on${Capitalize<DOMEvent>}`
// 'onClick' | 'onFocus' | 'onBlur' | 'onChange'

// 应用于对象类型
type EventHandlers = {
  [K in EventHandler]?: () => void
}
```

---

## 六、装饰器

### 旧版装饰器（`experimentalDecorators`）和 TS 5.0 新版装饰器的区别？

**参考答案：**

1. **旧版装饰器**（`experimentalDecorators: true`）：
   - 基于早期 TC39 提案，不是标准
   - 依赖 `reflect-metadata` 库获取元数据
   - 类装饰器参数是构造函数 `target`
   - NestJS、Angular 目前使用的就是旧版

2. **TS 5.0 新版装饰器**（2023 年正式支持 TC39 Stage 3）：
   - 基于 TC39 标准，不依赖 `reflect-metadata`
   - 装饰器接收 `context` 对象（含 `name`、`kind`、`addInitializer` 等）
   - 返回值语义不同（方法装饰器返回新函数）

```ts
// 旧版
function log(target: any, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value
  descriptor.value = function(...args: any[]) {
    console.log(`calling ${key}`)
    return original.apply(this, args)
  }
}

// 新版（TS 5.0）
function log<T extends (...args: any[]) => any>(
  fn: T,
  context: ClassMethodDecoratorContext
) {
  return function(this: any, ...args: any[]) {
    console.log(`calling ${String(context.name)}`)
    return fn.apply(this, args)
  } as T
}
```

3. **迁移注意**：两者不兼容，NestJS 等框架仍需 `experimentalDecorators`。

---

### 类装饰器 / 方法装饰器 / 属性装饰器的执行顺序？

**参考答案：**

1. **求值顺序（从上到下）**：装饰器表达式从上到下依次求值（工厂函数先执行）
2. **应用顺序（从下到上，从内到外）**：装饰器函数从下到上依次应用

```ts
@ClassDec       // 4. 最后执行类装饰器
class MyClass {
  @PropDec      // 1. 属性装饰器先执行
  name: string

  @MethodDec2   // 3. 从下到上
  @MethodDec1   // 2. MethodDec1 后于 MethodDec2 执行（从下到上）
  greet() {}
}
```

**执行顺序总结**：
1. 实例属性装饰器（按出现顺序）
2. 实例方法装饰器（每个方法从下到上）
3. 静态属性装饰器
4. 静态方法装饰器
5. 类装饰器（最后）

---

### 如何用装饰器实现依赖注入？（Reflect Metadata + IoC 容器原理）

**参考答案：**

1. **核心依赖**：`reflect-metadata` 库，允许在运行时读写元数据：
```ts
import 'reflect-metadata'

// 启用 tsconfig: emitDecoratorMetadata: true
// TS 编译器会自动注入 design:type / design:paramtypes 元数据
```

2. **实现简版 IoC 容器**：
```ts
const container = new Map<string, any>()

// @Injectable 标记可注入的类
function Injectable(target: any) {
  const paramTypes = Reflect.getMetadata('design:paramtypes', target) || []
  const deps = paramTypes.map((dep: any) => container.get(dep.name))
  container.set(target.name, new target(...deps))
}

@Injectable
class Logger {
  log(msg: string) { console.log(msg) }
}

@Injectable
class UserService {
  constructor(private logger: Logger) {}  // TS 自动注入 design:paramtypes = [Logger]
  getUser() { this.logger.log('getting user') }
}

const userService = container.get('UserService') as UserService
```

3. **`design:paramtypes`**：TS 开启 `emitDecoratorMetadata` 后，编译器自动将构造函数参数类型写入元数据，IoC 容器读取后自动实例化依赖。

4. **NestJS 的实现**：基于相同原理，通过 `@Module`、`@Controller`、`@Injectable` 等装饰器构建完整的依赖注入体系。

---

## 七、类型系统新特性（2024–2026）

### `satisfies` vs `: Type` 注解 vs `as Type` 断言的三者区别？

**参考答案：**

这是 2024 年开始进入大厂面试的考点，三者区别非常重要：

1. **`: Type` 注解**：将变量**拓宽**为指定类型，丢失字面量类型信息：
```ts
type Color = string | [number, number, number]
const red: Color = [255, 0, 0]
red.map(x => x)  // ❌ 报错：Color 没有 map 方法（被拓宽为 string | ...）
```

2. **`as Type` 断言**：强制断言为指定类型，**绕过类型检查**，不安全：
```ts
const red = [255, 0, 0] as Color
red.map(x => x)  // ❌ 同样报错：断言后类型是 Color
// 而且如果类型不兼容，as 还会隐藏真实错误
```

3. **`satisfies` 操作符（TS 4.9+）**：验证值满足类型约束，同时**保留推断出的更精确字面量类型**：
```ts
type Color = string | [number, number, number]
const palette = {
  red: [255, 0, 0],
  green: '#00ff00',
} satisfies Record<string, Color>

palette.red.map(x => x)        // ✅ 保留了 number[] 类型
palette.green.toUpperCase()    // ✅ 保留了 string 类型
// 同时如果写错类型，satisfies 会报错（: Type 只拓宽，不报错）
```

4. **三者对比表**：

| | `: Type` 注解 | `as Type` 断言 | `satisfies T` |
|---|---|---|---|
| 类型检查 | ✅ | ⚠️ 可绕过 | ✅ |
| 保留字面量类型 | ❌ 拓宽 | ❌ 拓宽 | ✅ 保留 |
| 安全性 | 安全 | 不安全 | 安全 |
| 使用场景 | 明确指定类型 | 类型不兼容时强转 | 校验同时保留精确类型 |

5. **选择原则**：
   - 需要校验 + 保留字面量类型 → `satisfies`
   - 需要指定类型且字面量不重要 → `: Type`
   - 类型系统无法推断/确实需要强转 → `as`（谨慎使用）

---

### `as const satisfies T` 组合的使用场景？

**参考答案：**

```ts
type RouteConfig = {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
}

const routes = [
  { path: '/users', method: 'GET' },
  { path: '/users', method: 'POST' },
] as const satisfies RouteConfig[]

// as const：每个 method 的类型是字面量 'GET'/'POST' 而非 string
// satisfies RouteConfig[]：同时校验结构正确性
routes[0].method  // 类型：'GET'（字面量，而非 string）
```

**组合效果**：`as const` 负责收窄字面量类型，`satisfies` 负责类型校验，两者不冲突。

---

### `using` 声明是什么？`[Symbol.dispose]()` 如何工作？

**参考答案：**

1. **背景**：来自 TC39 的 Explicit Resource Management 提案，TS 5.2 实现。解决资源（文件句柄、数据库连接、锁）的自动释放问题。

2. **同步版本**：
```ts
class FileHandle {
  constructor(public path: string) { console.log(`open ${path}`) }
  [Symbol.dispose]() { console.log(`close ${this.path}`) }
}

function processFile() {
  using fh = new FileHandle('data.txt')  // 进入作用域，自动调用构造
  // ... 处理文件
}  // 作用域结束，自动调用 fh[Symbol.dispose]()，相当于 try/finally
```

3. **异步版本**：
```ts
class DBConnection {
  async [Symbol.asyncDispose]() {
    await this.close()
  }
}
async function query() {
  await using conn = new DBConnection()
  // 作用域结束，await conn[Symbol.asyncDispose]()
}
```

4. **本质**：语法糖，编译后等价于 `try { ... } finally { resource[Symbol.dispose]() }`。比手写 try/finally 更简洁，也避免忘记释放。

---

### 类型谓词 `val is string` vs `asserts val is string` 的区别？

**参考答案：**

1. **`val is string`（类型谓词）**：函数返回 `true` 时，TS 将参数收窄为 `string`：
```ts
function isString(val: unknown): val is string {
  return typeof val === 'string'
}

const x: unknown = 'hello'
if (isString(x)) {
  x.toUpperCase()  // ✅ 此处 x 已被收窄为 string
}
```

2. **`asserts val is string`（断言函数）**：函数正常返回（不抛出）时，TS 认为参数类型已被收窄，适合 assert 风格的校验：
```ts
function assertString(val: unknown): asserts val is string {
  if (typeof val !== 'string') throw new TypeError('Expected string')
}

const x: unknown = 'hello'
assertString(x)
x.toUpperCase()  // ✅ 调用后 x 已被收窄为 string（无需 if）
```

3. **区别**：
   - 谓词函数：返回 boolean，配合 `if` 使用
   - 断言函数：返回 void，调用后直接收窄（抛出则不执行后续代码）

---

## 八、工程化与实战

### `tsconfig.json` 中 `strict` 模式开启了哪些具体检查？各自含义？

**参考答案：**

`strict: true` 是以下选项的快捷开关：

| 选项 | 含义 |
|------|------|
| `strictNullChecks` | `null`/`undefined` 不能赋值给其他类型，必须显式处理 |
| `strictFunctionTypes` | 函数参数类型检查使用逆变（更安全），方法签名除外 |
| `strictBindCallApply` | `bind`/`call`/`apply` 的参数类型严格检查 |
| `strictPropertyInitialization` | 类属性必须在构造函数中初始化（或标记为可选/definite assignment） |
| `noImplicitAny` | 不允许隐式推断为 `any`，必须显式标注类型 |
| `noImplicitThis` | 不允许 `this` 隐式为 `any` |
| `alwaysStrict` | 生成的 JS 文件开启 `'use strict'` |
| `useUnknownInCatchVariables`（TS 4.4+） | catch 块中的错误变量类型为 `unknown` 而非 `any` |

**建议**：新项目直接开 `strict: true`，老项目迁移可逐个开启。

---

### `paths` 别名和 `baseUrl` 的配置及常见踩坑？

**参考答案：**

1. **配置方式**：
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"]
    }
  }
}
```

2. **重要踩坑**：`tsconfig.json` 的 `paths` 配置**只影响 TypeScript 编译器的类型检查**，不影响实际的模块解析。打包工具（Vite/webpack）需要**额外配置**：
```ts
// vite.config.ts
import { resolve } from 'path'
export default {
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
}
```

3. **常见问题**：只配了 tsconfig paths，编译不报错，但运行时找不到模块。原因是 tsc 不做路径转换（除非用 `tsc-alias` 等工具）。

---

### 如何给没有类型声明的 npm 包补充类型？（三种方式）

**参考答案：**

1. **方式一：安装 `@types/xxx`**（最常用）：
```bash
npm install -D @types/lodash
# DefinitelyTyped 社区维护，覆盖大多数流行库
```

2. **方式二：在项目中创建 `.d.ts` 文件**（`declare module`）：
```ts
// types/some-lib.d.ts
declare module 'some-lib' {
  export function doSomething(input: string): number
  export interface Options { timeout?: number }
}
```

3. **方式三：扩充现有模块声明（模块增强）**：
```ts
// 给 express 的 Request 对象添加自定义属性
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; name: string }
    }
  }
}
```

4. **临时方案**：在引用处直接 `declare module` 或用 `// @ts-ignore`（不推荐）。

---

### `declare global` / `declare module` / `namespace` 的区别？

**参考答案：**

1. **`declare global`**：在模块文件中扩充全局命名空间（`window`、`globalThis` 等）：
```ts
// 必须在模块文件中（有 import/export）才能用 declare global
declare global {
  interface Window { myCustomProp: string }
  function globalHelper(): void
}
```

2. **`declare module 'xxx'`**：声明或扩充某个 npm 模块的类型：
```ts
// 声明没有类型的模块
declare module 'untyped-lib' {
  export function foo(): void
}

// 扩充现有模块（模块增强）
import 'express'
declare module 'express' {
  interface Request { user?: User }
}
```

3. **`namespace`**：在全局脚本（非模块）中组织类型，避免命名冲突；现代项目一般不用（模块化替代）：
```ts
namespace MyApp {
  export interface User { name: string }
  export interface Config { apiUrl: string }
}
const u: MyApp.User = { name: 'Alice' }
```

4. **选择原则**：
   - 扩充全局对象 → `declare global`
   - 给第三方库补类型 / 扩充第三方库 → `declare module`
   - 遗留代码或全局脚本组织 → `namespace`（新代码避免使用）

---

### 如何优化 TypeScript 项目的编译性能？

**参考答案：**

1. **`skipLibCheck: true`**：跳过 `.d.ts` 声明文件的类型检查，显著减少编译时间（大型项目常用）

2. **增量编译**：
```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"  // 缓存文件位置
  }
}
```

3. **`isolatedModules: true`**：要求每个文件可以独立编译（不依赖跨文件类型信息），配合 Vite/esbuild/Babel 等工具的单文件转译模式使用

4. **Project References（项目引用）**：将大型项目拆分为多个子项目，各自编译，只重新编译变更的子项目：
```json
// tsconfig.json
{
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/ui" }
  ]
}
```

5. **排除不必要的文件**：
```json
{
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

6. **使用 `transpileOnly`**：类型检查与编译分离，编译交给 esbuild/swc（极速），类型检查单独跑 `tsc --noEmit`（只检查不输出）

---

### Zod / class-validator 和 TypeScript 类型检查的关系？为什么编译时类型不够用？

**参考答案：**

1. **TypeScript 类型只存在于编译时**：编译后的 JS 不含任何类型信息，无法在运行时验证从外部（API 响应、表单输入、localStorage）来的数据

2. **运行时数据的问题**：
```ts
interface User { name: string; age: number }
const user = JSON.parse(response) as User
// TS 认为没问题，但实际上 age 可能是字符串，name 可能不存在
user.age.toFixed(2)  // 运行时崩溃：age is string, not number
```

3. **Zod 的解决方案**：同时生成运行时 schema 和 TS 类型：
```ts
import { z } from 'zod'
const UserSchema = z.object({
  name: z.string(),
  age: z.number().int().positive(),
})
type User = z.infer<typeof UserSchema>  // 从 schema 推导 TS 类型

// 运行时验证
const result = UserSchema.safeParse(JSON.parse(response))
if (result.success) {
  result.data.age.toFixed(2)  // ✅ 安全
} else {
  console.error(result.error)
}
```

4. **适用场景**：
   - Zod：轻量，TS-first，与框架无关
   - class-validator：基于装饰器，配合 NestJS/TypeORM 等类风格框架
   - io-ts：函数式风格，类型更精确但学习曲线陡

5. **核心原则**：信任边界处（HTTP 请求、环境变量、用户输入）必须用运行时校验，内部模块间传递可以只用 TS 类型。

---

## 附：近三年考察趋势总结

| 时间段 | 考察重心 |
|--------|---------|
| 2022–2023 | 基础类型、工具类型手写、泛型约束；type vs interface 必问 |
| 2023–2024 | 类型体操升频（type-challenges 直接入题）；模板字面量类型；协变/逆变进二面 |
| 2024–2025 | satisfies 操作符；TS 5.0 新装饰器；tsconfig 优化；infer 复杂场景 |
| 2025–2026 | using 声明；const 类型参数；Zod 运行时校验组合；工程化题目占比持续上升 |

---

## 附：面试官追问规律

1. **手写完工具类型后** → "去掉 `infer` 能不能实现？为什么必须用 `infer`？"
2. **回答了 type vs interface** → "项目里团队规范用哪个？为什么？"
3. **聊完协变逆变** → "函数类型在对象方法 shorthand 写法和属性箭头写法下，检查规则有什么不同？"（`strictFunctionTypes` 对 shorthand 方法签名无效，仍是双变）
4. **手写了 IsAny** → "为什么 `0 extends (T & 1)` 能检测 any？any 的类型系统语义是什么？"（any 既是顶类型又是底类型，`any & 1 = any`，`0 extends any = true`）
5. **聊完 satisfies** → "什么时候选 `satisfies`、什么时候选 `: Type`、什么时候选 `as Type`？"（需要字面量 + 校验用 satisfies；明确拓宽用 : Type；不安全强转用 as，尽量避免）

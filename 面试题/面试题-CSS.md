# CSS 面试题

## 1. BFC 是什么，怎么触发，有哪些应用场景

**定义**

BFC（Block Formatting Context，块级格式化上下文）是 CSS 视觉渲染中的一个独立布局环境。核心规则：**BFC 内部的元素按块级规则排版，且内部布局不影响外部，外部也不影响内部。**

**触发条件（任一即可）**

- `overflow: hidden / auto / scroll`（非 `visible`）
- `display: flow-root`（现代写法，无副作用，推荐）
- `display: flex / inline-flex / grid / inline-grid`
- `position: absolute / fixed`
- `float` 非 `none`
- 根元素 `<html>`

**三个关键特性**

- 内部 Box 垂直排列：BFC 内的块级盒子从上到下依次放置
- margin 不与外部折叠：BFC 内外的垂直 margin 不会合并
- BFC 不与 float 元素重叠：BFC 区域会收缩避让浮动元素

**应用场景**

- 清除浮动：父元素触发 BFC（`overflow: hidden`），浮动子元素被计入父元素高度，解决高度塌陷
- 阻止 margin 塌陷：相邻块级元素垂直 margin 合并时，给其中一个套 BFC 容器隔开
- 两栏自适应布局：左侧 float，右侧 `display: flow-root`，右侧自动避开 float 区域

> 现代实践首选 `display: flow-root`，`overflow: hidden` 有裁剪副作用。BFC 本质是"隔离的独立布局区域"，所有应用都是这个特性的延伸。

---

## 2. CSS 选择器优先级计算规则

**优先级权重（从高到低）**

| 选择器类型 | 权重 |
|-----------|------|
| `!important` | 最高，覆盖一切 |
| 内联样式 `style=""` | 1-0-0-0 |
| ID 选择器 `#id` | 0-1-0-0 |
| 类、伪类、属性选择器 `.class` / `:hover` / `[type]` | 0-0-1-0 |
| 元素、伪元素选择器 `div` / `::before` | 0-0-0-1 |
| 通配符 `*`、关系选择器 `+` `>` `~` | 0-0-0-0 |

**计算规则**

优先级用四位数表示 `(a, b, c, d)`，从左到右比较，数字大的优先级高：

```css
/* (0,1,0,0) vs (0,0,2,1) → ID 选择器胜 */
#nav { color: red; }            /* 0-1-0-0 */
.nav li.active { color: blue; } /* 0-0-2-1 */
```

**注意事项**

- 相同优先级，后声明的覆盖前声明的（层叠）
- `:not()` 本身不计权重，但括号内的选择器计
- `::before` 等伪元素权重和元素选择器相同（0-0-0-1）
- 继承来的样式优先级最低，比通配符还低

> 优先级口诀：内联 > ID > 类/伪类/属性 > 元素/伪元素，同级后来居上，`!important` 打破一切。

---

## 3. 元素水平垂直居中的多种方案

**方案一：Flexbox（最常用）**

```css
.parent {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

**方案二：Grid**

```css
.parent {
  display: grid;
  place-items: center; /* justify-items + align-items 简写 */
}
```

**方案三：absolute + transform（不需要知道子元素尺寸）**

```css
.parent { position: relative; }
.child {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```

**方案四：absolute + margin auto（需要知道子元素尺寸）**

```css
.parent { position: relative; }
.child {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  margin: auto;
  width: 100px;
  height: 100px;
}
```

**方案五：table-cell（兼容老浏览器）**

```css
.parent {
  display: table-cell;
  text-align: center;
  vertical-align: middle;
}
.child { display: inline-block; }
```

**方案六：line-height（仅适用单行文本）**

```css
.parent {
  height: 100px;
  line-height: 100px;
  text-align: center;
}
```

**方案对比**

| 方案 | 是否需要知道子元素尺寸 | 兼容性 | 推荐度 |
|------|----------------------|--------|--------|
| Flex | 否 | IE11+ | ⭐⭐⭐⭐⭐ |
| Grid | 否 | IE 不支持 | ⭐⭐⭐⭐⭐ |
| absolute + transform | 否 | IE9+ | ⭐⭐⭐⭐ |
| absolute + margin auto | 是 | IE8+ | ⭐⭐⭐ |
| table-cell | 否 | IE8+ | ⭐⭐ |

> 现代项目首选 Flex 或 Grid，需要兼容老浏览器用 absolute + transform。

---

## 4. `position` 各属性值的区别

**五种取值**

- `static`（默认）：正常文档流，`top/left/z-index` 无效
- `relative`：相对自身原始位置偏移，**仍占据原来的空间**，不脱离文档流
- `absolute`：相对最近的非 `static` 祖先元素定位，**脱离文档流**，不占据空间
- `fixed`：相对视口定位，**脱离文档流**，滚动页面不跟随移动
- `sticky`：正常流中滚动到阈值前是 `relative`，到达阈值后变成 `fixed`，**不脱离文档流**

**关键区别表**

| | 参照物 | 脱离文档流 | 占据空间 |
|--|--------|-----------|---------|
| static | — | 否 | 是 |
| relative | 自身原位置 | 否 | 是 |
| absolute | 最近非static祖先 | 是 | 否 |
| fixed | 视口 | 是 | 否 |
| sticky | 最近滚动祖先 | 否 | 是 |

**sticky 的常见坑**

- 父元素必须有滚动容器（`overflow` 非 `visible`），否则 sticky 失效
- 父元素高度必须大于 sticky 元素高度，否则没有粘性效果
- 必须指定 `top/bottom/left/right` 之一，否则等同于 `relative`

> absolute 找的是最近的"有定位"的祖先，没有则是 `<html>`；sticky 是 relative 和 fixed 的混合体，到达阈值前不脱流，超过后固定。

---

## 5. Flex 布局核心属性

**什么是 Flex 布局**

Flex（Flexible Box，弹性盒子）是 CSS3 引入的一维布局模型，专门解决元素在容器中的对齐、排列和空间分配问题。设置 `display: flex` 后，容器变为弹性容器，子元素变为弹性项目，可以沿主轴（水平/垂直）灵活排列，是现代布局的首选方案，取代了 float + 负 margin 等 hack 写法。

- **主轴（main axis）**：子项排列的方向，默认水平，由 `flex-direction` 控制
- **交叉轴（cross axis）**：垂直于主轴的方向

**容器属性**

```css
.container {
  display: flex;
  flex-direction: row | column | row-reverse | column-reverse; /* 主轴方向 */
  flex-wrap: nowrap | wrap | wrap-reverse;   /* 是否换行 */
  justify-content: flex-start | flex-end | center | space-between | space-around | space-evenly; /* 主轴对齐 */
  align-items: stretch | flex-start | flex-end | center | baseline; /* 交叉轴对齐（单行）*/
  align-content: flex-start | center | space-between | stretch; /* 交叉轴对齐（多行）*/
  gap: 10px; /* 子项间距，现代写法 */
}
```

**子项属性**

```css
.item {
  flex: 1;          /* flex-grow: 1, flex-shrink: 1, flex-basis: 0% 的简写 */
  flex-grow: 1;     /* 剩余空间分配比例，默认 0 */
  flex-shrink: 1;   /* 空间不足时收缩比例，默认 1 */
  flex-basis: auto; /* 主轴方向的初始大小 */
  align-self: auto | flex-start | center | flex-end; /* 单独设置交叉轴对齐 */
  order: 0;         /* 排列顺序，数字越小越靠前 */
}
```

**常见布局场景**

```css
/* 两栏布局：左固定右自适应 */
.left { width: 200px; flex-shrink: 0; }
.right { flex: 1; }

/* 等分三栏 */
.item { flex: 1; }

/* 底部固定 footer */
body { display: flex; flex-direction: column; min-height: 100vh; }
main { flex: 1; }
```

**`flex: 1` 的真实含义**

`flex: 1` = `flex-grow: 1; flex-shrink: 1; flex-basis: 0%`，注意 `flex-basis: 0%` 不是 `auto`，意味着子项的初始大小从 0 开始，所有剩余空间按比例分配。`flex: auto` = `flex-grow: 1; flex-shrink: 1; flex-basis: auto`，初始大小是内容尺寸。

> justify-content 控制主轴，align-items 控制交叉轴；flex: 1 让子项平分剩余空间，是最常用的自适应布局手段。

---

## 6. 重排（reflow）和重绘（repaint）的区别，如何减少

**定义**

- **重排（reflow）**：元素的几何属性（位置、尺寸）发生变化，浏览器需要重新计算布局，影响所有相关元素。代价极高。
- **重绘（repaint）**：元素的外观属性（颜色、背景）发生变化，不影响布局，只重新绘制该元素。代价较低。

**关系**：重排必然触发重绘，重绘不一定触发重排。

**触发重排的操作**

- 改变尺寸：`width`、`height`、`padding`、`margin`、`border`
- 改变位置：`top`、`left`、`position`
- 添加/删除 DOM 元素
- 改变字体大小
- 读取布局属性：`offsetWidth`、`scrollTop`、`clientHeight`、`getComputedStyle()`（强制同步布局）

**如何减少**

- 批量修改样式：用 `className` 或 `cssText` 一次性修改，而不是逐条修改
- 脱离文档流再操作：`display: none` → 修改 → 恢复显示（只触发 2 次重排）
- 使用 `DocumentFragment` 批量插入 DOM
- 避免在循环中读取布局属性（会强制刷新渲染队列）
- 使用 `transform` 和 `opacity` 做动画（触发 GPU 合成层，跳过重排重绘）
- 使用 `will-change: transform` 提前提升为合成层



transform 走的是合成层（Composite Layer），渲染流水线是：Layout → Paint → Composite，transform 跳过了前两步，直接在 GPU 上合成，主线程不参与。改 top/left 则触发 Layout，整条流水线都要跑一遍，代价高。

```js
// ❌ 循环读取触发强制同步布局
for (let i = 0; i < 100; i++) {
  el.style.width = el.offsetWidth + 1 + 'px'; // 每次都强制重排
}

// ✅ 先读后写
const width = el.offsetWidth;
for (let i = 0; i < 100; i++) {
  el.style.width = width + i + 'px';
}
```

> 重排 > 重绘 > 合成层（GPU）。动画优先用 transform/opacity，批量操作 DOM 用 DocumentFragment，避免在循环里读布局属性。

---

## 7. CSS 盒模型，`box-sizing` 的作用

**标准盒模型 vs IE 盒模型**

- **标准盒模型**（`box-sizing: content-box`，默认）：`width/height` 只包含内容区，`padding` 和 `border` 会撑大元素实际占用空间

```
实际宽度 = width + padding-left + padding-right + border-left + border-right
```

- **IE 盒模型**（`box-sizing: border-box`）：`width/height` 包含内容 + padding + border，实际占用空间就是设置的 width

```
实际宽度 = width（内容 + padding + border 都算在内）
```

**`border-box` 更符合直觉**

```css
/* 想要一个宽 200px、有 20px padding 的盒子 */

/* content-box：要手动计算 200 - 40 = 160 */
.box { box-sizing: content-box; width: 160px; padding: 20px; }

/* border-box：直接写 200px，padding 包含在内 */
.box { box-sizing: border-box; width: 200px; padding: 20px; }
```

**为什么全局设 `border-box`**

1. 布局尺寸直观可控，写多少就是多少，不用心算加 padding/border
2. 避免百分比宽度被 padding/border 撑破——`width: 100%` + `padding` 在 `content-box` 下会溢出父容器
3. 多人协作时心智负担统一，减少排版计算错误

**`box-sizing: inherit` 的用途**

`box-sizing` 默认不继承，直接用 `* { box-sizing: border-box }` 会强制覆盖所有元素，无法局部还原。推荐写法：

```css
html {
  box-sizing: border-box;
}
*, *::before, *::after {
  box-sizing: inherit; /* 继承根元素，全局默认 border-box */
}

/* 局部需要 content-box 时，只改该元素，后代自动跟随 */
.third-party-widget {
  box-sizing: content-box;
}
```

这样实现"全局默认 border-box + 局部可覆盖"的弹性控制，适合引入第三方组件库的场景。

> content-box 是数学正确但反直觉的，border-box 是"你写多宽就多宽"的直觉模型。现代项目全局设置 border-box 是标配；搭配 `inherit` 可保留局部覆盖能力。

---

## 8. `display:none` / `visibility:hidden` / `opacity:0` 的区别

**三者对比**

| | `display: none` | `visibility: hidden` | `opacity: 0` |
|--|-----------------|----------------------|--------------|
| 占据空间 | 否 | 是 | 是 |
| 触发重排 | 是 | 否 | 否 |
| 子元素是否受影响 | 是，全部隐藏 | 子元素可设 `visible` 显示 | 是，全部透明 |
| 能否响应事件 | 否 | 否 | **是** |
| 是否可被读屏器读取 | 否 | 否 | 是 |
| 过渡动画 | 不支持 | 支持 | 支持 |

**关键区别细节**

- `opacity: 0` 元素仍可接收点击事件，这是常见的坑
- `visibility: hidden` 可以被子元素覆盖：父 `hidden`，子 `visible` 子元素会显示出来
- `display: none` 会触发重排，性能代价最高；`opacity` 只触发合成，性能最好

```css
/* visibility 可被子元素覆盖 */
.parent { visibility: hidden; }
.child { visibility: visible; } /* 子元素依然可见 */
```

> display:none 从文档流移除，visibility:hidden 占位隐藏不响应事件，opacity:0 占位透明但仍响应事件。三者性能代价从高到低：display > visibility > opacity。

---

## 9. `margin` 塌陷问题

**什么是 margin 塌陷**

相邻的两个块级元素，垂直方向的 margin 不会叠加，而是取较大值。分两种情况：

**情况一：相邻兄弟元素**

```css
.a { margin-bottom: 20px; }
.b { margin-top: 30px; }
/* 实际间距是 30px，不是 50px */
```

**情况二：父子元素（更隐蔽）**

父元素没有 border、padding 隔离时，子元素的 `margin-top` 会"穿透"到父元素外面：

```css
.parent { /* 没有 border 或 padding */ }
.child { margin-top: 30px; } /* 这个 margin 会作用在 parent 上，而不是 parent 内部 */
```

**解决方案**

| 方法 | 原理 |
|------|------|
| 给父元素加 `padding-top` | 创建隔离 |
| 给父元素加 `border-top` | 创建隔离 |
| 给父元素触发 BFC（`overflow: hidden`） | BFC 内外 margin 不折叠 |
| 给父元素加 `display: flow-root` | 触发 BFC，无副作用 |
| 兄弟间只用一侧 margin | 避免相邻 |

**只有垂直方向**

margin 塌陷只发生在垂直方向（block 流向），水平方向不存在这个问题。Flex/Grid 容器内也不存在 margin 塌陷。

> margin 塌陷只在普通流的垂直方向发生，Flex/Grid 容器内不存在。最根本的解决是触发 BFC 或用 padding 替代 margin。

---

## 10. `z-index` 层叠上下文，什么情况下失效

**层叠上下文（Stacking Context）**

层叠上下文是一个独立的"层"，内部元素的 z-index 只在这个上下文内比较，不跟外部的 z-index 比较。

**创建层叠上下文的条件**

- `position: relative/absolute/fixed/sticky` + `z-index` 非 `auto`
- `opacity` 小于 1
- `transform` 非 `none`
- `filter` 非 `none`
- `will-change` 指定了 opacity/transform 等
- `isolation: isolate`（专门用来创建层叠上下文）

**`z-index` 失效的常见场景**

```css
/* 场景一：没有设置 position */
.box {
  z-index: 999; /* 失效！没有 position，z-index 无效 */
}

/* 场景二：父元素创建了层叠上下文，子元素被限制在父层内 */
.parent { position: relative; z-index: 1; }
.child { z-index: 9999; } /* 再大也只在 parent 层内比较，出不了 parent 的层 */

/* 场景三：兄弟元素的 z-index 比较 */
/* A 的子元素 z-index 再高，也比不过 B（如果 B 的 z-index 比 A 高）*/
```

**层叠顺序（从低到高）**

```
背景和边框 → 负 z-index → 块级元素 → 浮动元素 → 行内元素 → z-index: 0/auto → 正 z-index
```

> z-index 生效的前提是元素有 position（非 static）。父元素创建了层叠上下文后，子元素的 z-index 只在父层内比较，这是最常见的 z-index "失效"原因。

---

## 11. 1px 问题在移动端如何解决

**问题原因**

移动端屏幕有设备像素比（DPR，Device Pixel Ratio）：DPR = 物理像素 / CSS 像素。iPhone Retina 屏 DPR = 2 或 3，CSS 写的 `1px` 实际渲染为 2px 或 3px 物理像素，视觉上比设计稿的 1px 粗。

**解决方案**

**方案一：`transform: scaleY(0.5)`（推荐）**

```css
.border-1px {
  position: relative;
}
.border-1px::after {
  content: '';
  position: absolute;
  left: 0; bottom: 0;
  width: 100%;
  height: 1px;
  background: #000;
  transform: scaleY(0.5);
  transform-origin: 0 0;
}
```

**方案二：viewport + rem 方案**

根据 DPR 设置 viewport 缩放，让 1 CSS px = 1 物理像素：

```html
<meta name="viewport" content="width=device-width, initial-scale=0.5">
```

DPR=2 时 initial-scale=0.5，整体缩放，1px 就是真实 1 物理像素，但影响全局布局。

**方案三：border-image / box-shadow**

```css
/* box-shadow 模拟 */
.border { box-shadow: 0 1px 0 0 #000; }
```

**方案四：媒体查询 + `min-device-pixel-ratio`**

```css
@media (-webkit-min-device-pixel-ratio: 2) {
  .border { border-width: 0.5px; }
}
```

**方案对比**

| 方案 | 优点 | 缺点 |
|------|------|------|
| transform scaleY | 兼容性好，可控 | 代码冗余 |
| viewport 缩放 | 全局生效 | 影响所有布局 |
| 0.5px | 简单 | iOS 支持，Android 兼容性差 |
| box-shadow | 简单 | 颜色不够精准 |

> 1px 问题本质是 CSS 像素和物理像素的映射问题。推荐 transform scaleY(0.5) + 伪元素，兼容性最好且不影响全局布局。

---

## 12. CSS 实现三角形

**原理**

元素宽高为 0，border 四个方向都有宽度时，border 呈现梯形/三角形。利用这个特性，让三个方向透明，一个方向有颜色，即可实现三角形。

**向上三角形**

```css
.triangle-up {
  width: 0;
  height: 0;
  border-left: 50px solid transparent;
  border-right: 50px solid transparent;
  border-bottom: 100px solid #f00; /* 底边有颜色，朝上 */
}
```

**向右三角形**

```css
.triangle-right {
  width: 0;
  height: 0;
  border-top: 50px solid transparent;
  border-bottom: 50px solid transparent;
  border-left: 100px solid #f00; /* 左边有颜色，朝右 */
}
```

**直角三角形**

```css
.triangle-corner {
  width: 0;
  height: 0;
  border-top: 100px solid #f00;
  border-right: 100px solid transparent;
}
```

**现代方案：clip-path**

```css
.triangle {
  width: 100px;
  height: 100px;
  background: #f00;
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}
```

`clip-path` 更直观，可以做任意多边形，但 IE 不支持。

> 三角形的原理是 border 在元素宽高为 0 时呈三角形拼合，让其他三边透明即可。现代项目可用 clip-path，更直观灵活。

---

## 13. Grid 和 Flex 的区别，各自适用场景

**核心区别**

- **Flex**：一维布局，处理一行或一列
- **Grid**：二维布局，同时处理行和列

**Flex 适用场景**

- 导航栏（水平排列，最后一项靠右）
- 等高卡片列表
- 居中对齐
- 一维的自适应布局

```css
/* 导航栏最后一项靠右 */
nav { display: flex; }
.last { margin-left: auto; }
```

**Grid 适用场景**

- 整体页面布局（header/sidebar/main/footer）
- 瀑布流/卡片网格
- 需要精确控制行列的复杂布局

```css
/* 经典三列布局 */
.layout {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
  min-height: 100vh;
}
```

**配合使用**

Grid 做整体布局，Flex 做局部对齐，是现代布局的最佳实践：

```css
.page { display: grid; grid-template-areas: "nav main"; } /* 整体 */
.nav { display: flex; align-items: center; }              /* 导航内部 */
```

> Flex 是一维的（行或列），Grid 是二维的（行和列）。页面整体框架用 Grid，组件内部对齐用 Flex，两者配合使用效果最好。

---

## 14. `transition` vs `animation` 的区别

**核心区别**

| | `transition` | `animation` |
|--|--------------|-------------|
| 触发方式 | 需要状态变化触发（hover、class 切换） | 自动播放，无需触发 |
| 关键帧 | 只有起始和结束两帧 | 可定义任意多个关键帧 |
| 循环 | 不能循环 | 可以循环（`infinite`） |
| 暂停/控制 | 不支持 | 支持（`animation-play-state`） |
| 方向 | 不支持反向 | 支持（`animation-direction`） |
| JS 控制 | 只能改触发条件 | 可用 JS 控制播放状态 |

**`transition` 语法**

```css
.box {
  transition: all 0.3s ease;
  /* property duration timing-function delay */
}
.box:hover {
  transform: scale(1.1);
}
```

**`animation` 语法**

```css
@keyframes slide-in {
  0%   { transform: translateX(-100%); opacity: 0; }
  60%  { transform: translateX(10%); }
  100% { transform: translateX(0); opacity: 1; }
}

.box {
  animation: slide-in 0.5s ease forwards;
  /* name duration timing-function fill-mode */
}
```

**使用场景**

- `transition`：hover 效果、状态切换（按钮、菜单展开）、简单的交互反馈
- `animation`：页面加载动画、循环 loading、复杂多阶段动画、自动播放的效果

**性能建议**

两者都优先使用 `transform` 和 `opacity`，这两个属性只触发合成层，不触发重排重绘，性能最好。

> transition 是状态变化的插值，animation 是关键帧序列。简单交互用 transition，复杂/自动/循环动画用 animation。两者都应优先操作 transform/opacity 保证性能。


---

## 15. 行内元素和块级元素分别有哪些，有何区别，怎样转换

**块级元素（display: block）**

独占一行，可设宽高、margin/padding 四个方向都生效。

`div`、`p`、`h1~h6`、`ul`/`ol`/`li`、`table`、`form`、`header`/`footer`/`section`/`article`、`pre`、`hr`

**行内元素（display: inline）**

不独占一行，宽高无效（设置不生效），垂直方向的 margin/padding 不生效（水平方向生效），宽度由内容撑开。

`span`、`a`、`em`、`strong`、`b`、`i`、`code`、`label`、`img`（特殊：行内但可设宽高）

**行内块元素（display: inline-block）**

兼具两者特点：不独占一行，但可设宽高、margin/padding 四个方向都生效。

`img`、`input`、`button`、`select`、`textarea`

**核心区别**

| 维度 | 块级 | 行内 | 行内块 |
|------|------|------|--------|
| 独占一行 | 是 | 否 | 否 |
| 设宽高 | ✅ | ❌（无效） | ✅ |
| 默认宽度 | 撑满父容器 | 内容宽度 | 内容宽度 |
| margin/padding | 四向生效 | 仅水平生效 | 四向生效 |
| 换行影响 | 不受影响 | 代码换行会产生空白间距 | 同行内 |

**行内元素的空白间距问题**

行内和行内块元素之间，HTML 源码的换行/空格会被解析成一个空白字符，导致元素间有间距。

```html
<!-- 有间距 -->
<span>A</span>
<span>B</span>

<!-- 解决：父元素设 font-size: 0 -->
<div style="font-size: 0">
  <span>A</span><span>B</span>
</div>
```

**如何转换**

通过 `display` 属性转换：

```css
span { display: block; }        /* 行内 → 块级，独占一行，可设宽高 */
div  { display: inline; }       /* 块级 → 行内，不独占一行，宽高无效 */
div  { display: inline-block; } /* 块级 → 行内块，不独占一行但可设宽高 */
```

**img 为什么特殊**

`img` 默认是 `inline`，但它属于**替换元素**（replaced element），内容由外部资源决定，所以可以设置宽高。类似的还有 `input`、`textarea`、`video`。替换元素虽然 display 是 inline，但表现上更像 inline-block。

> 块级独占一行可设宽高，行内不独占但宽高无效，行内块两者兼具。转换用 `display`，注意行内元素间的空白间距问题可用父元素 `font-size: 0` 解决。

---

## 16. `flex: 1`、`flex: auto`、`flex: none` 三者区别，以及 `flex: 1` 子项最小宽度问题

**展开值与行为**

- flex-grow属性定义项目的放大比例，默认为0，即如果存在剩余空间，也不放大。
- flex-shrink属性定义了项目的缩小比例，默认为1，即如果空间不足，该项目将缩小。
- flex-basis属性定义了在分配多余空间之前，项目占据的主轴空间。浏览器根据这个属性，计算主轴是否有多余空间。它的默认值为auto，即项目的本来大小。

| 写法 | 展开值 | 行为 |
|------|--------|------|
| `flex: 1` | `flex-grow: 1; flex-shrink: 1; flex-basis: 0%` | 初始尺寸为 0，忽略内容大小，严格按比例等分剩余空间 |
| `flex: auto` | `flex-grow: 1; flex-shrink: 1; flex-basis: auto` | 初始尺寸为内容大小，先占内容空间，再按比例分配剩余空间 |
| `flex: none` | `flex-grow: 0; flex-shrink: 0; flex-basis: auto` | 不放大、不缩小，尺寸固定为内容或显式设置的宽度 |

核心区别在于 `flex-basis`：

**它的初始值是 auto，此时浏览器会检查元素是否设置了 width 属性值。如果有，则使用 width 的值作为 flex-basis 的值；如果没有，则用元素内容自身的大小。如果 flex-basis 的值不是 auto，width 属性会被忽略。**

```
flex: 1    → basis: 0%   → 从 0 开始竞争，多个 flex:1 严格等宽
flex: auto → basis: auto → 先按内容占位，再分剩余，内容多的项最终更宽
flex: none → basis: auto → 完全不参与伸缩，内容多宽就多宽
```

**`flex: 1` 子项被压缩到小于最小内容宽度**

flex 子项的 `min-width` 默认值是 `auto`（等同于 `min-content`），这个默认值本身就**保护**了内容不被压缩。

真正让内容被过度压缩的原因，通常是手动设了 `min-width: 0` 或 `overflow: hidden`（隐式触发 `min-width: 0`）：

```css
/* 场景：想让长文本截断，加了 overflow: hidden，结果元素被压没了 */
.item {
  flex: 1;
  overflow: hidden;       /* 隐式 min-width: 0，可以压缩到 0 */
  white-space: nowrap;
  text-overflow: ellipsis;
}
```

规则：
- **不想让内容被过度压缩** → 不要设 `min-width: 0`，保留默认 `auto`
- **允许压缩到 0**（如文字截断场景）→ 显式加 `min-width: 0`
- **硬限最小宽度** → `min-width: 120px` 等具体值

> `flex: 1` 严格等分（basis:0%），`flex: auto` 内容优先再等分（basis:auto），`flex: none` 完全固定。子项被压烂通常是 `min-width: 0` 或 `overflow: hidden` 导致，不是 flex 本身的问题。

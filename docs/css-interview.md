# CSS 面试题整理

## 选择器与优先级

### CSS 选择器有哪些类型？优先级如何计算？

**选择器类型及权重**：

| 选择器 | 示例 | 权重 |
|---|---|---|
| 内联样式 | `style="..."` | 1000 |
| ID 选择器 | `#id` | 100 |
| 类选择器 | `.class` | 10 |
| 属性选择器 | `[type="text"]` | 10 |
| 伪类选择器 | `:hover` | 10 |
| 标签选择器 | `div` | 1 |
| 伪元素选择器 | `::before` | 1 |
| 通配符 / 关系选择器 | `*`、`>`、`+` | 0 |

**注意事项**：
- `!important` 优先级最高，超越所有选择器
- 优先级相同时，后定义的样式覆盖先定义的
- 继承来的样式优先级最低
- 样式来源优先级：内联样式 > 内部样式 > 外部样式 > 浏览器默认样式

**计算示例**：`div.box#header p` = 1(div) + 10(.box) + 100(#header) + 1(p) = 112

### 哪些 CSS 属性可以被继承？

**可继承属性**（父元素设置后，子元素自动继承）：
- 字体类：`font-family`、`font-size`、`font-weight`、`font-style`
- 文本类：`color`、`text-align`、`line-height`、`letter-spacing`
- 可见性：`visibility`
- 列表类：`list-style`

**不可继承属性**（每个元素需要单独设置）：
- 盒模型：`width`、`height`、`margin`、`padding`、`border`
- 定位：`position`、`top`、`left`、`z-index`
- 背景：`background`、`background-color`、`background-image`
- 浮动：`float`、`clear`
- 文本修饰：`text-decoration`

---

## 盒模型

### 标准盒模型和 IE 盒模型有什么区别？

盒模型由四部分组成：margin（外边距）、border（边框）、padding（内边距）、content（内容）。

**区别在于 width/height 的计算范围**：

```
标准盒模型 (content-box)：            IE 盒模型 (border-box)：
┌──────── margin ────────┐           ┌──────── margin ────────┐
│ ┌────── border ──────┐ │           │ ┌─ border+pad+content ─┐│
│ │ ┌─── padding ───┐  │ │           │ │  ┌─── padding ───┐   ││
│ │ │    content    │  │ │           │ │  │    content    │   ││
│ │ │ ← width/ht  → │  │ │           │ │  └───────────────┘   ││
│ │ └───────────────┘  │ │           │ └─────────────────────┘ │
│ └────────────────────┘ │           │    ← width/height →     │
└────────────────────────┘           └────────────────────────┘
width = content 区域                  width = border + padding + content
```

- **标准盒模型**（`box-sizing: content-box`，默认值）：设置 `width: 200px` 后，加上 padding 和 border，实际占据宽度会超出 200px
- **IE 盒模型**（`box-sizing: border-box`）：设置 `width: 200px` 就真的占 200px，padding 和 border 从里面扣

实际开发中更推荐全局用 `border-box`，直观不易出错：

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

**读取元素尺寸的 API**：
- `offsetWidth/offsetHeight`：border + padding + content
- `clientWidth/clientHeight`：padding + content（不含 border）
- `scrollWidth/scrollHeight`：padding + 实际内容（含溢出的隐藏部分）

追问：`scrollWidth` 和 `offsetWidth` 在有溢出内容时的差异——`offsetWidth` 是元素盒子的视觉宽度，`scrollWidth` 包含超出滚动的内容，`scrollWidth >= offsetWidth`。

---

## 居中布局

### 元素水平垂直居中有哪些方案？

**已知宽高 — absolute + 负 margin**：

```css
.parent { position: relative; }
.child {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -50px;  /* 自身高度的一半 */
  margin-left: -50px; /* 自身宽度的一半 */
}
```

**已知宽高 — absolute + margin auto**：

```css
.child {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  margin: auto;
}
```

**不需要知道宽高 — absolute + transform（推荐）**：

```css
.child {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```

**Flexbox（最常用）**：

```css
.parent {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

**Grid**：

```css
.parent {
  display: grid;
  place-items: center; /* justify-items + align-items 的缩写 */
}
```

**table-cell（兼容旧浏览器）**：

```css
.parent {
  display: table-cell;
  text-align: center;
  vertical-align: middle;
}
```

**纯文本垂直居中**：设置 `line-height` 等于 `height` 值。

---

## BFC

### 什么是 BFC？如何触发？有什么用？

BFC（Block Formatting Context，块级格式化上下文）是一个**独立的布局区域**，内部元素的布局不会影响外部，外部也不影响内部。

可以把它理解为一个"结界"——里面的规则和外面隔离开来。

**如何触发 BFC**：
- 根元素 `<html>` 天然是 BFC
- `float` 不为 `none`
- `position` 为 `absolute` 或 `fixed`
- `display` 为 `inline-block`、`flex`、`grid`、`table-cell`
- `overflow` 为 `hidden`、`auto`、`scroll`（非 visible）

**BFC 能解决的问题**：

1. **解决 margin 重叠**：两个 BFC 之间的 margin 不会合并，把其中一个元素包在新的 BFC 里即可

2. **清除浮动 / 解决高度塌陷**：父元素触发 BFC 后，会计算内部浮动子元素的高度

```css
/* 常用方式 */
.parent { overflow: hidden; }
```

3. **自适应两栏布局**：BFC 区域不会与浮动元素重叠

```css
.left { float: left; width: 200px; }
.right { overflow: hidden; } /* 触发 BFC，不会与左侧浮动元素重叠 */
```

**格式化上下文分类**（了解）：
- BFC：块级格式化上下文
- IFC：行内格式化上下文
- GFC：网格布局格式化上下文（display: grid）
- FFC：弹性格式化上下文（display: flex）

---

## 浮动

### 为什么需要清除浮动？有哪些方式？

**浮动的问题**：浮动元素脱离文档流，父元素无法感知浮动子元素的高度，导致**高度塌陷**（父元素高度变为 0），影响后续布局。

浮动还有文字环绕的特性，这是浮动最初的设计意图。

**清除浮动的方式**：

1. **伪元素清除（推荐）**：

```css
.clearfix::after {
  content: '';
  display: block;
  clear: both;
}
```

2. **触发父元素 BFC**：

```css
.parent { overflow: hidden; }  /* 最常用 */
```

3. **父元素设置固定高度**：不推荐，不灵活

4. **在浮动元素后添加空 div**：不推荐，增加无意义 HTML 标签

**`clear` 属性的原理**：

`clear: both` 不是真的"清除"了浮动，而是让元素的盒边不与前面的浮动元素相邻，从而触发换行。实际上 `clear: left` 和 `clear: right` 效果与 `clear: both` 等同，实际只用 `clear: both`。

注意：`absolute` 和 `float` 不能共用，同时设置时 `float` 失效。

### 什么是 margin 重叠（塌陷）？如何解决？

相邻的**块级元素**在垂直方向上的 margin 会合并，取较大值而不是相加。只在**垂直方向**发生，浮动和绝对定位元素不参与。

**合并规则**：
- 两正取最大值
- 一正一负：正值 - 负值的绝对值
- 两负取绝对值最大的负值

**场景与解决方案**：

**兄弟元素 margin 重叠**（上元素 margin-bottom 与下元素 margin-top 合并）：
- 把其中一个元素设为 `display: inline-block`
- 把其中一个元素设为 `float`
- 把其中一个元素设为 `position: absolute/fixed`

**父子元素 margin 重叠**（子元素 margin-top 跑到父元素外面）：
- 父元素加 `overflow: hidden`（触发 BFC）
- 父元素加 `border: 1px solid transparent`
- 父元素加 `padding-top: 1px`
- 子元素改为 `display: inline-block`

### 元素的层叠顺序是怎样的？什么是层叠上下文？

#### 层叠顺序（同一层叠上下文内，从低到高）

1. 背景和边框（当前层叠上下文的）
2. 负 `z-index` 的定位元素
3. 块级盒（非定位的块级元素）
4. 浮动盒（非定位的浮动元素）
5. 行内盒（非定位的行内元素）
6. `z-index: 0` / `z-index: auto` 的定位元素
7. 正 `z-index` 的定位元素（值越大越靠上）

#### 层叠上下文（Stacking Context）——理解 z-index 失效的关键

**层叠上下文**是一个独立的渲染层，内部的层叠顺序与外部完全隔离，只在同一层叠上下文内比较 `z-index`。

**触发层叠上下文的条件**：
- `position` 不为 `static` 且 `z-index` 不为 `auto`
- `opacity` 小于 1
- `transform`、`filter`、`perspective` 不为 `none`
- `will-change` 指定了上述属性
- `isolation: isolate`（专门用于隔离层叠）
- `display: flex/grid` 的直接子元素且 `z-index` 不为 `auto`

**z-index 失效的经典案例**：

```
html（根层叠上下文）
 ├── div A（z-index: 1，触发新层叠上下文）
 │    └── child（z-index: 9999）← 只在 A 内部排序，无法超出 A 的范围
 └── div B（z-index: 2）← B 整体盖住 A，child 再大也没用
```

```html
<!-- A 和 B 是兄弟元素 -->
<div class="A">  <!-- z-index:1, opacity:0.99 触发层叠上下文 -->
  <div class="child">我是 child，z-index:9999</div>
</div>
<div class="B">  <!-- z-index:2 -->我会盖住 child</div>
```

```css
.A    { position: relative; z-index: 1; opacity: 0.99; } /* opacity 触发层叠上下文 */
.child{ position: relative; z-index: 9999; }             /* 看起来很高，但被 A 限制住了 */
.B    { position: relative; z-index: 2; }                /* z-index:2 > A 的 z-index:1，所以 B 整体盖住 A */
```

**为什么 `transform` 会让 `fixed` 定位失效？**

`position: fixed` 通常相对视口定位，但如果祖先元素触发了层叠上下文（特别是有 `transform`），该 `fixed` 子元素的包含块会变成这个祖先元素而非视口，导致 fixed 行为异常。这是实际开发中的高频 bug。

**`isolation: isolate` 的作用**：创建一个新的层叠上下文，但不改变视觉效果，专门用于隔离混合模式（`mix-blend-mode`）或防止 `z-index` 意外穿透：

```css
.modal-wrapper {
  isolation: isolate; /* 保证内部 z-index 不与外部竞争 */
}
```

---

## 定位

### position 有哪些值？各有什么区别？

| 值 | 是否脱离文档流 | 参照基准 | 说明 |
|---|---|---|---|
| `static` | 否 | — | 默认值，正常文档流，忽略 top/left/z-index |
| `relative` | 否 | 自身原始位置 | 不影响其他元素布局，常用作 absolute 的参照容器 |
| `absolute` | 是 | 最近的非 static 祖先 | 找不到则相对 body；常用于弹出层、徽标 |
| `fixed` | 是 | 浏览器视口 | 滚动页面不移动；常用于导航栏、回顶部按钮 |
| `sticky` | 否 | 滚动容器 | `relative` 和 `fixed` 的混合体，必须设置 top/left/bottom/right 才生效 |
| `inherit` | — | 继承父元素 | — |

**absolute 的参照元素查找规则**：向上递归查找所有祖先，找到第一个 `position` 不为 `static` 的元素；如果没找到，则相对于 `body`。

### absolute 和 fixed 有什么共同点和不同点？

**共同点**：
- 都脱离文档流，不占据原位置
- 都让行内元素变成 block
- 都会遮盖下方的非定位元素

**不同点**：
- `absolute` 的参照元素可以设定（最近非 static 祖先），随页面滚动移动
- `fixed` 始终参照浏览器视口，页面滚动时位置不变

### 粘性布局（sticky）怎么用？

`position: sticky` 是 `relative` 和 `fixed` 的结合体：元素在到达设定阈值前表现为 `relative`，越过阈值后表现为 `fixed`。

```css
.header {
  position: sticky;
  top: 0; /* 必须设置，否则不生效 */
  z-index: 100;
}
```

**特点**：
- 不脱离文档流，仍占据原有空间
- 相对于最近的**可滚动祖先**定位，而非视口
- 必须设置 `top`、`right`、`bottom`、`left` 其中之一才生效

**适用场景**：顶部导航栏、表格表头吸顶、侧边目录跟随滚动。

**sticky 失效的常见原因**（面试高频坑）：

1. **父元素有 `overflow: hidden/auto/scroll`**：sticky 的滚动容器是最近的可滚动祖先，`overflow: hidden` 会让父元素成为滚动容器，但又没有实际滚动，sticky 元素永远触达不了阈值，等于失效。

```css
/* 错误：父元素有 overflow: hidden，sticky 子元素会失效 */
.parent { overflow: hidden; }
.child  { position: sticky; top: 0; }
```

2. **父元素高度等于或小于子元素高度**：sticky 需要"滚动空间"，父容器高度等于子元素时没有滚动，自然不会固定。

3. **未设置 `top` / `left` / `bottom` / `right`**：这是必要条件，没有就等于 `position: relative`。

4. **滚动容器不是 `window` 而是某个中间层**：`position: sticky` 相对于最近的可滚动祖先（有 `overflow` 且可滚动的元素），不是相对于 viewport。如果页面滚动容器不是 body 而是某个中间 div，需要把 sticky 元素放在那个 div 内。

**如何排查 sticky 失效**：打开 DevTools，逐级检查父元素是否有 `overflow: hidden/auto/scroll`，这几乎是最常见的原因。

### display、float、position 三者之间的关系是什么？

优先级机制（从高到低）：

1. `display: none`：直接隐藏，position 和 float 均无效
2. `position: absolute/fixed`：float 失效，display 自动调整为 block 或 table
3. `float` 不为 none：display 自动变为 block
4. 以上都不满足：display 按设置值生效

简记：**absolute/fixed > float > display**

---

## 响应式布局

### 响应式布局有哪些实现方案？

响应式布局的核心是让页面根据设备尺寸自动适配。

1. **媒体查询（Media Queries）**：针对不同屏幕宽度区间写不同样式

```css
@media screen and (max-width: 768px) {
  .item { flex-basis: 50%; }
}
@media screen and (max-width: 480px) {
  .item { flex-basis: 100%; }
}
```

2. **百分比布局**：宽度用百分比，相对父元素计算。灵活但精确度低，适合外层容器。

3. **rem + 媒体查询**：rem 相对根元素 `font-size` 计算，通过修改根字体大小实现整体缩放。PC 端常用。

4. **rem + flexible.js**：JS 动态计算根字体大小，移动端适配方案。

5. **vw / vh**：视口宽度/高度的百分比，`1vw = 视口宽度的 1%`，无需 JS 介入。

### rem 实现移动端适配的原理是什么？

rem 的核心思想：**把屏幕划分成相同的份数，让同一元素在不同屏幕上占据相同比例的空间**。

原理：
- `1rem` = `html` 的 `font-size` 值
- 以 750px 设计稿为例，分成 10 份，则 `1rem = 75px`
- 一个 150px 宽的元素 = `2rem`
- 在 375px 屏幕上：`html font-size = 375/10 = 37.5px`，该元素宽度 = `2 × 37.5 = 75px`，恰好是屏幕宽度的 20%——和设计稿比例一致

```javascript
// 动态设置根字体大小
document.documentElement.style.fontSize = document.body.clientWidth / 10 + 'px'
```

---

## 布局进阶

### Flexbox 布局怎么用？常见属性有哪些？

**主轴与交叉轴示意**：

```
flex-direction: row（默认）：
┌─────────────────────────────────────┐
│  →→→  主轴 (main axis)  →→→         │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │  1   │ │  2   │ │  3   │  ↓交叉轴│
│  └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────┘

flex-direction: column：
┌─────────────────┐
│  ↓ 主轴 (column)│
│  ┌───────────┐  │
│  │     1     │  │
│  └───────────┘  │
│  ┌───────────┐  │
│  │     2     │  → 交叉轴
│  └───────────┘  │
└─────────────────┘
```

**容器属性**：

```css
.container {
  display: flex;
  flex-direction: row;          /* 主轴方向：row | row-reverse | column | column-reverse */
  justify-content: center;      /* 主轴对齐：flex-start | center | flex-end | space-between | space-around | space-evenly */
  align-items: center;          /* 交叉轴单行对齐：flex-start | center | flex-end | stretch | baseline */
  align-content: center;        /* 交叉轴多行对齐（flex-wrap 时生效） */
  flex-wrap: wrap;              /* 换行：nowrap | wrap | wrap-reverse */
  gap: 16px;                    /* 子项间距（row-gap column-gap 分开控制） */
}
```

`align-items` vs `align-content`：前者控制**单行**内子项的交叉轴对齐；后者只在**多行**（flex-wrap: wrap）时生效，控制行与行之间的分布。

**子项属性**：

```css
.item {
  flex: 1;              /* flex-grow flex-shrink flex-basis 的缩写，等于 flex: 1 1 0 */
  flex-grow: 1;         /* 放大比例，默认 0（不放大） */
  flex-shrink: 1;       /* 缩小比例，默认 1（会缩小） */
  flex-basis: 200px;    /* 初始主轴尺寸，优先级高于 width */
  align-self: flex-end; /* 覆盖容器的 align-items，单独控制此项 */
  order: 2;             /* 排列顺序，越小越靠前，默认 0 */
}
```

### `flex-basis` 是什么？和 `width` 有什么区别？

`flex-basis` 设置 flex 子项在**主轴方向上的初始大小**，在放大/缩小分配空间前的基准值。

优先级链：`flex-basis` > `width` > `content size`（内容自然宽度）

关键区别：
- `flex-basis` 优先级高于 `width`（当主轴为水平方向时）
- `flex-basis: auto` = 使用元素的 `width`；`flex-basis: 0` = 从 0 开始按比例分配

**`flex: 1` 等于什么？**

```css
flex: 1;
/* 等价于 */
flex-grow: 1;
flex-shrink: 1;
flex-basis: 0;   /* ← 注意是 0，不是 auto！*/
```

`flex-basis: 0` 意味着子项从 0 开始分配剩余空间，所有 `flex: 1` 的子项完全等宽。  
如果写 `flex-grow: 1` 而不写 `flex-basis`，`flex-basis` 默认是 `auto`，子项会先按内容撑开，再分配剩余空间，结果宽度未必相等。

**`min-width` 对 flex 收缩的限制**：`flex-shrink` 不会让子项小于其 `min-content` 宽度（即最长不可换行内容的宽度）。这是常见布局 bug 的来源——明明设了 `flex: 1`，某个子项却不收缩，原因往往是其内容（如一段长 URL）设置了隐式 `min-width`。

```css
/* 修复：显式设置 min-width */
.item { flex: 1; min-width: 0; }
```

### `space-between` 和 `space-around` 有什么区别？

- `space-between`：两端没有间距，子项之间均分间距
- `space-around`：每个子项两侧各有相等间距（所以两端的间距是中间间距的一半）
- `space-evenly`：所有间距完全相等，包括两端

### Grid 布局怎么用？和 Flex 有什么区别？

**一句话区别**：Flex 是**一维布局**（主轴方向排列），Grid 是**二维布局**（同时控制行和列）。

```
Flex：一次只能控制一个方向
┌──────────────────────────────┐
│ [item1] [item2] [item3]      │  ← 沿主轴排列
└──────────────────────────────┘

Grid：同时控制行列，像表格但更强
┌──────────┬──────────┬────────┐
│  item1   │  item2   │ item3  │
├──────────┼──────────┼────────┤
│  item4   │  item5   │ item6  │
└──────────┴──────────┴────────┘
```

**容器属性**：

```css
.container {
  display: grid;

  /* 列定义：3列，各占1份 */
  grid-template-columns: 1fr 1fr 1fr;
  /* 等价简写 */
  grid-template-columns: repeat(3, 1fr);

  /* 固定 + 自适应 + 固定（圣杯布局一行搞定） */
  grid-template-columns: 200px 1fr 200px;

  /* 行定义 */
  grid-template-rows: 60px 1fr 40px;

  /* 间距 */
  gap: 16px;
  /* 或分别设置 */
  row-gap: 16px;
  column-gap: 8px;

  /* 子项对齐 */
  justify-items: center;   /* 水平对齐 */
  align-items: center;     /* 垂直对齐 */
}
```

**子项属性（跨行列）**：

```css
.item {
  /* 从第1列线到第3列线（占2列） */
  grid-column: 1 / 3;
  /* 等价简写 */
  grid-column: span 2;

  /* 占2行 */
  grid-row: span 2;
}
```

**常用布局模板**：

```css
/* 经典页面布局：header + sidebar + main + footer */
.layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 60px 1fr 40px;
  grid-template-areas:
    "header  header"
    "sidebar main"
    "footer  footer";
  height: 100vh;
}
.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.footer  { grid-area: footer; }
```

```
视觉效果：
┌─────────────────────────────┐
│           header            │
├──────────┬──────────────────┤
│          │                  │
│ sidebar  │      main        │
│          │                  │
├──────────┴──────────────────┤
│           footer            │
└─────────────────────────────┘
```

**响应式卡片网格（最实用）**：

```css
.cards {
  display: grid;
  /* 每列最小 200px，最多 1fr；自动算列数，不需要媒体查询 */
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
```

`auto-fill` 尽量多放列；`auto-fit` 让已有列拉伸填满容器。

**何时用 Flex，何时用 Grid**：
- 导航栏、按钮组、单行/单列的间距排列 → **Flex**
- 整体页面骨架、卡片网格、需要行列对齐的表格式布局 → **Grid**
- 两者可以嵌套：Grid 做页面骨架，Flex 做组件内排列

### 两栏布局（左固定右自适应）如何实现？

**方案一：Flex（推荐）**

```css
.wrap { display: flex; }
.left { width: 200px; flex-shrink: 0; }
.right { flex: 1; }
```

**方案二：Grid**

```css
.wrap { display: grid; grid-template-columns: 200px 1fr; }
```

**方案三：float + margin**

```css
.left { float: left; width: 200px; }
.right { margin-left: 200px; }
```

### 三栏布局（圣杯 / 双飞翼）如何实现？

**共同点**：都用 float，中间栏在 HTML 最前面优先加载。

**Flex 方案（最简单）**：

```css
.wrap { display: flex; }
.left { width: 200px; }
.center { flex: 1; }
.right { width: 200px; }
```

**圣杯布局**（float + margin 负值 + relative）：

HTML 顺序：center → left → right

```css
.wrap { padding: 0 200px; }

.center { float: left; width: 100%; }

.left {
  float: left;
  width: 200px;
  margin-left: -100%;       /* 跑到 center 同行最左侧 */
  position: relative;
  right: 200px;             /* 再移出 padding 区域 */
}

.right {
  float: left;
  width: 200px;
  margin-left: -200px;      /* 跑到 center 同行最右侧 */
  position: relative;
  left: 200px;
}
```

**双飞翼布局**（float + margin 负值，不需要 relative）：

HTML：container（内含 center）→ left → right

```css
.container { float: left; width: 100%; }
.center { margin: 0 200px; }  /* 用 margin 留出两侧空间 */

.left { float: left; width: 200px; margin-left: -100%; }
.right { float: left; width: 200px; margin-left: -200px; }
```

**区别**：圣杯用父容器 padding 留空间，需要 relative 微调；双飞翼用中间栏的 margin 留空间，更简洁，无需 relative。

---

## CSS3 新特性

### CSS3 新增了哪些内容？

- **新选择器**：`:nth-child(n)`、`:last-child`、`:not()`、`[attr^=value]` 等
- **边框**：`border-radius`（圆角）、`box-shadow`（阴影）、多边框
- **背景**：多背景图、`background-size`、`background-origin`、`background-clip`
- **颜色**：`rgba`、`hsla`、`opacity`
- **文字**：`text-shadow`、`text-overflow`、`word-wrap`
- **过渡与动画**：`transition`、`animation` + `@keyframes`
- **变换**：`transform`（平移、旋转、缩放、倾斜）
- **媒体查询**：`@media`
- **Flex / Grid 布局**
- **自定义属性（CSS 变量）**：`--color: red; color: var(--color)`

### CSS 中 `transition` 和 `animation` 有什么区别？

**transition（过渡）**：在两个状态之间平滑切换，需要触发条件（如 hover）。

```css
div {
  transition: width 0.3s ease-in-out;
}
div:hover { width: 300px; }
```

属性：`transition-property`、`transition-duration`、`transition-timing-function`（linear/ease/ease-in/ease-out）、`transition-delay`

**animation（动画）**：通过关键帧自定义多状态动画，可以自动播放、循环。

```css
@keyframes slide-in {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(0); }
}

.box {
  animation: slide-in 1s ease-in-out infinite alternate;
}
```

属性：`animation-name`、`animation-duration`、`animation-timing-function`、`animation-delay`、`animation-iteration-count`（次数，`infinite` 无限）、`animation-direction`（正向/反向/交替）、`animation-fill-mode`（动画结束保持最终帧：`forwards`）、`animation-play-state`（running/paused）

**核心区别**：transition 是触发式的状态切换，animation 是声明式的自动播放动画。

---

## 视觉效果

### 伪类和伪元素有什么区别？

**伪类**（单冒号 `:`）：选择元素的**特定状态**，是真实文档中已存在元素的状态变化。

常见伪类：`:hover`、`:active`、`:focus`、`:visited`、`:nth-child(n)`、`:first-child`、`:last-child`、`:not()`、`:checked`、`:disabled`

**伪元素**（双冒号 `::`）：在元素的特定位置**插入虚拟元素**，不是真实存在于文档中的元素。

常见伪元素：`::before`、`::after`、`::first-line`、`::first-letter`、`::placeholder`

**一句话区别**：伪类是"状态选择器"，伪元素是"虚拟元素生成器"。

### `display: none`、`visibility: hidden`、`opacity: 0` 有什么区别？

| 特性 | `display: none` | `visibility: hidden` | `opacity: 0` |
|---|---|---|---|
| 是否占据空间 | 否（从渲染树移除） | 是 | 是 |
| 子元素是否可见 | 否 | 子元素可设为 visible 单独显示 | 否 |
| 是否触发事件 | 否 | 否 | 是（仍可点击） |
| 是否支持 transition | 否 | 是 | 是 |
| 读屏软件 | 不可读 | 不可读 | 可读 |
| 性能 | 触发重排 | 触发重绘 | GPU 合成层，性能最好 |

**记忆口诀**：`display: none` 完全消失不占位；`visibility: hidden` 隐身还占位；`opacity: 0` 透明但能点击。

另外 `transition` 不支持 `display: none`，做淡入淡出动画要用 `opacity` 或 `visibility`。

### 多行文本溢出如何处理？

**单行溢出**：

```css
.text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**多行溢出（WebKit 私有属性，兼容性好）**：

```css
.text {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3; /* 显示行数 */
  /* 可选：防止超出容器 */
  max-height: calc(1.5em * 3);
  line-height: 1.5;
}
```

**兼容方案（伪元素模拟省略号）**：

```css
.text {
  position: relative;
  max-height: 40px;  /* line-height * 行数 */
  line-height: 20px;
  overflow: hidden;
}
.text::after {
  content: '...';
  position: absolute;
  bottom: 0;
  right: 0;
  padding-left: 40px;
  background: linear-gradient(to right, transparent, #fff 55%);
}
```

### 为什么用 `transform` 做位移而不用 `top/left`？

`transform` 的变换在合成层（Composite Layer）上完成，由 GPU 处理，**不触发 layout（重排）和 paint（重绘）**，只触发 composite（合成），性能更好。

`top/left` 的变化会触发 **重排（Reflow）**，浏览器需要重新计算所有受影响元素的位置，代价高。

触发 GPU 加速的属性：`transform`、`opacity`、`filter`、`will-change`。

```css
/* 推荐：GPU 加速，不触发重排 */
.box { transform: translate(100px, 0); }

/* 避免：触发重排，性能差 */
.box { left: 100px; }
```

### CSS 动画了解 GPU 加速吗？

GPU 是为图形处理设计的，拥有数千个并行处理核心，专门处理图形数据，比 CPU 处理同样的图形任务快得多。

使用 GPU 加速的方式：将元素提升为**合成层**（Compositing Layer）。

触发合成层的属性：
- `transform: translate3d(0,0,0)` 或 `translateZ(0)`（最常用）
- `opacity`（动画时）
- `will-change: transform`
- `filter`

提升为合成层的优点：
- 位图由 GPU 处理，速度更快
- repaint 只影响本层，不影响其他层
- transform 和 opacity 动画不触发 layout 和 paint

注意：合成层过多会消耗大量显存，不要滥用。

---

## 布局技巧

### 如何用 CSS 实现三角形？

原理：宽高为 0，利用 border 的梯形特性，让某三条 border 透明。

```css
/* 向上的三角形 */
.triangle {
  width: 0;
  height: 0;
  border-left: 50px solid transparent;
  border-right: 50px solid transparent;
  border-bottom: 100px solid red;
}

/* 向右的三角形 */
.triangle-right {
  width: 0;
  height: 0;
  border-top: 50px solid transparent;
  border-bottom: 50px solid transparent;
  border-left: 100px solid red;
}
```

### 如何实现自适应正方形？

利用 `padding-top/padding-bottom` 的百分比是相对父元素**宽度**计算的特性：

```css
.square {
  width: 50%;
  padding-top: 50%; /* 等于宽度，因此高度 = 宽度 */
  position: relative;
}
.square-content {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
}
```

或使用 `aspect-ratio`（现代浏览器）：

```css
.square {
  width: 50%;
  aspect-ratio: 1 / 1;
}
```

### 如何用 CSS 画扇形？

利用 `border-radius` 和 `overflow: hidden`：

```css
.sector {
  width: 100px;
  height: 100px;
  background: red;
  border-radius: 100px 0 0 0; /* 只保留左上角的圆弧 */
}
```

或用 `clip-path`：

```css
.sector {
  width: 100px;
  height: 100px;
  background: red;
  clip-path: polygon(0 0, 100% 0, 100% 100%);
}
```

### 如何显示小于 10px 的文字？

新版 Chrome 已支持任意像素的字体，直接设置即可。对于老版浏览器：

```css
/* 方案一：zoom 缩放（IE 友好，但影响布局） */
.small { font-size: 20px; zoom: 0.5; }

/* 方案二：transform scale（不影响布局占位，但需处理位移） */
.small {
  font-size: 20px;
  transform: scale(0.5);
  transform-origin: left center;
}
```

### `link` 和 `@import` 有什么区别？

| 特性 | `<link>` | `@import` |
|---|---|---|
| 属于 | HTML 标签 | CSS 语法 |
| 加载时机 | 页面加载时**并行**下载 CSS | 等 CSS 文件加载完才下载导入的 CSS |
| 性能 | 较好，不阻塞 DOM 解析 | 较差，存在级联延迟 |
| JS 控制 | 可以动态增删 link 标签 | 无法通过 JS 操作 |
| 兼容性 | 全浏览器支持 | IE5+ 支持 |

结论：**优先用 `<link>`**，避免 `@import`，尤其在生产环境中 `@import` 会导致加载串行。

### 标签之间的空白间隙如何消除？

行内元素（`inline`、`inline-block`）之间会有空白，原因是 HTML 中换行和空格被解析为一个空格字符。

解决方案：

```css
/* 方案一：父元素 font-size 设为 0，子元素再单独设置 */
.parent { font-size: 0; }
.child { font-size: 16px; }

/* 方案二：改用 flex 布局（推荐） */
.parent { display: flex; }

/* 方案三：HTML 中不换行（影响可读性，不推荐） */
```

### img 标签底部空白缝隙如何解决？

原因：`img` 是行内元素，默认基线（baseline）对齐，底部会留出字母下行区域（如 g、y 的尾巴）。

解决方案：

```css
img { display: block; }          /* 转为块级元素 */
img { vertical-align: bottom; }  /* 改变对齐基准 */
img { vertical-align: middle; }
img { vertical-align: top; }
```

### Vue 中的样式穿透（`>>>` / `/deep/` / `:deep()`）是什么？

都是 Vue 中 Scoped CSS 的**深度选择器**，用于穿透组件边界修改子组件或 UI 库的样式，而不影响全局。

- `>>>`：仅适用于纯 CSS，在 Sass/Less 中无法识别
- `/deep/`：Vue 2 时代的方案，Vue 3 中可能报警告
- `:deep(.class)`：Vue 3 推荐写法
- `::v-deep`：已废弃

```css
/* Vue 3 推荐 */
:deep(.el-input__inner) {
  border-color: red;
}

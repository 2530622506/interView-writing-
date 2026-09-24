/**
 * push(x): 将元素 x 压入栈顶
pop(): 弹出并返回栈顶元素
top(): 返回栈顶元素
empty(): 检查栈是否为空
 */

// 一个队列实现栈(FOFI)
var MyStack = function () {
  this.queue = []
}

/**
 * @param {number} x
 * @return {void}
 */
MyStack.prototype.push = function (x) {
  // 1. 新元素先入队（此时它在队尾）
  this.queue.push(x)
  // 2. 关键步骤：把新元素前面的所有老元素，依次从队头取出，重新放回队尾
  // 这样，新元素就被“顶”到了队头，模拟了栈顶
  let size = this.queue.length
  for (let i = 0; i < size - 1; i++) {
    this.queue.push(this.queue.shift())
  }
}

/**
 * @return {number}
 */
MyStack.prototype.pop = function () {
  // 队头就是栈顶，直接出队
  return this.queue.shift()
}

/**
 * @return {number}
 */
MyStack.prototype.top = function () {
  // 队头就是栈顶，直接读取
  return this.queue[0]
}

/**
 * @return {boolean}
 */
MyStack.prototype.empty = function () {
  return this.queue.length === 0
}

// 示例用法
const stack = new Stack()

stack.push(1)
stack.push(2)
console.log(stack.top())
console.log(stack.pop()) // 返回 2
// 返回 False
console.log(stack.empty())

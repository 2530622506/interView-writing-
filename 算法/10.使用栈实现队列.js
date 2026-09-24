// push(x) -- 元素 x 入栈
// pop() -- 移除栈顶元素
// top() -- 获取栈顶元素
// empty() -- 返回栈是否为空

// 使用两个数组的栈方法（push, pop） 实现队列
/**
 * Initialize your data structure here.
 */
var MyQueue = function () {
  this.stackIn = [] // 输入栈
  this.stackOut = [] // 输出栈
}

/**
 * Push element x to the back of queue.
 * @param {number} x
 * @return {void}
 */
MyQueue.prototype.push = function (x) {
  this.stackIn.push(x)
}

/**
 * Removes the element from in front of queue and returns that element.
 * @return {number}
 */
MyQueue.prototype.pop = function () {
  // 队列：先进先出，栈：后进先出
  if (this.stackOut.length == 0) {
    while (this.stackIn.length > 0) {
      this.stackOut.push(this.stackIn.pop())
    }
  }
  return this.stackOut.pop()
}

/**
 * Get the front element.
 * @return {number}
 */

// 查询栈顶元素的值，所以先将其弹出，然后压回去
MyQueue.prototype.peek = function () {
  const x = this.pop()
  this.stackOut.push(x)
  return x
}

/**
 * Returns whether the queue is empty.
 * @return {boolean}
 */
MyQueue.prototype.empty = function () {
  return !this.stackIn.length && !this.stackOut.length
}

// 初始化队列
var queue = new MyQueue()

// 添加元素到队列
queue.push(1)
queue.push(2)
queue.push(3)

// 获取队列头部元素
console.log(queue.peek()) // 输出: 1

// 删除队列头部元素
console.log(queue.pop()) // 输出: 1

// 再次获取队列头部元素
console.log(queue.peek()) // 输出: 2

// 判断队列是否为空
console.log(queue.empty()) // 输出: false

// 继续删除队列头部元素
console.log(queue.pop()) // 输出: 2
console.log(queue.pop()) // 输出: 3

// 判断队列是否为空
console.log(queue.empty()) // 输出: true

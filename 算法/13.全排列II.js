/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var permuteUnique = function (nums) {
  // 1. 先排序，让相同元素相邻，便于去重剪枝
  nums.sort((a, b) => a - b)

  let res = []
  // 2. 显式初始化 used 数组
  let used = []

  const dfs = path => {
    // 终止条件：路径长度等于数组长度，找到一个完整排列
    if (path.length === nums.length) {
      res.push(path.slice()) // 深拷贝，避免后续修改影响结果
      return // 结束当前递归分支
    }

    for (let i = 0; i < nums.length; i++) {
      // 剪枝1：当前元素已被使用，跳过（防止同一元素被重复选取）
      if (used[i]) continue

      // 剪枝2：去重核心！
      // 当前元素与前一个元素相同，且前一个元素未被使用（说明是同一层的重复选择）
      // 此时跳过当前元素，避免生成重复排列
      if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) {
        continue
      }

      // 做选择
      path.push(nums[i])
      used[i] = true

      // 递归探索下一层
      dfs(path)

      // 撤销选择（回溯）
      path.pop()
      used[i] = false
    }
  }

  dfs([])
  return res
}

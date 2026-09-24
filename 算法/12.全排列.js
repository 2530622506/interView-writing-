var permute = function (nums) {
  let res = []
  let used = []

  const dfs = path => {
    // 选够了
    if (path.length == nums.length) {
      res.push(path.slice())
      return
    }

    for (const num of nums) {
      if (used[num]) continue
      path.push(num)
      used[num] = true

      dfs(path)

      path.pop()
      used[num] = false
    }
  }
  dfs([])
  return res
}

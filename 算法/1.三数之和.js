var threeSum = function (nums) {
  let res = []
  nums.sort((a, b) => a - b)
  if (nums.length < 3) return res

  for (let i = 0; i < nums.length; i++) {
    let left = i + 1
    let right = nums.length - 1
    // 对a进行去重
    if (i > 0 && nums[i] == nums[i - 1]) continue
    while (left < right) {
      let lnum = nums[left],
        rnum = nums[right],
        curnum = nums[i]
      const threenum = curnum + lnum + rnum
      if (threenum > 0) {
        right--
      } else if (threenum < 0) {
        left++
      } else {
        res.push([curnum, lnum, rnum])
        // 对bc进行去重
        while (left < right && nums[left] == nums[left + 1]) {
          left++
        }
        while (left < right && nums[right] == nums[right - 1]) {
          right--
        }
        left++
        right--
      }
    }
  }
  return res
}
// 测试
let nums = [-1, 0, 1, 2, -1, -4]
console.log(threeSum(nums))

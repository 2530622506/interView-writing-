var lengthOfLongestSubstring = function (s) {
  let map = new Map()
  let left = 0
  let maxLength = 0
  // 思路：核心思路：滑动窗口 + 哈希表。维护一个“不重复”的窗口，右指针不断扩张，左指针在遇到重复时收缩。
  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right]) && map.get(s[right]) >= left) {
      left = map.get(s[right]) + 1
    }
    map.set(s[right], right)
    maxLength = Math.max(maxLength, right - left + 1)
  }
  return maxLength
}

function firstUniqChar(s) {
  // 两次遍历：1.统计字符出现的频率 2.查看出现一次的位置
  let map = new Map()
  for (const char of s) {
    map.set(char, (map.get(char) || 0) + 1)
  }
  for (let i = 0; i < s.length; i++) {
    if (map.get(s[i]) == 1) {
      return i
    }
  }
  return -1
}

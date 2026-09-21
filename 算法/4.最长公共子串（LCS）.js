function LCS(str1, str2) {
  const dp = new Array(str1.length + 1)
    .fill(0)
    .map(() => new Array(str2.length + 1).fill(0))
  let maxLength = 0,
    endIndex = 0

  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] == str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
        if (dp[i][j] > maxLength) {
          maxLength = dp[i][j]
          endIndex = i
        }
      }
    }
  }
  return str1.slice(endIndex - maxLength, endIndex)
}

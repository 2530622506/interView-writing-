function bigSUm(num1, num2) {
  // 思路：模拟手工加法的工程，从字符串最后一位开始逐位相加，注意处理进位
  let maxLength = Math.max(num1.length, num2.length)
  // 数字前面填充0
  let Sum1 = num1.padStart(maxLength, "0")
  let Sum2 = num2.padStart(maxLength, "0")
  let carry = 0
  let res = ""
  for (let i = maxLength - 1; i >= 0; i--) {
    let sum = parseInt(Sum1[i]) + parseInt(Sum2[i]) + carry
    res = (sum % 10) + res
    carry = Math.floor(sum / 10)
  }
  if (carry) {
    res = carry + res
  }
  return res
}

console.log(bigSUm("12", "4561222222222222222222222222140"))

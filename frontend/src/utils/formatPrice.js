export const formatPrice = (price) => {
  if (price === null || price === undefined || price === '') return ''
  return new Intl.NumberFormat('vi-VN').format(Number(price))
}

export const formatNumber = (num) => {
  if (!num && num !== 0) return ''
  return new Intl.NumberFormat('vi-VN').format(num)
}

export const calculateDiscount = (price, comparePrice) => {
  if (!comparePrice || comparePrice <= price) return 0
  return Math.round(((comparePrice - price) / comparePrice) * 100)
}
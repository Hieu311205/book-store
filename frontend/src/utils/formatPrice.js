export const formatPrice = (price) => {
  if (!price && price !== 0) return ''
  return '$' + new Intl.NumberFormat('en-US').format(price)
}

export const formatNumber = (num) => {
  if (!num && num !== 0) return ''
  return new Intl.NumberFormat('en-US').format(num)
}

export const calculateDiscount = (price, comparePrice) => {
  if (!comparePrice || comparePrice <= price) return 0
  return Math.round(((comparePrice - price) / comparePrice) * 100)
}

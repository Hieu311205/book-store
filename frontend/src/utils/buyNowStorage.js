const BUY_NOW_KEY = 'book_store_buy_now_item'

export const saveBuyNowItem = (product, quantity = 1) => {
  const item = {
    product_id: product.id,
    id: `buy-now-${product.id}`,
    slug: product.slug,
    title: product.title,
    author_name: product.author_name,
    image_url: product.images?.[0]?.image_url || product.primary_image || '/images/placeholder-book.jpg',
    price: Number(product.price) || 0,
    quantity,
    line_total: (Number(product.price) || 0) * quantity,
  }

  sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify(item))
  return item
}

export const getBuyNowItem = () => {
  try {
    const raw = sessionStorage.getItem(BUY_NOW_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const clearBuyNowItem = () => {
  sessionStorage.removeItem(BUY_NOW_KEY)
}

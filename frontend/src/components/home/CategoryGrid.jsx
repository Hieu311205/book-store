import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { categoryService } from '../../services/category.service'

const CategoryGrid = () => {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
    select: (res) => res.data,
  })

  if (isLoading) {
    return (
      <section className="my-8">
        <h2 className="text-xl font-bold mb-6">Danh mục sách</h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-24 bg-white dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="my-8">
      <h2 className="text-xl font-bold mb-6">Danh mục sách</h2>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/products?category=${cat.slug || cat.id}`}
            className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md transition-shadow text-center"
          >
            <span className="text-sm font-bold mb-2 text-primary-600">{cat.icon || 'Sách'}</span>
            <span className="text-sm font-medium">{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default CategoryGrid

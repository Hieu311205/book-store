import { FiEdit2, FiTrash2 } from 'react-icons/fi'

const ProductActions = ({ product, onEdit, onDelete }) => (
  <div className="flex items-center justify-center gap-1">
    <button
      onClick={() => onEdit(product)}
      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
      title="Sửa"
    >
      <FiEdit2 size={15} />
    </button>
    <button
      onClick={() => onDelete(product.id, product.title)}
      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded"
      title="Xóa"
    >
      <FiTrash2 size={15} />
    </button>
  </div>
)

export default ProductActions

import { FiEdit2, FiTrash2 } from 'react-icons/fi'

const CategoryActions = ({ item, onEdit, onDelete, isDeleting }) => (
  <div className="flex justify-end gap-3">
    <button type="button" onClick={() => onEdit(item)} className="text-blue-500 hover:text-blue-600" title="Sửa">
      <FiEdit2 />
    </button>
    <button
      type="button"
      onClick={() => onDelete(item.id)}
      disabled={isDeleting}
      className="text-red-500 hover:text-red-600 disabled:opacity-50"
      title="Xóa"
    >
      <FiTrash2 />
    </button>
  </div>
)

export default CategoryActions

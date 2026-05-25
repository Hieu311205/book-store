import { FiPlus } from 'react-icons/fi'
import CategoryFilters from './components/CategoryFilters'
import CategoryFormModal from './components/CategoryFormModal'
import CategoryTable from './components/CategoryTable'
import { useAdminCategories } from './hooks/useAdminCategories'

const Categories = () => {
  const categories = useAdminCategories()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Danh mục</h1>
        <button type="button" onClick={categories.openCreate} className="btn btn-primary">
          <FiPlus /> Thêm danh mục
        </button>
      </div>

      <CategoryFilters
        filters={categories.filters}
        setters={categories.setters}
        showAdvanced={categories.showAdvanced}
        setShowAdvanced={categories.setShowAdvanced}
        hasFilters={categories.hasFilters}
        isFetching={categories.isFetching}
        refetch={categories.refetch}
        resetFilters={categories.resetFilters}
        totalItems={categories.totalItems}
        totalPages={categories.totalPages}
        page={categories.page}
      />

      <CategoryTable
        categories={categories.categories}
        isLoading={categories.isLoading}
        hasFilters={categories.hasFilters}
        page={categories.page}
        setPage={categories.setPage}
        totalPages={categories.totalPages}
        totalItems={categories.totalItems}
        onEdit={categories.startEdit}
        onDelete={categories.deleteCategory}
        isDeleting={categories.isDeleting}
      />

      <CategoryFormModal
        isOpen={categories.isFormOpen}
        editingId={categories.editingId}
        form={categories.form}
        setForm={categories.setForm}
        parentOptions={categories.parentOptions}
        onClose={categories.resetForm}
        onSubmit={categories.submit}
        isSubmitting={categories.isSubmitting}
      />
    </div>
  )
}

export default Categories

import { FiPlus } from 'react-icons/fi'
import ProductFilters from './components/ProductFilters'
import ProductFormModal from './components/ProductFormModal'
import ProductTable from './components/ProductTable'
import { useAdminProducts } from './hooks/useAdminProducts'
import { useAuth } from '../../context/AuthContext'
import { ROLE_GROUPS } from '../../config/permissions'

const Products = () => {
  const products = useAdminProducts()
  const { user } = useAuth()
  const canManageProducts = ROLE_GROUPS.productManage.includes(user?.role)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý sách</h1>
        {canManageProducts && <button onClick={products.openCreate} className="btn btn-primary">
          <FiPlus size={16} /> Thêm sách
        </button>}
      </div>

      <ProductFilters
        filters={products.filters}
        setters={products.setters}
        categories={products.categories}
        authors={products.authors}
        publishers={products.publishers}
        showAdvanced={products.showAdvanced}
        setShowAdvanced={products.setShowAdvanced}
        hasFilters={products.hasFilters}
        isFetching={products.isFetching}
        refetch={products.refetch}
        resetFilters={products.resetFilters}
        totalItems={products.totalItems}
        totalPages={products.totalPages}
        page={products.page}
      />

      <ProductTable
        products={products.data?.products || []}
        isLoading={products.isLoading}
        hasFilters={products.hasFilters}
        page={products.page}
        setPage={products.setPage}
        totalPages={products.totalPages}
        totalItems={products.totalItems}
        onEdit={products.openEdit}
        onDelete={products.handleDelete}
        canManage={canManageProducts}
      />

      <ProductFormModal
        isOpen={canManageProducts && products.isFormOpen}
        editingProduct={products.editingProduct}
        form={products.form}
        setForm={products.setForm}
        categories={products.categories}
        authors={products.authors}
        publishers={products.publishers}
        coverInputRef={products.coverInputRef}
        previewInputRef={products.previewInputRef}
        openCoverPicker={products.openCoverPicker}
        handleCoverFileChange={products.handleCoverFileChange}
        openPreviewPicker={products.openPreviewPicker}
        handlePreviewFileChange={products.handlePreviewFileChange}
        updatePreview={products.updatePreview}
        deletePreview={products.deletePreview}
        handleSubmit={products.handleSubmit}
        closeForm={products.closeForm}
        uploadCoverMutation={products.uploadCoverMutation}
        uploadPreviewMutation={products.uploadPreviewMutation}
        updatePreviewMutation={products.updatePreviewMutation}
        deletePreviewMutation={products.deletePreviewMutation}
        isSaving={products.isSaving}
      />
    </div>
  )
}

export default Products

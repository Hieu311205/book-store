import { useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiEye, FiTrash2, FiUpload, FiX } from 'react-icons/fi'
import { getCategoryLabel } from '../utils/productHelpers'

const ProductFormModal = ({
  isOpen,
  editingProduct,
  form,
  setForm,
  categories,
  authors,
  publishers,
  coverInputRef,
  previewInputRef,
  openCoverPicker,
  handleCoverFileChange,
  openPreviewPicker,
  handlePreviewFileChange,
  updatePreview,
  deletePreview,
  handleSubmit,
  closeForm,
  uploadCoverMutation,
  uploadPreviewMutation,
  updatePreviewMutation,
  deletePreviewMutation,
  isSaving,
}) => {
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0)
  const previewImages = form.preview_images || []
  const activePreviewIndex = previewImages.length ? Math.min(selectedPreviewIndex, previewImages.length - 1) : 0
  const selectedPreview = previewImages[activePreviewIndex]
  const goToPreview = (direction) => {
    if (!previewImages.length) return
    setSelectedPreviewIndex((current) => (current + direction + previewImages.length) % previewImages.length)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{editingProduct ? 'Sua thong tin sach' : 'Them sach moi'}</h2>
          <button type="button" onClick={closeForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <FiX size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Thong tin co ban</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium">Ten sach <span className="text-red-500">*</span></span>
                <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Danh muc</span>
                <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Chua chon</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{getCategoryLabel(category)}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Tac gia</span>
                <select className="input" value={form.author_id} onChange={(e) => setForm({ ...form, author_id: e.target.value })}>
                  <option value="">Chua chon</option>
                  {authors.map((author) => <option key={author.id} value={author.id}>{author.name}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Nha xuat ban</span>
                <select className="input" value={form.publisher_id} onChange={(e) => setForm({ ...form, publisher_id: e.target.value })}>
                  <option value="">Chua chon</option>
                  {publishers.map((publisher) => <option key={publisher.id} value={publisher.id}>{publisher.name}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Hinh thuc bia</span>
                <select className="input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
                  <option value="paperback">Bia mem (Paperback)</option>
                  <option value="hardcover">Bia cung (Hardcover)</option>
                  <option value="ebook">Ebook</option>
                </select>
              </label>
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Gia & Ton kho</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="space-y-1">
                <span className="text-sm font-medium">Gia ban <span className="text-red-500">*</span></span>
                <input className="input" type="number" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Gia goc</span>
                <input className="input" type="number" min="0" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Ton kho</span>
                <input className="input" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">SKU</span>
                <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </label>
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Chi tiet sach</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="space-y-1">
                <span className="text-sm font-medium">ISBN</span>
                <input className="input" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">So trang</span>
                <input className="input" type="number" min="0" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Nam xuat ban</span>
                <input className="input" type="number" min="1900" max="2099" value={form.publish_year} onChange={(e) => setForm({ ...form, publish_year: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Ngon ngu</span>
                <input className="input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
              </label>
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Anh & Mo ta</p>
            <div className="space-y-4">
              <label className="space-y-1">
                <span className="text-sm font-medium">URL anh bia</span>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button type="button" onClick={openCoverPicker} disabled={uploadCoverMutation.isPending} className="btn btn-outline">
                    <FiUpload size={16} />
                    {uploadCoverMutation.isPending ? 'Dang luu anh...' : 'Chon anh bia'}
                  </button>
                  <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleCoverFileChange} />
                </div>
                <input className="input" placeholder="/images/covers/danh-muc/anh-bia.jpg" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                {form.image_url && (
                  <div className="flex items-start gap-3 rounded-lg border dark:border-gray-700 p-3 mt-2">
                    <img src={form.image_url} alt="Anh bia" className="h-28 w-20 object-cover rounded bg-gray-100" />
                    <div className="text-xs text-gray-500 break-all">
                      <p className="font-medium text-gray-700 dark:text-gray-200 mb-1">Duong dan da luu</p>
                      <p>{form.image_url}</p>
                    </div>
                  </div>
                )}
              </label>

              <div className="space-y-2 rounded-lg border dark:border-gray-700 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">link Đọc thử</p>
                  </div>
                  <button
                    type="button"
                    onClick={openPreviewPicker}
                    disabled={!editingProduct || uploadPreviewMutation.isPending}
                    className="btn btn-outline"
                  >
                    <FiUpload size={16} />
                    {uploadPreviewMutation.isPending ? 'Dang luu...' : 'Them anh doc thu'}
                  </button>
                  <input ref={previewInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={handlePreviewFileChange} />
                </div>

                {previewImages.length > 0 ? (
                  <>
                  <div className="relative flex min-h-72 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-16 py-3 dark:border-gray-700 dark:bg-gray-900/40">
                    <img src={selectedPreview?.image_url} alt={selectedPreview?.alt_text || 'Preview'} className="max-h-96 max-w-full rounded object-contain" />
                    {previewImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => goToPreview(-1)}
                          className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-800 shadow-sm hover:border-primary-600 hover:bg-primary-600 hover:text-white dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          title="Anh truoc"
                        >
                          <FiChevronLeft />
                        </button>
                        <button
                          type="button"
                          onClick={() => goToPreview(1)}
                          className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-800 shadow-sm hover:border-primary-600 hover:bg-primary-600 hover:text-white dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          title="Anh tiep theo"
                        >
                          <FiChevronRight />
                        </button>
                      </>
                    )}
                    <span className="absolute bottom-3 right-3 rounded bg-gray-900/70 px-2 py-1 text-xs font-semibold text-white">
                      {activePreviewIndex + 1}/{previewImages.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {previewImages.map((preview, index) => (
                      <div key={preview.id || preview.image_url} className="rounded-lg border dark:border-gray-700 p-2 space-y-2">
                        <button type="button" onClick={() => setSelectedPreviewIndex(index)} className={`block w-full rounded ${activePreviewIndex === index ? 'ring-2 ring-primary-500' : ''}`}>
                          <img src={preview.image_url} alt={preview.alt_text || `Preview ${index + 1}`} className="h-32 w-full rounded bg-gray-100 object-cover" />
                        </button>
                        <div className="flex items-center gap-2">
                          <input
                            className="input"
                            type="number"
                            min="0"
                            defaultValue={preview.sort_order ?? index + 1}
                            onBlur={(e) => updatePreview(preview.id, { sort_order: e.target.value })}
                            disabled={updatePreviewMutation.isPending}
                          />
                          <button type="button" onClick={() => setSelectedPreviewIndex(index)} className="btn btn-outline btn-sm px-2" title="Xem anh">
                            <FiEye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePreview(preview.id)}
                            disabled={deletePreviewMutation.isPending}
                            className="btn btn-danger btn-sm px-2"
                            title="Xoa anh"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-500">Chua co anh doc thu.</p>
                )}
              </div>

              <label className="space-y-1">
                <span className="text-sm font-medium">Mo ta ngan</span>
                <input className="input" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Mo ta day du</span>
                <textarea className="input min-h-28 resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Cai dat hien thi</p>
            <div className="flex flex-wrap gap-6">
              {[
                { key: 'is_active', label: 'Dang ban (hien thi cho khach)' },
                { key: 'is_featured', label: 'Sach noi bat (trang chu)' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={Boolean(form[key])} onChange={(e) => setForm({ ...form, [key]: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded" />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
          <button type="button" onClick={closeForm} className="btn btn-secondary">Huy</button>
          <button disabled={isSaving} className="btn btn-primary min-w-28">
            {isSaving ? 'Dang luu...' : editingProduct ? 'Luu thay doi' : 'Them sach'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductFormModal

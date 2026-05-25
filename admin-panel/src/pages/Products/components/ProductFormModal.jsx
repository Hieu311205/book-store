import { FiUpload, FiX } from 'react-icons/fi'

const ProductFormModal = ({
  isOpen,
  editingProduct,
  form,
  setForm,
  categories,
  authors,
  publishers,
  coverInputRef,
  openCoverPicker,
  handleCoverFileChange,
  handleSubmit,
  closeForm,
  uploadCoverMutation,
  isSaving,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{editingProduct ? 'Sửa thông tin sách' : 'Thêm sách mới'}</h2>
          <button type="button" onClick={closeForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <FiX size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Thông tin cơ bản</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium">Tên sách <span className="text-red-500">*</span></span>
                <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Danh mục</span>
                <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Chưa chọn</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Tác giả</span>
                <select className="input" value={form.author_id} onChange={(e) => setForm({ ...form, author_id: e.target.value })}>
                  <option value="">Chưa chọn</option>
                  {authors.map((author) => <option key={author.id} value={author.id}>{author.name}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Nhà xuất bản</span>
                <select className="input" value={form.publisher_id} onChange={(e) => setForm({ ...form, publisher_id: e.target.value })}>
                  <option value="">Chưa chọn</option>
                  {publishers.map((publisher) => <option key={publisher.id} value={publisher.id}>{publisher.name}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Hình thức bìa</span>
                <select className="input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
                  <option value="paperback">Bìa mềm (Paperback)</option>
                  <option value="hardcover">Bìa cứng (Hardcover)</option>
                  <option value="ebook">Ebook</option>
                </select>
              </label>
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Giá & Tồn kho</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="space-y-1">
                <span className="text-sm font-medium">Giá bán <span className="text-red-500">*</span></span>
                <input className="input" type="number" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Giá gốc</span>
                <input className="input" type="number" min="0" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Tồn kho</span>
                <input className="input" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">SKU</span>
                <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </label>
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Chi tiết sách</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="space-y-1">
                <span className="text-sm font-medium">ISBN</span>
                <input className="input" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Số trang</span>
                <input className="input" type="number" min="0" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Năm xuất bản</span>
                <input className="input" type="number" min="1900" max="2099" value={form.publish_year} onChange={(e) => setForm({ ...form, publish_year: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Ngôn ngữ</span>
                <input className="input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
              </label>
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Ảnh & Mô tả</p>
            <div className="space-y-4">
              <label className="space-y-1">
                <span className="text-sm font-medium">URL ảnh bìa</span>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button type="button" onClick={openCoverPicker} disabled={uploadCoverMutation.isPending} className="btn btn-outline">
                    <FiUpload size={16} />
                    {uploadCoverMutation.isPending ? 'Đang lưu ảnh...' : 'Chọn ảnh bìa'}
                  </button>
                  <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleCoverFileChange} />
                </div>
                <input className="input" placeholder="/images/covers/danh-muc/anh-bia.jpg" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                {form.image_url && (
                  <div className="flex items-start gap-3 rounded-lg border dark:border-gray-700 p-3 mt-2">
                    <img src={form.image_url} alt="Ảnh bìa" className="h-28 w-20 object-cover rounded bg-gray-100" />
                    <div className="text-xs text-gray-500 break-all">
                      <p className="font-medium text-gray-700 dark:text-gray-200 mb-1">Đường dẫn đã lưu</p>
                      <p>{form.image_url}</p>
                    </div>
                  </div>
                )}
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Mô tả ngắn</span>
                <input className="input" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Mô tả đầy đủ</span>
                <textarea className="input min-h-28 resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Cài đặt hiển thị</p>
            <div className="flex flex-wrap gap-6">
              {[
                { key: 'is_active', label: 'Đang bán (hiển thị cho khách)' },
                { key: 'is_featured', label: 'Sách nổi bật (trang chủ)' },
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
          <button type="button" onClick={closeForm} className="btn btn-secondary">Hủy</button>
          <button disabled={isSaving} className="btn btn-primary min-w-28">
            {isSaving ? 'Đang lưu...' : editingProduct ? 'Lưu thay đổi' : 'Thêm sách'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductFormModal

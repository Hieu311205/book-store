import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { adminService } from '../../../services/admin.service'
import { buildPayload, emptyForm } from '../utils/productHelpers'

export const useAdminProducts = () => {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [author, setAuthor] = useState('')
  const [publisher, setPublisher] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isBestseller, setIsBestseller] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [page, setPage] = useState(1)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const coverInputRef = useRef(null)

  const hasFilters = !!(category || author || publisher || status || priceMin || priceMax || isFeatured || isBestseller)
  const queryParams = {
    page,
    limit: 20,
    search: search || undefined,
    category: category || undefined,
    author: author || undefined,
    publisher: publisher || undefined,
    status: status || undefined,
    sort,
    price_min: priceMin || undefined,
    price_max: priceMax || undefined,
    is_featured: isFeatured ? 1 : undefined,
    is_bestseller: isBestseller ? 1 : undefined,
  }

  const resetFilters = () => {
    setSearch('')
    setCategory('')
    setAuthor('')
    setPublisher('')
    setStatus('')
    setSort('newest')
    setPriceMin('')
    setPriceMax('')
    setIsFeatured(false)
    setIsBestseller(false)
    setPage(1)
  }

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-products', queryParams],
    queryFn: () => adminService.getProducts(queryParams),
    select: (res) => res.data,
    staleTime: 0,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: adminService.getCategories,
    select: (res) => res.data,
  })

  const { data: authors = [] } = useQuery({
    queryKey: ['admin-authors'],
    queryFn: adminService.getAuthors,
    select: (res) => res.data,
  })

  const { data: publishers = [] } = useQuery({
    queryKey: ['admin-publishers'],
    queryFn: adminService.getPublishers,
    select: (res) => res.data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-products'] })
  const closeForm = () => {
    setIsFormOpen(false)
    setEditingProduct(null)
    setForm(emptyForm)
  }

  const createMutation = useMutation({
    mutationFn: adminService.createProduct,
    onSuccess: () => {
      invalidate()
      closeForm()
      toast.success('Đã thêm sách')
    },
    onError: (error) => toast.error(error.message || 'Thêm sách thất bại'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateProduct(id, data),
    onSuccess: () => {
      invalidate()
      closeForm()
      toast.success('Đã cập nhật sách')
    },
    onError: (error) => toast.error(error.message || 'Cập nhật sách thất bại'),
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteProduct,
    onSuccess: () => {
      invalidate()
      toast.success('Đã xóa sách')
    },
    onError: (error) => toast.error(error.message || 'Xóa thất bại'),
  })

  const uploadCoverMutation = useMutation({
    mutationFn: adminService.uploadProductCover,
    onSuccess: (res) => {
      const imageUrl = res.data?.image_url
      if (imageUrl) {
        setForm((current) => ({ ...current, image_url: imageUrl }))
      }
      if (editingProduct) invalidate()
      toast.success('Đã lưu ảnh bìa')
    },
    onError: (error) => toast.error(error.message || 'Không thể tải ảnh bìa'),
  })

  const openCreate = () => {
    setEditingProduct(null)
    setForm(emptyForm)
    setIsFormOpen(true)
  }

  const openEdit = (product) => {
    setEditingProduct(product)
    setForm({
      ...emptyForm,
      title: product.title || '',
      category_id: product.category_id || '',
      author_id: product.author_id || '',
      publisher_id: product.publisher_id || '',
      price: product.price || '',
      compare_price: product.compare_price || '',
      stock: product.stock || 0,
      sku: product.sku || '',
      isbn: product.isbn || '',
      pages: product.pages || '',
      publish_year: product.publish_year || '',
      language: product.language || 'Vietnamese',
      format: product.format || 'paperback',
      short_description: product.short_description || '',
      description: product.description || '',
      image_url: product.images?.[0]?.image_url || '',
      is_active: Number(product.is_active ?? 1),
      is_featured: Number(product.is_featured ?? 0),
    })
    setIsFormOpen(true)
  }

  const handleDelete = (id, title) => {
    if (window.confirm(`Bạn có chắc muốn xóa "${title}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = buildPayload(form)
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const openCoverPicker = () => {
    if (!form.category_id) {
      toast.error('Vui lòng chọn danh mục trước khi chọn ảnh bìa')
      return
    }
    coverInputRef.current?.click()
  }

  const handleCoverFileChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const data = new FormData()
    data.append('cover', file)
    data.append('category_id', form.category_id)
    if (editingProduct?.id) {
      data.append('product_id', editingProduct.id)
    }

    uploadCoverMutation.mutate(data)
  }

  return {
    data,
    isLoading,
    isFetching,
    refetch,
    categories,
    authors,
    publishers,
    filters: { search, category, author, publisher, status, sort, priceMin, priceMax, isFeatured, isBestseller },
    setters: { setSearch, setCategory, setAuthor, setPublisher, setStatus, setSort, setPriceMin, setPriceMax, setIsFeatured, setIsBestseller, setPage },
    showAdvanced,
    setShowAdvanced,
    page,
    setPage,
    hasFilters,
    resetFilters,
    isFormOpen,
    editingProduct,
    form,
    setForm,
    coverInputRef,
    openCreate,
    openEdit,
    closeForm,
    handleDelete,
    handleSubmit,
    openCoverPicker,
    handleCoverFileChange,
    uploadCoverMutation,
    isSaving: createMutation.isPending || updateMutation.isPending || uploadCoverMutation.isPending,
    totalPages: data?.pagination?.totalPages || 1,
    totalItems: data?.pagination?.totalItems ?? 0,
  }
}

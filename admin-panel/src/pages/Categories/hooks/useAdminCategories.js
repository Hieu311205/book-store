import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { adminService } from '../../../services/admin.service'
import { LIMIT, emptyForm, normalizeCategoryPayload } from '../utils/categoryHelpers'

export const useAdminCategories = () => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [parentFilter, setParentFilter] = useState('')
  const [sort, setSort] = useState('sort_order')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [page, setPage] = useState(1)

  const hasFilters = !!(search || status || parentFilter)
  const queryParams = {
    page,
    limit: LIMIT,
    search: search || undefined,
    status: status || undefined,
    parent: parentFilter || undefined,
    sort,
  }

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-categories', queryParams],
    queryFn: () => adminService.getCategories(queryParams),
    select: (res) => res.data,
  })

  const { data: allCategories = [] } = useQuery({
    queryKey: ['admin-categories-all'],
    queryFn: () => adminService.getCategories(),
    select: (res) => res.data || [],
  })

  const refreshCategories = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    queryClient.invalidateQueries({ queryKey: ['admin-categories-all'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setIsFormOpen(false)
  }

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setParentFilter('')
    setSort('sort_order')
    setPage(1)
  }

  const createMutation = useMutation({
    mutationFn: adminService.createCategory,
    onSuccess: () => {
      refreshCategories()
      resetForm()
      toast.success('Đã thêm danh mục')
    },
    onError: (error) => toast.error(error.message || 'Không thể thêm danh mục'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => adminService.updateCategory(id, payload),
    onSuccess: () => {
      refreshCategories()
      resetForm()
      toast.success('Đã cập nhật danh mục')
    },
    onError: (error) => toast.error(error.message || 'Không thể cập nhật danh mục'),
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteCategory,
    onSuccess: () => {
      refreshCategories()
      toast.success('Đã xóa danh mục')
    },
    onError: (error) => toast.error(error.message || 'Không thể xóa danh mục'),
  })

  const submit = (event) => {
    event.preventDefault()
    const payload = normalizeCategoryPayload(form)
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setForm({
      name: item.name || '',
      name_en: item.name_en || '',
      parent_id: item.parent_id ? String(item.parent_id) : '',
      description: item.description || '',
      image_url: item.image_url || '',
      icon: item.icon || '',
      sort_order: item.sort_order ?? 0,
      is_active: Number(item.is_active ?? 1),
    })
    setIsFormOpen(true)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setIsFormOpen(true)
  }

  const categories = data?.categories || []

  return {
    form,
    setForm,
    editingId,
    isFormOpen,
    allCategories,
    parentOptions: allCategories.filter((item) => Number(item.id) !== Number(editingId)),
    filters: { search, status, parentFilter, sort },
    setters: { setSearch, setStatus, setParentFilter, setSort, setPage },
    showAdvanced,
    setShowAdvanced,
    page,
    setPage,
    hasFilters,
    isLoading,
    isFetching,
    refetch,
    resetForm,
    resetFilters,
    submit,
    startEdit,
    openCreate,
    deleteCategory: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    categories,
    totalPages: data?.pagination?.totalPages || 1,
    totalItems: data?.pagination?.totalItems ?? categories.length,
  }
}

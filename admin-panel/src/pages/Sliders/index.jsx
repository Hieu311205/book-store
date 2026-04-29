import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { adminService } from '../../services/admin.service'

const emptyForm = { title: '', subtitle: '', image_url: '', link: '', button_text: '', sort_order: 0, is_active: 1 }

const Sliders = () => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sliders'],
    queryFn: adminService.getSliders,
    select: (res) => res.data,
  })

  const createMutation = useMutation({
    mutationFn: adminService.createSlider,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-sliders'])
      setForm(emptyForm)
      toast.success('Da them banner')
    },
    onError: (error) => toast.error(error.message || 'Khong the them banner'),
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteSlider,
    onSuccess: () => queryClient.invalidateQueries(['admin-sliders']),
  })

  const submit = (event) => {
    event.preventDefault()
    createMutation.mutate({ ...form, sort_order: Number(form.sort_order), is_active: Number(form.is_active) })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Banner</h1>
      <form onSubmit={submit} className="card p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="input" placeholder="Tieu de" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="input" placeholder="Mo ta" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
        <input className="input" placeholder="URL anh" required value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        <input className="input" placeholder="Link" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
        <input className="input" placeholder="Text nut" value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} />
        <button className="btn btn-primary"><FiPlus /> Them banner</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="card p-6">Dang tai...</div>
        ) : data?.length ? data.map((item) => (
          <div key={item.id} className="card overflow-hidden">
            <img src={item.image_url} alt={item.title} className="h-40 w-full object-cover bg-gray-100" />
            <div className="p-4 flex justify-between gap-3">
              <div>
                <p className="font-semibold">{item.title || 'Banner'}</p>
                <p className="text-sm text-gray-500">{item.subtitle}</p>
              </div>
              <button onClick={() => deleteMutation.mutate(item.id)} className="text-red-500"><FiTrash2 /></button>
            </div>
          </div>
        )) : (
          <div className="card p-6 text-gray-500">Chua co banner</div>
        )}
      </div>
    </div>
  )
}

export default Sliders

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiCheck, FiTrash2 } from 'react-icons/fi'
import { adminService } from '../../services/admin.service'

const ContactMessages = () => {
  const queryClient = useQueryClient()
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['contact-messages'],
    queryFn: adminService.getContactMessages,
    select: (res) => res.data || [],
  })

  const markReadMutation = useMutation({
    mutationFn: adminService.markContactMessageRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['contact-messages'])
      queryClient.invalidateQueries(['admin-notifications'])
      toast.success('Da danh dau da doc')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteContactMessage,
    onSuccess: () => {
      queryClient.invalidateQueries(['contact-messages'])
      queryClient.invalidateQueries(['admin-notifications'])
      toast.success('Da xoa tin nhan')
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tin nhan lien he</h1>
      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nguoi gui</th>
                <th>Chu de</th>
                <th>Noi dung</th>
                <th>Ngay gui</th>
                <th>Trang thai</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8">Dang tai...</td></tr>
              ) : messages.length ? messages.map((item) => (
                <tr key={item.id}>
                  <td>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.email}</p>
                    {item.phone && <p className="text-sm text-gray-500">{item.phone}</p>}
                  </td>
                  <td>{item.subject}</td>
                  <td className="max-w-md">{item.message}</td>
                  <td>{new Date(item.created_at).toLocaleString('vi-VN')}</td>
                  <td>
                    <span className={`badge ${Number(item.is_read) ? 'badge-success' : 'badge-warning'}`}>
                      {Number(item.is_read) ? 'Da doc' : 'Chua doc'}
                    </span>
                  </td>
                  <td className="text-right">
                    {!Number(item.is_read) && (
                      <button onClick={() => markReadMutation.mutate(item.id)} className="text-green-600 mr-3">
                        <FiCheck />
                      </button>
                    )}
                    <button onClick={() => deleteMutation.mutate(item.id)} className="text-red-500">
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Chua co tin nhan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ContactMessages

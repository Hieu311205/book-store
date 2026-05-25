import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userService } from '../../services/user.service'
import { formatPrice } from '../../utils/formatPrice'

const Wallet = () => {
  const queryClient = useQueryClient()
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [selectedBankId, setSelectedBankId] = useState('')
  const [showBankForm, setShowBankForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: userService.getWallet,
    select: (res) => res.data,
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  })

  const wallet = data?.wallet
  const bankAccounts = data?.bank_accounts || []
  const selectedBank = bankAccounts.find((item) => String(item.id) === String(selectedBankId)) || bankAccounts[0]
  const transactions = data?.transactions || []
  const hasLinkedBank = bankAccounts.length > 0
  const pendingTransactions = transactions.filter((tx) => tx.status === 'pending')

  useEffect(() => {
    if (!selectedBankId && bankAccounts.length) {
      setSelectedBankId(String(bankAccounts[0].id))
    }
  }, [bankAccounts, selectedBankId])

  const refreshWallet = () => queryClient.invalidateQueries({ queryKey: ['wallet'] })

  const linkBankMutation = useMutation({
    mutationFn: userService.linkBankAccount,
    onSuccess: () => {
      toast.success('Đã thêm tài khoản ngân hàng')
      setBankName('')
      setBankAccountNumber('')
      setBankAccountName('')
      setShowBankForm(false)
      refreshWallet()
    },
    onError: (error) => toast.error(error.message || 'Không thể liên kết ngân hàng'),
  })

  const depositMutation = useMutation({
    mutationFn: userService.depositWallet,
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu nạp tiền, vui lòng chờ admin duyệt')
      setDepositAmount('')
      refreshWallet()
    },
    onError: (error) => toast.error(error.message || 'Không thể nạp tiền'),
  })

  const withdrawMutation = useMutation({
    mutationFn: userService.withdrawWallet,
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu rút tiền')
      setWithdrawAmount('')
      refreshWallet()
    },
    onError: (error) => toast.error(error.message || 'Không thể rút tiền'),
  })

  const openBankForm = () => {
    setBankName('')
    setBankAccountNumber('')
    setBankAccountName('')
    setShowBankForm(true)
  }

  const submitBankAccount = () => {
    if (!bankName.trim() || !bankAccountNumber.trim() || !bankAccountName.trim()) {
      toast.error('Nhập đầy đủ thông tin ngân hàng')
      return
    }
    linkBankMutation.mutate({
      bank_name: bankName.trim(),
      bank_account_number: bankAccountNumber.trim(),
      bank_account_name: bankAccountName.trim(),
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <p className="text-sm text-gray-500 mb-1">Số dư ví</p>
        <div className="text-4xl font-bold text-primary-600">
          {isLoading ? '...' : `${formatPrice(wallet?.balance || 0)} đ`}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Tiền hoàn từ hủy đơn hoặc trả hàng sẽ được cộng vào ví này.
        </p>
        {pendingTransactions.length > 0 && (
          <div className="mt-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
            Bạn có <strong>{pendingTransactions.length}</strong> giao dịch đang chờ admin duyệt. Số dư sẽ tự động cập nhật khi được duyệt.
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-lg">Ngân hàng liên kết</h2>
            <p className="text-sm text-gray-500">Có thể thêm nhiều tài khoản và chọn tài khoản dùng cho từng giao dịch.</p>
          </div>
          <button type="button" className="btn btn-outline" onClick={openBankForm}>
            Thêm ngân hàng
          </button>
        </div>

        {hasLinkedBank ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">Tài khoản dùng cho giao dịch</label>
              <select className="input w-full max-w-xl" value={selectedBankId} onChange={(e) => setSelectedBankId(e.target.value)}>
                {bankAccounts.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bank_name} - {bank.bank_account_name} - {bank.bank_account_number}
                  </option>
                ))}
              </select>
            </div>
            {selectedBank && (
              <div className="rounded-lg border dark:border-gray-700 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{selectedBank.bank_name}</p>
                  <p className="text-sm text-gray-500">{selectedBank.bank_account_name} - {selectedBank.bank_account_number}</p>
                </div>
                <span className="text-xs font-semibold text-green-600">Đang chọn</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-yellow-600">Bạn chưa liên kết tài khoản ngân hàng.</p>
        )}

        {showBankForm && (
          <div className="rounded-lg border dark:border-gray-700 p-4 space-y-3">
            <div className="grid md:grid-cols-3 gap-3">
              <input className="input w-full" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Tên ngân hàng" />
              <input className="input w-full" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="Số tài khoản" />
              <input className="input w-full" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="Tên chủ tài khoản" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary" disabled={linkBankMutation.isPending} onClick={submitBankAccount}>
                Lưu ngân hàng
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowBankForm(false)}>
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-3">
          <h2 className="font-bold text-lg">Nạp tiền</h2>
          <p className="text-sm text-gray-500">
            {selectedBank ? `Nạp từ ${selectedBank.bank_name} - ${selectedBank.bank_account_number}` : 'Chọn ngân hàng trước khi nạp tiền.'}
          </p>
          <input
            className="input w-full"
            type="number"
            min="0"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Số tiền muốn nạp"
          />
          <button
            className="btn btn-primary w-full"
            disabled={depositMutation.isPending || !selectedBank}
            onClick={() => {
              if (!selectedBank) {
                toast.error('Chọn tài khoản ngân hàng trước khi nạp tiền')
                return
              }
              if (Number(depositAmount) <= 0) {
                toast.error('Nhập số tiền hợp lệ')
                return
              }
              depositMutation.mutate({ amount: Number(depositAmount), bank_account_id: Number(selectedBankId) })
            }}
          >
            Nạp vào ví
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-3">
          <h2 className="font-bold text-lg">Rút về ngân hàng</h2>
          <p className="text-sm text-gray-500">
            {selectedBank ? `Rút về ${selectedBank.bank_name} - ${selectedBank.bank_account_number}` : 'Chọn ngân hàng trước khi rút tiền.'}
          </p>
          <input
            className="input w-full"
            type="number"
            min="0"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Số tiền muốn rút"
          />
          <button
            className="btn btn-primary w-full"
            disabled={withdrawMutation.isPending || !selectedBank}
            onClick={() => {
              if (!selectedBank) {
                toast.error('Chọn tài khoản ngân hàng trước khi rút tiền')
                return
              }
              if (Number(withdrawAmount) <= 0) {
                toast.error('Nhập số tiền hợp lệ')
                return
              }
              withdrawMutation.mutate({ amount: Number(withdrawAmount), bank_account_id: Number(selectedBankId) })
            }}
          >
            Gửi yêu cầu rút
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">Lịch sử ví</h2>
        {transactions.length ? (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const statusMap = {
                pending: { label: 'Chờ duyệt', cls: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
                completed: { label: 'Hoàn tất', cls: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
                rejected: { label: 'Từ chối', cls: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
              }
              const statusInfo = statusMap[tx.status] || { label: tx.status, cls: 'text-gray-500' }
              return (
                <div key={tx.id} className="flex flex-wrap items-center justify-between gap-3 border-b dark:border-gray-700 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{tx.description || 'Giao dịch ví'}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(tx.created_at).toLocaleString('vi-VN')}
                      {tx.bank_name ? ` — ${tx.bank_name} ${tx.bank_account_number}` : ''}
                    </p>
                  </div>
                  <p className={`font-bold ${tx.type === 'credit' ? (tx.status === 'rejected' ? 'text-gray-400 line-through' : 'text-green-600') : (tx.status === 'rejected' ? 'text-gray-400 line-through' : 'text-red-500')}`}>
                    {tx.type === 'credit' ? '+' : '-'}{formatPrice(tx.amount)} đ
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-500">Chưa có giao dịch ví.</p>
        )}
      </div>
    </div>
  )
}

export default Wallet

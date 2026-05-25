import { FiFilter, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi'
import {
  paymentMethodOptions,
  paymentStatusOptions,
  sortOptions,
  statusOptions,
} from '../utils/orderStatus'

const OrderFilters = ({
  filters,
  setters,
  showAdvanced,
  setShowAdvanced,
  hasFilters,
  totalItems,
  totalPages,
  page,
  isFetching,
  refetch,
  resetFilters,
}) => (
  <div className="card p-4 space-y-3">
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-64">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => { setters.setSearch(e.target.value); setters.setPage(1) }}
          placeholder="Mã đơn, khách hàng, email, SĐT..."
          className="input pl-9 text-sm"
        />
      </div>

      <select value={filters.status} onChange={(e) => { setters.setStatus(e.target.value); setters.setPage(1) }} className="input w-auto text-sm">
        {statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>

      <select value={filters.paymentStatus} onChange={(e) => { setters.setPaymentStatus(e.target.value); setters.setPage(1) }} className="input w-auto text-sm">
        {paymentStatusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>

      <select value={filters.sort} onChange={(e) => { setters.setSort(e.target.value); setters.setPage(1) }} className="input w-auto text-sm">
        {sortOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>

      <button onClick={() => setShowAdvanced((current) => !current)} className={`btn text-sm gap-1.5 ${showAdvanced ? 'btn-primary' : 'btn-outline'}`}>
        <FiFilter size={14} /> Nâng cao
      </button>

      <button onClick={() => refetch()} disabled={isFetching} className="btn btn-outline text-sm gap-1.5">
        <FiRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Làm mới
      </button>

      {hasFilters && (
        <button onClick={resetFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium">
          <FiX size={14} /> Xóa bộ lọc
        </button>
      )}
    </div>

    {showAdvanced && (
      <div className="flex flex-wrap gap-4 items-end pt-3 border-t dark:border-gray-700">
        <div className="flex flex-col gap-1 min-w-44">
          <span className="text-xs font-medium text-gray-500">Phương thức thanh toán</span>
          <select value={filters.paymentMethod} onChange={(e) => { setters.setPaymentMethod(e.target.value); setters.setPage(1) }} className="input text-sm">
            {paymentMethodOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Giá trị từ (đ)</span>
          <input type="number" min="0" value={filters.minAmount} onChange={(e) => { setters.setMinAmount(e.target.value); setters.setPage(1) }} placeholder="Tối thiểu" className="input text-sm w-36" />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Giá trị đến (đ)</span>
          <input type="number" min="0" value={filters.maxAmount} onChange={(e) => { setters.setMaxAmount(e.target.value); setters.setPage(1) }} placeholder="Tối đa" className="input text-sm w-36" />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Ngày đặt từ</span>
          <input type="date" value={filters.dateFrom} onChange={(e) => { setters.setDateFrom(e.target.value); setters.setPage(1) }} className="input text-sm w-40" />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Ngày đặt đến</span>
          <input type="date" value={filters.dateTo} onChange={(e) => { setters.setDateTo(e.target.value); setters.setPage(1) }} className="input text-sm w-40" />
        </div>
      </div>
    )}

    <div className="flex items-center justify-between text-sm text-gray-500 pt-1">
      <span>
        {isFetching ? 'Đang tải...' : `${totalItems} đơn hàng`}
        {hasFilters && <span className="ml-2 text-primary-600 font-medium">(đang lọc)</span>}
      </span>
      {totalPages > 1 && <span>Trang {page} / {totalPages}</span>}
    </div>
  </div>
)

export default OrderFilters

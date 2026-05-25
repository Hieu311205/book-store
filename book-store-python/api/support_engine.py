FAQ_ITEMS = [
    {
        'category': 'ordering',
        'question': 'Làm sao để đặt hàng?',
        'answer': (
            'Bạn chọn sách, thêm vào giỏ hàng hoặc mua ngay, chọn địa chỉ giao hàng, '
            'chọn phương thức thanh toán rồi xác nhận đơn. Sau khi đặt thành công, '
            'hệ thống tạo đơn ở trạng thái chờ xác nhận.'
        ),
    },
    {
        'category': 'voucher',
        'question': 'Có thể dùng mã giảm giá ở đâu?',
        'answer': (
            'Mã giảm giá được chọn ở trang thanh toán. Mã chỉ áp dụng khi còn hiệu lực, '
            'còn lượt sử dụng và đơn hàng đạt điều kiện tối thiểu.'
        ),
    },
    {
        'category': 'shipping',
        'question': 'Thời gian giao hàng mất bao lâu?',
        'answer': (
            'Thời gian giao hàng dự kiến được tính từ lúc shop nhập đơn vị vận chuyển '
            'và mã vận đơn. Người dùng có thể theo dõi trạng thái giao hàng trong trang đơn hàng.'
        ),
    },
    {
        'category': 'cancel',
        'question': 'Tôi có thể hủy đơn hàng không?',
        'answer': (
            'Bạn có thể hủy khi đơn còn ở trạng thái chờ xác nhận hoặc đã xác nhận. '
            'Khi đơn đã chuẩn bị hàng, đang giao hoặc đã giao thì không thể tự hủy.'
        ),
    },
    {
        'category': 'payment',
        'question': 'Thanh toán được xử lý như thế nào?',
        'answer': (
            'Đơn COD sẽ thanh toán khi nhận hàng. Đơn chuyển khoản, thẻ hoặc ví điện tử '
            'được ghi nhận sau khi hệ thống xác nhận đã thanh toán.'
        ),
    },
    {
        'category': 'return',
        'question': 'Sách bị lỗi có đổi trả được không?',
        'answer': (
            'Bạn có thể gửi yêu cầu đổi trả sau khi đơn đã giao thành công. Admin sẽ kiểm tra '
            'lý do, xử lý đổi hàng hoặc hoàn tiền vào ví điện tử nếu đủ điều kiện.'
        ),
    },
    {
        'category': 'wallet',
        'question': 'Ví điện tử dùng để làm gì?',
        'answer': (
            'Ví điện tử dùng để nhận tiền hoàn từ đơn đã thanh toán, thanh toán đơn hàng '
            'và tạo yêu cầu rút tiền về tài khoản ngân hàng đã liên kết.'
        ),
    },
]


def get_support_faq(limit=None):
    if limit:
        return FAQ_ITEMS[:limit]
    return FAQ_ITEMS

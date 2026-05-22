// Script tạo báo cáo dự án BookStore → BAO_CAO_DU_AN.docx
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, ShadingType, PageBreak, Header, Footer,
  PageNumber, NumberFormat, convertInchesToTwip, LevelFormat,
  UnderlineType,
} = require('docx')
const fs = require('fs')

const PRIMARY = '1A56B0'
const HEADER_FILL = 'D6E4F7'

const h = (text, level = HeadingLevel.HEADING_1) =>
  new Paragraph({
    text,
    heading: level,
    spacing: { before: 260, after: 120 },
    run: { bold: true, color: level === HeadingLevel.HEADING_1 ? PRIMARY : '1E3A5F' },
  })

const h2 = (t) => h(t, HeadingLevel.HEADING_2)
const h3 = (t) => h(t, HeadingLevel.HEADING_3)

const p = (...runs) =>
  new Paragraph({ children: runs, spacing: { before: 60, after: 80 }, alignment: AlignmentType.JUSTIFIED })

const t = (text, opts = {}) =>
  new TextRun({ text, font: 'Times New Roman', size: 24, ...opts })

const bold = (text) => t(text, { bold: true })
const italic = (text) => t(text, { italics: true, color: '555555' })

const bullet = (text) =>
  new Paragraph({
    bullet: { level: 0 },
    children: [t(text)],
    spacing: { before: 40, after: 40 },
  })

const bullet2 = (text) =>
  new Paragraph({
    bullet: { level: 1 },
    children: [t(text)],
    spacing: { before: 20, after: 20 },
  })

const pageBreak = () =>
  new Paragraph({ children: [new PageBreak()] })

const cell = (text, shade = false, bold_ = false) =>
  new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, font: 'Times New Roman', size: 22, bold: bold_ })],
      alignment: AlignmentType.LEFT,
      spacing: { before: 40, after: 40 },
    })],
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    shading: shade ? { fill: HEADER_FILL, type: ShadingType.CLEAR } : undefined,
  })

const cellC = (text, shade = false, bold_ = false) =>
  new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, font: 'Times New Roman', size: 22, bold: bold_ })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 40 },
    })],
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    shading: shade ? { fill: HEADER_FILL, type: ShadingType.CLEAR } : undefined,
  })

const headerRow = (...cols) =>
  new TableRow({ children: cols.map(c => cellC(c, true, true)), tableHeader: true })

const dataRow = (...cols) =>
  new TableRow({ children: cols.map((c, i) => (i === 0 ? cellC(c) : cell(c))) })

// ───────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: 'Times New Roman', size: 24 } },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1',
        run: { bold: true, size: 32, color: PRIMARY, font: 'Times New Roman' },
        paragraph: { spacing: { before: 360, after: 160 } },
      },
      {
        id: 'Heading2', name: 'Heading 2',
        run: { bold: true, size: 28, color: '1E3A5F', font: 'Times New Roman' },
        paragraph: { spacing: { before: 260, after: 100 } },
      },
      {
        id: 'Heading3', name: 'Heading 3',
        run: { bold: true, size: 24, color: '2C5F8A', font: 'Times New Roman' },
        paragraph: { spacing: { before: 160, after: 80 } },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1.1),
          bottom: convertInchesToTwip(1.0),
          left: convertInchesToTwip(1.3),
          right: convertInchesToTwip(0.9),
        },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [t('BÁO CÁO DỰ ÁN — HỆ THỐNG BÁN SÁCH TRỰC TUYẾN BOOKSTORE', { color: '888888', size: 18 })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC', space: 6 } },
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            t('Trang ', { color: '888888', size: 18 }),
            new TextRun({ children: [PageNumber.CURRENT], color: '888888', size: 18 }),
            t(' / ', { color: '888888', size: 18 }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], color: '888888', size: 18 }),
          ],
        })],
      }),
    },
    children: [

      // ════════════════════════════ TRANG BÌA ════════════════════════════
      new Paragraph({ text: '' }),
      new Paragraph({ text: '' }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: 'TRƯỜNG ĐẠI HỌC', bold: true, size: 26, font: 'Times New Roman', color: '333333' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'KHOA CÔNG NGHỆ THÔNG TIN', bold: true, size: 26, font: 'Times New Roman', color: '333333' })],
        spacing: { after: 400 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'BÁO CÁO ĐỒ ÁN MÔN HỌC', bold: true, size: 40, font: 'Times New Roman', color: PRIMARY })],
        spacing: { after: 200 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'XÂY DỰNG HỆ THỐNG BÁN SÁCH TRỰC TUYẾN', bold: true, size: 34, font: 'Times New Roman', color: '1E3A5F' })],
        spacing: { after: 100 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '(BookStore Full-Stack Web Application)', italics: true, size: 26, font: 'Times New Roman', color: '555555' })],
        spacing: { after: 600 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Công nghệ sử dụng: PHP · MySQL · React.js · Tailwind CSS', size: 22, font: 'Times New Roman', color: '444444' })],
        spacing: { after: 800 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Năm học: 2024 – 2025', size: 24, font: 'Times New Roman', color: '333333' })],
        spacing: { after: 0 },
      }),
      pageBreak(),

      // ════════════════════════════ MỤC LỤC ════════════════════════════
      h('MỤC LỤC'),
      ...[
        ['I.',   'GIỚI THIỆU TỔNG QUAN', '3'],
        ['II.',  'PHÂN TÍCH HỆ THỐNG TƯƠNG TỰ NGOÀI THỰC TẾ', '4'],
        ['III.', 'MÔ TẢ HỆ THỐNG XÂY DỰNG', '6'],
        ['IV.',  'KIẾN TRÚC HỆ THỐNG', '7'],
        ['V.',   'THIẾT KẾ CƠ SỞ DỮ LIỆU', '9'],
        ['VI.',  'PHÂN TÍCH CHỨC NĂNG HỆ THỐNG', '11'],
        ['VII.', 'ĐÁNH GIÁ VÀ HƯỚNG PHÁT TRIỂN', '18'],
        ['VIII.','KẾT LUẬN', '19'],
      ].map(([num, title, page]) =>
        new Paragraph({
          children: [
            new TextRun({ text: `${num}  ${title}`, font: 'Times New Roman', size: 24, bold: true }),
            new TextRun({ text: `\t${page}`, font: 'Times New Roman', size: 24, color: '888888' }),
          ],
          spacing: { before: 60, after: 60 },
          tabStops: [{ type: 'right', position: convertInchesToTwip(5.2) }],
        })
      ),
      pageBreak(),

      // ════════════════════════════ CHƯƠNG I ════════════════════════════
      h('I. GIỚI THIỆU TỔNG QUAN'),
      h2('1.1. Bối cảnh và lý do chọn đề tài'),
      p(t('Thương mại điện tử tại Việt Nam tăng trưởng mạnh mẽ trong những năm gần đây, đặc biệt sau đại dịch COVID-19. Theo báo cáo của Hiệp hội Thương mại điện tử Việt Nam (VECOM), doanh thu thương mại điện tử B2C năm 2023 đạt hơn 20 tỷ USD, tăng 25% so với năm 2022. Trong đó, lĩnh vực sách và văn hóa phẩm chứng kiến sự bùng nổ khi các độc giả chuyển dần từ mua sách tại cửa hàng truyền thống sang mua trực tuyến.')),
      p(t('Xu hướng này tạo ra nhu cầu cấp thiết về các nền tảng thương mại điện tử chuyên biệt cho sách — nơi người đọc có thể dễ dàng tìm kiếm, đánh giá, và mua sách từ mọi thiết bị. Dự án ')),
      p(bold('BookStore'), t(' được xây dựng nhằm đáp ứng nhu cầu đó, đồng thời là cơ hội để nhóm áp dụng tổng hợp các kiến thức lập trình web full-stack trong môi trường thực tế.')),
      h2('1.2. Mục tiêu dự án'),
      bullet('Xây dựng hệ thống bán sách trực tuyến hoàn chỉnh từ giao diện khách hàng đến trang quản trị.'),
      bullet('Áp dụng kiến trúc tách biệt Frontend – Backend (REST API) hiện đại.'),
      bullet('Thiết kế cơ sở dữ liệu quan hệ đầy đủ cho một hệ thống thương mại điện tử thực tế.'),
      bullet('Triển khai các tính năng cốt lõi: quản lý sản phẩm, đặt hàng, thanh toán, mã giảm giá, đánh giá sản phẩm.'),
      bullet('Xây dựng trang quản trị cho admin theo dõi đơn hàng, doanh thu và quản lý nội dung.'),
      h2('1.3. Phạm vi dự án'),
      p(t('Hệ thống bao gồm 3 thành phần độc lập:')),
      bullet('Frontend (Storefront): Giao diện dành cho khách hàng tại cổng 3000.'),
      bullet('Admin Panel: Trang quản trị dành cho nhân viên/admin tại cổng 3001.'),
      bullet('Backend API: REST API PHP thuần tại cổng 5000, phục vụ cả hai giao diện trên.'),
      pageBreak(),

      // ════════════════════════════ CHƯƠNG II ════════════════════════════
      h('II. PHÂN TÍCH HỆ THỐNG TƯƠNG TỰ NGOÀI THỰC TẾ'),
      h2('2.1. Tổng quan các hệ thống tham khảo'),
      p(t('Nhóm đã nghiên cứu và tham khảo ba hệ thống bán sách/TMĐT lớn tại Việt Nam: Tiki, Fahasa Online và Shopee (phân khúc sách). Từ đó rút ra những tính năng thiết yếu và áp dụng vào thiết kế hệ thống của mình.')),
      h2('2.2. Phân tích chi tiết từng hệ thống'),
      h3('2.2.1. Tiki (tiki.vn)'),
      p(bold('Mô tả: '), t('Tiki là sàn TMĐT đa ngành hàng, trong đó sách là một trong những ngành hàng chiến lược. Tiki Books cung cấp hàng triệu đầu sách với kho hàng riêng (TikiNOW – giao hàng trong 2 giờ).')),
      p(bold('Điểm mạnh nổi bật:')),
      bullet('Tìm kiếm nâng cao với bộ lọc đa chiều: thể loại, nhà xuất bản, tác giả, giá, định dạng, ngôn ngữ.'),
      bullet('Hệ thống đánh giá và review sản phẩm có xác thực mua hàng.'),
      bullet('Quản lý đơn hàng thời gian thực với tracking vận chuyển.'),
      bullet('Hệ thống voucher, flash sale, và TikiXu (điểm thưởng).'),
      bullet('Hỗ trợ nhiều phương thức thanh toán: COD, thẻ, ví điện tử VNPay, Momo, ZaloPay.'),
      p(bold('Hạn chế: '), t('Giao diện phức tạp, nhiều quảng cáo, trải nghiệm mobile đôi khi chậm với kết nối yếu.')),
      h3('2.2.2. Fahasa Online (fahasa.com)'),
      p(bold('Mô tả: '), t('Fahasa là chuỗi nhà sách lớn nhất Việt Nam với hệ thống cửa hàng vật lý và website TMĐT tích hợp. Ưu điểm là danh mục sách phong phú, đặc biệt là sách giáo khoa, sách thiếu nhi và sách tiếng Việt.')),
      p(bold('Điểm mạnh nổi bật:')),
      bullet('Danh mục sách có cấu trúc phân cấp rõ ràng (thể loại → chủ đề → tác giả).'),
      bullet('Tích hợp giỏ hàng lưu trữ lâu dài, hỗ trợ khách vãng lai.'),
      bullet('Hệ thống thành viên với thẻ tích điểm Fahasa Card.'),
      bullet('Trang chi tiết sản phẩm đầy đủ: ISBN, NXB, năm xuất bản, tóm tắt, mục lục.'),
      p(bold('Hạn chế: '), t('Giao diện thiết kế cũ, thiếu tính năng so sánh sản phẩm, chức năng tìm kiếm chưa mạnh.')),
      h3('2.2.3. Shopee (shopee.vn — phân khúc Sách & Văn phòng phẩm)'),
      p(bold('Mô tả: '), t('Shopee là sàn marketplace lớn nhất Đông Nam Á. Tuy không chuyên sách, nhưng danh mục Sách & VPP của Shopee rất lớn với nhiều người bán cạnh tranh về giá.')),
      p(bold('Điểm mạnh nổi bật:')),
      bullet('UI/UX thân thiện, tối ưu cho mobile-first.'),
      bullet('Voucher miễn phí vận chuyển và flash sale hấp dẫn.'),
      bullet('Hệ thống chat trực tiếp với người bán.'),
      bullet('Đánh giá người mua kèm ảnh thực tế.'),
      p(bold('Hạn chế: '), t('Không có trang sản phẩm chuyên sâu (thiếu ISBN, thông tin tác giả đầy đủ), chất lượng hàng giả khó kiểm soát.')),
      h2('2.3. Bảng so sánh tính năng'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          headerRow('Tính năng', 'Tiki', 'Fahasa', 'Shopee', 'BookStore (của nhóm)'),
          dataRow('Tìm kiếm nâng cao', '✅ Đầy đủ', '⚠️ Cơ bản', '⚠️ Cơ bản', '✅ Có (tìm kiếm + bộ lọc)'),
          dataRow('Giỏ hàng khách', '✅', '✅', '✅', '✅ Có (session)'),
          dataRow('Mã giảm giá', '✅', '✅', '✅', '✅ Có (coupon system)'),
          dataRow('Đánh giá sản phẩm', '✅ Có verify', '✅', '✅ Có ảnh', '✅ Có (chờ duyệt)'),
          dataRow('Wishlist', '✅', '✅', '✅', '✅ Có'),
          dataRow('Theo dõi đơn hàng', '✅ Thời gian thực', '✅', '✅', '⚠️ Trạng thái tĩnh'),
          dataRow('Đăng nhập Google', '✅', '❌', '❌', '✅ Có'),
          dataRow('Admin dashboard', 'Riêng biệt', 'Riêng biệt', 'Seller Center', '✅ Tích hợp'),
          dataRow('Thanh toán online', '✅ Đa dạng', '✅', '✅', '⚠️ COD + chuyển khoản'),
          dataRow('Quản lý kho hàng', '✅ Tự động', '✅', '✅ Seller', '✅ Thủ công'),
        ],
      }),
      new Paragraph({ text: '' }),
      p(italic('Ghi chú: ✅ = Hoàn thành đầy đủ · ⚠️ = Có nhưng hạn chế · ❌ = Không có')),
      h2('2.4. Rút ra yêu cầu cho hệ thống của nhóm'),
      p(t('Từ phân tích trên, nhóm xác định các yêu cầu ưu tiên cao cho BookStore:')),
      bullet('Trang chi tiết sản phẩm đầy đủ thông tin: ISBN, NXB, tác giả, năm xuất bản, số trang, ngôn ngữ.'),
      bullet('Giỏ hàng hỗ trợ cả khách vãng lai (session-based) lẫn khách đã đăng nhập.'),
      bullet('Hệ thống mã giảm giá linh hoạt (phần trăm / số tiền cố định, có hạn sử dụng và giới hạn người dùng).'),
      bullet('Admin panel thống kê doanh thu, quản lý đơn hàng trực quan.'),
      bullet('Hỗ trợ đăng nhập Google để giảm rào cản cho người dùng mới.'),
      pageBreak(),

      // ════════════════════════════ CHƯƠNG III ════════════════════════════
      h('III. MÔ TẢ HỆ THỐNG XÂY DỰNG'),
      h2('3.1. Tên và phiên bản'),
      p(bold('Tên hệ thống: '), t('BookStore — Hệ thống bán sách trực tuyến')),
      p(bold('Phiên bản: '), t('1.0.0 (Development / Demo)')),
      p(bold('Ngôn ngữ giao diện: '), t('Tiếng Việt')),
      h2('3.2. Đối tượng sử dụng'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          headerRow('Đối tượng', 'Mô tả', 'Hệ thống sử dụng'),
          dataRow('Khách vãng lai', 'Chưa đăng nhập, muốn duyệt và mua sách', 'Storefront (cổng 3000)'),
          dataRow('Khách hàng đã đăng ký', 'Có tài khoản, quản lý đơn hàng, wishlist, đánh giá', 'Storefront (cổng 3000)'),
          dataRow('Admin / Nhân viên', 'Quản lý sản phẩm, đơn hàng, người dùng', 'Admin Panel (cổng 3001)'),
          dataRow('Super Admin', 'Tất cả quyền admin + quản lý cài đặt hệ thống', 'Admin Panel (cổng 3001)'),
        ],
      }),
      new Paragraph({ text: '' }),
      h2('3.3. Luồng hoạt động chính'),
      p(t('Khách hàng truy cập Storefront → duyệt sản phẩm → thêm vào giỏ → đặt hàng (điền địa chỉ + chọn thanh toán) → nhận email xác nhận (nếu có) → theo dõi trạng thái đơn hàng trong tài khoản. Admin tiếp nhận đơn trên Admin Panel → cập nhật trạng thái → gán mã vận đơn khi giao hàng.')),
      pageBreak(),

      // ════════════════════════════ CHƯƠNG IV ════════════════════════════
      h('IV. KIẾN TRÚC HỆ THỐNG'),
      h2('4.1. Mô hình kiến trúc tổng thể'),
      p(t('Hệ thống theo kiến trúc '), bold('SPA + REST API'), t(' (Single Page Application kết hợp với PHP REST API):')),
      new Paragraph({
        children: [new TextRun({ text: '┌─────────────────────────┐      ┌─────────────────────────┐', font: 'Courier New', size: 20, color: '333333' })],
        spacing: { before: 60, after: 0 },
      }),
      new Paragraph({ children: [new TextRun({ text: '│  Frontend (React SPA)   │      │  Admin Panel (React SPA)│', font: 'Courier New', size: 20, color: '333333' })], spacing: { before: 0, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: '│  Vite · Tailwind CSS    │      │  Vite · Tailwind CSS    │', font: 'Courier New', size: 20, color: '333333' })], spacing: { before: 0, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: '│  cổng :3000             │      │  cổng :3001             │', font: 'Courier New', size: 20, color: '333333' })], spacing: { before: 0, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: '└────────────┬────────────┘      └────────────┬────────────┘', font: 'Courier New', size: 20, color: '333333' })], spacing: { before: 0, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: '             │  HTTP/JSON (REST API)            │', font: 'Courier New', size: 20, color: '333333' })], spacing: { before: 0, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: '             └──────────────┬──────────────────┘', font: 'Courier New', size: 20, color: '333333' })], spacing: { before: 0, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: '                            ▼', font: 'Courier New', size: 20, color: '333333' })], spacing: { before: 0, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: '              ┌─────────────────────────┐', font: 'Courier New', size: 20, color: '333333' })], spacing: { before: 0, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: '              │  Backend PHP (API Server)│', font: 'Courier New', size: 20, color: '333333' })], spacing: { before: 0, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: '              │  PHP 8+ · PDO · Router   │', font: 'Courier New', size: 20, color: '333333' })], spacing: { before: 0, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: '              │  cổng :5000             │', font: 'Courier New', size: 20, color: '333333' })], spacing: { before: 0, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: '              └─────────────┬───────────┘', font: 'Courier New', size: 20, color: '333333' })], spacing: { before: 0, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: '                            │  PDO', font: 'Courier New', size: 20, color: '333333' })], spacing: { before: 0, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: '                            ▼', font: 'Courier New', size: 20, color: '333333' })], spacing: { before: 0, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: '              ┌─────────────────────────┐', font: 'Courier New', size: 20, color: '333333' })], spacing: { before: 0, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: '              │  MySQL 8.0 Database      │', font: 'Courier New', size: 20, color: '333333' })], spacing: { before: 0, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: '              │  bookstore (15 bảng)     │', font: 'Courier New', size: 20, color: '333333' })], spacing: { before: 0, after: 0 } }),
      new Paragraph({ children: [new TextRun({ text: '              └─────────────────────────┘', font: 'Courier New', size: 20, color: '333333' })], spacing: { before: 0, after: 0 } }),
      new Paragraph({ text: '' }),
      h2('4.2. Công nghệ sử dụng'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          headerRow('Thành phần', 'Công nghệ / Thư viện', 'Vai trò'),
          dataRow('Frontend (Storefront)', 'React 18, Vite, Tailwind CSS, TanStack Query v5', 'Giao diện khách hàng'),
          dataRow('Admin Panel', 'React 18, Vite, Tailwind CSS, Recharts, React Hook Form', 'Trang quản trị'),
          dataRow('Backend API', 'PHP 8+, PHP built-in server, PDO, JSON', 'REST API server'),
          dataRow('Database', 'MySQL 8.0, utf8mb4', 'Lưu trữ dữ liệu'),
          dataRow('Authentication', 'JWT (Access + Refresh Token), Google OAuth 2.0', 'Xác thực người dùng'),
          dataRow('Routing', 'React Router v6 (SPA routing)', 'Điều hướng phía client'),
          dataRow('State & Cache', 'TanStack Query (server state), React Context (cart/auth)', 'Quản lý trạng thái'),
          dataRow('Thông báo', 'React Hot Toast', 'Toast notification'),
          dataRow('Upload ảnh', 'Cloudinary (qua URL), hoặc lưu URL thủ công', 'Quản lý hình ảnh sản phẩm'),
        ],
      }),
      new Paragraph({ text: '' }),
      h2('4.3. Cấu trúc thư mục dự án'),
      p(t('Dự án được tổ chức thành các thư mục độc lập:')),
      bullet('book-store-main/frontend/     — Storefront React app'),
      bullet2('src/pages/   — các trang (Home, Product, Cart, Checkout, Profile…)'),
      bullet2('src/services/— wrapper gọi API (axios)'),
      bullet2('src/contexts/— CartContext, AuthContext'),
      bullet('book-store-main/admin-panel/  — Admin Panel React app'),
      bullet2('src/pages/   — Dashboard, Products, Orders, Users, Coupons, Settings…'),
      bullet('book-store-main/backend/      — PHP API'),
      bullet2('src/api/routes/ — orders.php, admin.php, auth.php, products.php…'),
      bullet2('src/middleware/ — AuthMiddleware, CorsMiddleware'),
      bullet('book-store-main/database/     — schema_mysql.sql'),
      pageBreak(),

      // ════════════════════════════ CHƯƠNG V ════════════════════════════
      h('V. THIẾT KẾ CƠ SỞ DỮ LIỆU'),
      h2('5.1. Danh sách bảng'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          headerRow('STT', 'Tên bảng', 'Mô tả chức năng', 'Số cột chính'),
          dataRow('1', 'users', 'Tài khoản người dùng (customer, admin, super_admin)', '14'),
          dataRow('2', 'user_addresses', 'Địa chỉ giao hàng của người dùng', '10'),
          dataRow('3', 'categories', 'Danh mục sách (hỗ trợ phân cấp parent_id)', '10'),
          dataRow('4', 'authors', 'Thông tin tác giả', '6'),
          dataRow('5', 'publishers', 'Thông tin nhà xuất bản', '6'),
          dataRow('6', 'products', 'Sản phẩm sách (đầy đủ thông tin)', '32'),
          dataRow('7', 'product_images', 'Ảnh phụ của sản phẩm', '6'),
          dataRow('8', 'product_tags', 'Tag/từ khoá cho sản phẩm', '2'),
          dataRow('9', 'cart_items', 'Giỏ hàng (user_id hoặc session_id)', '6'),
          dataRow('10', 'wishlist', 'Danh sách yêu thích', '4'),
          dataRow('11', 'coupons', 'Mã giảm giá', '13'),
          dataRow('12', 'coupon_usage', 'Lịch sử sử dụng mã giảm giá', '5'),
          dataRow('13', 'orders', 'Đơn hàng', '28'),
          dataRow('14', 'order_items', 'Chi tiết sản phẩm trong đơn hàng', '8'),
          dataRow('15', 'payments', 'Giao dịch thanh toán', '12'),
          dataRow('16', 'reviews', 'Đánh giá sản phẩm', '12'),
          dataRow('17', 'settings', 'Cài đặt hệ thống (key-value)', '3'),
          dataRow('18', 'sliders', 'Banner/Slider trang chủ', '8'),
          dataRow('19', 'contact_messages', 'Tin nhắn liên hệ từ khách hàng', '7'),
        ],
      }),
      new Paragraph({ text: '' }),
      h2('5.2. Quan hệ giữa các bảng chính'),
      p(t('Bảng ')), // will describe FK relationships
      bullet('users (1) ←→ (N) orders: một người dùng có nhiều đơn hàng (ON DELETE SET NULL để giữ lịch sử khi xóa user).'),
      bullet('orders (1) ←→ (N) order_items: một đơn hàng gồm nhiều dòng sản phẩm (ON DELETE CASCADE).'),
      bullet('products (1) ←→ (N) order_items: sản phẩm bị xóa không xóa dữ liệu đơn hàng (ON DELETE SET NULL).'),
      bullet('products (1) ←→ (N) product_images, product_tags: cascade xóa khi xóa sản phẩm.'),
      bullet('categories hỗ trợ self-reference (parent_id) để tổ chức phân cấp danh mục.'),
      bullet('coupons (1) ←→ (N) coupon_usage: theo dõi tần suất sử dụng mã theo từng user.'),
      h2('5.3. Các trường quan trọng trong bảng orders'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          headerRow('Trường', 'Kiểu dữ liệu', 'Ý nghĩa'),
          dataRow('order_number', 'VARCHAR(20) UNIQUE', 'Mã đơn hàng hiển thị cho khách (vd: ORD-20240515-001)'),
          dataRow('status', "ENUM('pending','paid','processing','shipped','delivered','cancelled','refunded')", 'Trạng thái xử lý đơn hàng'),
          dataRow('payment_status', "ENUM('pending','paid','failed','refunded')", 'Trạng thái thanh toán'),
          dataRow('payment_method', "ENUM('cod','bank_transfer','card')", 'Phương thức thanh toán'),
          dataRow('subtotal / shipping_cost / discount_amount / total_amount', 'DECIMAL(12,0)', 'Các thành phần giá trị đơn hàng'),
          dataRow('tracking_code', 'VARCHAR(100)', 'Mã vận đơn giao hàng'),
          dataRow('coupon_id + coupon_code', 'INT + VARCHAR', 'Mã giảm giá đã áp dụng (lưu snapshot code)'),
        ],
      }),
      new Paragraph({ text: '' }),
      pageBreak(),

      // ════════════════════════════ CHƯƠNG VI ════════════════════════════
      h('VI. PHÂN TÍCH CHỨC NĂNG HỆ THỐNG'),
      p(t('Phần này trình bày chi tiết từng nhóm chức năng, gồm mô tả luồng hoạt động, đánh giá mức độ hoàn thành và các trường hợp giới hạn.')),

      h2('6.1. Nhóm chức năng: Xác thực người dùng (Authentication)'),
      h3('6.1.1. Đăng ký tài khoản'),
      p(bold('Luồng hoạt động: '), t('Người dùng điền email + mật khẩu → Backend hash mật khẩu bằng bcrypt (cost 10) → Lưu vào bảng users với role="customer" → Trả về JWT access token + refresh token.')),
      p(bold('Tình huống HOÀN THÀNH:')),
      bullet('Đăng ký với email hợp lệ chưa tồn tại → tạo tài khoản thành công.'),
      bullet('Mật khẩu được hash an toàn bằng bcrypt, không lưu plaintext.'),
      bullet('Trả về JWT để người dùng đăng nhập ngay sau khi đăng ký.'),
      p(bold('Tình huống CHƯA HOÀN THÀNH / HẠN CHẾ:')),
      bullet('Chưa có xác minh email (email_verified = 0 mặc định, không gửi email xác nhận).'),
      bullet('Chưa có kiểm tra độ mạnh mật khẩu phía backend.'),
      bullet('Không có captcha chống đăng ký tự động.'),

      h3('6.1.2. Đăng nhập email/mật khẩu'),
      p(bold('Luồng: '), t('Frontend gửi email + password → Backend tra bảng users, so sánh bcrypt → Tạo JWT access token (exp: 15 phút) + refresh token (exp: 7 ngày) → Lưu refresh token vào cookie httpOnly hoặc localStorage.')),
      p(bold('Tình huống HOÀN THÀNH:')),
      bullet('Đăng nhập đúng email/mật khẩu → nhận token, điều hướng về trang chủ.'),
      bullet('Sai mật khẩu → trả lỗi 401 rõ ràng.'),
      bullet('Access token refresh tự động khi hết hạn.'),
      p(bold('Tình huống HẠN CHẾ:')),
      bullet('Chưa có giới hạn số lần đăng nhập sai (brute-force protection).'),
      bullet('Chưa hỗ trợ đăng xuất từ xa (revoke token trên server).'),

      h3('6.1.3. Đăng nhập Google OAuth'),
      p(bold('Tình huống HOÀN THÀNH:')),
      bullet('Người dùng nhấn "Đăng nhập Google" → redirect tới Google → callback về backend → tạo/cập nhật tài khoản với google_id → trả về JWT.'),
      bullet('Nếu email Google đã tồn tại → liên kết tài khoản, không tạo trùng.'),
      p(bold('Tình huống HẠN CHẾ:')),
      bullet('Cần cấu hình GOOGLE_CLIENT_ID trong .env — không hoạt động nếu thiếu.'),
      bullet('Chưa xử lý trường hợp Google thu hồi quyền.'),

      h2('6.2. Nhóm chức năng: Sản phẩm (Products)'),
      h3('6.2.1. Xem danh sách và tìm kiếm sản phẩm'),
      p(bold('Tình huống HOÀN THÀNH:')),
      bullet('Xem danh sách sản phẩm có phân trang (page, limit).'),
      bullet('Lọc theo danh mục (category_id hoặc slug).'),
      bullet('Tìm kiếm full-text theo tiêu đề (LIKE %keyword%).'),
      bullet('Sắp xếp theo: newest, price_asc, price_desc, bestseller, rating.'),
      bullet('Lọc kết hợp: danh mục + giá + tác giả + NXB + ngôn ngữ.'),
      bullet('Trang chi tiết sản phẩm: đầy đủ ISBN, NXB, tác giả, số trang, năm xuất bản, ngôn ngữ, dịch giả.'),
      bullet('Hiển thị đánh giá trung bình và số lượt đánh giá.'),
      p(bold('Tình huống HẠN CHẾ:')),
      bullet('Tìm kiếm LIKE không tối ưu khi dataset lớn (không có full-text index MySQL hay Elasticsearch).'),
      bullet('Không có gợi ý tìm kiếm (autocomplete).'),
      bullet('Không có tính năng "Sản phẩm liên quan" được tính toán thông minh (chỉ cùng danh mục).'),

      h3('6.2.2. Quản lý sản phẩm (Admin)'),
      p(bold('Tình huống HOÀN THÀNH:')),
      bullet('Thêm/sửa/xóa sản phẩm với đầy đủ các trường.'),
      bullet('Upload nhiều ảnh sản phẩm (primary + gallery).'),
      bullet('Thêm/xóa tag sản phẩm.'),
      bullet('Bật/tắt hiển thị sản phẩm (is_active).'),
      bullet('Đánh dấu "Nổi bật" (is_featured), "Bán chạy" (is_bestseller).'),
      bullet('Quản lý tồn kho (stock), giá gốc, giá khuyến mãi, % giảm giá.'),
      p(bold('Tình huống HẠN CHẾ:')),
      bullet('Chưa có import hàng loạt từ Excel/CSV.'),
      bullet('Không có lịch sử thay đổi giá (price history).'),
      bullet('Tồn kho không tự động trừ khi đặt hàng (cần thêm logic stock reservation).'),

      h2('6.3. Nhóm chức năng: Giỏ hàng (Cart)'),
      p(bold('Tình huống HOÀN THÀNH:')),
      bullet('Thêm sản phẩm vào giỏ khi chưa đăng nhập (session-based, lưu bằng session_id cookie).'),
      bullet('Thêm sản phẩm vào giỏ khi đã đăng nhập (user_id).'),
      bullet('Cập nhật số lượng, xóa từng sản phẩm, xóa toàn bộ giỏ.'),
      bullet('Hiển thị tổng tiền tự động cập nhật.'),
      bullet('Chuyển giỏ hàng session sang user khi đăng nhập (cart merge).'),
      p(bold('Tình huống HẠN CHẾ:')),
      bullet('Không kiểm tra tồn kho khi thêm vào giỏ — có thể thêm số lượng vượt stock.'),
      bullet('Giỏ hàng session bị mất khi hết phiên trình duyệt.'),
      bullet('Không có giới hạn số lượng tối đa trong giỏ.'),

      h2('6.4. Nhóm chức năng: Đặt hàng và Thanh toán (Checkout)'),
      p(bold('Tình huống HOÀN THÀNH:')),
      bullet('Điền địa chỉ giao hàng đầy đủ (tên, điện thoại, tỉnh/thành, quận/huyện, địa chỉ chi tiết).'),
      bullet('Chọn phương thức thanh toán: COD, chuyển khoản ngân hàng, thẻ tín dụng.'),
      bullet('Áp dụng mã giảm giá (validate phía backend: hạn dùng, min_purchase, per_user_limit).'),
      bullet('Tính phí vận chuyển tự động dựa trên tỉnh/thành.'),
      bullet('Tạo đơn hàng với order_number duy nhất.'),
      bullet('Trừ used_count của coupon sau khi đặt hàng thành công.'),
      bullet('Khách vãng lai đặt hàng không cần tài khoản (guest checkout).'),
      p(bold('Tình huống HẠN CHẾ:')),
      bullet('Thanh toán COD và chuyển khoản là thủ công — không tích hợp cổng thanh toán thực (VNPay, MoMo, Stripe).'),
      bullet('Không có xác nhận email tự động sau khi đặt hàng.'),
      bullet('Không tự động trừ stock sau khi đặt — cần xử lý thủ công hoặc thêm trigger.'),
      bullet('Chưa có trang xác nhận thanh toán cho phương thức chuyển khoản.'),

      h2('6.5. Nhóm chức năng: Quản lý đơn hàng'),
      h3('6.5.1. Phía khách hàng'),
      p(bold('Tình huống HOÀN THÀNH:')),
      bullet('Xem danh sách đơn hàng cá nhân với đầy đủ thông tin.'),
      bullet('Xem chi tiết đơn hàng: sản phẩm, giá, phí ship, giảm giá, mã vận đơn.'),
      bullet('Hủy đơn hàng khi ở trạng thái "pending" hoặc "paid".'),
      bullet('Hiển thị badge trạng thái với màu sắc trực quan.'),
      p(bold('Tình huống HẠN CHẾ:')),
      bullet('Không có thông báo real-time khi trạng thái đơn thay đổi.'),
      bullet('Không có trang tracking vận chuyển tích hợp.'),
      h3('6.5.2. Phía Admin'),
      p(bold('Tình huống HOÀN THÀNH:')),
      bullet('Xem toàn bộ đơn hàng với bộ lọc: trạng thái, phương thức thanh toán, khoảng ngày.'),
      bullet('Tìm kiếm đơn hàng theo order_number, tên khách, email.'),
      bullet('Cập nhật trạng thái đơn hàng (pending → processing → shipped → delivered).'),
      bullet('Nhập mã vận đơn (tracking_code).'),
      bullet('Xem chi tiết đơn: sản phẩm, địa chỉ giao hàng, ghi chú khách hàng.'),
      bullet('Export danh sách đơn hàng (nếu được triển khai).'),
      p(bold('Tình huống HẠN CHẾ:')),
      bullet('Không có in phiếu giao hàng (packing slip).'),
      bullet('Không có tích hợp API vận chuyển (GHTK, GHN, ViettelPost).'),

      h2('6.6. Nhóm chức năng: Mã giảm giá (Coupons)'),
      p(bold('Tình huống HOÀN THÀNH:')),
      bullet('Tạo coupon kiểu phần trăm (percentage) hoặc số tiền cố định (fixed).'),
      bullet('Thiết lập: giá trị, giảm tối đa (max_discount), đơn tối thiểu (min_purchase).'),
      bullet('Giới hạn tổng lượt dùng (usage_limit) và lượt dùng mỗi người (per_user_limit).'),
      bullet('Thời hạn hiệu lực (start_date, end_date).'),
      bullet('Validate tất cả điều kiện phía backend trước khi áp dụng.'),
      bullet('Lưu lịch sử sử dụng vào bảng coupon_usage.'),
      p(bold('Tình huống HẠN CHẾ:')),
      bullet('Không có coupon theo danh mục hoặc theo sản phẩm cụ thể.'),
      bullet('Không thể áp nhiều coupon đồng thời cho một đơn hàng.'),

      h2('6.7. Nhóm chức năng: Đánh giá sản phẩm (Reviews)'),
      p(bold('Tình huống HOÀN THÀNH:')),
      bullet('Khách đã đăng nhập gửi đánh giá: rating (1-5 sao), tiêu đề, nội dung, ưu điểm, nhược điểm.'),
      bullet('Đánh giá chờ duyệt (is_approved = 0) trước khi hiển thị công khai.'),
      bullet('Admin duyệt/ẩn đánh giá.'),
      bullet('Cập nhật rating_avg và rating_count trên sản phẩm.'),
      p(bold('Tình huống HẠN CHẾ:')),
      bullet('Chưa kiểm tra is_verified_purchase — người dùng có thể đánh giá sản phẩm chưa mua.'),
      bullet('Không có cơ chế báo cáo (report) đánh giá vi phạm.'),

      h2('6.8. Nhóm chức năng: Dashboard và Thống kê (Admin)'),
      p(bold('Tình huống HOÀN THÀNH:')),
      bullet('Tổng quan: tổng đơn hàng, doanh thu, số khách hàng, tổng sản phẩm.'),
      bullet('Doanh thu theo tháng (biểu đồ cột Recharts).'),
      bullet('Danh sách đơn hàng gần đây với badge trạng thái.'),
      bullet('Thống kê theo khoảng thời gian (7 ngày, 30 ngày, 12 tháng).'),
      p(bold('Tình huống HẠN CHẾ:')),
      bullet('Không có thống kê sản phẩm bán chạy nhất (top products).'),
      bullet('Không có phân tích hành vi người dùng (funnel, bounce rate).'),
      bullet('Chưa có cảnh báo tồn kho thấp (low stock alert).'),

      h2('6.9. Nhóm chức năng: Wishlist'),
      p(bold('Tình huống HOÀN THÀNH:')),
      bullet('Thêm/xóa sản phẩm vào danh sách yêu thích.'),
      bullet('Xem danh sách yêu thích trong trang Profile.'),
      bullet('Chuyển từ wishlist sang giỏ hàng trực tiếp.'),
      p(bold('Tình huống HẠN CHẾ:')),
      bullet('Chỉ hoạt động với người dùng đã đăng nhập.'),
      bullet('Không có chia sẻ wishlist với người khác.'),

      h2('6.10. Tóm tắt chức năng theo mức độ hoàn thành'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          headerRow('Nhóm chức năng', 'Mức hoàn thành', 'Ghi chú'),
          dataRow('Đăng ký / Đăng nhập', '✅ ~85%', 'Thiếu xác minh email, rate limiting'),
          dataRow('Google OAuth', '✅ ~80%', 'Cần cấu hình .env đúng'),
          dataRow('Duyệt & tìm kiếm sản phẩm', '✅ ~90%', 'Tìm kiếm LIKE đơn giản'),
          dataRow('Quản lý sản phẩm (Admin)', '✅ ~85%', 'Thiếu import Excel, price history'),
          dataRow('Giỏ hàng', '✅ ~85%', 'Không validate stock khi thêm vào'),
          dataRow('Đặt hàng / Checkout', '✅ ~80%', 'Chưa tích hợp cổng thanh toán thật'),
          dataRow('Quản lý đơn hàng', '✅ ~88%', 'Thiếu in phiếu, tích hợp vận chuyển'),
          dataRow('Mã giảm giá', '✅ ~90%', 'Không hỗ trợ multi-coupon'),
          dataRow('Đánh giá sản phẩm', '✅ ~75%', 'Chưa verify purchase'),
          dataRow('Dashboard & Thống kê', '✅ ~80%', 'Thiếu top-products, low stock alert'),
          dataRow('Wishlist', '✅ ~90%', 'Chỉ cho user đăng nhập'),
          dataRow('Quản lý người dùng', '✅ ~85%', 'CRUD đầy đủ, thiếu bulk actions'),
          dataRow('Cài đặt hệ thống', '⚠️ ~60%', 'UI cơ bản, chưa email config'),
          dataRow('Thanh toán online thực', '❌ 0%', 'Chỉ COD + chuyển khoản thủ công'),
          dataRow('Thông báo email tự động', '❌ 0%', 'Chưa tích hợp SMTP / mail service'),
        ],
      }),
      new Paragraph({ text: '' }),
      pageBreak(),

      // ════════════════════════════ CHƯƠNG VII ════════════════════════════
      h('VII. ĐÁNH GIÁ VÀ HƯỚNG PHÁT TRIỂN'),
      h2('7.1. Kết quả đạt được'),
      bullet('Xây dựng thành công hệ thống TMĐT sách hoàn chỉnh với đầy đủ luồng mua hàng từ duyệt sản phẩm đến đặt hàng.'),
      bullet('Tách biệt rõ Frontend / Admin Panel / Backend — có thể phát triển độc lập và thay thế từng thành phần.'),
      bullet('Thiết kế CSDL quan hệ 15+ bảng, chuẩn hóa tốt, hỗ trợ đầy đủ các nghiệp vụ TMĐT.'),
      bullet('Áp dụng JWT authentication an toàn với access/refresh token pattern.'),
      bullet('Admin Panel với dashboard trực quan, quản lý đơn hàng và sản phẩm hiệu quả.'),
      bullet('Hệ thống coupon linh hoạt với nhiều loại điều kiện.'),
      h2('7.2. Hạn chế hiện tại'),
      bullet('Chưa tích hợp cổng thanh toán thực (VNPay, MoMo) — điểm quan trọng nhất cần bổ sung.'),
      bullet('Không có hệ thống gửi email tự động (xác nhận đơn hàng, reset mật khẩu).'),
      bullet('Tìm kiếm full-text chưa tối ưu — cần MySQL FULLTEXT index hoặc Elasticsearch.'),
      bullet('Stock không được quản lý real-time — có thể dẫn đến oversell.'),
      bullet('Không có CDN hay image optimization — ảnh sản phẩm lớn ảnh hưởng hiệu năng.'),
      h2('7.3. Hướng phát triển tiếp theo'),
      bullet('Tích hợp VNPay hoặc MoMo để hoàn thiện luồng thanh toán.'),
      bullet('Thêm hệ thống email tự động dùng PHPMailer hoặc dịch vụ SendGrid/Mailgun.'),
      bullet('Nâng cấp tìm kiếm: thêm MySQL FULLTEXT index, autocomplete suggestion.'),
      bullet('Thêm real-time notification cho admin khi có đơn hàng mới (WebSocket hoặc SSE).'),
      bullet('Tích hợp API vận chuyển (GHN, GHTK) để tự động tính phí và theo dõi đơn.'),
      bullet('Thêm tính năng loyalty points (điểm thưởng) cho khách hàng thân thiết.'),
      bullet('Chuyển backend sang Laravel/Symfony để có ORM, queue, cache đầy đủ hơn.'),
      bullet('Triển khai Docker để dễ dàng deploy lên cloud (AWS, GCP, hoặc VPS).'),
      pageBreak(),

      // ════════════════════════════ CHƯƠNG VIII ════════════════════════════
      h('VIII. KẾT LUẬN'),
      p(t('Dự án BookStore đã xây dựng thành công một hệ thống bán sách trực tuyến đầy đủ chức năng, có thể vận hành thực tế ở quy mô nhỏ và vừa. Hệ thống thể hiện khả năng tích hợp nhiều công nghệ hiện đại: React SPA, PHP REST API, MySQL, JWT authentication, và Google OAuth — phản ánh đúng xu hướng phát triển phần mềm web ngày nay.')),
      p(t('Thông qua quá trình phân tích và so sánh với các hệ thống thương mại lớn như Tiki và Fahasa, nhóm đã định hướng thiết kế sát với thực tế, đặc biệt ở các tính năng cốt lõi như giỏ hàng session, mã giảm giá linh hoạt, và trang quản trị đơn hàng.')),
      p(t('Những hạn chế hiện tại — chủ yếu về thanh toán online và gửi email — là những phần cần đầu tư thêm thời gian và tích hợp dịch vụ bên thứ ba, hoàn toàn có thể bổ sung trong giai đoạn phát triển tiếp theo.')),
      p(bold('Nhóm phát triển xin chân thành cảm ơn và mong nhận được nhận xét từ giảng viên hướng dẫn.')),
      new Paragraph({ text: '' }),
      new Paragraph({ text: '' }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: `Ngày ${new Date().getDate()} tháng ${new Date().getMonth()+1} năm ${new Date().getFullYear()}`, font: 'Times New Roman', size: 24, italics: true })],
      }),
    ],
  }],
})

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync('BAO_CAO_DU_AN.docx', buf)
  console.log('✅  BAO_CAO_DU_AN.docx đã được tạo thành công!')
})
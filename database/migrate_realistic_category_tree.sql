-- Seed danh muc sach cap 2 / cap 3 thuc te cho website nha sach
-- Chay sau schema_mysql.sql va cac migration tao cot categories.
-- Co the chay lai nhieu lan: moi slug chi duoc them neu chua ton tai.

-- Dam bao co danh muc goc Trinh Tham neu database cu chua co.
INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT NULL, 'Trinh Tham', 'Mystery and Detective', 'trinh-tham',
       'Sach trinh tham, hinh su va pha an.', 60, 1
WHERE NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'trinh-tham');

-- =========================
-- Tieu thuyet
-- =========================
INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Van hoc Viet Nam', 'Vietnamese Literature', 'van-hoc-viet-nam',
       'Tac pham tieu thuyet va van xuoi Viet Nam.', 10, 1
FROM categories c
WHERE c.slug = 'tieu-thuyet'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'van-hoc-viet-nam');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Truyen dai', 'Long-form Fiction', 'truyen-dai',
       'Tieu thuyet va truyen dai Viet Nam.', 10, 1
FROM categories c
WHERE c.slug = 'van-hoc-viet-nam'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'truyen-dai');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Truyen ngan', 'Short Stories', 'truyen-ngan',
       'Tap truyen ngan va tuyen tap truyen ngan.', 20, 1
FROM categories c
WHERE c.slug = 'van-hoc-viet-nam'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'truyen-ngan');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Van hoc nuoc ngoai', 'Foreign Literature', 'van-hoc-nuoc-ngoai',
       'Tac pham tieu thuyet va van hoc dich nuoc ngoai.', 20, 1
FROM categories c
WHERE c.slug = 'tieu-thuyet'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'van-hoc-nuoc-ngoai');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Tieu thuyet kinh dien', 'Classic Novels', 'tieu-thuyet-kinh-dien',
       'Nhung tac pham kinh dien cua van hoc the gioi.', 10, 1
FROM categories c
WHERE c.slug = 'van-hoc-nuoc-ngoai'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'tieu-thuyet-kinh-dien');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Tieu thuyet hien dai', 'Contemporary Novels', 'tieu-thuyet-hien-dai',
       'Tieu thuyet hien dai, duong dai va cac tac gia moi.', 20, 1
FROM categories c
WHERE c.slug = 'van-hoc-nuoc-ngoai'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'tieu-thuyet-hien-dai');

-- =========================
-- Kinh te
-- =========================
INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Quan tri kinh doanh', 'Business Management', 'quan-tri-kinh-doanh',
       'Sach quan tri, dieu hanh doanh nghiep va mo hinh kinh doanh.', 10, 1
FROM categories c
WHERE c.slug = 'kinh-te'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'quan-tri-kinh-doanh');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Khoi nghiep', 'Entrepreneurship', 'khoi-nghiep',
       'Sach ve khoi nghiep, go-to-market va xay dung san pham.', 10, 1
FROM categories c
WHERE c.slug = 'quan-tri-kinh-doanh'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'khoi-nghiep');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Lanh dao quan ly', 'Leadership and Management', 'lanh-dao-quan-ly',
       'Sach ve lanh dao, quan ly nhan su va van hanh doi ngu.', 20, 1
FROM categories c
WHERE c.slug = 'quan-tri-kinh-doanh'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'lanh-dao-quan-ly');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Tai chinh dau tu', 'Finance and Investing', 'tai-chinh-dau-tu',
       'Sach ve tai chinh ca nhan, dau tu va quan ly tien bac.', 20, 1
FROM categories c
WHERE c.slug = 'kinh-te'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'tai-chinh-dau-tu');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Tai chinh ca nhan', 'Personal Finance', 'tai-chinh-ca-nhan',
       'Sach ve tiet kiem, quan ly chi tieu va lap ke hoach tai chinh.', 10, 1
FROM categories c
WHERE c.slug = 'tai-chinh-dau-tu'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'tai-chinh-ca-nhan');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Chung khoan', 'Stock Market', 'chung-khoan',
       'Sach ve thi truong chung khoan, phan tich va chien luoc dau tu.', 20, 1
FROM categories c
WHERE c.slug = 'tai-chinh-dau-tu'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'chung-khoan');

-- =========================
-- Ky nang song
-- =========================
INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Ky nang nghe nghiep', 'Career Skills', 'ky-nang-nghe-nghiep',
       'Ky nang lam viec, thang tien va phat trien su nghiep.', 10, 1
FROM categories c
WHERE c.slug = 'ky-nang-song'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'ky-nang-nghe-nghiep');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Giao tiep', 'Communication', 'giao-tiep',
       'Sach ve giao tiep, thuyet trinh va dam phan.', 10, 1
FROM categories c
WHERE c.slug = 'ky-nang-nghe-nghiep'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'giao-tiep');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Quan ly thoi gian', 'Time Management', 'quan-ly-thoi-gian',
       'Sach ve nang suat ca nhan, sap xep cong viec va muc tieu.', 20, 1
FROM categories c
WHERE c.slug = 'ky-nang-nghe-nghiep'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'quan-ly-thoi-gian');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Phat trien ban than', 'Personal Development', 'phat-trien-ban-than',
       'Sach giup phat trien tu duy, cam xuc va thoi quen song.', 20, 1
FROM categories c
WHERE c.slug = 'ky-nang-song'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'phat-trien-ban-than');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Tu duy tich cuc', 'Positive Thinking', 'tu-duy-tich-cuc',
       'Sach ve thai do song, tu duy tich cuc va tinh than vuot kho.', 10, 1
FROM categories c
WHERE c.slug = 'phat-trien-ban-than'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'tu-duy-tich-cuc');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Thoi quen hieu qua', 'Effective Habits', 'thoi-quen-hieu-qua',
       'Sach ve xay dung thoi quen va ky luat ca nhan.', 20, 1
FROM categories c
WHERE c.slug = 'phat-trien-ban-than'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'thoi-quen-hieu-qua');

-- =========================
-- Khoa hoc
-- =========================
INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Khoa hoc tu nhien', 'Natural Sciences', 'khoa-hoc-tu-nhien',
       'Sach pho thong va chuyen sau ve cac nganh khoa hoc tu nhien.', 10, 1
FROM categories c
WHERE c.slug = 'khoa-hoc'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'khoa-hoc-tu-nhien');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Vat ly thien van', 'Physics and Astronomy', 'vat-ly-thien-van',
       'Sach ve vu tru, vat ly, thien van hoc va kham pha khong gian.', 10, 1
FROM categories c
WHERE c.slug = 'khoa-hoc-tu-nhien'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'vat-ly-thien-van');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Sinh hoc', 'Biology', 'sinh-hoc',
       'Sach ve su song, tien hoa, co the nguoi va the gioi tu nhien.', 20, 1
FROM categories c
WHERE c.slug = 'khoa-hoc-tu-nhien'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'sinh-hoc');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Cong nghe', 'Technology', 'cong-nghe',
       'Sach ve cong nghe, may tinh va doi moi so.', 20, 1
FROM categories c
WHERE c.slug = 'khoa-hoc'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'cong-nghe');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Tri tue nhan tao', 'Artificial Intelligence', 'tri-tue-nhan-tao',
       'Sach ve AI, machine learning va ung dung tri tue nhan tao.', 10, 1
FROM categories c
WHERE c.slug = 'cong-nghe'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'tri-tue-nhan-tao');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Lap trinh', 'Programming', 'lap-trinh',
       'Sach lap trinh, phat trien phan mem va ky thuat may tinh.', 20, 1
FROM categories c
WHERE c.slug = 'cong-nghe'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'lap-trinh');

-- =========================
-- Thieu nhi
-- =========================
INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Truyen thieu nhi', 'Children Stories', 'truyen-thieu-nhi',
       'Truyen tranh, truyen chu va tac pham cho thieu nhi.', 10, 1
FROM categories c
WHERE c.slug = 'thieu-nhi'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'truyen-thieu-nhi');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Truyen tranh', 'Comics', 'truyen-tranh',
       'Truyen tranh va manga phu hop voi lua tuoi thieu nhi.', 10, 1
FROM categories c
WHERE c.slug = 'truyen-thieu-nhi'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'truyen-tranh');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Truyen co tich', 'Fairy Tales', 'truyen-co-tich',
       'Co tich, ngu ngon va truyen dan gian cho tre em.', 20, 1
FROM categories c
WHERE c.slug = 'truyen-thieu-nhi'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'truyen-co-tich');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Giao duc thieu nhi', 'Children Education', 'giao-duc-thieu-nhi',
       'Sach giao duc som, ren luyen ky nang va hoc tap cho tre.', 20, 1
FROM categories c
WHERE c.slug = 'thieu-nhi'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'giao-duc-thieu-nhi');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Sach to mau', 'Coloring Books', 'sach-to-mau',
       'Sach to mau, ve tranh va hoat dong sang tao cho tre.', 10, 1
FROM categories c
WHERE c.slug = 'giao-duc-thieu-nhi'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'sach-to-mau');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Ky nang cho be', 'Life Skills for Kids', 'ky-nang-cho-be',
       'Sach ve ky nang song, ung xu va an toan cho tre em.', 20, 1
FROM categories c
WHERE c.slug = 'giao-duc-thieu-nhi'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'ky-nang-cho-be');

-- =========================
-- Trinh tham
-- =========================
INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Trinh tham co dien', 'Classic Detective', 'trinh-tham-co-dien',
       'Tac pham trinh tham co dien, suy luan va pha an.', 10, 1
FROM categories c
WHERE c.slug = 'trinh-tham'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'trinh-tham-co-dien');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Vu an pha an', 'Case Solving', 'vu-an-pha-an',
       'Sach ve cac vu an, manh moi va qua trinh pha an.', 10, 1
FROM categories c
WHERE c.slug = 'trinh-tham-co-dien'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'vu-an-pha-an');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Tham tu tu', 'Private Detective', 'tham-tu-tu',
       'Truyen ve tham tu, dieu tra tu nhan va suy luan logic.', 20, 1
FROM categories c
WHERE c.slug = 'trinh-tham-co-dien'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'tham-tu-tu');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Hinh su hien dai', 'Modern Crime Fiction', 'hinh-su-hien-dai',
       'Truyen hinh su hien dai, dieu tra va phap y.', 20, 1
FROM categories c
WHERE c.slug = 'trinh-tham'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'hinh-su-hien-dai');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Tam ly toi pham', 'Criminal Psychology', 'tam-ly-toi-pham',
       'Sach ve ho so toi pham, tam ly va dong co gay an.', 10, 1
FROM categories c
WHERE c.slug = 'hinh-su-hien-dai'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'tam-ly-toi-pham');

INSERT INTO categories (parent_id, name, name_en, slug, description, sort_order, is_active)
SELECT c.id, 'Dieu tra phap y', 'Forensic Investigation', 'dieu-tra-phap-y',
       'Sach ve phap y, hien truong va ky thuat dieu tra.', 20, 1
FROM categories c
WHERE c.slug = 'hinh-su-hien-dai'
  AND NOT EXISTS (SELECT 1 FROM categories x WHERE x.slug = 'dieu-tra-phap-y');

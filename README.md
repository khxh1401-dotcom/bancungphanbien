# Bạn cùng phản biện

Mô hình đối thoại với trí tuệ nhân tạo rèn luyện tư duy phản biện cho học sinh trung học phổ thông.

Dự án khoa học kĩ thuật năm học 2026–2027, lĩnh vực Khoa học xã hội và hành vi.

- Học sinh thực hiện: Phạm Gia Tường (lớp 12A12), Trương Minh Đăng (lớp 12A7)
- Giáo viên hướng dẫn: La Thị Ngọc Bích
- Trường THPT Phan Văn Trị, thành phố Cần Thơ

## Trang làm gì

Trang soạn sẵn câu lệnh biến ChatGPT, Gemini hoặc Copilot thành một người bạn tranh luận. AI không làm bài hộ: AI hỏi lại, góp ý và phản bác theo quy trình 5 bước (Phát biểu, Phân tích, Phản hồi, Phản bác, Phát huy) để học sinh tự suy nghĩ sắc bén hơn.

Trang có 6 thẻ: Luyện với AI, Chủ đề, Trò chơi, Tự kiểm tra, Trên lớp, Cơ sở khoa học. Đây là trang tĩnh, chạy hoàn toàn trên trình duyệt và không thu thập dữ liệu cá nhân; mọi lựa chọn chỉ lưu trên trình duyệt của người dùng.

## Các tệp

| Tệp | Nội dung |
| --- | --- |
| `index.html` | Nội dung các thẻ của trang |
| `style.css` | Giao diện: màu, phông chữ, bố cục, nền tối |
| `thong-tin.js` | Tên học sinh, giáo viên, trường, năm học (sửa tên ở đây) |
| `core.js` | Soạn câu lệnh gửi AI: 7 vai, 3 mức, 103 chủ đề, bảng kiểm lập luận |
| `app.js` | Điều khiển trang: chuyển thẻ, sao chép, trò chơi, tự kiểm tra, đồng hồ trên lớp |
| `favicon.svg` | Biểu tượng trên thẻ trình duyệt |

## Sửa tên học sinh

Mở tệp `thong-tin.js`, bấm biểu tượng bút chì, sửa dòng `hocSinh`, rồi bấm **Commit changes**. GitHub tự dựng lại trang; tải lại trang để thấy tên mới.

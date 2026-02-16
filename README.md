# firebase1 - BlueStock ERP Demo

Giao diện quản lý kho tiếng Việt theo phong cách doanh nghiệp với tông xanh dương trắng pastel.

## Chức năng chính

- Menu điều hướng: **Tổng quan, Tồn kho, Nhập, Xuất, Lịch sử nhập xuất, Bán hàng, Nhà cung cấp, Cấu hình danh mục**.
- Cập nhật sản phẩm đầy đủ các trường:
  - SKU, tên sản phẩm, thương hiệu, phân loại.
  - Nếu phân loại là **Lọc** thì hiển thị thêm trường **OEM**.
  - Số lượng, ngưỡng giới hạn, giá, vị trí.
  - Ảnh sản phẩm: hỗ trợ **upload trực tiếp** hoặc **chụp ảnh** từ thiết bị.
- Tổng quan hiển thị toàn bộ sản phẩm và tìm kiếm theo **SKU/tên sản phẩm**.
- Nghiệp vụ nhập/xuất kho và theo dõi lịch sử nhập xuất.
- Tab bán hàng: chọn nhiều sản phẩm trong một đơn và mở bản in (Save as PDF).
- Cấu hình cho phép thêm/bớt thương hiệu và phân loại.

## Chạy dự án

```bash
python3 -m http.server 4173
```

Mở trình duyệt tại `http://localhost:4173`.

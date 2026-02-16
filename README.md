# firebase1

Giao diện quản lý kho theo chuẩn doanh nghiệp (demo front-end):

- Menu điều hướng chính.
- Quản lý thêm/bớt sản phẩm với các trường: SKU, tên sản phẩm, thương hiệu, phân loại (nếu là **Lọc** có thêm trường OEM), số lượng, ngưỡng giới hạn, giá, vị trí, hình ảnh (upload trực tiếp hoặc chụp ảnh).
- Tab nghiệp vụ: **Nhập**, **Xuất**, **Lịch sử nhập xuất**.
- Tab **Tổng quan**: hiển thị tất cả sản phẩm và chỉ số tồn kho.
- Tab **Bán hàng**: tạo giao dịch bán và tự động trừ tồn.

## Chạy nhanh

```bash
python3 -m http.server 4173
```

Mở trình duyệt: `http://localhost:4173`

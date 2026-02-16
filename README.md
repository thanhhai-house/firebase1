# Enterprise Warehouse Pro

Web quản lý kho theo phong cách doanh nghiệp (dashboard KPI, quản lý SKU, nhập/xuất kho, cảnh báo tồn thấp, lịch sử giao dịch và xuất CSV).

## Chạy local

```bash
python3 -m http.server 8080
```

Mở: `http://localhost:8080`

## Deploy Netlify

### Cách 1: Netlify Drop (nhanh nhất)
1. Vào https://app.netlify.com/drop
2. Kéo thả toàn bộ thư mục project này.
3. Netlify sẽ cấp URL public ngay.

### Cách 2: Netlify CLI
```bash
npm i -g netlify-cli
netlify login
netlify deploy --prod --dir .
```

`netlify.toml` đã cấu hình publish thư mục gốc.

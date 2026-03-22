# 🎬 VidLoad Pro - Backend API

API tải video hàng loạt từ TikTok, YouTube, Facebook, Douyin.

## Tính năng
- Scan toàn bộ video của 1 kênh chỉ bằng @username
- Hỗ trợ TikTok, YouTube, Facebook Profile, Fanpage
- Tải hàng loạt + xuất file ZIP
- Giới hạn Free 50 video/tháng, Pro không giới hạn

## Tech Stack
- Node.js + Express
- yt-dlp
- Deploy: Render.com

## API Endpoints
- GET  /                  → Health check
- POST /scan-channel      → Scan kênh
- POST /download-video    → Tải 1 video
- GET  /download-zip      → Xuất ZIP
- POST /cleanup           → Xóa file tạm

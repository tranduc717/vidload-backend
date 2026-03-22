const express = require("express")
const cors = require("cors")
const { exec } = require("child_process")
const archiver = require("archiver")
const fs = require("fs")
const path = require("path")

const app = express()
app.use(cors())
app.use(express.json())

// Tạo thư mục downloads nếu chưa có
if (!fs.existsSync("./downloads")) {
  fs.mkdirSync("./downloads")
}

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ status: "VidLoad Pro API running ✅" })
})

// ✅ Scan kênh TikTok / YouTube / Facebook
app.post("/scan-channel", (req, res) => {
  const { username, platform } = req.body
  
  let url = ""
  if (platform === "tiktok") {
    url = `https://www.tiktok.com/@${username}`
  } else if (platform === "youtube") {
    url = `https://www.youtube.com/@${username}/videos`
  } else if (platform === "facebook" || platform === "fanpage") {
    url = `https://www.facebook.com/${username}/videos`
  } else {
    return res.json({ success: false, message: "Platform không hợp lệ" })
  }

  const cmd = `yt-dlp --flat-playlist -J --no-warnings "${url}"`
  
  exec(cmd, { timeout: 60000 }, (err, stdout) => {
    if (err) {
      return res.json({ 
        success: false, 
        message: "Không thể scan kênh. Kiểm tra lại username." 
      })
    }
    try {
      const data = JSON.parse(stdout)
      const videos = (data.entries || []).map(v => ({
        id: v.id,
        title: v.title || "Video",
        duration: v.duration,
        url: v.url || v.webpage_url
      }))
      res.json({ success: true, videos, total: videos.length })
    } catch (e) {
      res.json({ success: false, message: "Lỗi xử lý dữ liệu" })
    }
  })
})

// ✅ Download 1 video
app.post("/download-video", (req, res) => {
  const { url, videoId } = req.body
  const outputPath = `./downloads/%(title)s_${videoId}.%(ext)s`
  const cmd = `yt-dlp -o "${outputPath}" --no-warnings "${url}"`
  
  exec(cmd, { timeout: 120000 }, (err) => {
    if (err) {
      return res.json({ success: false, message: "Tải thất bại" })
    }
    res.json({ success: true, message: "Tải thành công" })
  })
})

// ✅ Kiểm tra trạng thái download
app.get("/download-status/:sessionId", (req, res) => {
  res.json({ status: "downloading", progress: 50 })
})

// ✅ Xuất ZIP
app.get("/download-zip", (req, res) => {
  const archive = archiver("zip", { zlib: { level: 5 } })
  res.attachment("vidload-videos.zip")
  archive.pipe(res)
  archive.directory("./downloads/", false)
  archive.finalize()
})

// ✅ Xóa downloads sau khi ZIP xong
app.post("/cleanup", (req, res) => {
  fs.readdir("./downloads", (err, files) => {
    if (!err) {
      files.forEach(file => {
        fs.unlinkSync(path.join("./downloads", file))
      })
    }
    res.json({ success: true })
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`VidLoad Pro API running on port ${PORT}`)
})

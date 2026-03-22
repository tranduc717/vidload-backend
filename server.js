const express = require("express")
const cors = require("cors")
const { exec } = require("child_process")
const archiver = require("archiver")
const fs = require("fs")
const path = require("path")

const app = express()
app.use(cors())
app.use(express.json())

if (!fs.existsSync("./downloads")) {
  fs.mkdirSync("./downloads")
}

app.get("/", (req, res) => {
  res.json({ status: "VidLoad Pro API running OK" })
})

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
    return res.json({ success: false, message: "Platform khong hop le" })
  }

  // Thêm --user-agent và --no-check-certificate để bypass bot detection
  const cmd = `yt-dlp --flat-playlist -J --no-warnings --no-check-certificates --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${url}"`

  exec(cmd, { timeout: 90000 }, (err, stdout, stderr) => {
    if (err) {
      console.log("SCAN ERROR:", err.message)
      console.log("STDERR:", stderr)
      return res.json({
        success: false,
        message: "Khong the scan kenh: " + err.message
      })
    }
    try {
      const data = JSON.parse(stdout)
      const videos = (data.entries || []).map(v => ({
        id: v.id,
        title: v.title || "Video",
        duration: v.duration || null,
        url: v.url || v.webpage_url || ""
      }))
      console.log("SCAN OK:", videos.length, "videos found")
      res.json({ success: true, videos, total: videos.length })
    } catch (e) {
      console.log("PARSE ERROR:", e.message)
      console.log("RAW OUTPUT:", stdout.substring(0, 500))
      res.json({ success: false, message: "Loi xu ly du lieu" })
    }
  })
})

app.post("/download-video", (req, res) => {
  const { url } = req.body
  const cmd = `yt-dlp -o "./downloads/%(title)s.%(ext)s" --no-warnings --no-check-certificates "${url}"`

  exec(cmd, { timeout: 180000 }, (err) => {
    if (err) {
      return res.json({ success: false, message: "Tai that bai" })
    }
    res.json({ success: true })
  })
})

app.get("/download-zip", (req, res) => {
  const archive = archiver("zip", { zlib: { level: 5 } })
  res.attachment("vidload-videos.zip")
  archive.pipe(res)
  archive.directory("./downloads/", false)
  archive.finalize()
})

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
  console.log("VidLoad API running on port " + PORT)
})

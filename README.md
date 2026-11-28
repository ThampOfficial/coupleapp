# บันทึกของเราสองคน (Couple App)

เว็บแอปไดอารี่สำหรับคู่รัก (ภาษาไทย) เก็บข้อมูลใน Google Sheet ผ่าน Google Apps Script

- นับว่าคบกันมากี่วัน / กี่ปี กี่เดือน กี่วัน และนับวันแต่งงาน
- ไทม์ไลน์: เจอกัน, วันนี้ทำอะไร, ไปเที่ยว, ครบรอบ, แต่งงาน, อื่นๆ พร้อมรูป
- แผนที่สถานที่ที่ไปด้วยกัน
- วันสำคัญ: ครบ 100 / 500 / 1,000 วัน, ครบรอบปี, ครบรอบแต่งงาน

## เปิดแอป
https://thampofficial.github.io/coupleapp/ (ต้องใส่รหัสผ่าน)

แอปอยู่ที่ GitHub Pages (`index.html`) เก็บข้อมูลล่าสุดไว้ในเครื่องเพื่อเปิดได้ทันที แล้วดึงข้อมูลใหม่จาก Google Sheet ผ่าน Apps Script

## ไฟล์
- `index.html` — หน้าแอป: ไทม์ไลน์ ค้นหา แผนที่ วันสำคัญ, ดึงวันที่และ GPS จากรูปตอนอัปโหลด
- `Code.gs` — API บน Google Apps Script อ่าน/เขียน Google Sheet "Couple App Data" และเก็บรูปในโฟลเดอร์ Drive "Couple App/Photos" ทุกคำสั่งต้องมีรหัสผ่าน
- `icon-v2.svg`, `icon-*.png`, `apple-touch-icon-v2.png`, `manifest.webmanifest` — ไอคอน (กด "เพิ่มไปยังหน้าจอโฮม" ได้)

## ตั้งค่า Apps Script
1. วาง `Code.gs` ทับไฟล์เดิม (ไม่ต้องมีไฟล์อื่น) แล้ว Save
2. Deploy → Manage deployments → ✏️ → Version: New version → Deploy (ลิงก์เดิม)
3. ถ้าลิงก์ /exec เปลี่ยน ให้แก้ค่า `API` ใน `index.html`

รหัสผ่านเก็บในแท็บ Settings ของ Google Sheet (แถว `password`) ไม่ได้อยู่ใน repo นี้

ข้อมูล: แท็บ `Moments` (1 แถว = 1 ความทรงจำ, คอลัมน์ photos = Drive file id คั่นด้วยจุลภาค) และแท็บ `Settings`


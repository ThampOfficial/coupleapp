# บันทึกของเราสองคน (Couple App)

เว็บแอปไดอารี่สำหรับคู่รัก (ภาษาไทย) เก็บข้อมูลใน Google Sheet ผ่าน Google Apps Script

- นับว่าคบกันมากี่วัน / กี่ปี กี่เดือน กี่วัน และนับวันแต่งงาน
- ไทม์ไลน์: เจอกัน, วันนี้ทำอะไร, ไปเที่ยว, ครบรอบ, แต่งงาน, อื่นๆ พร้อมรูป
- แผนที่สถานที่ที่ไปด้วยกัน
- วันสำคัญ: ครบ 100 / 500 / 1,000 วัน, ครบรอบปี, ครบรอบแต่งงาน

## เปิดแอป
- https://thampofficial.github.io/coupleapp/ (หน้านี้ฝังเว็บแอปไว้)
- ลิงก์ตรง: https://script.google.com/macros/s/AKfycbwtg8iBaA7i9IR8wxWoCprGgzy8Lz_LzkLIGI4mblSQGPFDREN-REvHu636-VXhmb00xw/exec

## ไฟล์
- `Code.gs` — ฝั่งเซิร์ฟเวอร์ อ่าน/เขียน Google Sheet "Couple App Data" และเก็บรูปในโฟลเดอร์ Drive "Couple App/Photos"
- `Index.html` — หน้าแอป มีช่องค้นหา (ตอนอัปรูปจะดึงวันที่ถ่ายและพิกัด GPS จากรูปให้อัตโนมัติ)
- `index.html` — หน้า GitHub Pages ที่ฝังลิงก์ Apps Script

## ติดตั้ง
1. เปิด https://script.google.com → New project
2. วาง `Code.gs` ทับไฟล์ Code.gs เดิม
3. กด + → HTML ตั้งชื่อ `Index` แล้ววาง `Index.html`
4. Deploy → New deployment → Web app
   - Execute as: **Me**
   - Who has access: **Anyone**
5. อนุญาตสิทธิ์ แล้วคัดลอกลิงก์ Web app ส่งให้แฟน

ข้อมูล: แท็บ `Moments` (1 แถว = 1 ความทรงจำ, คอลัมน์ photos = Drive file id คั่นด้วยจุลภาค) และแท็บ `Settings`

## อัปเดตโค้ด (ลิงก์เดิม)
Deploy → Manage deployments → ✏️ → Version: New version → Deploy

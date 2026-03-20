# PRD — SPUBUS BIZ CONTENT: หน้าสร้างคอนเทนต์ AI

**Product**: SPUBUS BIZ CONTENT — AI-Powered Content Generator
**Page**: `/content`
**URL**: https://biz-content.vercel.app/content
**Version**: 1.0
**Date**: 20 มีนาคม 2569
**Owner**: คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม

---

## 1. ภาพรวมผลิตภัณฑ์ (Product Overview)

หน้า Content เป็นเครื่องมือ AI สำหรับสร้างแคปชั่น/ข้อความโพสต์โซเชียลมีเดีย ออกแบบมาเพื่อทีม PR และบุคลากรของคณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม ช่วยให้สร้างคอนเทนต์โปรโมทหลักสูตร กิจกรรม และข่าวสารได้รวดเร็วและมีคุณภาพระดับมืออาชีพ

---

## 2. กลุ่มผู้ใช้เป้าหมาย (Target Users)

| กลุ่มผู้ใช้ | รายละเอียด |
|---|---|
| **ทีม PR / สื่อสารองค์กร** | สร้างแคปชั่นโปรโมทหลักสูตร กิจกรรม อีเวนต์ |
| **อาจารย์ / เจ้าหน้าที่คณะ** | เขียนโพสต์ประชาสัมพันธ์สาขาวิชา |
| **ทีมรับสมัครนักศึกษา** | สร้างคอนเทนต์ดึงดูดนักศึกษาใหม่ |
| **ทีมกิจการนักศึกษา** | โปรโมทกิจกรรม โครงการ เวิร์กชอป |

---

## 3. User Flow หลัก

```
ผู้ใช้ Login (Google / Email)
        │
        ▼
   เข้าหน้า /content
        │
        ▼
┌─────────────────────────────────────────────────────┐
│  ฝั่งซ้าย: ฟอร์มกรอกข้อมูล                           │
│  1. เลือกหัวข้อโพสต์ (Headline)                       │
│  2. เลือกหมวดหมู่ / สาขาวิชา                         │
│  3. เลือกแพลตฟอร์มปลายทาง                           │
│  4. เลือกโทนการเขียน                                 │
│  5. อัปโหลดรูปภาพ (Optional)                         │
│     └── AI ช่วยอ่านจากรูปภาพ (OCR)                   │
│  6. กรอก/แก้ไขประเด็นสำคัญ                           │
│  7. กดปุ่ม "สร้างแคปชั่น"                              │
└─────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────┐
│  ฝั่งขวา: แสดงผลลัพธ์                                 │
│  1. Preview แคปชั่นแบบ Social Post                    │
│  2. คัดลอก / แก้ไข / สร้างใหม่                        │
│  3. ลิงก์ไปโพสต์บนแพลตฟอร์มจริง                      │
│  4. บันทึกลง Memory Box (3 ช่อง)                     │
│  5. Tips แนะนำการโพสต์                               │
└─────────────────────────────────────────────────────┘
```

---

## 4. ฟีเจอร์ทั้งหมด (Features Breakdown)

### 4.1 ระบบ Authentication

| รายการ | รายละเอียด |
|---|---|
| **Provider** | Supabase Auth |
| **วิธีล็อกอิน** | Google OAuth / Email + Password |
| **การลงทะเบียน** | สมัครด้วย Email + ยืนยันอีเมล หรือ Google sign-in อัตโนมัติ |
| **Profile** | สร้าง/อัปเดตอัตโนมัติจาก Google metadata (ชื่อ, รูปโปรไฟล์) |
| **Redirect** | หากยังไม่ล็อกอิน → redirect ไป `/login` |
| **Token** | ใช้ Supabase access_token แนบ header `Authorization: Bearer <token>` ทุก API call |

---

### 4.2 ฟอร์มสร้างคอนเทนต์ (ContentForm)

#### 4.2.1 หัวข้อโพสต์ (Headline) — `required`

Dropdown เลือกเป้าหมายของคอนเทนต์ มีทั้งหมด 7 ตัวเลือก:

| # | หัวข้อ |
|---|---|
| 1 | โปรโมทหลักสูตรและเปิดรับสมัครนักศึกษาใหม่ |
| 2 | แนะนำจุดเด่นและบรรยากาศการเรียนการสอนของคณะ |
| 3 | แชร์ความสำเร็จและประสบการณ์ของศิษย์เก่า/นักศึกษาปัจจุบัน |
| 4 | ประชาสัมพันธ์กิจกรรม โครงการ หรือเวิร์กชอปของคณะ |
| 5 | ให้ความรู้ ทริคทางธุรกิจ หรือเทรนด์ใหม่ๆ ที่น่าสนใจ |
| 6 | เชิญชวนร่วมงาน Open House และแนะแนวการศึกษา |
| 7 | ประกาศข่าวสารและความร่วมมือกับองค์กรธุรกิจชั้นนำ |

#### 4.2.2 หมวดหมู่ / สาขาวิชา (Category) — `required`

Dropdown เลือกสาขา มีทั้งหมด 7 ตัวเลือก:

| # | หมวดหมู่ | Hashtag ที่ผูกอัตโนมัติ |
|---|---|---|
| 1 | คณะบริหารธุรกิจ (ภาพรวม) | #เปลี่ยนฝันปั้นธุรกิจ #คณะบริหารธุรกิจ #SPUBUS #SPU |
| 2 | สาขาการบริหารและการจัดการสมัยใหม่ | + #สาขาวิชาการบริหารและการจัดการสมัยใหม่ |
| 3 | สาขาการตลาดดิจิทัล | + #สาขาวิชาการตลาดดิจิทัล |
| 4 | สาขาธุรกิจระหว่างประเทศ | + #สาขาวิชาธุรกิจระหว่างประเทศ |
| 5 | สาขาบริหารธุรกิจ | + #สาขาวิชาบริหารธุรกิจ |
| 6 | ศูนย์บ่มเพาะธุรกิจ | #BusinessIncubator #ศูนย์บ่มเพาะธุรกิจ |
| 7 | กิจการนักศึกษา | #StudentAffairs #กิจการนักศึกษา |

> ระบบจะแนบ Hashtag ท้ายโพสต์อัตโนมัติตามหมวดหมู่ที่เลือก

#### 4.2.3 แพลตฟอร์มปลายทาง (Platform)

Radio button แบบ visual เลือก 1 จาก 6 แพลตฟอร์ม:

| แพลตฟอร์ม | สไตล์การเขียนที่ AI ปรับ |
|---|---|
| **Facebook** | ยาวปานกลาง เนื้อหาครบ Emoji เล็กน้อย น่าเชื่อถือ |
| **LINE** | สั้น กระชับ Bullet points เป็นกันเอง สำหรับบรอดแคสต์ |
| **Instagram** | ไลฟ์สไตล์ สั้นกระชับ ดึงดูดสายตา ไม่ใส่ลิงก์ |
| **TikTok** | สั้นมาก Hook 3 วินาที สคริปต์/แคปชั่นยั่วกิเลส |
| **Lemon8** | วัยรุ่นนักรีวิว สดใส น่ารัก ฮาวทู/เคล็ดลับ |
| **YouTube** | Community Post / Shorts Script ฮุคทันที กระตุ้น Engagement |

#### 4.2.4 โทนการเขียน (Tone & Style)

Radio button แบบ grid เลือก 1 จาก 4 โทน:

| โทน | ไอคอน | ลักษณะ |
|---|---|---|
| ทางการ น่าเชื่อถือ | 💼 | มืออาชีพ ทันสมัย Emoji เท่าที่จำเป็น |
| สนุกสนาน เป็นกันเอง | 🎉 | วัยรุ่น ครีเอทีฟ Emoji สนุก |
| สั้น กระชับ ตรงประเด็น | ⚡ | Executive Summary ไม่มีน้ำ |
| เน้นอิโมจิ สีสันสะดุดตา | 🎨 | Emoji ทุกบรรทัด ดึงดูดสายตา |

#### 4.2.5 อัปโหลดรูปภาพ (Media Upload) — `optional`

| รายการ | รายละเอียด |
|---|---|
| **รูปแบบไฟล์** | รองรับทุก image/* (PNG, JPG, GIF, WebP ฯลฯ) |
| **วิธีอัปโหลด** | คลิกเลือกไฟล์ หรือ ลาก & วาง (Drag & Drop) |
| **Preview** | แสดงภาพตัวอย่างทันทีหลังอัปโหลด |
| **ลบภาพ** | ปุ่ม X มุมขวาบนของภาพ |
| **หมายเหตุ** | รูปภาพใช้แสดง Preview เท่านั้น ไม่ส่งผลต่อข้อความ AI (ยกเว้นใช้ฟีเจอร์ OCR) |

#### 4.2.6 AI ช่วยอ่านจากรูปภาพ (AI Image OCR)

| รายการ | รายละเอียด |
|---|---|
| **แสดงเมื่อ** | อัปโหลดรูปภาพแล้ว — กล่อง AI ปรากฏข้างรูป (side-by-side) |
| **การทำงาน** | ส่ง Base64 image → Gemini Vision API → สกัดข้อความสำคัญ |
| **ข้อมูลที่ดึง** | ชื่องาน, ไฮไลท์, วิทยากร, วันที่, เวลา, สถานที่ |
| **ผลลัพธ์** | อัตโนมัติเติมลงช่อง "ประเด็นสำคัญ" พร้อม badge "ผลลัพธ์จาก AI" |
| **AI Model** | Google Gemini 2.5 Flash (Vision) |
| **Timeout** | สูงสุด 30 วินาที |

#### 4.2.7 ประเด็นสำคัญ (Key Points) — `optional`

| รายการ | รายละเอียด |
|---|---|
| **Input type** | Textarea (ขยายจาก 3 เป็น 6 บรรทัดเมื่อมีข้อมูล) |
| **แหล่งข้อมูล** | พิมพ์เอง หรือ ได้จาก AI OCR อัตโนมัติ |
| **ผลต่อ AI** | AI จะนำเนื้อหานี้ไปตีความบริบทและเขียนโพสต์ให้ตรงประเด็น |

#### 4.2.8 ปุ่มสร้างแคปชั่น (Generate)

| รายการ | รายละเอียด |
|---|---|
| **เงื่อนไข** | ต้องเลือก Headline + Category ก่อน |
| **สถานะระหว่างสร้าง** | แสดง spinner + "Gemini กำลังคิดและเขียนเนื้อหา..." |
| **AI Model** | Google Gemini 2.5 Flash |
| **Branding** | ทุกโพสต์ขึ้นต้นด้วย "SPUBUS บริหารธุรกิจ ม.ศรีปทุม" |
| **Hashtag** | แนบ Hashtag ยืนพื้นท้ายโพสต์อัตโนมัติตามหมวดหมู่ |

---

### 4.3 หน้าแสดงผลลัพธ์ (ContentPreview)

#### 4.3.1 Social Post Preview

| รายการ | รายละเอียด |
|---|---|
| **รูปแบบ** | จำลอง Social Media Post พร้อม Avatar "SPU", ชื่อ "SPU Business School" |
| **Platform badge** | แสดงไอคอนแพลตฟอร์มที่เลือก |
| **Markdown render** | รองรับ Markdown ด้วย ReactMarkdown |
| **Character count** | นับและแสดงจำนวนตัวอักษรทั้งหมด (รวม Hashtag) |
| **รูปภาพ** | แสดงรูปที่อัปโหลดใต้ข้อความ (เหมือน Social Post จริง) |

#### 4.3.2 การจัดการข้อความ

| ฟีเจอร์ | รายละเอียด |
|---|---|
| **แก้ไขข้อความ** | คลิกที่ข้อความ → เปลี่ยนเป็น textarea แก้ไขได้ (inline editing) |
| **Edit hint** | Hover แสดง badge "แก้ไข" สีแดง มุมขวาบน |
| **คัดลอก** | ปุ่ม "คัดลอก" → copy ข้อความทั้งหมดไป clipboard |
| **สร้างใหม่** | ปุ่ม "สร้างใหม่" → เรียก AI สร้างเวอร์ชันใหม่โดยใช้ข้อมูลเดิม |
| **โพสต์บนแพลตฟอร์ม** | ปุ่มลิงก์ไปหน้า post ของแพลตฟอร์มที่เลือก (เปิดแท็บใหม่) |

---

### 4.4 การจัดการ Content (ContentManagement)

| ฟีเจอร์ | รายละเอียด |
|---|---|
| **ล้างฟอร์ม** | ปุ่ม "เริ่มสร้างโพสต์ใหม่ (Clear)" — รีเซ็ตทุกฟิลด์ |
| **ไปแพลตฟอร์ม** | ลิงก์ไปหน้าล็อกอิน/โพสต์ของแพลตฟอร์มที่เลือก |
| **รองรับ** | Facebook, LINE, Instagram, TikTok, Lemon8 |

---

### 4.5 กล่องฝากคอนเทนต์ (Memory Box)

| รายการ | รายละเอียด |
|---|---|
| **จำนวนช่อง** | 3 ช่อง (Slot 1, 2, 3) |
| **บันทึก** | เก็บทั้งข้อความ + รูปภาพ + platform + category |
| **เรียกคืน** | โหลดข้อมูลจาก slot กลับมาแก้ไขต่อ |
| **ลบ** | ลบข้อมูลใน slot ทิ้ง |
| **Storage** | Supabase Database (API `/api/saved-contents`) |
| **ข้อมูลต่อ user** | แยกตาม user_id — แต่ละคนมี 3 slot ของตัวเอง |

---

### 4.6 Tips แนะนำ (ContentTips)

แสดงเคล็ดลับการโพสต์คอนเทนต์แบบ static:
- เวลาทองคำสำหรับ Facebook (8-9 AM, 12 PM)
- กฎ 3 วินาทีของ IG/TikTok
- เทคนิคถามนำเพิ่ม Engagement

---

## 5. สถาปัตยกรรมระบบ (Technical Architecture)

### 5.1 Tech Stack

| Layer | เทคโนโลยี |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 18 |
| **Styling** | CSS (globals.css) |
| **AI Engine** | Google Gemini 2.5 Flash API |
| **Auth** | Supabase Auth (Google OAuth + Email/Password) |
| **Database** | Supabase PostgreSQL |
| **Hosting** | Vercel |
| **UI Icons** | Lucide React |
| **Notifications** | React Hot Toast |
| **Markdown** | react-markdown |

### 5.2 API Endpoints

#### `POST /api/generate` — สร้างแคปชั่น AI

| รายการ | รายละเอียด |
|---|---|
| **Auth** | Bearer token (required) |
| **Request body** | `{ title, category, platform, tone, keyPoints }` |
| **Validation** | title, category, platform, tone ต้องไม่ว่าง |
| **AI Model** | `gemini-2.5-flash` |
| **Response** | `{ content: "ข้อความที่ AI สร้าง" }` |
| **Logging** | บันทึกลง `generation_logs` table (non-blocking) |
| **Error handling** | 401 Unauthorized, 400 Bad Request, 429 Rate Limit, 500 Server Error |

#### `POST /api/extract` — AI อ่านข้อความจากรูปภาพ (OCR)

| รายการ | รายละเอียด |
|---|---|
| **Auth** | Bearer token (required) |
| **Request body** | `{ imageBase64, mimeType }` |
| **AI Model** | `gemini-2.5-flash` (Vision) |
| **Max Duration** | 30 วินาที |
| **Response** | `{ text: "ข้อความที่สกัดได้" }` |
| **Error handling** | 401 Unauthorized, 400 Missing data, 429 Rate Limit, 500 Server Error |

#### `GET/POST/DELETE /api/saved-contents` — Memory Box

| Method | รายละเอียด |
|---|---|
| **GET** | ดึง 3 slots ของ user |
| **POST** | บันทึก content + image + metadata ลง slot |
| **DELETE** | ลบ slot ที่ระบุ (`?slot=0,1,2`) |

### 5.3 Database Tables

| Table | คอลัมน์สำคัญ | หมายเหตุ |
|---|---|---|
| `profiles` | id, email, full_name, avatar_url, role | สร้างอัตโนมัติตอน login |
| `generation_logs` | user_id, platform, category, tone, title, used_image, used_ocr | Log การใช้งาน AI |
| `saved_contents` | user_id, slot_index, content_text, image_url, platform, category | Memory Box |

---

## 6. AI Prompt Engineering

### 6.1 Content Generation Prompt

ระบบใช้ Prompt ที่ออกแบบละเอียดเพื่อให้ AI สร้างคอนเทนต์คุณภาพสูง:

| กฎ | รายละเอียด |
|---|---|
| **Persona** | นักเขียนคอนเทนต์องค์กรระดับท็อป |
| **เริ่มต้น** | ทุกโพสต์ขึ้นต้นด้วย "SPUBUS บริหารธุรกิจ ม.ศรีปทุม" |
| **ห้ามใช้ Markdown** | ไม่ใช้ * หรือ ** ในเนื้อหา |
| **ห้ามเกริ่น AI** | ไม่พูด "ได้เลยครับ นี่คือ..." |
| **Layout** | Emoji นำหน้าบรรทัด (ห้ามท้ายประโยค), Bullet point ด้วย Emoji |
| **Smart context** | ถ้ามีวันที่/เวลา/สถานที่ → เขียนเป็นประกาศอีเวนต์ / ถ้าไม่มี → เขียนเป็นโปรโมต |
| **ห้าม placeholder** | ห้ามเขียน "ไม่มีข้อมูล", "TBA", "-" |
| **Hashtag** | แนบ Hashtag ยืนพื้นจาก `CATEGORY_TAGS` ท้ายโพสต์เสมอ |
| **CTA** | ต้องมี Call to Action ชัดเจนตอนท้าย |

### 6.2 Image Extraction Prompt

สั่ง AI ให้สกัดข้อมูลจากโปสเตอร์:
- ชื่องาน, ไฮไลท์ (1 ประโยค), ชื่อวิทยากร, วันที่, เวลา, สถานที่
- ข้ามหัวข้อที่ไม่มีข้อมูลในภาพ (ห้ามเขียน "ไม่มีข้อมูล")

---

## 7. Layout & UI Design

### 7.1 โครงสร้างหน้า

```
┌──────────────────────────────────────────────────────┐
│  Navbar (โลโก้ SPU BUS + เมนู: หน้าหลัก, Content,    │
│  Poster + User avatar/logout)                        │
├──────────────────────────────────────────────────────┤
│  Hero Header: "SPUBUS BIZ CONTENT"                   │
│  Sub: "AI-Powered Content Generator for SPU..."      │
├─────────────────────┬────────────────────────────────┤
│                     │                                │
│   Form Column       │   Preview Column               │
│   (ฝั่งซ้าย)         │   (ฝั่งขวา)                     │
│                     │                                │
│   ┌───────────────┐ │   ┌────────────────────────┐   │
│   │ ContentForm   │ │   │ ContentPreview         │   │
│   │               │ │   │ (Social Post Preview)  │   │
│   │ - Headline    │ │   └────────────────────────┘   │
│   │ - Category    │ │                                │
│   │ - Platform    │ │   ┌────────────────────────┐   │
│   │ - Tone        │ │   │ ContentManagement      │   │
│   │ - Image + OCR │ │   │ (Clear / Go to Platform)│  │
│   │ - Key Points  │ │   └────────────────────────┘   │
│   │ - Generate    │ │                                │
│   └───────────────┘ │   ┌────────────────────────┐   │
│                     │   │ MemoryBox (3 Slots)    │   │
│                     │   └────────────────────────┘   │
│                     │                                │
│                     │   ┌────────────────────────┐   │
│                     │   │ ContentTips            │   │
│                     │   └────────────────────────┘   │
│                     │                                │
├─────────────────────┴────────────────────────────────┤
```

### 7.2 Responsive Design

- **Desktop**: 2 คอลัมน์ (Form ซ้าย + Preview ขวา)
- **Mobile**: Stack เป็น 1 คอลัมน์ (Form บน + Preview ล่าง)

---

## 8. Error Handling

| สถานการณ์ | การจัดการ |
|---|---|
| ยังไม่ล็อกอิน | Redirect → `/login` |
| ไม่ได้เลือก Headline/Category | Toast error "กรุณาเลือกหัวข้อและหมวดหมู่" |
| AI API ล้มเหลว | Toast error แสดง error message |
| Rate Limit (429) | Toast error "โควต้าการใช้งาน API เต็มแล้ว" |
| OCR ไม่มีรูป | Toast error "กรุณาอัปโหลดรูปภาพก่อน" |
| Gemini API key หายไป | Response 500 "Gemini API key not configured" |
| Usage logging ล้มเหลว | Non-blocking — ไม่กระทบ user (console.warn เท่านั้น) |

---

## 9. Security

| รายการ | รายละเอียด |
|---|---|
| **API Protection** | ทุก API endpoint ต้องมี Bearer token |
| **API Key** | Gemini API key เก็บ server-side เท่านั้น (env variable) |
| **User isolation** | Memory Box แยกตาม user_id |
| **Image processing** | Base64 ส่ง server-side → ไม่ expose ไปยัง third party |
| **Role-based access** | Admin role แยกจาก User ปกติ |

---

## 10. Performance

| รายการ | ค่า |
|---|---|
| **First Load JS** (Content page) | ~178 kB |
| **Content generation** | 3-8 วินาที (ขึ้นกับ Gemini API) |
| **Image OCR** | 5-15 วินาที (สูงสุด 30 วินาที) |
| **Build target** | Static + Server-rendered (Next.js hybrid) |
| **CDN** | Vercel Edge Network |

---

## 11. Environment Variables ที่ต้องตั้งค่า

| Variable | หมายเหตุ |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) |

---

## 12. ข้อจำกัดปัจจุบัน (Known Limitations)

1. **ไม่มี rate limiting ฝั่ง app** — พึ่งพา Gemini API rate limit เท่านั้น
2. **ไม่มี content history** — เห็นเฉพาะ 3 slots ใน Memory Box ไม่มี history ย้อนหลัง
3. **ไม่มี A/B testing** — ไม่สามารถเปรียบเทียบหลายเวอร์ชันพร้อมกัน
4. **รูปภาพไม่ได้ host** — Preview ใช้ Base64 / Data URL ไม่ได้ upload ไป storage
5. **Hashtag แก้ไขไม่ได้** — ผูกตายกับ Category ใน constants.js

---

## 13. Roadmap แนะนำ (Future Enhancements)

| ลำดับ | ฟีเจอร์ | Priority |
|---|---|---|
| 1 | Content History — ดูประวัติคอนเทนต์ที่เคยสร้างทั้งหมด | High |
| 2 | Custom Hashtag — ให้ผู้ใช้เพิ่ม/แก้ Hashtag เองได้ | Medium |
| 3 | Multi-version — สร้าง 2-3 เวอร์ชันพร้อมกันเพื่อเปรียบเทียบ | Medium |
| 4 | Image hosting — Upload รูปไป Supabase Storage | Medium |
| 5 | Schedule post — ตั้งเวลาโพสต์อัตโนมัติ | Low |
| 6 | Analytics dashboard — สถิติการใช้งาน AI ต่อ user/เดือน | Low |
| 7 | Template library — เทมเพลตคอนเทนต์สำเร็จรูป | Low |

---

*เอกสารนี้จัดทำโดย SPUBUS BIZ CONTENT Development Team*
*อัปเดตล่าสุด: 20 มีนาคม 2569*

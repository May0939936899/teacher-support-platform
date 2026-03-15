# BiZ Content — Production Deployment Guide

AI-Powered Content Generator for คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม

## Tech Stack

- **Frontend**: Next.js 15 + React 19
- **Backend**: Next.js API Routes (serverless)
- **Auth**: Google OAuth via Supabase
- **Database**: Supabase (PostgreSQL)
- **AI**: Gemini 2.5 Flash (server-side only)
- **Deployment**: Vercel

---

## Setup Steps

### 1. Supabase Setup

1. สมัคร [supabase.com](https://supabase.com) แล้วสร้าง project ใหม่
2. ไปที่ **SQL Editor** → รัน SQL จากไฟล์ `supabase/schema.sql`
3. ไปที่ **Settings > API** → คัดลอก:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Google OAuth Setup

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com)
2. สร้าง project → เปิด **OAuth consent screen** → ตั้งเป็น External
3. สร้าง **Credentials > OAuth 2.0 Client ID** (Web application)
4. ใส่ Authorized redirect URI:
   ```
   https://<your-supabase-ref>.supabase.co/auth/v1/callback
   ```
5. คัดลอก Client ID + Client Secret
6. ไปที่ **Supabase Dashboard > Authentication > Providers > Google**
7. เปิด Google provider → ใส่ Client ID + Secret → Save

### 3. Environment Variables

คัดลอก `.env.example` → `.env.local` แล้วใส่ค่าจริง:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIza...
ADMIN_EMAILS=your@email.com
```

### 4. Run Locally

```bash
npm install
npm run dev
```

เปิด http://localhost:3000

### 5. Deploy to Vercel

```bash
npx vercel
```

หรือเชื่อม GitHub repo แล้ว deploy อัตโนมัติ

**ตั้ง Environment Variables ใน Vercel Dashboard:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `ADMIN_EMAILS`

### 6. Set Admin Users

เพิ่ม email ที่ต้องการให้เป็น admin ใน `ADMIN_EMAILS` (คั่นด้วย comma):

```env
ADMIN_EMAILS=admin1@spu.ac.th,admin2@spu.ac.th
```

---

## Security Improvements

| ปัญหาเดิม | แก้ไขแล้ว |
|-----------|----------|
| Gemini API key อยู่ใน frontend | ย้ายไป server-side env var |
| Admin password hardcode `Admin1234` | ใช้ role-based check จาก DB + email list |
| ไม่มี authentication | Google OAuth ผ่าน Supabase |
| localStorage เก็บ stats | Supabase database |
| ไม่มี backend | Next.js API routes |

---

## Project Structure

```
src/
├── app/
│   ├── layout.jsx          # Root layout + auth provider
│   ├── page.jsx             # Main generator (auth-protected)
│   ├── login/page.jsx       # Login page
│   ├── admin/page.jsx       # Admin dashboard
│   ├── auth/callback/route.js
│   ├── api/generate/route.js
│   ├── api/extract/route.js
│   ├── api/saved-contents/route.js
│   ├── api/admin/stats/route.js
│   └── globals.css
├── components/
│   ├── Navbar.jsx
│   ├── ContentForm.jsx
│   ├── ContentPreview.jsx
│   ├── MemoryBox.jsx
│   └── AdminDashboard.jsx
├── hooks/useAuth.js
└── lib/
    ├── constants.js
    ├── prompts.js
    ├── supabase-browser.js
    └── supabase-server.js
```

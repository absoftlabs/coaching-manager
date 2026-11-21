# Coaching Manager

কোচিং সেন্টার ম্যানেজমেন্ট ওয়েব অ্যাপ — শিক্ষার্থী, শিক্ষক, ক্লাস, ব্যাচ, রেজাল্ট, ফি, হাজিরা ও SMS।
মোবাইল-ফ্রেন্ডলি (ফোনে বটম ট্যাব + স্লাইড মেনু, টেবিলের বদলে কার্ড লিস্ট)।

**Stack:** Next.js 15 (App Router) · TypeScript · Prisma · MySQL · Tailwind CSS v4 · shadcn/ui (Radix) · JWT cookie auth

## সেটআপ

```bash
# 1) ডিপেন্ডেন্সি
npm install

# 2) .env তৈরি করুন
cp .env.example .env
#    DATABASE_URL = আপনার রিমোট MySQL, JWT_SECRET = লম্বা র‍্যান্ডম স্ট্রিং

# 3) ডাটাবেস টেবিল তৈরি/আপডেট
npm run db:push

# 4) প্রথম অ্যাডমিন (DEMO_ADMIN_* .env থেকে নেয়)
npm run seed:admin

# 5) চালান
npm run dev          # http://localhost:3000
# প্রোডাকশন:
npm run build && npm start
```

> **পুরনো ডাটাবেস:** টেবিল ও কলামের নাম আগের Coaching Management Software-এর মতোই।
> একই `DATABASE_URL` দিলে পুরনো সব ডাটা কাজ করবে। `db:push` শুধু `settings` টেবিলে
> নতুন nullable কলাম (`orgName`, `orgPhone`, `orgAddress`, `smsApiUrl`) যোগ করে।

## SMS সেটআপ

লগইন করে **Settings → SMS API** তে:

- **API Base URL** — খালি রাখলে ডিফল্ট `http://bulksmsbd.net/api`
- **API Key** ও **Sender ID** — আপনার SMS প্রোভাইডার থেকে
- **Check Balance** দিয়ে কী যাচাই, **Send Test SMS** দিয়ে টেস্ট

Settings-এ সেভ করা মান `.env`-এর `SMS_API_KEY` / `SMS_SENDER_ID` এর চেয়ে অগ্রাধিকার পায়।

## রোল

| রোল | অ্যাক্সেস |
|---|---|
| Admin | সবকিছু |
| Teacher | শুধু Attendance ও Change Password. শিক্ষক যোগ করলে লগইন অটো তৈরি হয় — username = ফোন নম্বর, password = `123456` |

## ফিচার

- **Dashboard** — মোট শিক্ষার্থী, আজ উপস্থিত, আদায়কৃত ফি, শিক্ষক, SMS ব্যালেন্স; ১৪ দিনের হাজিরা চার্ট
- **Students** — যোগ/এডিট/দেখা/প্রিন্ট, সাসপেন্ড/রি-অ্যাডমিট, ব্যাচ ও রোল ফিল্টার, অটো `PCC-xxxxx` আইডি
- **Teachers** — যোগ (লগইন সহ), এডিট, পাসওয়ার্ড রিসেট, সাসপেন্ড/অ্যাপয়েন্ট
- **Classes & Batches** — দিনসহ ক্লাস, ব্যাচে মোট ক্লাস/শিক্ষার্থী
- **Results** — একাধিক বিষয় (MCQ + লিখিত), GPA, মার্কশিট প্রিন্ট, রো থেকে সরাসরি SMS
- **Fees** — শিক্ষার্থী খুঁজে ফি আদায়, অফিস + স্টুডেন্ট কপি রসিদ প্রিন্ট
- **Attendance** — ব্যাচ ও তারিখ ধরে P/A, "All present", Present/Absent তালিকা
- **SMS** — ভেরিয়েবলসহ টেমপ্লেট, অভিভাবকদের রেজাল্ট SMS, শিক্ষকদের কাস্টম SMS, লগ
- **Settings** — কোচিং নাম/ফোন/ঠিকানা/লোগো, SMS API, অ্যাডমিন অ্যাকাউন্ট

## প্রজেক্ট স্ট্রাকচার

```
prisma/schema.prisma        ডাটাবেস মডেল
src/middleware.ts           লগইন ও রোল-ভিত্তিক অ্যাক্সেস, CSRF চেক
src/app/(app)/...           লগইন-পরবর্তী পেজ (সার্ভার কম্পোনেন্ট, সরাসরি Prisma)
src/app/api/...             REST API (mutation)
src/components/...          UI (ui/ = shadcn প্রিমিটিভ)
src/lib/queries.ts          ডাটা কোয়েরি ও serializer
src/lib/sms/                SMS ক্লায়েন্ট ও টেমপ্লেট রেন্ডারার
```

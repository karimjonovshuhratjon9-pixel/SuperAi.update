# SuperAI - Next Generation AI Assistant

Gemini 2.0 texnologiyasiga asoslangan zamonaviy AI yordamchisi.

## Xususiyatlar

- 💬 **Chat** - Matnli suhbat (rasm tahlil qilish bilan)
- 🎤 **Ovozli Muloqot** - Jonli ovozli suhbat
- 🎨 **Image Studio** - Rasm yaratish va tahrirlash
- 💾 **Ma'lumotlar saqlash** - IndexedDB orqali mahalliy saqlash
- 🌐 **Ko'p tilli** - O'zbek, Rus, Ingliz tillari

## O'rnatish

### 1. Dependency'larni o'rnatish

```bash
npm install
```

### 2. API kalitini sozlash

`.env.local` faylini yarating va Gemini API kalitingizni qo'shing:

```bash
VITE_API_KEY=your_gemini_api_key_here
```

API kalitini olish: https://makersuite.google.com/app/apikey

### 3. Ishga tushirish

Development rejimida:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm run preview
```

## Loyiha strukturasi

```
superai/
├── components/          # React komponentlar
│   ├── Auth.tsx        # Autentifikatsiya
│   ├── ChatView.tsx    # Chat interfeysi
│   ├── Dashboard.tsx   # Asosiy sahifa
│   ├── ImageGenView.tsx # Rasm generatsiya
│   ├── Sidebar.tsx     # Yon menyu
│   └── VoiceView.tsx   # Ovozli muloqot
├── services/           # Xizmatlar
│   ├── dbService.ts    # IndexedDB boshqaruvi
│   └── geminiService.ts # Gemini API integratsiyasi
├── App.tsx             # Asosiy komponent
├── constants.ts        # Konstantalar
├── types.ts            # TypeScript turlari
├── index.tsx           # Entry point
└── index.html          # HTML shablon
```

## Texnologiyalar

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS
- **AI**: Google Gemini 2.0 API
- **Database**: IndexedDB
- **Speech**: Web Speech API

## Asosiy Xatolar To'g'rilandi

1. ✅ **Gemini API yangilandi** - @google/genai o'rniga @google/generative-ai
2. ✅ **Model nomlari to'g'rilandi** - Gemini 2.0 Flash va Imagen 3.0
3. ✅ **API chaqiruvlari to'g'rilandi** - GoogleGenerativeAI sinfi
4. ✅ **Environment variables** - Vite uchun VITE_ prefiksi
5. ✅ **Voice API to'g'rilandi** - Web Speech API bilan almashtirildi
6. ✅ **TypeScript xatolari tuzatildi** - To'g'ri turlar va interfeys
7. ✅ **Package.json yangilandi** - To'g'ri versiyalar

## API Kalitlari

Loyiha quyidagi API'lardan foydalanadi:

- **Gemini API** - Chat, Image generation, Voice
  - Model: gemini-2.0-flash-exp
  - Image Model: imagen-3.0-generate-001

## Brauzer qo'llab-quvvatlash

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Litsenziya

MIT License

## Muallif

SuperAI Development Team

## Qo'shimcha ma'lumot

Yordam kerak bo'lsa yoki xatolik topsangiz, iltimos issue yarating.

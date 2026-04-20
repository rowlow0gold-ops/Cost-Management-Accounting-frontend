# Cost Management Accounting — Frontend

Next.js 14 (App Router) + TypeScript + Tailwind + Recharts.

## Run

```bash
npm install
npm run dev
# -> http://localhost:3000
```

Backend must be running at `http://localhost:8080`. Override with:
```
NEXT_PUBLIC_API_BASE=https://your-backend.example.com npm run dev
```

## Demo logins

Password for all: `password123`

- `admin@noaats.com` — 전체 권한 (마스터 CRUD, 감사로그)
- `manager@noaats.com` — 공수 승인, 원가배분, 내부대체
- `user@noaats.com` — 공수 입력만

## Pages

| 경로        | 역할              | 기능 |
|-------------|-------------------|------|
| `/login`    | 누구나            | 로그인 |
| `/dashboard`| USER 이상         | KPI, 본부별/프로젝트별 차트, 차이분석 요약 |
| `/timesheet`| USER 이상         | 공수 입력, 제출, (매니저) 승인·반려 |
| `/allocation`| MANAGER 이상     | 표준원가 배분 (HOURS / HEADCOUNT / REVENUE) |
| `/transfer` | MANAGER 이상      | 본부 간 내부대체가액 기록 |
| `/variance` | USER 이상         | 예산 vs 실적 차이분석 + Excel 다운로드 |
| `/masters`  | ADMIN             | 본부/직원/프로젝트 CRUD |
| `/audit`    | ADMIN             | 감사 로그 조회 |

## Deploy to Vercel

1. Push this folder to GitHub.
2. Import on Vercel.
3. Set env var:
   - `NEXT_PUBLIC_API_BASE` = `https://your-backend.onrender.com`

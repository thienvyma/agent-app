# Phase 33: Auth & Login Page (S33)

> NextAuth login thuc → bao ve dashboard.

## Tinh nang
1. Login page dep, dark mode
2. NextAuth Credentials provider (owner login)
3. Session management
4. Protected routes middleware
5. User profile (avatar, name)

## Files tao moi
1. `src/app/login/page.tsx` — Login page (email + password form)
2. `src/lib/auth-config.ts` — NextAuth config (Credentials provider)
3. `prisma/schema` add `User` model
4. `tests/auth/auth.test.ts`

## Login flow
```
1. User truy cap / → middleware check session
2. Khong co session → redirect /login
3. Nhap email + password → POST /api/auth/callback/credentials
4. NextAuth verify → tao session
5. Redirect ve / → dashboard hien thi
```

## Default accounts (seed)
```
Owner: admin@openclaw.dev / admin123
```

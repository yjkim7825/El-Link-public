# EcoLink — B2B CSR 협업 자동화 풀스택 데모

> 사회적기업과 외부 기업 CSR 담당자를 잇는 **B2B 협업 자동화** 솔루션의 풀스택 데모입니다.
> 협업 자료를 AI로 분류하고, 기업 맞춤 협업 아이디어를 추천하며, 서류 발급과 모의 견적까지 한 흐름으로 처리합니다.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-6DB33F?logo=springboot&logoColor=white)
![Java](https://img.shields.io/badge/Java-17-007396?logo=openjdk&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

> ⚠️ **학습 / 포트폴리오 목적의 데모입니다.** 등장하는 회사명·담당자·서류·견적 등 모든 데이터는 가상이며, 실제 기업/개인과 무관합니다.

---

## ✨ 핵심 기능

- **🤖 AI 자료 자동 분류** — 업로드한 협업 자료(PDF·이미지·텍스트)를 Gemini가 읽고 카테고리·제목·키워드를 자동 추출
- **💡 협업 아이디어 추천 AI** — 후보 기업명만 입력하면 기업 분석 + 보유 자료 매칭으로 맞춤 협업 아이디어를 2단계로 생성
- **🏢 파트너 관리** — 관리자가 파트너사 계정을 등록(임시 비밀번호 1회 노출)하고 상태(초대/활성/비활성)를 관리, 최초 로그인 시 비밀번호 변경 강제
- **🧾 모의 견적 + PDF** — 단가표 기반으로 견적 라인 구성(단가×수량×일수 + 기업이윤 + VAT), 단가 변경에도 과거 견적은 스냅샷으로 보존, 한글 PDF 발급
- **📁 서류 발급 + 이력** — 회사 서류를 종류별로 등록하고 파트너가 다운로드, 발급 이력 자동 기록
- **🔐 역할 기반 인증** — JWT(access in-memory + refresh httpOnly 쿠키), 관리자/파트너 분리, 공개 랜딩(무인증 협업 사례 미리보기)

---

## 🧱 기술 스택

| 영역 | 스택 |
| --- | --- |
| 프론트엔드 | React 18 · TypeScript · Vite · Tailwind CSS · React Router · TanStack Query · Zustand · react-hook-form + zod |
| 백엔드 | Spring Boot 3.3 · Java 17 · Spring Security(JWT) · Spring Data JPA · Gradle(Kotlin DSL) |
| 데이터 | dev: H2(in-memory) · prod: PostgreSQL |
| AI / 문서 | Google Gemini API · openhtmltopdf(한글 폰트 임베드) |

아키텍처·API·ERD 상세는 [`docs/`](./docs) 참고.

---

## 🚀 로컬 실행

### 사전 요구
- JDK 17+, Node 18+ / pnpm, (선택) Google Gemini API 키

### 1) 백엔드 (포트 8080, dev 프로필 = H2 인메모리)
```bash
cd backend
./gradlew bootRun            # dev가 기본 프로필 (매 기동 시 데모 시드 자동 생성)
```
- (선택) AI 기능을 쓰려면 환경변수 `GEMINI_API_KEY`를 설정하세요. **키가 없어도 나머지 기능은 정상 동작**합니다.
- 환경변수 예시는 [`backend/.env.example`](./backend/.env.example) 참고.

### 2) 프론트엔드 (포트 5173, `/api` → 8080 프록시)
```bash
cd frontend
pnpm install
pnpm dev
```
→ 브라우저에서 http://localhost:5173

### 🔑 데모 시드 계정
| 역할 | 이메일 | 비밀번호 |
| --- | --- | --- |
| 관리자 | `admin@ecolink.demo` | `admin1234` |
| 파트너(활성) | `active@partner.demo` | `demo1234` |

---

## 🌐 라이브 데모

> 배포 후 링크 추가 예정 — _coming soon_

배포 방법은 [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) 참고 (Supabase + Railway + Vercel).

## 🖼️ 스크린샷

> 스크린샷은 [`docs/screenshots/`](./docs/screenshots) 에 추가 예정입니다.

---

## 📄 라이선스

[MIT](./LICENSE) © 2026 EcoLink

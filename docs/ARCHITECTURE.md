# EcoLink 아키텍처 설계

> Google Apps Script + Google Sheets 기반 시스템을 **React + Spring Boot** 모노레포로 마이그레이션하기 위한 구조 설계 문서.
> 본 문서는 "어디에 무엇이 들어가는가"(폴더 구조)와 "어떻게 동작하는가"(런타임/프로필 전략)를 정의한다. 도메인 모델은 [ERD.md](./ERD.md), API 계약은 [API.md](./API.md) 참고.

---

## 1. 시스템 개요

사회적기업 **EcoLink**과 외부 기업 CSR 담당자 간 협업 솔루션. 하나의 백엔드를 공유하는 **두 개의 프론트엔드 영역**으로 구성된다.

| 영역 | 사용자 | 주요 기능 |
| --- | --- | --- |
| **관리자(admin)** | EcoLink 내부 직원 | 협업자료 업로드 → Gemini 자동 분류·정리 → 저장 / 협업제안 AI(기업분석 + 아이디어) / 파트너 계정 관리 / 단가 카탈로그 관리 |
| **파트너십(partnership)** | 외부 CSR 담당자 | 포트폴리오 조회 / 서류 발급(PDF) / 모의 견적 입력·계산·저장 |

기존 GAS 모듈과의 매핑:

| 기존 GAS 모듈 | 신규 도메인 | 비고 |
| --- | --- | --- |
| `파일 업로드` / `홈` | `material` + `proposal` | `자료 요약` 시트 → `material` 테이블, 협업제안 AI → `proposal` |
| `포트폴리오` | `material`(읽기) | 파트너용 조회 화면 |
| `서류 발급` / `서류 조회` | `document` | 고정 회사서류 + 발급 이력 |
| `견적서` / `견적서 산출` | `quote` + `PriceCatalog` | 클라이언트 계산 → 서버 저장 + PDF 생성 |

---

## 2. 모노레포 최상위 구조

```
EcoLink/
├── frontend/                 # React 18 + Vite + TS (admin + partnership SPA)
├── backend/                  # Spring Boot 3.x + Java 17 (Gradle Kotlin DSL)
├── docs/                     # 설계 문서 (본 폴더)
│   ├── ARCHITECTURE.md
│   ├── ERD.md
│   └── API.md
├── legacy-gas/               # 기존 Apps Script 코드 보관 (마이그레이션 참조용, 빌드 제외)
│   ├── 홈/  파일 업로드/  포트폴리오/  서류 발급/  서류 조회/  견적서/  견적서 산출/
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml   # pnpm lint + typecheck + build
│       ├── backend-ci.yml    # gradle build + test
│       └── codeql.yml        # (선택) 보안 정적분석
├── .gitignore
├── .editorconfig
└── README.md
```

> **legacy-gas/**: 현재 루트의 한글 폴더(`홈`, `파일 업로드` 등)는 이 디렉토리로 이동해 마이그레이션 레퍼런스로만 유지한다. 신규 코드 빌드 대상에서 제외한다.

---

## 3. Frontend 상세 구조

`features/`(도메인 단위) + `components/ui/`(범용 프리미티브) + `api/`/`hooks/`/`types/`(횡단) 구조. admin과 partnership을 **하나의 SPA 안에서 라우트로 분리**하고, 공유 자산은 상위에 둔다.

```
frontend/
├── public/
├── src/
│   ├── main.tsx                  # 진입점
│   ├── App.tsx                   # 최상위 라우터 (admin / partnership 분기)
│   ├── routes/
│   │   ├── adminRoutes.tsx       # /admin/* (인증 가드: ADMIN)
│   │   ├── partnerRoutes.tsx     # /partner/* (인증 가드: PARTNER)
│   │   └── guards.tsx            # RequireAuth, RequireRole, RequirePasswordChanged
│   │
│   ├── features/
│   │   ├── admin/
│   │   │   ├── material/         # 자료 업로드 → AI 분류 미리보기 → 편집·저장
│   │   │   │   ├── pages/        # MaterialUploadPage, MaterialListPage, MaterialEditPage
│   │   │   │   ├── components/   # AnalysisPreview, MaterialForm, FileDropzone
│   │   │   │   └── hooks/        # useAnalyzeMaterial, useSaveMaterial
│   │   │   ├── proposal/         # 협업제안 AI (기업분석 → 아이디어)
│   │   │   │   ├── pages/        # ProposalPage, ProposalHistoryPage
│   │   │   │   └── components/   # CompanyAnalysisView, IdeaCardList
│   │   │   ├── partners/         # 파트너 계정 등록/관리 (임시비번 발급)
│   │   │   │   └── pages/        # PartnerListPage, PartnerCreatePage
│   │   │   └── catalog/          # 단가 카탈로그 CRUD
│   │   │       └── pages/        # CatalogListPage, CatalogEditPage
│   │   │
│   │   └── partnership/
│   │       ├── portfolio/        # 업로드 자료 포트폴리오 조회
│   │       │   ├── pages/        # PortfolioPage, PortfolioDetailPage
│   │       │   └── components/   # PortfolioCard, CategoryFilter
│   │       ├── documents/        # 서류 발급(다운로드)
│   │       │   └── pages/        # DocumentCenterPage
│   │       ├── quote/            # 모의 견적 입력·계산·저장
│   │       │   ├── pages/        # QuoteBuilderPage, QuoteHistoryPage
│   │       │   ├── components/   # QuoteTable, QuoteSummary
│   │       │   └── hooks/        # useQuoteCalculator (단가×수량×일수, 이윤/VAT)
│   │       └── account/          # 최초 로그인 비밀번호 변경 등
│   │           └── pages/        # ChangePasswordPage
│   │
│   ├── components/
│   │   ├── ui/                   # 도메인 비의존 프리미티브 (TailwindCSS)
│   │   │   ├── Button.tsx  Input.tsx  Modal.tsx  Table.tsx
│   │   │   ├── Card.tsx  Badge.tsx  Spinner.tsx  Toast.tsx
│   │   │   └── form/             # FormField, FormError 등
│   │   └── layout/               # AdminLayout, PartnerLayout, Header, Sidebar
│   │
│   ├── api/                      # 백엔드 통신 계층
│   │   ├── client.ts             # axios 인스턴스 (baseURL, 인터셉터)
│   │   ├── auth.ts               # interceptor: access 토큰 주입 / 401 → refresh 재시도
│   │   ├── materials.ts  proposals.ts  partners.ts
│   │   ├── portfolio.ts  documents.ts  quotes.ts  catalog.ts
│   │   └── index.ts
│   │
│   ├── hooks/                    # 횡단 커스텀 훅
│   │   ├── useAuth.ts            # 로그인 상태/역할
│   │   ├── useApiQuery.ts        # (TanStack Query 래퍼, 채택 시)
│   │   └── useDebounce.ts
│   │
│   ├── types/                    # 백엔드 DTO와 1:1 대응하는 TS 타입
│   │   ├── api.ts                # ApiResponse<T> = { success, data, error }
│   │   ├── material.ts  proposal.ts  partner.ts
│   │   ├── document.ts  quote.ts  catalog.ts
│   │   └── auth.ts
│   │
│   ├── lib/                      # 순수 유틸 (formatCurrency, date 등)
│   └── styles/                   # tailwind.css, 전역 스타일
│
├── index.html
├── vite.config.ts                # dev proxy: /api → http://localhost:8080
├── tailwind.config.ts
├── tsconfig.json
├── .env.development              # VITE_API_BASE_URL=/api
├── .env.production
├── .eslintrc.cjs / eslint.config.js
├── .prettierrc
└── package.json
```

**프론트 핵심 규약**
- `types/api.ts`의 `ApiResponse<T> = { success: boolean; data: T | null; error: ApiError | null }`로 모든 응답을 감싼다 (백엔드 공통 포맷과 동일).
- `api/auth.ts` 인터셉터가 access 토큰을 헤더에 주입하고, 401 응답 시 refresh로 1회 재시도 후 실패하면 로그인으로 리다이렉트한다.
- refresh 토큰은 **httpOnly 쿠키**로 관리되므로 JS에서 접근하지 않는다(인터셉터는 access만 다룸).

---

## 4. Backend 상세 구조

도메인별 패키지(`material`, `proposal`, `partner`, `document`, `quote`, `common`)로 분리한다. 각 도메인은 `controller / service / repository / entity / dto` 레이어를 자체 보유한다.

```
backend/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle/  gradlew  gradlew.bat
└── src/
    ├── main/
    │   ├── java/com/ecolink/ellink/
    │   │   ├── EllinkApplication.java
    │   │   │
    │   │   ├── common/                       # 횡단 관심사
    │   │   │   ├── config/
    │   │   │   │   ├── SecurityConfig.java        # SecurityFilterChain, 경로별 권한
    │   │   │   │   ├── CorsConfig.java            # dev: localhost:5173 / prod: 운영 도메인
    │   │   │   │   ├── OpenApiConfig.java         # springdoc-openapi (Swagger)
    │   │   │   │   ├── JpaConfig.java             # Auditing (createdAt/updatedAt)
    │   │   │   │   └── GeminiConfig.java          # Gemini WebClient 빈
    │   │   │   ├── security/
    │   │   │   │   ├── JwtTokenProvider.java      # access/refresh 발급·검증
    │   │   │   │   ├── JwtAuthenticationFilter.java
    │   │   │   │   ├── CustomUserDetails.java
    │   │   │   │   └── RefreshTokenCookie.java    # httpOnly 쿠키 빌드/파싱
    │   │   │   ├── response/
    │   │   │   │   ├── ApiResponse.java           # { success, data, error }
    │   │   │   │   └── ApiError.java              # { code, message, fields? }
    │   │   │   ├── exception/
    │   │   │   │   ├── GlobalExceptionHandler.java # @RestControllerAdvice
    │   │   │   │   ├── BusinessException.java      # 도메인 예외 베이스
    │   │   │   │   └── ErrorCode.java              # enum: 코드 ↔ HTTP 상태 매핑
    │   │   │   ├── storage/                       # 파일 저장 추상화
    │   │   │   │   ├── StorageService.java        # 인터페이스 (store/load/delete/url)
    │   │   │   │   ├── LocalStorageService.java   # @Profile("dev") → ./storage/{key}
    │   │   │   │   ├── CloudStorageService.java   # @Profile("prod") → R2/Supabase (스텁)
    │   │   │   │   └── StoredObject.java          # key, size, contentType
    │   │   │   └── audit/
    │   │   │       └── BaseTimeEntity.java        # createdAt, updatedAt (MappedSuperclass)
    │   │   │
    │   │   ├── auth/                          # 인증 엔드포인트 (admin + partner 공용)
    │   │   │   ├── AuthController.java        # 로그인/리프레시/로그아웃/비번변경
    │   │   │   ├── AuthService.java
    │   │   │   └── dto/                       # LoginRequest, TokenResponse, ChangePasswordRequest
    │   │   │
    │   │   ├── partner/                       # 파트너 계정 (관리자 등록·관리)
    │   │   │   ├── PartnerAdminController.java    # /api/admin/partners (ADMIN)
    │   │   │   ├── PartnerService.java
    │   │   │   ├── PartnerRepository.java
    │   │   │   ├── entity/Partner.java
    │   │   │   └── dto/                       # PartnerCreateRequest, PartnerResponse
    │   │   │
    │   │   ├── material/                      # 협업자료 + AI 분류
    │   │   │   ├── MaterialAdminController.java   # /api/admin/materials
    │   │   │   ├── PortfolioController.java       # /api/partner/portfolio (읽기)
    │   │   │   ├── MaterialService.java
    │   │   │   ├── MaterialAnalysisService.java   # Gemini 분류 호출
    │   │   │   ├── MaterialRepository.java
    │   │   │   ├── entity/  Material.java  MaterialFile.java
    │   │   │   └── dto/      MaterialAnalyzeRequest/Response, MaterialResponse
    │   │   │
    │   │   ├── proposal/                      # 협업제안 AI
    │   │   │   ├── ProposalController.java        # /api/admin/proposals
    │   │   │   ├── ProposalService.java
    │   │   │   ├── ProposalRepository.java
    │   │   │   ├── entity/Proposal.java
    │   │   │   └── dto/      CompanyAnalyzeRequest, IdeaRequest, ProposalResponse
    │   │   │
    │   │   ├── quote/                         # 견적 + 단가 카탈로그
    │   │   │   ├── QuoteController.java            # /api/partner/quotes
    │   │   │   ├── CatalogAdminController.java     # /api/admin/catalog (ADMIN CRUD)
    │   │   │   ├── CatalogController.java          # /api/partner/quote/catalog (읽기)
    │   │   │   ├── QuoteService.java               # 계산 + 단가 스냅샷 복사
    │   │   │   ├── QuoteRepository.java  PriceCatalogRepository.java
    │   │   │   ├── entity/  Quote.java  QuoteItem.java  PriceCatalog.java
    │   │   │   └── dto/      QuoteCreateRequest, QuoteResponse, CatalogItemDto
    │   │   │
    │   │   └── document/                      # 서류 발급 + PDF 생성
    │   │       ├── DocumentController.java         # /api/partner/documents
    │   │       ├── DocumentService.java
    │   │       ├── pdf/
    │   │       │   ├── PdfRenderer.java            # 한글 폰트 임베드 공통
    │   │       │   ├── QuotePdfGenerator.java      # Quote ID → PDF 재생성
    │   │       │   └── CompanyDocProvider.java     # 사업자등록증/통장사본
    │   │       ├── DocumentRepository.java         # 발급 이력
    │   │       ├── entity/  CompanyDocument.java  DocumentIssue.java
    │   │       └── dto/      DocumentResponse, IssueResponse
    │   │
    │   └── resources/
    │       ├── application.yml                # 공통
    │       ├── application-dev.yml            # H2, LocalStorage, CORS localhost:5173
    │       ├── application-prod.yml           # PostgreSQL, CloudStorage, 운영 CORS
    │       ├── fonts/
    │       │   └── NotoSansKR-Regular.ttf     # PDF 한글 임베드 폰트 (필수)
    │       └── db/migration/                  # Flyway (선택) V1__init.sql ...
    │
    └── test/
        └── java/com/ecolink/ellink/
            ├── quote/QuoteServiceTest.java    # 계산·스냅샷 로직 단위 테스트
            └── ...
```

> 패키지 베이스 `com.ecolink.ellink`는 예시이며 조직 도메인에 맞게 조정한다. `auth`는 요구된 6개 패키지(material/proposal/partner/document/quote/common)에 더해 인증 진입점을 한 곳에 모으기 위한 보조 패키지다. 원한다면 `common/security` 아래로 흡수 가능.

---

## 5. 런타임/프로필 전략

### 5.1 Spring 프로필
| 프로필 | DB | 파일 저장소 | CORS 허용 | 비고 |
| --- | --- | --- | --- | --- |
| `dev` | H2 (in-memory/file) | `LocalStorageService` → `./storage/{key}` | `http://localhost:5173` | Swagger 활성, SQL 로그 |
| `prod` | PostgreSQL | `CloudStorageService` (R2/Supabase, S3 호환) | 운영 도메인만 | Swagger 비공개 권장 |

### 5.2 파일 저장 추상화
- 모든 파일 I/O는 `StorageService` 인터페이스를 통해서만 수행한다.
- 현재 단계: `LocalStorageService`만 실제 구현. `CloudStorageService`는 **인터페이스 자리만 잡아둔 스텁**(미구현 메서드는 `UnsupportedOperationException`).
- DB에는 **메타데이터만** 저장: `fileKey`, `mimeType`, `size`, `uploadedBy`, `originalName`. 바이트는 저장소가 보관.
- 다운로드는 컨트롤러가 `StorageService.load(fileKey)` 스트림을 반환하거나, prod에서는 presigned URL을 반환하도록 인터페이스를 설계.

### 5.3 인증 흐름 (요약)
1. 관리자가 백오피스에서 파트너 등록 → **임시 비밀번호** 발급(자가 회원가입 없음).
2. 파트너 최초 로그인 시 `mustChangePassword=true` → 비밀번호 변경 강제(프론트 가드 `RequirePasswordChanged`).
3. 로그인 성공 시 **access(짧은 만료) + refresh(httpOnly 쿠키)** 발급.
4. access 만료 시 `/api/auth/refresh`로 재발급. 자세한 계약은 [API.md](./API.md) §인증 참고.

### 5.4 외부 연동 — Gemini
- `common/config/GeminiConfig`에서 `WebClient` 빈 구성, API 키는 `application-*.yml` + 환경변수(`GEMINI_API_KEY`)로 주입(코드/리포지토리에 키 금지).
- 기존 GAS의 `runGeminiAnalysis`(JSON 응답 강제) → `MaterialAnalysisService`, `analyzeCompany`/`getCollaborationIdeas`(Markdown) → `ProposalService`로 이관.

### 5.5 공통 응답/예외
- 모든 컨트롤러 응답은 `ApiResponse<T> = { success, data, error }`.
- 도메인 예외(`BusinessException` + `ErrorCode`)를 `GlobalExceptionHandler`가 잡아 `ErrorCode`별 HTTP 상태로 매핑.
- API 문서는 `springdoc-openapi`로 자동 생성(`/swagger-ui.html`, dev 한정 노출 권장).

---

## 6. 빌드 / 도구

| 영역 | 도구 |
| --- | --- |
| Frontend | pnpm, Vite, TypeScript, ESLint, Prettier, TailwindCSS, React Router |
| Backend | Gradle (Kotlin DSL), Java 17, Spring Boot 3.x, Spring Web, Spring Data JPA, Spring Security, springdoc-openapi |
| PDF | **openhtmltopdf** (확정) — 기존 인쇄 HTML 템플릿 재활용 + 한글 폰트 임베드 |
| DB | dev: H2 / prod: PostgreSQL (마이그레이션은 Flyway 선택) |
| CI | GitHub Actions (frontend-ci, backend-ci) |

> PDF 라이브러리 = **openhtmltopdf 확정**. 기존 GAS `printQuotation`의 HTML 인쇄 템플릿을 그대로 이관해 재활용한다. `resources/templates/quote.html` + `resources/fonts/NotoSansKR-Regular.ttf` 임베드.

# EcoLink REST API 명세 초안

> 모든 경로 prefix: `/api`. 모든 응답은 공통 envelope로 감싼다. 인증/권한, 도메인 엔티티는 [ARCHITECTURE.md](./ARCHITECTURE.md), [ERD.md](./ERD.md) 참고.

---

## 0. 공통 규약

### 0.1 응답 포맷
모든 응답은 다음 형태:
```jsonc
// 성공
{ "success": true,  "data": { /* 페이로드 */ }, "error": null }
// 실패
{ "success": false, "data": null, "error": { "code": "QUOTE_NOT_FOUND", "message": "견적을 찾을 수 없습니다.", "fields": null } }
```
- `error.fields`: 검증 실패 시 `{ "email": "형식이 올바르지 않습니다" }` 형태(선택).
- `GlobalExceptionHandler`가 `ErrorCode` enum 기준으로 HTTP 상태 매핑.

### 0.2 에러 코드 ↔ HTTP 상태 (예시)
| code | HTTP | 의미 |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | 요청 검증 실패 |
| `UNAUTHORIZED` | 401 | 미인증/토큰 만료 |
| `PASSWORD_CHANGE_REQUIRED` | 403 | 최초 로그인 비번 변경 필요 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `*_NOT_FOUND` | 404 | 리소스 없음 |
| `DUPLICATE_EMAIL` | 409 | 이메일 중복 |
| `GEMINI_ERROR` | 502 | 외부 AI 호출 실패 |
| `INTERNAL_ERROR` | 500 | 기타 |

### 0.3 인증
- `Authorization: Bearer <accessToken>` 헤더로 보호 자원 접근.
- access 만료 시 `POST /api/auth/refresh`(refresh는 httpOnly 쿠키로 자동 전송)로 재발급.
- 역할: `ADMIN`(관리자 사이트), `PARTNER`(파트너십 사이트).

### 0.4 페이징 공통 쿼리
`?page=0&size=20&sort=createdAt,desc` → `data`는 `{ content: [...], page, size, totalElements, totalPages }`.

---

## 1. 인증 (`/api/auth`, `/api/admin/auth`)

### POST `/api/admin/auth/login` — 관리자 로그인
요청
```json
{ "email": "staff@ecolink.com", "password": "..." }
```
응답 `data`
```json
{ "accessToken": "jwt...", "tokenType": "Bearer", "expiresIn": 900,
  "user": { "id": 1, "name": "홍길동", "role": "ADMIN" } }
```
- refresh 토큰은 `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict`로 내려감.

### POST `/api/partner/auth/login` — 파트너 로그인
요청
```json
{ "email": "csr@company.com", "password": "임시비번 또는 변경된 비번" }
```
응답 `data`
```json
{ "accessToken": "jwt...", "tokenType": "Bearer", "expiresIn": 900,
  "mustChangePassword": true,
  "user": { "id": 10, "companyName": "ABC", "contactName": "김담당", "role": "PARTNER" } }
```
- `mustChangePassword=true`면 프론트는 비밀번호 변경 화면으로 강제 이동. 다른 보호 API는 `PASSWORD_CHANGE_REQUIRED`(403) 반환.

### POST `/api/auth/refresh` — 토큰 재발급
- 요청 바디 없음. httpOnly 쿠키의 refresh 토큰 사용.
- 응답 `data`: `{ "accessToken": "...", "expiresIn": 900 }` (+ refresh 회전 시 새 쿠키).

### POST `/api/auth/logout`
- refresh 쿠키 만료 처리. `data: null`.

### POST `/api/partner/auth/change-password` — 최초/임의 비밀번호 변경 (PARTNER)
요청
```json
{ "currentPassword": "임시비번", "newPassword": "새비번" }
```
- 성공 시 `mustChangePassword=false`로 전환. `data: { "changed": true }`.

---

## 2. 협업자료 — 관리자 (`/api/admin/materials`) · ADMIN

### POST `/api/admin/materials/files` — 파일 업로드 (선행)
- `multipart/form-data`, field `file`.
- 응답 `data`: `{ "fileId": 5, "fileKey": "2026/06/uuid.png", "mimeType": "image/png", "size": 20480, "originalName": "poster.png" }`
- 파일은 `StorageService`에 저장, 메타데이터만 DB.

### POST `/api/admin/materials/analyze` — AI 분류 미리보기 (저장 안 함)
요청 (택1 조합)
```json
{ "text": "행사 설명...", "fileId": 5 }
```
응답 `data` (기존 `runGeminiAnalysis` JSON 스키마 이관)
```json
{ "category": "EXPERIENCE", "title": "업사이클 키링 만들기",
  "introduction": "...", "partnerCompany": "없음",
  "keywords": ["ESG 경영", "자원순환", "친환경 캠페인"] }
```

### POST `/api/admin/materials` — 자료 저장 (편집본)
요청
```json
{ "category": "EXPERIENCE", "title": "...", "partnerCompany": "ABC",
  "keywords": ["...","...","..."], "introduction": "...",
  "fileId": 5, "source": "FILE_AND_TEXT" }
```
응답 `data`: 저장된 `MaterialResponse`(id 포함).

### GET `/api/admin/materials` — 목록 (페이징/필터)
- 쿼리: `category`, `q`(제목/키워드 검색), 페이징.

### GET `/api/admin/materials/{id}` — 상세
### PUT `/api/admin/materials/{id}` — 수정
### DELETE `/api/admin/materials/{id}` — 삭제

`MaterialResponse` 예시
```json
{ "id": 12, "category": "EXPERIENCE", "title": "...", "partnerCompany": "ABC",
  "keywords": ["..."], "introduction": "...",
  "file": { "fileId": 5, "url": "/api/files/2026/06/uuid.png", "mimeType": "image/png" },
  "createdAt": "2026-06-04T10:00:00Z" }
```

---

## 3. 협업제안 AI — 관리자 (`/api/admin/proposals`) · ADMIN

### POST `/api/admin/proposals/analyze-company` — 기업 분석
요청
```json
{ "companyName": "삼성전자" }
```
응답 `data`
```json
{ "companyName": "삼성전자", "companyAnalysis": "### 🏢 기업 개요\n...(Markdown)" }
```

### POST `/api/admin/proposals/ideas` — 협업 아이디어 생성
요청 (앞 단계 분석 결과를 그대로 전달)
```json
{ "companyName": "삼성전자", "companyAnalysis": "### 🏢 ...(Markdown)" }
```
- 서버는 최근 자료 N건(기존 30건)을 컨텍스트로 묶어 Gemini 호출.
응답 `data`
```json
{ "collaborationIdeas": "### 💡 제안 1: ...(Markdown)" }
```

### POST `/api/admin/proposals` — 제안 저장
요청
```json
{ "companyName": "삼성전자", "companyAnalysis": "...", "collaborationIdeas": "..." }
```
### GET `/api/admin/proposals` — 이력 목록 (페이징)
### GET `/api/admin/proposals/{id}` — 상세

---

## 4. 파트너 계정 관리 — 관리자 (`/api/admin/partners`) · ADMIN

### POST `/api/admin/partners` — 파트너 등록 (임시 비번 발급)
요청
```json
{ "email": "csr@company.com", "companyName": "ABC", "contactName": "김담당", "phone": "010-..." }
```
응답 `data`
```json
{ "id": 10, "email": "csr@company.com", "status": "INVITED",
  "temporaryPassword": "Xy7$kP2q", "mustChangePassword": true }
```
> **결정**: 임시 비밀번호는 **관리자 화면에 1회만 노출**한다(응답의 `temporaryPassword`). 이메일 자동 발송은 운영 단계로 보류. 프론트는 이 값을 다시 조회할 수 없으므로 등록 직후 1회 표시 후 폐기.

### GET `/api/admin/partners` — 목록 (페이징/검색)
### GET `/api/admin/partners/{id}` — 상세
### PATCH `/api/admin/partners/{id}` — 정보 수정 / 상태 변경(DISABLED 등)
### POST `/api/admin/partners/{id}/reset-password` — 비밀번호 초기화(새 임시 비번 발급)

---

## 5. 단가 카탈로그 (`/api/admin/catalog` CRUD · ADMIN / `/api/partner/quote/catalog` 읽기 · PARTNER)

### GET `/api/partner/quote/catalog` — 견적용 카탈로그 (PARTNER)
- 쿼리: `?activeOnly=true`
- 응답 `data`: 카테고리별 그룹 또는 평면 리스트
```json
[ { "id": 3, "category": "VOLUNTEER", "itemName": "장난감 수리",
    "unitPrice": 30000, "priceType": "FIXED", "unitLabel": "EA",
    "isActive": true, "sortOrder": 1 } ]
```

### GET `/api/admin/catalog` — 전체(비활성 포함, ADMIN)
### POST `/api/admin/catalog` — 항목 생성
```json
{ "category": "SOUVENIR", "itemName": "신규 기념품", "description": "...",
  "unitPrice": 12000, "priceType": "FIXED", "unitLabel": "EA", "sortOrder": 7 }
```
### PUT `/api/admin/catalog/{id}` — 수정 (단가 변경 → 과거 견적엔 영향 없음, 스냅샷 보존)
### PATCH `/api/admin/catalog/{id}/active` — 활성/비활성 토글
```json
{ "isActive": false }
```
### DELETE `/api/admin/catalog/{id}` — 삭제 (사용된 항목은 비활성 권장)

---

## 6. 견적 — 파트너 (`/api/partner/quotes`) · PARTNER

### POST `/api/partner/quotes` — 견적 생성/저장 (서버 재계산 + 단가 스냅샷)
요청 (단가는 보내지 않거나 보내더라도 서버가 카탈로그 기준으로 검증/스냅샷)
```json
{
  "clientName": "ABC 주식회사",
  "profitRate": 0.10,
  "validityPeriod": "견적일로부터 1개월",
  "items": [
    { "catalogId": 6, "quantity": 50, "days": 1 },
    { "catalogId": 1, "customUnitPrice": 500000, "quantity": 1, "days": 2 }
  ]
}
```
- `priceType=FIXED` 항목: 서버가 `PriceCatalog.unitPrice`를 스냅샷.
- `priceType=CUSTOM` 항목: `customUnitPrice` 사용.
- 서버가 `lineTotal`, 소계, 이윤, 공급가/VAT/총합계 **재계산** 후 저장.

응답 `data` (`QuoteResponse`)
```json
{
  "id": 101, "clientName": "ABC 주식회사", "status": "DRAFT",
  "profitRate": 0.10, "profitAmount": 250000,
  "supplyPrice": 2500000, "vat": 250000, "grandTotal": 2750000,
  "validityPeriod": "견적일로부터 1개월",
  "items": [
    { "category": "SOUVENIR", "itemName": "곰돌이 키링", "unitPrice": 10000,
      "quantity": 50, "days": 1, "lineTotal": 500000 }
  ],
  "createdAt": "2026-06-04T10:00:00Z"
}
```

### GET `/api/partner/quotes` — 내 견적 목록 (페이징)
### GET `/api/partner/quotes/{id}` — 견적 상세 (스냅샷 그대로)
### GET `/api/partner/quotes/{id}/pdf` — 견적서 PDF 다운로드/재생성
- `Content-Type: application/pdf`, 한글 폰트 임베드. Quote ID 스냅샷 기반이라 항상 동일 결과.
- 호출 시 `DocumentIssue`(issueType=QUOTE) 이력 기록 + `Quote.status=ISSUED`, `issuedAt` 갱신.

> 관리자도 조회가 필요하면 `/api/admin/quotes`(전체) 추가 가능. 파트너는 본인 것만 접근(소유권 검증).

---

## 7. 서류 발급 — 파트너 (`/api/partner/documents`) · PARTNER

### GET `/api/partner/documents` — 발급 가능 회사 서류 목록
응답 `data`
```json
[ { "docType": "BUSINESS_LICENSE", "title": "사업자등록증", "mimeType": "application/pdf" },
  { "docType": "BANK_STATEMENT", "title": "통장사본", "mimeType": "application/pdf" } ]
```

### GET `/api/partner/documents/{docType}/download` — 회사 서류 다운로드
- `docType` ∈ `BUSINESS_LICENSE | BANK_STATEMENT`.
- 활성 버전(`CompanyDocument.active=true`) 파일을 `StorageService`에서 스트림.
- `DocumentIssue`(issueType=COMPANY_DOC) 이력 기록.

### GET `/api/partner/documents/issues` — 내 발급 이력
응답 `data`
```json
[ { "id": 9, "issueType": "QUOTE", "quoteId": 101, "issuedAt": "2026-06-04T10:05:00Z" },
  { "id": 8, "issueType": "COMPANY_DOC", "docType": "BUSINESS_LICENSE", "issuedAt": "..." } ]
```

### (관리자) 회사 서류 업로드/교체 — `/api/admin/documents` · ADMIN
- POST `multipart` `{ docType, file }` → 새 버전 등록(이전 버전 `active=false`).
- GET `/api/admin/documents` — 버전 목록.

---

## 8. 파일 스트리밍 (`/api/files`)
- GET `/api/files/{fileKey...}` — 인증된 사용자에게 메타데이터 기반 파일 스트림(또는 prod에서 presigned URL 리다이렉트).
- 권한: 자료 이미지 등 공개 범위는 정책에 따라 PARTNER/ADMIN 허용.

---

## 9. 권한 매트릭스 요약

| 엔드포인트 그룹 | ADMIN | PARTNER | 비고 |
| --- | :--: | :--: | --- |
| `/api/admin/**` | ✅ | ❌ | 관리자 전용 |
| `/api/partner/auth/**` | ❌ | ✅(공개 로그인 제외) | 로그인은 익명 허용 |
| `/api/partner/portfolio/**` | ➖ | ✅ | 관리자 미리보기 허용 가능 |
| `/api/partner/quotes/**` | ➖ | ✅(본인) | 소유권 검증 |
| `/api/partner/documents/**` | ➖ | ✅ | 발급 이력 기록 |
| `/api/auth/refresh`,`/logout` | ✅ | ✅ | 쿠키 기반 |

> ➖ = 기본 비허용이나 요구 시 확장 가능.

---

## 10. 파트너 포트폴리오 조회 (`/api/partner/portfolio`) · PARTNER
> 관리자 자료(`Material`)를 파트너가 읽기 전용으로 조회.

### GET `/api/partner/portfolio` — 목록 (카테고리 필터/페이징)
- 쿼리: `category`(MaterialCategory), `q`, 페이징.
- 응답: `MaterialResponse` 페이지(편집 필드 제외한 공개 뷰).

### GET `/api/partner/portfolio/{id}` — 상세

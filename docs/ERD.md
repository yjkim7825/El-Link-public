# EcoLink 도메인 모델 / ERD 초안

> JPA 엔티티 기준 설계. 타입은 논리 타입으로 표기(실제 매핑은 H2/PostgreSQL 호환). 모든 엔티티는 `BaseTimeEntity`(`createdAt`, `updatedAt`)를 상속한다고 가정한다.

---

## 1. 엔티티 관계 다이어그램 (텍스트)

```
                           ┌──────────────────┐
                           │   AdminUser      │  EcoLink 내부 직원
                           └──────────────────┘
                                    │ creates / updates
                                    ▼
┌──────────────┐  uploads  ┌──────────────────┐  has 1   ┌──────────────────┐
│  AdminUser   │──────────▶│    Material      │─────────▶│  MaterialFile    │
└──────────────┘           │ (협업자료/포폴)   │ 0..1     │ (파일 메타데이터) │
                           └──────────────────┘          └──────────────────┘

┌──────────────┐  authors  ┌──────────────────┐
│  AdminUser   │──────────▶│    Proposal      │  협업제안 AI 결과
└──────────────┘           │ (기업분석+아이디어)│
                           └──────────────────┘

┌──────────────┐  registers ┌──────────────────┐
│  AdminUser   │──────────▶ │     Partner      │  외부 CSR 담당자 계정
└──────────────┘            └──────────────────┘
                                   │ owns
                ┌──────────────────┼───────────────────┐
                ▼                                       ▼
        ┌──────────────────┐                   ┌──────────────────┐
        │      Quote       │ 1            *     │  DocumentIssue   │  발급 이력
        │ (견적서, 스냅샷)  │──────┐            │ (누가/언제/무엇)  │
        └──────────────────┘      │            └──────────────────┘
                │ 1                │ snapshot           │ refers
                ▼ *               (unitPrice 복사)       ▼
        ┌──────────────────┐      │            ┌──────────────────┐
        │    QuoteItem     │      │            │ CompanyDocument  │  고정 회사서류
        │ (라인, 단가 스냅) │◀─────┘            │ (사업자등록증 등)│
        └──────────────────┘  references       └──────────────────┘
                │ optional
                ▼
        ┌──────────────────┐
        │  PriceCatalog    │  단가 카탈로그 (관리자 CRUD, isActive)
        └──────────────────┘

┌──────────────────┐
│  RefreshToken    │  (선택) refresh 토큰 화이트리스트/회전 관리
└──────────────────┘
```

핵심 설계 포인트:
- **단가 스냅샷**: `QuoteItem.unitPrice`는 발급 시점 `PriceCatalog.unitPrice`를 **복사 저장**한다. 이후 카탈로그 단가가 바뀌어도 과거 견적은 원본 금액을 그대로 재현(PDF 재생성 보장).
- **파일은 메타데이터만 DB에 저장**, 실제 바이트는 `StorageService`(local/cloud)가 보관. `MaterialFile.fileKey`로 연결.
- **자가 회원가입 없음**: `Partner`는 항상 `AdminUser`가 생성하며 임시 비밀번호 + `mustChangePassword` 플래그를 가진다.

---

## 2. 엔티티 상세

### 2.1 AdminUser — 관리자(내부 직원)
| 필드 | 타입 | 제약/비고 |
| --- | --- | --- |
| id | Long (PK) | auto |
| email | String | unique, 로그인 ID |
| passwordHash | String | BCrypt |
| name | String | |
| role | enum `AdminRole` | `ADMIN` (필요 시 `SUPER_ADMIN`) |
| active | boolean | 비활성화 시 로그인 차단 |
| createdAt / updatedAt | timestamp | |

### 2.2 Partner — 외부 CSR 담당자 계정
| 필드 | 타입 | 제약/비고 |
| --- | --- | --- |
| id | Long (PK) | |
| email | String | unique, 로그인 ID |
| passwordHash | String | 최초엔 임시 비밀번호 해시 |
| companyName | String | 소속 기업명 |
| contactName | String | 담당자 이름 |
| phone | String | nullable |
| status | enum `PartnerStatus` | `INVITED`, `ACTIVE`, `DISABLED` |
| mustChangePassword | boolean | 최초 로그인 시 true → 변경 강제 |
| lastLoginAt | timestamp | nullable |
| createdById | FK → AdminUser | 등록한 관리자 |
| createdAt / updatedAt | timestamp | |

### 2.3 Material — 협업자료 (= 기존 `자료 요약` 시트)
| 필드 | 타입 | 제약/비고 |
| --- | --- | --- |
| id | Long (PK) | |
| category | enum `MaterialCategory` | `ENVIRONMENT_EDUCATION`(환경교육), `EXPERIENCE`(체험), `VOLUNTEER`(봉사), `UPCYCLING`(업사이클링) |
| title | String | AI 생성(20자 내) 후 편집 가능 |
| partnerCompany | String | 협업 기업/기관명, 없으면 "없음" |
| keywords | String | 콤마 구분 키워드 3개 (또는 별도 테이블로 정규화 가능) |
| introduction | String(TEXT) | 소개(100자 내) |
| fileId | FK → MaterialFile | nullable (텍스트만 등록 가능) |
| source | enum `MaterialSource` | `FILE`, `TEXT`, `FILE_AND_TEXT` |
| createdById | FK → AdminUser | |
| createdAt / updatedAt | timestamp | 시트의 "저장일시" 대응 |

> 기존 시트의 `=IMAGE(...)` 셀 표현은 신규에선 `MaterialFile` + 프론트 렌더링으로 대체.

### 2.4 MaterialFile — 파일 메타데이터
| 필드 | 타입 | 제약/비고 |
| --- | --- | --- |
| id | Long (PK) | |
| fileKey | String | unique, StorageService 키 (`./storage/{key}` 또는 클라우드 객체키) |
| originalName | String | 업로드 원본 파일명 |
| mimeType | String | image/* , application/pdf 등 |
| size | Long | bytes |
| uploadedById | FK → AdminUser | "uploadedBy" |
| createdAt | timestamp | |

> 일반화하여 `StoredFile`로 두고 Material/Document/Quote 첨부에 공용으로 써도 된다. 본 초안은 자료용으로 분리 표기.

### 2.5 Proposal — 협업제안 AI 결과
| 필드 | 타입 | 제약/비고 |
| --- | --- | --- |
| id | Long (PK) | |
| companyName | String | 분석 대상 기업명 |
| companyAnalysis | String(TEXT) | `analyzeCompany` 결과(Markdown) |
| collaborationIdeas | String(TEXT) | `getCollaborationIdeas` 결과(Markdown) |
| modelName | String | 사용 모델(예: gemini-1.5-flash) — 재현/감사용 |
| createdById | FK → AdminUser | |
| createdAt | timestamp | |

> 기업분석과 아이디어를 별도 호출로 생성하되 하나의 Proposal 레코드로 묶어 저장. 두 단계를 분리 저장하고 싶으면 `companyAnalysis`만 먼저 생성 후 `collaborationIdeas`를 갱신하는 흐름도 가능.

### 2.6 PriceCatalog — 단가 카탈로그 (관리자 CRUD)
| 필드 | 타입 | 제약/비고 |
| --- | --- | --- |
| id | Long (PK) | |
| category | enum `QuoteCategory` | `PLANNING`(기획), `VOLUNTEER`(임직원자원봉사), `EXPERIENCE`(체험), `SOUVENIR`(기념품), `OPERATIONS`(제작/운영비) |
| itemName | String | 예: "업사이클 키링 체험" |
| description | String | nullable, 상세 |
| unitPrice | Long | 원. `priceType=CUSTOM`이면 0(입력형) |
| priceType | enum `PriceType` | `FIXED`(고정 단가), `CUSTOM`(사용자 입력 단가 — 기획/디자인/주문제작 등) |
| unitLabel | String | 예: "EA", "인", "일" |
| sortOrder | int | 표시 순서 |
| isActive | boolean | 비활성 시 신규 견적 선택지에서 제외(과거 견적엔 영향 없음) |
| createdAt / updatedAt | timestamp | "변경 이력" = updatedAt 보존 |

> **결정**: 변경 이력은 `updatedAt` + 견적측 단가 스냅샷으로만 관리한다. 행 단위 완전 이력(`PriceCatalogHistory`)은 채택하지 않는다. (과거 견적 금액 재현은 `QuoteItem.unitPrice` 스냅샷이 보장하므로 충분.)

기존 GAS 하드코딩 초기 시드(참고):

| category | itemName | unitPrice | priceType |
| --- | --- | --- | --- |
| PLANNING | 기획 | 0 | CUSTOM |
| PLANNING | 디자인 | 0 | CUSTOM |
| VOLUNTEER | 장난감 수리 | 30,000 | FIXED |
| VOLUNTEER | 장난감 소독 | 10,000 | FIXED |
| VOLUNTEER | 장난감 분해 | 5,000 | FIXED |
| EXPERIENCE | 업사이클 키링 체험 | 15,000 | FIXED |
| EXPERIENCE | 업사이클 블럭 조립 체험 | 15,000 | FIXED |
| SOUVENIR | 병뚜껑 업사이클 치약짜개 | 3,500 | FIXED |
| SOUVENIR | 곰돌이 키링 | 10,000 | FIXED |
| SOUVENIR | 업사이클 화분 키트 | 15,000 | FIXED |
| SOUVENIR | 업사이클 블럭 연필꽂이 | 15,000 | FIXED |
| SOUVENIR | 환경 교육 동화책 (지구는 내 친구) | 15,000 | FIXED |
| SOUVENIR | 주문 제작시 별도 금액(금형+디자인비) | 0 | CUSTOM |
| OPERATIONS | 인건비 | 120,000 | FIXED |
| OPERATIONS | 왕복 출장비 | 600,000 | FIXED |
| OPERATIONS | 행사 운영비 | 10,000 | FIXED |

### 2.7 Quote — 견적서 (헤더, 스냅샷)
| 필드 | 타입 | 제약/비고 |
| --- | --- | --- |
| id | Long (PK) | PDF 재생성 키 |
| partnerId | FK → Partner | 작성/소유 파트너 |
| clientName | String | 발주처(기존 `clientName`) |
| supplyPrice | Long | 공급가액 (= grandTotal / 1.1, 원 단위 반올림) |
| vat | Long | 부가세 (= grandTotal − supplyPrice) |
| profitRate | decimal | 기업이윤율 (기본 0.10) |
| profitAmount | Long | 이윤액 스냅샷 |
| grandTotal | Long | 총합계(VAT 포함) |
| validityPeriod | String | 예: "견적일로부터 1개월" |
| status | enum `QuoteStatus` | `DRAFT`, `ISSUED` |
| issuedAt | timestamp | PDF 발급 시각 |
| createdAt / updatedAt | timestamp | |

> **계산 규칙(기존 로직 이관)**: 라인합 = unitPrice × quantity × days. 카테고리 소계 합 = 합계. 기업이윤 = 합계 × profitRate. 총합계 = 합계 + 이윤. 공급가액 = round(총합계 / 1.1), 부가세 = 총합계 − 공급가액. 서버에서 **재계산하여 검증** 후 저장(프론트 값 신뢰 금지).

### 2.8 QuoteItem — 견적 라인 (단가 스냅샷)
| 필드 | 타입 | 제약/비고 |
| --- | --- | --- |
| id | Long (PK) | |
| quoteId | FK → Quote | on delete cascade |
| catalogId | FK → PriceCatalog | nullable (CUSTOM/삭제 대비) |
| category | enum `QuoteCategory` | 스냅샷 |
| itemName | String | 스냅샷(발급 당시 명칭) |
| unitPrice | Long | **발급 시점 단가 복사본** |
| quantity | int | 수량 |
| days | decimal | 일수(0.5 단위 허용) |
| lineTotal | Long | unitPrice × quantity × days |
| sortOrder | int | |

### 2.9 CompanyDocument — 고정 회사 서류
| 필드 | 타입 | 제약/비고 |
| --- | --- | --- |
| id | Long (PK) | |
| docType | enum `CompanyDocType` | `BUSINESS_LICENSE`(사업자등록증), `BANK_STATEMENT`(통장사본), 확장 가능 |
| title | String | 표시명 |
| fileKey | String | StorageService 키 (기존 Drive 파일 이관) |
| mimeType | String | application/pdf 등 |
| version | int | 갱신 시 증가 |
| active | boolean | 현재 발급 버전 여부 |
| createdAt / updatedAt | timestamp | |

### 2.10 DocumentIssue — 발급 이력
| 필드 | 타입 | 제약/비고 |
| --- | --- | --- |
| id | Long (PK) | |
| partnerId | FK → Partner | 누구에게 |
| issueType | enum `IssueType` | `COMPANY_DOC`, `QUOTE` |
| companyDocId | FK → CompanyDocument | nullable (issueType=COMPANY_DOC) |
| quoteId | FK → Quote | nullable (issueType=QUOTE) |
| issuedAt | timestamp | 언제 |
| createdAt | timestamp | |

> "누가/언제/어떤 파트너에게/어떤 종류"를 만족. `quoteId` 기반으로 견적 PDF 재생성이 가능(스냅샷 보장).

### 2.11 (선택) AdminUser/Partner 공통 — 인증 보조
- `RefreshToken`(tokenHash, subjectType[ADMIN|PARTNER], subjectId, expiresAt, revoked) — refresh 회전/무효화를 서버에서 관리하려면 추가. httpOnly 쿠키만으로 충분하면 생략 가능.

---

## 3. Enum 요약

| Enum | 값 |
| --- | --- |
| `AdminRole` | ADMIN (, SUPER_ADMIN) |
| `PartnerStatus` | INVITED, ACTIVE, DISABLED |
| `MaterialCategory` | ENVIRONMENT_EDUCATION, EXPERIENCE, VOLUNTEER, UPCYCLING |
| `MaterialSource` | FILE, TEXT, FILE_AND_TEXT |
| `QuoteCategory` | PLANNING, VOLUNTEER, EXPERIENCE, SOUVENIR, OPERATIONS |
| `PriceType` | FIXED, CUSTOM |
| `QuoteStatus` | DRAFT, ISSUED |
| `CompanyDocType` | BUSINESS_LICENSE, BANK_STATEMENT |
| `IssueType` | COMPANY_DOC, QUOTE |

---

## 4. EcoLink 공급자 정보 (참조 데이터)

견적서/서류 PDF에 들어가는 공급자 고정 정보. 코드 상수 또는 단일 행 `CompanyProfile` 설정 테이블로 관리(향후 변경 대비 테이블 권장).

| 항목 | 값 |
| --- | --- |
| 상호 | EcoLink Inc. |
| 대표자 | Jane Doe |
| 사업자등록번호 | 000-00-00000 |
| 업태 | 서비스, 교육서비스업 |
| 종목 | 개인및가정용품수리업, 환경창의교육 |
| 주소 | 123 Demo Street, Seoul, Republic of Korea |

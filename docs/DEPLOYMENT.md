# 배포 가이드 (Supabase + Railway + Vercel)

EcoLink 공개 데모를 **Supabase(Postgres + Storage) + Railway(백엔드) + Vercel(프론트)** 조합으로 배포하는 단계별 안내입니다.

```
[브라우저] ──> Vercel (프론트, 정적 SPA)
                 │  VITE_API_BASE_URL
                 ▼
            Railway (Spring Boot, Docker)
                 ├──> Supabase Postgres  (JPA)
                 └──> Supabase Storage   (파일, service_role)
```

> ⚠️ 모든 비밀값(.env)은 **커밋하지 않습니다**. 아래 값들은 각 호스팅 대시보드의 환경변수에 직접 등록하세요.

---

## 0. 사전 준비 (Supabase)

1. Supabase 프로젝트 생성 → **Project Settings → Database** 에서 연결 정보 확인.
   - JDBC URL 형태: `jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres?sslmode=require`
   - username: `postgres` / password: 프로젝트 DB 비밀번호
2. **Storage → Buckets** 에서 `ellink-files` 버킷 생성 (**Private**).
3. **Project Settings → API** 에서 `service_role` 키 복사 (⚠️ 비밀, 백엔드에서만 사용).

---

## 1. 백엔드 — Railway

### 1-1. 프로젝트 연결
- Railway → **New Project → Deploy from GitHub repo** → `yjkim7825/El-Link-public` 선택.
- **Settings → Root Directory** = `backend` (Dockerfile/railway.json이 여기 있음).
- 빌더는 자동으로 `backend/Dockerfile` 사용 (railway.json에 명시). 헬스체크 `/actuator/health`.

### 1-2. 환경변수 (Variables 탭)
| 변수 | 값 | 비고 |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | `prod,demo` | demo = 데모 시드 ON(빈 화면 방지). 시드 끄려면 `prod` 만 |
| `DB_URL` | `jdbc:postgresql://db.<ref>.supabase.co:5432/postgres?sslmode=require` | |
| `DB_USERNAME` | `postgres` | |
| `DB_PASSWORD` | (Supabase DB 비번) | |
| `JPA_DDL_AUTO` | **첫 배포** `update` → 안정화 후 변수 삭제(기본 `validate`) | |
| `SUPABASE_URL` | `https://<ref>.supabase.co` | |
| `SUPABASE_SERVICE_KEY` | (service_role 키) | ⚠️ 비밀 |
| `SUPABASE_BUCKET` | `ellink-files` | |
| `ELLINK_JWT_SECRET` | 32바이트+ 무작위 문자열 | `openssl rand -base64 48` |
| `ELLINK_JWT_REFRESH_COOKIE_SECURE` | `true` | HTTPS |
| `REFRESH_COOKIE_SAME_SITE` | `None` | 프론트/백 분리 도메인이라 필수(+Secure) |
| `ELLINK_CORS_ORIGINS` | `https://<your-vercel-domain>` | Vercel 도메인 확정 후 입력(1-3 참고) |
| `GEMINI_API_KEY` | (선택) | 없으면 AI 기능만 비활성, 나머지 정상 |

> `PORT` 는 Railway가 자동 주입 → `application.yml`의 `${PORT:8080}`가 처리. 직접 설정 불필요.

### 1-3. 배포 & URL 확인
- Deploy 완료 후 **Settings → Networking → Generate Domain** 으로 공개 URL 생성
  (예: `https://ecolink-api.up.railway.app`).
- 헬스체크: `https://<railway-domain>/actuator/health` → `{"status":"UP"}` 확인.
- 이 URL을 Vercel의 `VITE_API_BASE_URL`, 그리고 Railway의 `ELLINK_CORS_ORIGINS`(Vercel 도메인)와 교차로 등록.

---

## 2. 프론트 — Vercel

### 2-1. 프로젝트 연결
- Vercel → **Add New → Project** → `yjkim7825/El-Link-public` import.
- **Root Directory** = `frontend`. Framework Preset = **Vite** (자동 감지, `frontend/vercel.json` 존재).
- Build Command `pnpm build` / Output `dist` (vercel.json에 명시됨).

### 2-2. 환경변수
| 변수 | 값 |
| --- | --- |
| `VITE_API_BASE_URL` | `https://<railway-domain>` (끝에 `/`·`/api` 붙이지 않음) |

### 2-3. 배포 & 교차 등록
- Deploy 후 Vercel 도메인 확인 (예: `https://el-link-public.vercel.app`).
- **이 도메인을 Railway `ELLINK_CORS_ORIGINS` 에 등록 후 백엔드 재배포** (CORS 허용).

---

## 3. 첫 배포 순서 (권장)

1. Supabase: 버킷 `ellink-files`(private) 생성, DB/Storage 키 확보.
2. Railway 배포 (`JPA_DDL_AUTO=update`, `ELLINK_CORS_ORIGINS`는 임시로 비워두거나 `*` 금지 → 일단 로컬 도메인). → Railway 도메인 확보.
3. Vercel 배포 (`VITE_API_BASE_URL`=Railway 도메인). → Vercel 도메인 확보.
4. Railway `ELLINK_CORS_ORIGINS`=Vercel 도메인으로 갱신 후 재배포.
5. 동작 확인 (4번 검증) → 안정화되면 Railway에서 `JPA_DDL_AUTO` 변수 삭제(= `validate`로 복귀).

---

## 4. 배포 후 검증

- `GET https://<railway>/actuator/health` → `UP`
- `GET https://<railway>/api/public/portfolio` → 시드 협업 사례 JSON (demo 프로필 시 7건)
- 프론트 접속 → 랜딩의 협업 사례 썸네일 로드(= Supabase Storage 다운로드 동작)
- 로그인:
  - 관리자 `admin@ecolink.demo` / `admin1234`
  - 파트너 `active@partner.demo` / `demo1234`
- 새 자료 업로드(대표 이미지 포함) → 저장 → 목록/상세 썸네일 표시(= Storage 업로드/다운로드)
- 견적 발급 → PDF 다운로드(= Storage 저장/재다운로드)
- 새로고침 후 로그인 유지(= cross-site refresh 쿠키 동작 = `SameSite=None; Secure`)

---

## 5. 필요한 환경변수 한눈에

**백엔드(Railway)**: `SPRING_PROFILES_ACTIVE`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JPA_DDL_AUTO`(첫배포만), `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET`, `ELLINK_JWT_SECRET`, `ELLINK_JWT_REFRESH_COOKIE_SECURE`, `REFRESH_COOKIE_SAME_SITE`, `ELLINK_CORS_ORIGINS`, `GEMINI_API_KEY`(선택)

**프론트(Vercel)**: `VITE_API_BASE_URL`

---

## 6. 트러블슈팅

| 증상 | 원인 / 해결 |
| --- | --- |
| 배포 후 로그인은 되는데 새로고침하면 풀림 | refresh 쿠키 cross-site 차단. `REFRESH_COOKIE_SAME_SITE=None` + `ELLINK_JWT_REFRESH_COOKIE_SECURE=true` 확인(둘 다 필요). |
| 브라우저 콘솔 CORS 오류 | `ELLINK_CORS_ORIGINS`에 **정확한** Vercel 도메인(https 포함, 끝 슬래시 없음). 변경 후 백엔드 재배포 필요. |
| 첫 부팅 `Schema-validation: missing table` | `JPA_DDL_AUTO=update`로 첫 배포(테이블 생성) 후 재기동. |
| 썸네일/파일 401·404 | `SUPABASE_SERVICE_KEY`(service_role, anon 아님)·`SUPABASE_BUCKET` 확인. 버킷명 `ellink-files`. |
| `Connection refused`/DB 타임아웃 | `DB_URL`에 `?sslmode=require` 포함 확인. Supabase는 SSL 필수. |
| 헬스체크 실패로 배포 롤백 | `/actuator/health` 공개 경로 등록됨(SecurityConfig). DB 연결 실패 시 health DOWN → DB 변수부터 점검. |
| 데모 화면이 비어 있음 | `SPRING_PROFILES_ACTIVE=prod,demo` 인지 확인(시드는 비어 있을 때만 1회 생성). |
| Railway 빌드 OOM/느림 | Dockerfile 멀티스테이지라 정상. 무료 플랜은 빌드가 느릴 수 있음(수 분). |

---

## 7. 보안 메모

- `service_role` 키는 **백엔드 환경변수에만**. 프론트(Vite) 빌드에는 절대 넣지 않음(번들에 노출됨).
- Storage 버킷은 **private** — 모든 파일은 백엔드가 service_role로 프록시 다운로드(`/api/**/{id}/thumbnail|download`).
- 운영 안정화 후 `JPA_DDL_AUTO`를 `validate`로(변수 삭제) 두어 스키마 변경을 막음.
- `.env`·키는 채팅/커밋/번들 어디에도 남기지 않음.

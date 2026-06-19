# -*- coding: utf-8 -*-
"""Phase 5 document 도메인 수동 검증(문서 CRUD + 발급이력 + 다운로드 스트리밍/가드). urllib UTF-8."""
import io
import json
import urllib.parse
import urllib.request
import urllib.error

BASE = "http://localhost:8080"
PASS = 0
FAIL = 0


def call(method, path, token=None, body=None):
    headers = {}
    data = None
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw


def download(path, token):
    """바이너리 다운로드 → (status, headers, body_bytes)."""
    req = urllib.request.Request(BASE + path, headers={"Authorization": "Bearer " + token}, method="GET")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read()


def multipart(fields, files):
    boundary = "----ellinkDoc7q"
    buf = io.BytesIO()
    for k, v in fields.items():
        buf.write(f"--{boundary}\r\n".encode())
        buf.write(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode())
        buf.write(v.encode("utf-8"))
        buf.write(b"\r\n")
    for name, filename, ctype, content in files:
        buf.write(f"--{boundary}\r\n".encode())
        buf.write(f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode())
        buf.write(f"Content-Type: {ctype}\r\n\r\n".encode())
        buf.write(content)
        buf.write(b"\r\n")
    buf.write(f"--{boundary}--\r\n".encode())
    return f"multipart/form-data; boundary={boundary}", buf.getvalue()


def post_multipart(path, token, fields, files):
    ctype, body = multipart(fields, files)
    req = urllib.request.Request(BASE + path, data=body,
                                 headers={"Authorization": "Bearer " + token, "Content-Type": ctype},
                                 method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw


def check(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
    else:
        FAIL += 1
    print(f"[{'PASS' if cond else 'FAIL'}] {name}" + (f"  -- {detail}" if detail else ""))


def login(email, pw):
    return call("POST", "/api/partner/auth/login", body={"email": email, "password": pw})


def onboard(admin, email, company):
    st, r = call("POST", "/api/admin/partners", token=admin,
                 body={"email": email, "companyName": company, "contactName": "담당자"})
    temp = r["data"]["temporaryPassword"]
    st, r = login(email, temp)
    tok = r["data"]["accessToken"]
    call("POST", "/api/partner/auth/change-password", token=tok,
         body={"currentPassword": temp, "newPassword": "docpass1234"})
    st, r = login(email, "docpass1234")
    return r["data"]["accessToken"]


# ===== 인증 =====
st, r = call("POST", "/api/admin/auth/login",
             body={"email": "admin@ecolink.demo", "password": "admin1234"})
admin = r["data"]["accessToken"]
check("관리자 로그인 200", st == 200 and admin)

# ===== (1) 시드 문서 =====
print("\n===== (1) 시드 문서 =====")
st, r = call("GET", "/api/admin/documents", token=admin)
docs = r["data"] if st == 200 else []
check("더미 문서 2종 시드", st == 200 and len(docs) == 2, f"count={len(docs)}")
biz = next((d for d in docs if d["type"] == "BUSINESS_LICENSE"), None)
bank = next((d for d in docs if d["type"] == "BANK_ACCOUNT"), None)
check("사업자등록증/통장사본 + active + 한글 originalName",
      biz and bank and biz["isActive"] and biz["originalName"] == "사업자등록증.pdf",
      f"biz={biz['originalName'] if biz else '-'}")

# ===== (2) 관리자 문서 CRUD =====
print("\n===== (2) 문서 CRUD =====")
st, r = post_multipart("/api/admin/documents", admin,
                       {"type": "INTRO_DECK", "title": "회사소개서 2026"},
                       [("file", "intro.pdf", "application/pdf", b"%PDF-1.4 intro deck dummy\n%%EOF")])
check("문서 업로드(multipart) 200 + active", st == 200 and r["data"]["isActive"] is True, f"st={st}")
intro_id = r["data"]["id"] if st == 200 else None
check("업로드 응답에 fileKey 미노출", st == 200 and "fileKey" not in r["data"])

st, r = call("PATCH", f"/api/admin/documents/{intro_id}", token=admin, body={"title": "회사소개서 v2"})
check("PATCH title 수정 반영", st == 200 and r["data"]["title"] == "회사소개서 v2", f"st={st}")

# ===== (3) 파트너 문서 목록 (type별 그룹, 활성만) =====
print("\n===== (3) 파트너 문서 목록(그룹) =====")
p1 = onboard(admin, "docpartner1@acme.com", "ACME")
st, r = call("GET", "/api/partner/documents", token=p1)
groups = r["data"] if st == 200 else []
all_doc_ids = [d["id"] for g in groups for d in g["documents"]]
check("파트너 목록 type별 그룹 구조", st == 200 and all("type" in g and "documents" in g for g in groups),
      f"groups={[g['type'] for g in groups]}")
check("활성 문서 3종(시드2+업로드1) 노출", len(all_doc_ids) == 3, f"ids={all_doc_ids}")
check("파트너 응답에 fileKey/uploadedBy 미노출",
      all("fileKey" not in d and "uploadedByName" not in d for g in groups for d in g["documents"]))

# ===== (4) 다운로드 + 발급 이력 =====
print("\n===== (4) 다운로드 + 발급 이력 기록 =====")
st, headers, body = download(f"/api/partner/documents/{biz['id']}/download", p1)
cd = urllib.parse.unquote(headers.get("Content-Disposition", ""))
check("다운로드 200", st == 200, f"st={st}")
check("Content-Disposition attachment + 원본 파일명", "attachment" in cd and "사업자등록증.pdf" in cd, f"cd={cd}")
check("Content-Type application/pdf", headers.get("Content-Type", "").startswith("application/pdf"),
      f"ct={headers.get('Content-Type')}")
check("스트리밍 바이트 길이 == size", len(body) == biz["size"], f"len={len(body)} size={biz['size']}")
check("실제 PDF 바이트 시작(%PDF)", body[:4] == b"%PDF")

# 한 번 더 다운로드 → 이력 2건
download(f"/api/partner/documents/{biz['id']}/download", p1)

st, lst = call("GET", "/api/admin/partners", token=admin)
p1id = next(p["id"] for p in lst["data"] if p["email"] == "docpartner1@acme.com")
st, r = call("GET", f"/api/admin/documents/issues?partnerId={p1id}", token=admin)
issues = r["data"] if st == 200 else []
check("같은 문서 2회 다운로드 → 발급이력 2건", len(issues) == 2, f"count={len(issues)}")
check("이력 fetch join: 파트너명/문서명 함께 조회",
      issues and issues[0]["partnerCompanyName"] == "ACME"
      and issues[0]["documentTitle"] == "사업자등록증"
      and issues[0]["partnerContactName"] == "담당자",
      f"sample={issues[0] if issues else '-'}")

# ===== (5) soft delete → 다운로드 404 / 목록 제외 =====
print("\n===== (5) soft delete =====")
st, r = call("DELETE", f"/api/admin/documents/{bank['id']}", token=admin)
check("통장사본 soft delete 200", st == 200)
st, r = call("GET", "/api/admin/documents", token=admin)
deleted = next((d for d in r["data"] if d["id"] == bank["id"]), None)
check("관리자 목록엔 남되 inactive", deleted is not None and deleted["isActive"] is False)
st, r = call("GET", "/api/partner/documents", token=p1)
ids_after = [d["id"] for g in r["data"] for d in g["documents"]]
check("파트너 목록에서 제외", bank["id"] not in ids_after, f"ids={ids_after}")
st, headers, body = download(f"/api/partner/documents/{bank['id']}/download", p1)
check("비활성 문서 다운로드 → 404(정보 미노출)", st == 404, f"st={st}")
st, headers, body = download("/api/partner/documents/999999/download", p1)
check("없는 문서 다운로드 → 404", st == 404, f"st={st}")

# ===== (6) 발급 이력 기간 필터 =====
print("\n===== (6) 발급 이력 기간 필터 =====")
st, r = call("GET", "/api/admin/documents/issues?from=2099-01-01T00:00:00Z", token=admin)
check("미래 from 필터 → 0건", st == 200 and len(r["data"]) == 0, f"count={len(r['data']) if st==200 else '-'}")
st, r = call("GET", "/api/admin/documents/issues?from=2000-01-01T00:00:00Z", token=admin)
check("과거 from 필터 → 전체(>=2)", st == 200 and len(r["data"]) >= 2, f"count={len(r['data']) if st==200 else '-'}")

# ===== (7) 가드: 비번미변경 / 비활성 파트너 403 =====
print("\n===== (7) 파트너 가드 =====")
st, r = call("POST", "/api/admin/partners", token=admin,
             body={"email": "docpartner3@acme.com", "companyName": "GAMMA", "contactName": "담당"})
temp3 = r["data"]["temporaryPassword"]
st, r = login("docpartner3@acme.com", temp3)
p3_mcp = r["data"]["accessToken"]
st, r = call("GET", "/api/partner/documents", token=p3_mcp)
check("비번미변경 → 문서목록 403 PASSWORD_CHANGE_REQUIRED",
      st == 403 and r["error"]["code"] == "PASSWORD_CHANGE_REQUIRED", f"st={st}")
st, headers, body = download(f"/api/partner/documents/{biz['id']}/download", p3_mcp)
check("비번미변경 → 다운로드 403", st == 403, f"st={st}")

p2 = onboard(admin, "docpartner2@acme.com", "BETA")
st, lst = call("GET", "/api/admin/partners", token=admin)
p2id = next(p["id"] for p in lst["data"] if p["email"] == "docpartner2@acme.com")
call("PATCH", f"/api/admin/partners/{p2id}/status", token=admin, body={"status": "DISABLED"})
st, r = call("GET", "/api/partner/documents", token=p2)
check("비활성 파트너 → 403 ACCOUNT_DISABLED",
      st == 403 and r["error"]["code"] == "ACCOUNT_DISABLED", f"st={st}")

print(f"\n===== 결과: {PASS} PASS / {FAIL} FAIL =====")

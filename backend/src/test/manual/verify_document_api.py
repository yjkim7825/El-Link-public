# -*- coding: utf-8 -*-
"""documents 프론트가 쓰는 API 검증: 업로드(multipart)/목록/관리자 다운로드(이력 미기록)/
수정/soft delete/재활성화 + 발급 이력(파트너 다운로드 시뮬 후 row 생성 확인). urllib UTF-8."""
import io
import json
import time
import urllib.parse
import urllib.request
import urllib.error

BASE = "http://localhost:8080"
PASS = FAIL = 0


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
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw


def multipart_upload(path, token, fields, fname, ctype, content):
    boundary = "----ellinkDoc7q"
    buf = io.BytesIO()
    for k, v in fields.items():
        buf.write(f"--{boundary}\r\n".encode())
        buf.write(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode())
        buf.write(v.encode("utf-8"))
        buf.write(b"\r\n")
    buf.write(f"--{boundary}\r\n".encode())
    buf.write(f'Content-Disposition: form-data; name="file"; filename="{fname}"\r\n'.encode())
    buf.write(f"Content-Type: {ctype}\r\n\r\n".encode())
    buf.write(content)
    buf.write(b"\r\n")
    buf.write(f"--{boundary}--\r\n".encode())
    req = urllib.request.Request(BASE + path, data=buf.getvalue(),
                                 headers={"Authorization": "Bearer " + token,
                                          "Content-Type": f"multipart/form-data; boundary={boundary}"},
                                 method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))


def download(path, token):
    req = urllib.request.Request(BASE + path, headers={"Authorization": "Bearer " + token}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read()


def check(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
    else:
        FAIL += 1
    print(f"[{'PASS' if cond else 'FAIL'}] {name}" + (f"  -- {detail}" if detail else ""))


st, r = call("POST", "/api/admin/auth/login",
             body={"email": "admin@ecolink.demo", "password": "admin1234"})
admin = r["data"]["accessToken"]
check("관리자 로그인 200", st == 200 and bool(admin))

# PDF 매직바이트만 있는 작은 파일(텍스트 추출 불필요 — 문서는 분석 안 함)
pdf = b"%PDF-1.4\n%EOF\n"

# ===== 업로드 =====
print("\n===== 문서 CRUD =====")
st, r = multipart_upload("/api/admin/documents", admin,
                         {"type": "BUSINESS_LICENSE", "title": "2026년 사업자등록증"},
                         "사업자등록증.pdf", "application/pdf", pdf)
check("업로드 200", st == 200, f"st={st}")
did = r["data"]["id"] if st == 200 else None
check("응답 필드(제목/파일명/크기/활성)",
      st == 200 and r["data"]["title"] == "2026년 사업자등록증"
      and r["data"]["originalName"] == "사업자등록증.pdf"
      and r["data"]["size"] == len(pdf) and r["data"]["isActive"] is True)
check("fileKey 미노출", st == 200 and "fileKey" not in r["data"])

st, r = call("GET", "/api/admin/documents", token=admin)
check("목록 포함", st == 200 and any(d["id"] == did for d in r["data"]))

# ===== 관리자 다운로드(이력 미기록) =====
st, h, body = download(f"/api/admin/documents/{did}/download", admin)
cd = urllib.parse.unquote(h.get("Content-Disposition", ""))
check("관리자 다운로드 200 + PDF 매직 + 파일명",
      st == 200 and body[:5] == b"%PDF-" and "사업자등록증.pdf" in cd, f"st={st} len={len(body)}")

# 다운로드 후에도 발급 이력은 비어 있어야(관리자 다운로드는 기록 안 함)
st, r = call("GET", f"/api/admin/documents/issues?documentId={did}", token=admin)
admin_issue_count = len([i for i in r["data"] if i["documentId"] == did]) if st == 200 else -1
check("관리자 다운로드는 이력 미기록", admin_issue_count == 0, f"count={admin_issue_count}")

# ===== 수정(제목) =====
st, r = call("PATCH", f"/api/admin/documents/{did}", token=admin, body={"title": "사업자등록증(수정본)"})
check("수정 200 + 제목 반영", st == 200 and r["data"]["title"] == "사업자등록증(수정본)")

# ===== soft delete → 비활성, 목록엔 존재 =====
st, r = call("DELETE", f"/api/admin/documents/{did}", token=admin)
check("soft delete 200", st == 200)
st, r = call("GET", "/api/admin/documents", token=admin)
tgt = next((d for d in r["data"] if d["id"] == did), None)
check("soft delete 후 isActive=false(목록 존재)", tgt is not None and tgt["isActive"] is False)

# 재활성화
st, r = call("PATCH", f"/api/admin/documents/{did}", token=admin, body={"isActive": True})
check("재활성화 200", st == 200 and r["data"]["isActive"] is True)

# ===== 발급 이력: 파트너 다운로드 시뮬 → row 생성 =====
print("\n===== 발급 이력 =====")
email = f"docverify_{int(time.time())}@company.com"
st, r = call("POST", "/api/admin/partners", token=admin,
             body={"email": email, "companyName": "이력검증상사", "contactName": "박이력"})
temp_pw = r["data"]["temporaryPassword"]
ppid = r["data"]["id"]
st, r = call("POST", "/api/partner/auth/login", body={"email": email, "password": temp_pw})
ptoken = r["data"]["accessToken"]
check("파트너 로그인", bool(ptoken))

# 신규 파트너는 mustChangePassword=true → 비번 가드로 파트너 API 403.
# 비밀번호 변경 후 정상 접근 가능(다운로드 시뮬 전제).
st, r = call("POST", "/api/partner/auth/change-password", token=ptoken,
             body={"currentPassword": temp_pw, "newPassword": "newpass1234"})
check("파트너 비밀번호 변경 200", st == 200, f"st={st}")

# 파트너가 문서 다운로드 → 이력 1건 기록
st, h, body = download(f"/api/partner/documents/{did}/download", ptoken)
check("파트너 다운로드 200", st == 200 and body[:5] == b"%PDF-", f"st={st}")

st, r = call("GET", "/api/admin/documents/issues", token=admin)
mine = [i for i in r["data"] if i["documentId"] == did and i["partnerId"] == ppid] if st == 200 else []
check("발급 이력 row 생성", len(mine) == 1, f"count={len(mine)}")
check("이력 응답 필드(파트너/문서)",
      bool(mine) and mine[0]["partnerCompanyName"] == "이력검증상사"
      and mine[0]["documentTitle"] == "사업자등록증(수정본)" and mine[0]["documentType"] == "BUSINESS_LICENSE")

# 파트너 필터
st, r = call("GET", f"/api/admin/documents/issues?partnerId={ppid}", token=admin)
check("파트너 필터 동작", st == 200 and all(i["partnerId"] == ppid for i in r["data"]) and len(r["data"]) >= 1)

# 정리
call("DELETE", f"/api/admin/documents/{did}", token=admin)

print(f"\n===== 결과: {PASS} PASS / {FAIL} FAIL =====")

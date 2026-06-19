# -*- coding: utf-8 -*-
"""파트너 포트폴리오 API 검증: 목록(카테고리/키워드 필터)/상세/첨부 다운로드 +
민감정보(fileKey/uploadedBy) 미노출 확인. 파트너 가드(mustChangePassword) 흐름 포함. urllib UTF-8."""
import base64
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


def post_multipart(path, token, fields, files):
    boundary = "----ellinkPf7q"
    buf = io.BytesIO()
    for k, v in fields.items():
        buf.write(f"--{boundary}\r\n".encode())
        buf.write(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode())
        buf.write(v.encode("utf-8")); buf.write(b"\r\n")
    for name, fname, ctype, content in files:
        buf.write(f"--{boundary}\r\n".encode())
        buf.write(f'Content-Disposition: form-data; name="{name}"; filename="{fname}"\r\n'.encode())
        buf.write(f"Content-Type: {ctype}\r\n\r\n".encode()); buf.write(content); buf.write(b"\r\n")
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


# ===== 준비: 관리자가 자료(첨부 포함) 1건 + 다른 카테고리 1건 생성 =====
st, r = call("POST", "/api/admin/auth/login",
             body={"email": "admin@ecolink.demo", "password": "admin1234"})
admin = r["data"]["accessToken"]
check("관리자 로그인", st == 200 and bool(admin))

png = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
st, r = post_multipart("/api/admin/materials/analyze", admin,
                       {"text": "더미"}, [("file", "guide.png", "image/png", png)])
fileref = r["data"].get("file") if st == 200 else None

st, r = call("POST", "/api/admin/materials", token=admin, body={
    "title": "업사이클 체험 키트", "summary": "폐플라스틱 블럭 친환경 조립 체험.",
    "category": "업사이클링", "keywords": "자원순환,업사이클링,체험",
    "files": [fileref] if fileref else []})
mid = r["data"]["id"] if st == 200 else None
check("자료A(업사이클링+첨부) 생성", bool(mid) and (not fileref or len(r["data"]["files"]) == 1))

st, r = call("POST", "/api/admin/materials", token=admin, body={
    "title": "환경 교육 워크숍", "summary": "초등 대상 환경 교육.",
    "category": "환경 교육", "keywords": "환경교육,캠페인", "files": []})
mid2 = r["data"]["id"] if st == 200 else None
check("자료B(환경 교육) 생성", bool(mid2))

# ===== 파트너 로그인 + 비번 변경(가드 해제) =====
email = f"pf_{int(time.time())}@company.com"
st, r = call("POST", "/api/admin/partners", token=admin,
             body={"email": email, "companyName": "포트폴리오상사", "contactName": "정포폴"})
temp_pw = r["data"]["temporaryPassword"]
st, r = call("POST", "/api/partner/auth/login", body={"email": email, "password": temp_pw})
ptoken = r["data"]["accessToken"]

# 비번 변경 전: 가드로 403
st, r = call("GET", "/api/partner/portfolio", token=ptoken)
check("비번 변경 전 포트폴리오 접근 → 403(가드)", st == 403, f"st={st}")

st, r = call("POST", "/api/partner/auth/change-password", token=ptoken,
             body={"currentPassword": temp_pw, "newPassword": "newpass1234"})
check("비번 변경 200", st == 200)

# ===== 목록 =====
print("\n===== 포트폴리오 =====")
st, r = call("GET", "/api/partner/portfolio", token=ptoken)
check("목록 200 + 두 자료 포함",
      st == 200 and any(m["id"] == mid for m in r["data"]) and any(m["id"] == mid2 for m in r["data"]))
# 민감정보 미노출(목록 항목)
item = next((m for m in r["data"] if m["id"] == mid), {})
check("목록 민감정보 미노출(uploadedBy/fileKey 없음)",
      "uploadedByName" not in item and "fileKey" not in item, f"keys={list(item.keys())}")

# 카테고리 필터
st, r = call("GET", "/api/partner/portfolio?" + urllib.parse.urlencode({"category": "업사이클링"}), token=ptoken)
check("카테고리 필터 동작",
      st == 200 and any(m["id"] == mid for m in r["data"]) and all(m["category"] == "업사이클링" for m in r["data"]))
# 키워드 필터
st, r = call("GET", "/api/partner/portfolio?" + urllib.parse.urlencode({"keyword": "자원순환"}), token=ptoken)
check("키워드 필터 동작", st == 200 and any(m["id"] == mid for m in r["data"]))

# ===== 상세 =====
st, r = call("GET", f"/api/partner/portfolio/{mid}", token=ptoken)
check("상세 200", st == 200 and r["data"]["id"] == mid)
d = r["data"] if st == 200 else {}
check("상세 민감정보 미노출(uploadedByName 없음)", "uploadedByName" not in d, f"keys={list(d.keys())}")
files = d.get("files", [])
check("상세 파일 fileKey 미노출", all("fileKey" not in f for f in files), f"file_keys={[list(f.keys()) for f in files]}")

# ===== 첨부 다운로드 =====
if files:
    fid = files[0]["id"]
    st, h, body = download(f"/api/partner/portfolio/{mid}/files/{fid}/download", ptoken)
    cd = urllib.parse.unquote(h.get("Content-Disposition", ""))
    check("첨부 다운로드 200 + PNG 매직 + 파일명",
          st == 200 and body[:8] == png[:8] and "guide.png" in cd, f"st={st} len={len(body)}")
else:
    check("첨부 다운로드", False, "첨부 파일이 없음(analyze 실패 가능)")

# 정리
for x in (mid, mid2):
    if x:
        call("DELETE", f"/api/admin/materials/{x}", token=admin)

print(f"\n===== 결과: {PASS} PASS / {FAIL} FAIL =====")

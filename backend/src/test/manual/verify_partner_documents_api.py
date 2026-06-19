# -*- coding: utf-8 -*-
"""파트너 서류 발급 API 검증: 목록(type별 그룹, 민감정보 미노출)/다운로드(이력 자동 기록).
파트너 가드(mustChangePassword) 흐름 포함. urllib UTF-8."""
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
check("관리자 로그인", st == 200 and bool(admin))

# 파트너 준비 + 비번 변경(가드 해제)
email = f"pd_{int(time.time())}@company.com"
st, r = call("POST", "/api/admin/partners", token=admin,
             body={"email": email, "companyName": "서류발급상사", "contactName": "최서류"})
temp_pw = r["data"]["temporaryPassword"]
ppid = r["data"]["id"]
st, r = call("POST", "/api/partner/auth/login", body={"email": email, "password": temp_pw})
ptoken = r["data"]["accessToken"]
st, r = call("POST", "/api/partner/auth/change-password", token=ptoken,
             body={"currentPassword": temp_pw, "newPassword": "newpass1234"})
check("파트너 비번 변경", st == 200)

# ===== 목록(type별 그룹) =====
print("\n===== 파트너 서류 목록 =====")
st, r = call("GET", "/api/partner/documents", token=ptoken)
check("목록 200", st == 200)
groups = r["data"] if st == 200 else []
check("시드 문서 2종 그룹 존재(사업자등록증/통장사본)",
      any(g["type"] == "BUSINESS_LICENSE" for g in groups)
      and any(g["type"] == "BANK_ACCOUNT" for g in groups),
      f"types={[g['type'] for g in groups]}")

# 민감정보 미노출
all_items = [it for g in groups for it in g["documents"]]
check("문서 항목 민감정보 미노출(fileKey/uploadedBy 없음)",
      all("fileKey" not in it and "uploadedByName" not in it for it in all_items),
      f"keys={list(all_items[0].keys()) if all_items else '없음'}")

# ===== 다운로드 → 이력 자동 기록 =====
print("\n===== 다운로드 + 발급 이력 =====")
doc = all_items[0]
did = doc["id"]
st, h, body = download(f"/api/partner/documents/{did}/download", ptoken)
cd = urllib.parse.unquote(h.get("Content-Disposition", ""))
check("다운로드 200 + 파일 수신 + 파일명",
      st == 200 and len(body) > 0 and doc["originalName"] in cd, f"st={st} len={len(body)}")

# 발급 이력 row 생성 확인(관리자)
st, r = call("GET", f"/api/admin/documents/issues?partnerId={ppid}", token=admin)
mine = [i for i in r["data"] if i["documentId"] == did and i["partnerId"] == ppid] if st == 200 else []
check("발급 이력 row 생성", len(mine) == 1, f"count={len(mine)}")
check("이력 응답 필드(파트너/문서)",
      bool(mine) and mine[0]["partnerCompanyName"] == "서류발급상사" and mine[0]["documentTitle"] == doc["title"])

print(f"\n===== 결과: {PASS} PASS / {FAIL} FAIL =====")

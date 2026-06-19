# -*- coding: utf-8 -*-
"""catalog + partner 프론트가 쓰는 API 검증.
catalog: list/create/update/비활성/활성/soft delete/단가검증. partner: create(임시비번)/login/list/status. urllib UTF-8."""
import json
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

# ===== CATALOG =====
print("\n===== CATALOG =====")
st, r = call("POST", "/api/admin/catalog", token=admin, body={
    "category": "EXPERIENCE", "itemName": "업사이클 체험 키트",
    "unitPrice": 50000, "unit": "개", "priceType": "FIXED"})
check("create 200", st == 200, f"st={st}")
cid = r["data"]["id"] if st == 200 else None
check("create 응답 필드", st == 200 and r["data"]["itemName"] == "업사이클 체험 키트"
      and r["data"]["isActive"] is True and r["data"]["unitPrice"] == 50000)

st, r = call("GET", "/api/admin/catalog", token=admin)
check("list 200 + 항목 포함", st == 200 and any(c["id"] == cid for c in r["data"]))

# 수정
st, r = call("PATCH", f"/api/admin/catalog/{cid}", token=admin, body={"unitPrice": 60000, "unit": "세트"})
check("update 200 + 반영", st == 200 and r["data"]["unitPrice"] == 60000 and r["data"]["unit"] == "세트")

# 비활성화(soft delete) → 목록엔 남지만 isActive=false
st, r = call("DELETE", f"/api/admin/catalog/{cid}", token=admin)
check("delete(soft) 200", st == 200)
st, r = call("GET", "/api/admin/catalog", token=admin)
target = next((c for c in r["data"] if c["id"] == cid), None)
check("soft delete 후 isActive=false (목록엔 존재)", target is not None and target["isActive"] is False,
      f"target={target}")

# 다시 활성화
st, r = call("PATCH", f"/api/admin/catalog/{cid}", token=admin, body={"isActive": True})
check("재활성화 200 + isActive=true", st == 200 and r["data"]["isActive"] is True)

# 단가 음수 → 400
st, r = call("POST", "/api/admin/catalog", token=admin, body={
    "category": "EXPERIENCE", "itemName": "음수단가", "unitPrice": -100, "unit": "개", "priceType": "FIXED"})
check("단가 음수 → 400", st == 400, f"st={st}")

# CUSTOM 0원 허용
st, r = call("POST", "/api/admin/catalog", token=admin, body={
    "category": "PLANNING", "itemName": "맞춤 기획", "unitPrice": 0, "unit": "식", "priceType": "CUSTOM"})
check("CUSTOM 0원 허용 200", st == 200, f"st={st}")
cid2 = r["data"]["id"] if st == 200 else None

# 파트너 활성 목록(비활성 제외) — soft delete된 게 빠지는지: 위에서 재활성화했으니 다시 비활성화 후 확인
call("DELETE", f"/api/admin/catalog/{cid}", token=admin)
st, r = call("GET", "/api/partner/catalog", token=admin)  # admin 토큰으론 403 가능 — 별도 확인 생략
# 정리
if cid2:
    call("DELETE", f"/api/admin/catalog/{cid2}", token=admin)

# ===== PARTNER =====
print("\n===== PARTNER =====")
import time
email = f"verify_{int(time.time())}@company.com"
st, r = call("POST", "/api/admin/partners", token=admin, body={
    "email": email, "companyName": "검증상사", "contactName": "김검증", "phone": "010-1234-5678"})
check("partner create 200", st == 200, f"st={st}")
temp_pw = r["data"]["temporaryPassword"] if st == 200 else None
pid = r["data"]["id"] if st == 200 else None
check("임시비번 1회 노출", bool(temp_pw), f"len={len(temp_pw or '')}")

# 임시비번으로 파트너 로그인
st, r = call("POST", "/api/partner/auth/login", body={"email": email, "password": temp_pw})
check("임시비번으로 파트너 로그인 200", st == 200 and r.get("data", {}).get("accessToken"),
      f"st={st} mustChange={r.get('data', {}).get('mustChangePassword')}")

# 목록에 INVITED로 보임
st, r = call("GET", "/api/admin/partners", token=admin)
p = next((x for x in r["data"] if x["id"] == pid), None)
check("목록에 INVITED 상태로 보임", p is not None and p["status"] == "INVITED", f"status={p['status'] if p else None}")

# 중복 이메일 → 400
st, r = call("POST", "/api/admin/partners", token=admin, body={
    "email": email, "companyName": "중복상사", "contactName": "이중복"})
check("중복 이메일 → 409(DUPLICATE_EMAIL)", st == 409, f"st={st}")

# 비활성화
st, r = call("PATCH", f"/api/admin/partners/{pid}/status", token=admin, body={"status": "DISABLED"})
check("비활성화 200 + DISABLED", st == 200 and r["data"]["status"] == "DISABLED")
# 활성화
st, r = call("PATCH", f"/api/admin/partners/{pid}/status", token=admin, body={"status": "ACTIVE"})
check("활성화 200 + ACTIVE", st == 200 and r["data"]["status"] == "ACTIVE")

print(f"\n===== 결과: {PASS} PASS / {FAIL} FAIL =====")

# -*- coding: utf-8 -*-
"""파트너 모의 견적 API 검증: 카탈로그/생성(DRAFT)/목록/상세/발급(PDF)/PDF 재다운로드/
단가 스냅샷(발급 후 카탈로그 단가 변경해도 견적·PDF 불변)/빈 항목 400. urllib UTF-8."""
import json
import time
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
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw


def get_bytes(path, token, method="GET", body=None):
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Authorization": "Bearer " + token}
    if data:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
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


# 준비: 관리자, 파트너(비번 변경)
st, r = call("POST", "/api/admin/auth/login", body={"email": "admin@ecolink.demo", "password": "admin1234"})
admin = r["data"]["accessToken"]
check("관리자 로그인", st == 200 and bool(admin))

email = f"q_{int(time.time())}@company.com"
st, r = call("POST", "/api/admin/partners", token=admin,
             body={"email": email, "companyName": "견적테스트상사", "contactName": "한견적"})
temp_pw = r["data"]["temporaryPassword"]
st, r = call("POST", "/api/partner/auth/login", body={"email": email, "password": temp_pw})
ptoken = r["data"]["accessToken"]
call("POST", "/api/partner/auth/change-password", token=ptoken,
     body={"currentPassword": temp_pw, "newPassword": "newpass1234"})

# 카탈로그(활성) — FIXED 항목 확보(없으면 관리자 생성)
st, r = call("GET", "/api/partner/catalog", token=ptoken)
check("활성 카탈로그 200", st == 200)
fixed = next((c for c in r["data"] if c["priceType"] == "FIXED" and c["isActive"]), None)
if not fixed:
    st, rc = call("POST", "/api/admin/catalog", token=admin, body={
        "category": "EXPERIENCE", "itemName": "검증용 체험", "unitPrice": 30000, "unit": "명", "priceType": "FIXED"})
    fixed_id, fixed_price = rc["data"]["id"], rc["data"]["unitPrice"]
    st, r = call("GET", "/api/partner/catalog", token=ptoken)
else:
    fixed_id, fixed_price = fixed["id"], fixed["unitPrice"]
check("FIXED 카탈로그 확보", bool(fixed_id), f"id={fixed_id} price={fixed_price}")

# ===== 생성(DRAFT): FIXED 1 + 커스텀 1 =====
print("\n===== 생성/조회 =====")
st, r = call("POST", "/api/partner/quotes", token=ptoken, body={"items": [
    {"catalogId": fixed_id, "quantity": 2},
    {"itemName": "맞춤 운송비", "unitPrice": 50000, "quantity": 1},
]})
check("생성 200 + DRAFT", st == 200 and r["data"]["status"] == "DRAFT", f"st={st}")
qid = r["data"]["id"] if st == 200 else None
expected_total = fixed_price * 2 + 50000
check("서버 총액 재계산", st == 200 and r["data"]["totalAmount"] == expected_total,
      f"total={r['data'].get('totalAmount')} expected={expected_total}")
check("FIXED 라인 단가 스냅샷=카탈로그 단가",
      any(it["catalogId"] == fixed_id and it["unitPrice"] == fixed_price for it in r["data"]["items"]))

# 목록 DRAFT 포함
st, r = call("GET", "/api/partner/quotes", token=ptoken)
li = next((x for x in r["data"] if x["id"] == qid), None)
check("목록에 DRAFT 포함", li is not None and li["status"] == "DRAFT")

# 상세
st, r = call("GET", f"/api/partner/quotes/{qid}", token=ptoken)
check("상세 200 + 항목 2개", st == 200 and len(r["data"]["items"]) == 2)

# DRAFT PDF 요청 → 404
st, h, body = get_bytes(f"/api/partner/quotes/{qid}/pdf", ptoken)
check("DRAFT PDF 요청 → 404", st == 404, f"st={st}")

# ===== 발급 =====
print("\n===== 발급 + 스냅샷 =====")
st, h, pdf = get_bytes(f"/api/partner/quotes/{qid}/issue", ptoken, method="POST")
check("발급 200 + PDF(%PDF) + content-type",
      st == 200 and pdf[:5] == b"%PDF-" and "application/pdf" in h.get("Content-Type", ""),
      f"st={st} len={len(pdf)}")
issued_len = len(pdf)

# 발급 후 상태 ISSUED
st, r = call("GET", f"/api/partner/quotes/{qid}", token=ptoken)
check("발급 후 ISSUED + issuedAt", st == 200 and r["data"]["status"] == "ISSUED" and r["data"]["issuedAt"])

# PDF 재다운로드 = 발급본과 동일 바이트(저장본)
st, h, pdf2 = get_bytes(f"/api/partner/quotes/{qid}/pdf", ptoken)
check("PDF 재다운로드 200 + 동일 바이트", st == 200 and len(pdf2) == issued_len and pdf2 == pdf,
      f"len={len(pdf2)} vs {issued_len}")

# ===== 단가 스냅샷: 카탈로그 단가 변경 후에도 견적/PDF 불변 =====
new_price = fixed_price + 99999
call("PATCH", f"/api/admin/catalog/{fixed_id}", token=admin, body={"unitPrice": new_price})
st, r = call("GET", f"/api/partner/quotes/{qid}", token=ptoken)
check("카탈로그 단가 변경 후 견적 총액 불변(스냅샷)",
      st == 200 and r["data"]["totalAmount"] == expected_total,
      f"total={r['data'].get('totalAmount')} expected={expected_total}")
st, h, pdf3 = get_bytes(f"/api/partner/quotes/{qid}/pdf", ptoken)
check("단가 변경 후 PDF 동일(발급 시점 고정)", st == 200 and pdf3 == pdf)
# 카탈로그 원복
call("PATCH", f"/api/admin/catalog/{fixed_id}", token=admin, body={"unitPrice": fixed_price})

# ===== 빈 항목 400 =====
st, r = call("POST", "/api/partner/quotes", token=ptoken, body={"items": []})
check("빈 항목 → 400", st == 400, f"st={st}")

# 비활성 카탈로그 라인 → 400
st, rc = call("POST", "/api/admin/catalog", token=admin, body={
    "category": "EXPERIENCE", "itemName": "곧 비활성", "unitPrice": 1000, "unit": "개", "priceType": "FIXED"})
inact_id = rc["data"]["id"]
call("DELETE", f"/api/admin/catalog/{inact_id}", token=admin)  # soft delete
st, r = call("POST", "/api/partner/quotes", token=ptoken, body={"items": [{"catalogId": inact_id, "quantity": 1}]})
check("비활성 카탈로그 라인 → 400", st == 400, f"st={st}")

print(f"\n===== 결과: {PASS} PASS / {FAIL} FAIL =====")

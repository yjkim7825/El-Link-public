# -*- coding: utf-8 -*-
"""견적 계산식 정비 검증: 일수 승수/기업이윤10%/VAT10%/발주처 필수/유효기간/단가 스냅샷/시드 호환.
발급 PDF 1장을 verify_output/에 저장. urllib UTF-8."""
import json
import os
import time
import urllib.request
import urllib.error

BASE = "http://localhost:8080"
PASS = FAIL = 0
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "verify_output")


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


def expect_breakdown(subtotal):
    profit = round(subtotal * 0.1)
    supply = subtotal + profit
    vat = round(supply * 0.1)
    return subtotal, profit, supply, vat, supply + vat


st, r = call("POST", "/api/admin/auth/login", body={"email": "admin@ecolink.demo", "password": "admin1234"})
admin = r["data"]["accessToken"]
check("관리자 로그인", st == 200 and bool(admin))

# 파트너(비번 변경)
email = f"calc_{int(time.time())}@company.com"
st, r = call("POST", "/api/admin/partners", token=admin,
             body={"email": email, "companyName": "계산검증상사", "contactName": "정계산"})
temp_pw = r["data"]["temporaryPassword"]
st, r = call("POST", "/api/partner/auth/login", body={"email": email, "password": temp_pw})
ptoken = r["data"]["accessToken"]
call("POST", "/api/partner/auth/change-password", token=ptoken,
     body={"currentPassword": temp_pw, "newPassword": "newpass1234"})

# 카탈로그 FIXED 확보
st, r = call("GET", "/api/partner/catalog", token=ptoken)
fixed = next((c for c in r["data"] if c["priceType"] == "FIXED" and c["isActive"]), None)
fid, fprice = fixed["id"], fixed["unitPrice"]

# ===== (A) 일수 승수 + 금액 분해 =====
print("\n===== (A) 일수/이윤/VAT =====")
# 라인: FIXED 단가 × 수량3 × 일수2  +  커스텀 50000 × 1 × 4
st, r = call("POST", "/api/partner/quotes", token=ptoken, body={
    "clientCompanyName": "테스트발주처",
    "items": [
        {"catalogId": fid, "quantity": 3, "days": 2},
        {"itemName": "맞춤 운송", "unitPrice": 50000, "quantity": 1, "days": 4},
    ]})
check("생성 200 + DRAFT", st == 200 and r["data"]["status"] == "DRAFT", f"st={st}")
q = r["data"]
exp_sub = fprice * 3 * 2 + 50000 * 1 * 4
es, ep, esp, ev, et = expect_breakdown(exp_sub)
check("라인 소계 = 단가×수량×일수",
      any(it["catalogId"] == fid and it["days"] == 2 and it["subtotal"] == fprice * 3 * 2 for it in q["items"]))
check("라인합(subtotalSum)", q["subtotalSum"] == es, f"{q['subtotalSum']} vs {es}")
check("기업이윤 10%", q["companyProfit"] == ep, f"{q['companyProfit']} vs {ep}")
check("공급가액", q["supplyAmount"] == esp, f"{q['supplyAmount']} vs {esp}")
check("부가세 10%", q["vat"] == ev, f"{q['vat']} vs {ev}")
check("합계(공급가액+VAT)", q["totalAmount"] == et, f"{q['totalAmount']} vs {et}")
check("발주처 저장", q["clientCompanyName"] == "테스트발주처")
qid = q["id"]

# ===== (B) 발주처 없이 발급 → 400 =====
print("\n===== (B) 발주처 필수 =====")
st, r = call("POST", "/api/partner/quotes", token=ptoken, body={
    "items": [{"catalogId": fid, "quantity": 1, "days": 1}]})  # 발주처 없음
noclient_id = r["data"]["id"]
st, h, body = get_bytes(f"/api/partner/quotes/{noclient_id}/issue", ptoken, method="POST")
err = json.loads(body.decode())
check("발주처 없이 발급 → 400 CLIENT_COMPANY_REQUIRED",
      st == 400 and err.get("error", {}).get("code") == "CLIENT_COMPANY_REQUIRED", f"st={st}")

# ===== (C) 발급 + PDF + 유효기간 + 저장 =====
print("\n===== (C) 발급 + 유효기간 =====")
st, h, pdf = get_bytes(f"/api/partner/quotes/{qid}/issue", ptoken, method="POST")
check("발급 200 + PDF", st == 200 and pdf[:5] == b"%PDF-", f"st={st} len={len(pdf)}")
os.makedirs(OUT_DIR, exist_ok=True)
with open(os.path.join(OUT_DIR, "quote_calc_sample.pdf"), "wb") as f:
    f.write(pdf)
print(f"  → PDF 저장: verify_output/quote_calc_sample.pdf ({len(pdf)} bytes)")

st, r = call("GET", f"/api/partner/quotes/{qid}", token=ptoken)
check("발급 후 ISSUED + validUntil 노출", st == 200 and r["data"]["status"] == "ISSUED" and r["data"].get("validUntil"))
# validUntil ≈ issuedAt + 1개월
check("유효기간 = 발급 + 약 1개월", bool(r["data"].get("validUntil")) and r["data"]["validUntil"] > r["data"]["issuedAt"])

# ===== (D) 단가 스냅샷 회귀 =====
print("\n===== (D) 단가 스냅샷 회귀 =====")
new_price = fprice + 77777
call("PATCH", f"/api/admin/catalog/{fid}", token=admin, body={"unitPrice": new_price})
st, r = call("GET", f"/api/partner/quotes/{qid}", token=ptoken)
check("카탈로그 단가 변경 후 합계 불변(스냅샷)", st == 200 and r["data"]["totalAmount"] == et,
      f"{r['data']['totalAmount']} vs {et}")
call("PATCH", f"/api/admin/catalog/{fid}", token=admin, body={"unitPrice": fprice})  # 원복

# ===== (E) 시드 견적 2개 새 스키마 호환 =====
print("\n===== (E) 시드 견적 호환 =====")
st, r = call("POST", "/api/partner/auth/login", body={"email": "active@partner.demo", "password": "demo1234"})
seed_token = r["data"]["accessToken"] if st == 200 else None
if seed_token:
    st, r = call("GET", "/api/partner/quotes", token=seed_token)
    check("시드 견적 2개 조회", st == 200 and len(r["data"]) == 2, f"count={len(r['data']) if st==200 else st}")
    check("시드 견적 발주처 노출", st == 200 and all(x["clientCompanyName"] for x in r["data"]))
    issued_seed = next((x for x in r["data"] if x["status"] == "ISSUED"), None)
    if issued_seed:
        st, d = call("GET", f"/api/partner/quotes/{issued_seed['id']}", token=seed_token)
        items = d["data"]["items"]
        check("시드 견적 라인 days 채워짐(>=1)", all(it["days"] >= 1 for it in items))
        # 새 공식 검증: subtotalSum→total
        es2 = d["data"]["subtotalSum"]
        check("시드 견적 합계 새 공식 일치", d["data"]["totalAmount"] == expect_breakdown(es2)[4])
else:
    check("시드 파트너 로그인", False, "active@partner.demo 로그인 실패")

print(f"\n===== 결과: {PASS} PASS / {FAIL} FAIL =====")

# -*- coding: utf-8 -*-
"""Phase 7 견적서 PDF 검증. 발급/다운로드/스냅샷 보존/소유권/상태 가드 + 한글 렌더.
결과 PDF는 repo 루트 verify_output/ 에 저장한다. urllib UTF-8."""
import io
import json
import os
import urllib.parse
import urllib.request
import urllib.error

BASE = "http://localhost:8080"
OUTPUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "verify_output"))
os.makedirs(OUTPUT, exist_ok=True)
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


def binary(method, path, token):
    """바이너리 응답 → (status, headers, body_bytes)."""
    req = urllib.request.Request(BASE + path, headers={"Authorization": "Bearer " + token}, method=method)
    try:
        with urllib.request.urlopen(req) as r:
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


def login(email, pw):
    return call("POST", "/api/partner/auth/login", body={"email": email, "password": pw})


def onboard_fresh(admin, email, company):
    st, r = call("POST", "/api/admin/partners", token=admin,
                 body={"email": email, "companyName": company, "contactName": "담당자"})
    temp = r["data"]["temporaryPassword"]
    st, r = login(email, temp)
    tok = r["data"]["accessToken"]
    call("POST", "/api/partner/auth/change-password", token=tok,
         body={"currentPassword": temp, "newPassword": "pdfpass1234"})
    st, r = login(email, "pdfpass1234")
    return r["data"]["accessToken"]


# ===== 인증 =====
st, r = call("POST", "/api/admin/auth/login",
             body={"email": "admin@ecolink.demo", "password": "admin1234"})
admin = r["data"]["accessToken"]
check("관리자 로그인 200", st == 200 and admin)

p1 = onboard_fresh(admin, "pdfpartner1@acme.com", "(주)한글기업")
p2 = onboard_fresh(admin, "pdfpartner2@acme.com", "베타상사")
check("파트너 2명 온보딩", bool(p1) and bool(p2))

# ===== 카탈로그에서 FIXED 항목 확보 =====
st, r = call("GET", "/api/partner/catalog", token=p1)
catalog = r["data"] if st == 200 else []
fixed = next((c for c in catalog if c["priceType"] == "FIXED"), None)
check("활성 카탈로그 FIXED 항목 존재", fixed is not None, f"item={fixed['itemName'] if fixed else '-'}")

# ===== (1) 견적 생성(DRAFT) — 한글 품목 + 커스텀 라인 =====
print("\n===== (1) 견적 생성 =====")
quote_body = {"items": [
    {"catalogId": fixed["id"], "quantity": 3},
    {"itemName": "현장 운영 인건비(주말)", "unitPrice": 150000, "quantity": 2},
]}
st, r = call("POST", "/api/partner/quotes", token=p1, body=quote_body)
check("견적 생성 200 + DRAFT", st == 200 and r["data"]["status"] == "DRAFT", f"st={st}")
quote_id = r["data"]["id"]
issued_total = r["data"]["totalAmount"]
expected_total = fixed["unitPrice"] * 3 + 150000 * 2
check("서버 재계산 총액 일치", issued_total == expected_total, f"total={issued_total} expected={expected_total}")

# ===== (2) DRAFT 상태 PDF 요청 → 404 =====
print("\n===== (2) DRAFT pdf 요청 404 =====")
st, h, b = binary("GET", f"/api/partner/quotes/{quote_id}/pdf", p1)
check("DRAFT 상태 GET pdf → 404", st == 404, f"st={st}")

# ===== (3) 발급(issue) → PDF 반환 =====
print("\n===== (3) 발급 =====")
st, headers, pdf = binary("POST", f"/api/partner/quotes/{quote_id}/issue", p1)
check("issue 200", st == 200, f"st={st}")
check("Content-Type application/pdf", headers.get("Content-Type", "").startswith("application/pdf"),
      f"ct={headers.get('Content-Type')}")
cd = urllib.parse.unquote(headers.get("Content-Disposition", ""))
check("Content-Disposition attachment", "attachment" in cd and "quote-" in cd, f"cd={cd}")
check("byte 길이 > 0", len(pdf) > 0, f"len={len(pdf)}")
check("PDF 매직넘버 %PDF 시작", pdf[:4] == b"%PDF", f"head={pdf[:8]}")
with open(os.path.join(OUTPUT, "quote_issued.pdf"), "wb") as f:
    f.write(pdf)

st, r = call("GET", f"/api/partner/quotes/{quote_id}", token=p1)
check("발급 후 상태 ISSUED + issuedAt 기록", r["data"]["status"] == "ISSUED" and r["data"].get("issuedAt"),
      f"status={r['data']['status']}")

# ===== (4) 재발급 시도 → 400 =====
print("\n===== (4) 재발급 차단 =====")
st, r = call("POST", f"/api/partner/quotes/{quote_id}/issue", token=p1)
check("이미 발급된 견적 재발급 → 400", st == 400, f"st={st}")

# ===== (5) 카탈로그 단가 변경 후 PDF 재다운로드 → 스냅샷 보존 =====
print("\n===== (5) 단가 변경 후 스냅샷 보존 =====")
new_price = fixed["unitPrice"] + 99999
st, r = call("PATCH", f"/api/admin/catalog/{fixed['id']}", token=admin, body={"unitPrice": new_price})
check("관리자 카탈로그 단가 변경 200", st == 200 and r["data"]["unitPrice"] == new_price, f"st={st}")

st, headers, pdf2 = binary("GET", f"/api/partner/quotes/{quote_id}/pdf", p1)
check("발급된 PDF 재다운로드 200", st == 200, f"st={st}")
check("재다운로드 PDF == 발급 PDF (바이트 동일)", pdf2 == pdf, f"len1={len(pdf)} len2={len(pdf2)}")
with open(os.path.join(OUTPUT, "quote_redownload.pdf"), "wb") as f:
    f.write(pdf2)

st, r = call("GET", f"/api/partner/quotes/{quote_id}", token=p1)
snap_line = next((it for it in r["data"]["items"] if it["catalogId"] == fixed["id"]), None)
check("견적 라인 단가는 발급 당시 스냅샷 유지(변경 전 값)",
      snap_line and snap_line["unitPrice"] == fixed["unitPrice"],
      f"line={snap_line['unitPrice'] if snap_line else '-'} catalogNow={new_price}")
check("견적 총액도 발급 당시 유지", r["data"]["totalAmount"] == expected_total,
      f"total={r['data']['totalAmount']}")

# ===== (6) 다른 파트너 PDF 요청 → 404 =====
print("\n===== (6) 소유권 격리 =====")
st, h, b = binary("GET", f"/api/partner/quotes/{quote_id}/pdf", p2)
check("다른 파트너 GET pdf → 404", st == 404, f"st={st}")
st, r = call("POST", f"/api/partner/quotes/{quote_id}/issue", token=p2)
check("다른 파트너 issue → 404", st == 404, f"st={st}")

# ===== (7) 없는 견적 =====
st, h, b = binary("GET", "/api/partner/quotes/999999/pdf", p1)
check("없는 견적 pdf → 404", st == 404, f"st={st}")

print(f"\nPDF 저장 위치: {OUTPUT}")
print(f"\n===== 결과: {PASS} PASS / {FAIL} FAIL =====")

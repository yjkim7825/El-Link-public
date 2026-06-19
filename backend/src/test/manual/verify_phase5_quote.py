# -*- coding: utf-8 -*-
"""Phase 5 quote 도메인 수동 검증(카탈로그 CRUD + 견적 스냅샷/재계산/소유권). urllib UTF-8."""
import json
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


def check(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
    else:
        FAIL += 1
    print(f"[{'PASS' if cond else 'FAIL'}] {name}" + (f"  -- {detail}" if detail else ""))


def login(email, pw):
    st, r = call("POST", "/api/partner/auth/login", body={"email": email, "password": pw})
    return st, r


def onboard_partner(admin, email, company, contact="담당자"):
    """관리자 등록 → 임시비번 로그인 → 비번변경 → 재로그인. 활성 토큰 반환."""
    st, r = call("POST", "/api/admin/partners", token=admin,
                 body={"email": email, "companyName": company, "contactName": contact})
    temp = r["data"]["temporaryPassword"]
    st, r = login(email, temp)
    tok_mcp = r["data"]["accessToken"]  # mustChangePassword 상태 토큰
    new_pw = "quotepass1234"
    call("POST", "/api/partner/auth/change-password", token=tok_mcp,
         body={"currentPassword": temp, "newPassword": new_pw})
    st, r = login(email, new_pw)
    return r["data"]["accessToken"], temp


# ===== 인증 =====
st, r = call("POST", "/api/admin/auth/login",
             body={"email": "admin@ecolink.demo", "password": "admin1234"})
admin = r["data"]["accessToken"]
check("관리자 로그인 200", st == 200 and admin)

# ===== (1) 카탈로그 시드 / 조회 =====
print("\n===== (1) 카탈로그 시드 & 조회 =====")
st, r = call("GET", "/api/admin/catalog", token=admin)
catalog = r["data"] if st == 200 else []
check("관리자 카탈로그 16종 시드", st == 200 and len(catalog) == 16, f"count={len(catalog)}")
by_name = {c["itemName"]: c for c in catalog}
repair = by_name.get("장난감 수리")
labor = by_name.get("인건비")
planning = by_name.get("기획")  # CUSTOM, unitPrice 0
check("FIXED 단가 정확(장난감 수리=30000)", repair and repair["unitPrice"] == 30000,
      f"{repair['unitPrice'] if repair else '-'}")
check("CUSTOM 단가 0 + priceType=CUSTOM(기획)",
      planning and planning["unitPrice"] == 0 and planning["priceType"] == "CUSTOM")

# 파트너 온보딩(P1) 후 활성 카탈로그 조회
p1, _ = onboard_partner(admin, "qpartner1@acme.com", "ACME")
st, r = call("GET", "/api/partner/catalog", token=p1)
check("파트너 활성 카탈로그 조회(16, 전부 활성)",
      st == 200 and len(r["data"]) == 16 and all(c["isActive"] for c in r["data"]),
      f"count={len(r['data']) if st==200 else '-'}")

# ===== (2) 카탈로그 관리자 CRUD =====
print("\n===== (2) 카탈로그 CRUD =====")
st, r = call("POST", "/api/admin/catalog", token=admin,
             body={"category": "EXPERIENCE", "itemName": "신규 체험 프로그램",
                   "unitPrice": 20000, "unit": "명", "priceType": "FIXED"})
check("카탈로그 생성 200", st == 200 and r["data"]["isActive"] is True, f"st={st}")
new_id = r["data"]["id"] if st == 200 else None

st, r = call("PATCH", f"/api/admin/catalog/{new_id}", token=admin, body={"unitPrice": 25000})
check("PATCH 단가 수정 반영", st == 200 and r["data"]["unitPrice"] == 25000, f"st={st}")

st, r = call("DELETE", f"/api/admin/catalog/{new_id}", token=admin)
check("DELETE soft delete 200", st == 200)
st, r = call("GET", "/api/admin/catalog", token=admin)
deleted = next((c for c in r["data"] if c["id"] == new_id), None)
check("관리자 목록엔 남되 isActive=false", deleted is not None and deleted["isActive"] is False)
st, r = call("GET", "/api/partner/catalog", token=p1)
check("파트너 목록에선 제외(비활성)", all(c["id"] != new_id for c in r["data"]))

# ===== (3) 견적 생성 — 스냅샷 & 서버 재계산 =====
print("\n===== (3) 견적 생성: 스냅샷 + 서버 재계산 =====")
# 클라가 totalAmount=999(거짓)을 보내도 무시되어야 함(DTO에 필드 없음 → Jackson 무시)
quote_body = {
    "totalAmount": 999,  # 무시되어야 함
    "items": [
        {"catalogId": repair["id"], "quantity": 2},      # 30000 x2 = 60000
        {"catalogId": labor["id"], "quantity": 1},       # 120000 x1 = 120000
        {"itemName": "특별 제작물", "unitPrice": 70000, "quantity": 3},  # 커스텀 210000
    ],
}
st, r = call("POST", "/api/partner/quotes", token=p1, body=quote_body)
check("견적 생성 200", st == 200, f"st={st}, body={str(r)[:200]}")
q = r["data"] if st == 200 else {}
check("서버 재계산 total=390000 (클라 999 무시)", q.get("totalAmount") == 390000,
      f"total={q.get('totalAmount')}")
items = q.get("items", [])
check("라인 소계 정확(60000/120000/210000)",
      [i["subtotal"] for i in items] == [60000, 120000, 210000],
      f"subtotals={[i['subtotal'] for i in items]}")
check("FIXED 단가 스냅샷=30000", items and items[0]["unitPrice"] == 30000)
check("커스텀 라인 catalogId=null + 단가 스냅샷",
      items[2].get("catalogId") is None and items[2]["unitPrice"] == 70000)
check("status=DRAFT, issuedAt 없음", q.get("status") == "DRAFT" and q.get("issuedAt") is None)
quote_id = q.get("id")

# ===== (4) 스냅샷 보존: 카탈로그 단가 변경 후에도 과거 견적 불변 =====
print("\n===== (4) 스냅샷 보존(카탈로그 단가 변경 영향 없음) =====")
call("PATCH", f"/api/admin/catalog/{repair['id']}", token=admin, body={"unitPrice": 99999})
st, r = call("GET", f"/api/partner/quotes/{quote_id}", token=p1)
ritems = r["data"]["items"] if st == 200 else []
check("단가 변경 후에도 과거 견적 단가=30000 유지",
      ritems and ritems[0]["unitPrice"] == 30000, f"unitPrice={ritems[0]['unitPrice'] if ritems else '-'}")
check("과거 견적 total=390000 불변", st == 200 and r["data"]["totalAmount"] == 390000)
# 새 견적은 변경된 단가(99999) 반영
st, r = call("POST", "/api/partner/quotes", token=p1,
             body={"items": [{"catalogId": repair["id"], "quantity": 1}]})
check("신규 견적은 변경 단가(99999) 반영", st == 200 and r["data"]["items"][0]["unitPrice"] == 99999,
      f"unitPrice={r['data']['items'][0]['unitPrice'] if st==200 else '-'}")

# ===== (5) CUSTOM 카탈로그 라인 =====
print("\n===== (5) CUSTOM 카탈로그 라인 =====")
st, r = call("POST", "/api/partner/quotes", token=p1,
             body={"items": [{"catalogId": planning["id"], "unitPrice": 500000, "quantity": 1}]})
check("CUSTOM 카탈로그(기획) 입력단가 스냅샷=500000",
      st == 200 and r["data"]["items"][0]["unitPrice"] == 500000, f"st={st}")
st, r = call("POST", "/api/partner/quotes", token=p1,
             body={"items": [{"catalogId": planning["id"], "quantity": 1}]})  # 단가 누락
check("CUSTOM 단가 누락 → 400", st == 400 and r["error"]["code"] == "VALIDATION_ERROR", f"st={st}")

# ===== (6) 검증/예외 케이스 =====
print("\n===== (6) 예외 케이스 =====")
st, r = call("POST", "/api/partner/quotes", token=p1,
             body={"items": [{"catalogId": new_id, "quantity": 1}]})  # 비활성 카탈로그
check("비활성 카탈로그 참조 → 400", st == 400 and r["error"]["code"] == "VALIDATION_ERROR", f"st={st}")
st, r = call("POST", "/api/partner/quotes", token=p1,
             body={"items": [{"catalogId": 999999, "quantity": 1}]})
check("없는 카탈로그 id → 404 CATALOG_ITEM_NOT_FOUND",
      st == 404 and r["error"]["code"] == "CATALOG_ITEM_NOT_FOUND", f"st={st}")
st, r = call("POST", "/api/partner/quotes", token=p1,
             body={"items": [{"unitPrice": 1000, "quantity": 1}]})  # 커스텀 itemName 누락
check("커스텀 itemName 누락 → 400", st == 400, f"st={st}")
st, r = call("POST", "/api/partner/quotes", token=p1,
             body={"items": [{"itemName": "x", "unitPrice": 1000, "quantity": 0}]})  # 수량 0
check("수량 0 → 400(@Min)", st == 400 and r["error"]["code"] == "VALIDATION_ERROR", f"st={st}")
st, r = call("POST", "/api/partner/quotes", token=p1, body={"items": []})  # 빈 items
check("빈 items → 400(@NotEmpty)", st == 400, f"st={st}")

# ===== (7) 소유권: 다른 파트너 견적 404 =====
print("\n===== (7) 소유권 격리 =====")
p2, _ = onboard_partner(admin, "qpartner2@acme.com", "BETA")
st, r = call("GET", "/api/partner/quotes", token=p2)
check("P2 견적 목록 비어있음(격리)", st == 200 and len(r["data"]) == 0, f"count={len(r['data']) if st==200 else '-'}")
st, r = call("GET", f"/api/partner/quotes/{quote_id}", token=p2)
check("P2가 P1 견적 조회 → 404 QUOTE_NOT_FOUND",
      st == 404 and r["error"]["code"] == "QUOTE_NOT_FOUND", f"st={st}")
st, r = call("GET", "/api/partner/quotes", token=p1)
check("P1 목록엔 본인 견적 3건(생성 성공분만)", st == 200 and len(r["data"]) == 3,
      f"count={len(r['data']) if st==200 else '-'}")

# ===== (8) 가드: 비번 미변경 파트너 403 =====
print("\n===== (8) 비번 미변경 파트너 가드 =====")
st, r = call("POST", "/api/admin/partners", token=admin,
             body={"email": "qpartner3@acme.com", "companyName": "GAMMA", "contactName": "담당"})
temp3 = r["data"]["temporaryPassword"]
st, r = login("qpartner3@acme.com", temp3)
p3_mcp = r["data"]["accessToken"]
st, r = call("GET", "/api/partner/catalog", token=p3_mcp)
check("비번 미변경 파트너 → /api/partner/catalog 403 PASSWORD_CHANGE_REQUIRED",
      st == 403 and r["error"]["code"] == "PASSWORD_CHANGE_REQUIRED", f"st={st}")
st, r = call("POST", "/api/partner/quotes", token=p3_mcp,
             body={"items": [{"itemName": "x", "unitPrice": 1, "quantity": 1}]})
check("비번 미변경 파트너 → 견적생성 403", st == 403 and r["error"]["code"] == "PASSWORD_CHANGE_REQUIRED",
      f"st={st}")

# 비활성 파트너 가드
st, lst = call("GET", "/api/admin/partners", token=admin)
p2id = next(p["id"] for p in lst["data"] if p["email"] == "qpartner2@acme.com")
call("PATCH", f"/api/admin/partners/{p2id}/status", token=admin, body={"status": "DISABLED"})
st, r = call("GET", "/api/partner/catalog", token=p2)
check("비활성 파트너 → 403 ACCOUNT_DISABLED",
      st == 403 and r["error"]["code"] == "ACCOUNT_DISABLED", f"st={st}")

print(f"\n===== 결과: {PASS} PASS / {FAIL} FAIL =====")

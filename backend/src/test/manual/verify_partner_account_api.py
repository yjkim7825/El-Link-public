# -*- coding: utf-8 -*-
"""파트너 내 계정 API 검증: GET /api/partner/me(가입일 포함)/비밀번호 변경(현재 비번 불일치 400,
정상 변경 후 새 비번 로그인). urllib UTF-8."""
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


st, r = call("POST", "/api/admin/auth/login", body={"email": "admin@ecolink.demo", "password": "admin1234"})
admin = r["data"]["accessToken"]
check("관리자 로그인", st == 200 and bool(admin))

email = f"acc_{int(time.time())}@company.com"
st, r = call("POST", "/api/admin/partners", token=admin,
             body={"email": email, "companyName": "계정테스트상사", "contactName": "유계정", "phone": "010-9999-0000"})
temp_pw = r["data"]["temporaryPassword"]
st, r = call("POST", "/api/partner/auth/login", body={"email": email, "password": temp_pw})
ptoken = r["data"]["accessToken"]
# 가드 해제(임시비번 → 1차 변경)
st, r = call("POST", "/api/partner/auth/change-password", token=ptoken,
             body={"currentPassword": temp_pw, "newPassword": "firstpass1"})
check("초기 비번 변경(가드 해제)", st == 200)

# ===== 내 정보 =====
print("\n===== 내 정보 =====")
st, r = call("GET", "/api/partner/me", token=ptoken)
check("me 200", st == 200)
me = r["data"] if st == 200 else {}
check("내 정보 필드(회사명/담당자/이메일/연락처)",
      me.get("companyName") == "계정테스트상사" and me.get("contactName") == "유계정"
      and me.get("email") == email and me.get("phone") == "010-9999-0000")
check("가입일(createdAt) 포함", bool(me.get("createdAt")), f"createdAt={me.get('createdAt')}")
check("마지막 로그인(lastLoginAt) 포함", "lastLoginAt" in me)

# ===== 비밀번호 변경 =====
print("\n===== 비밀번호 변경 =====")
# 현재 비번 불일치 → 400
st, r = call("POST", "/api/partner/auth/change-password", token=ptoken,
             body={"currentPassword": "wrongpass", "newPassword": "secondpass2"})
check("현재 비번 불일치 → 401(인증 실패)", st == 401, f"st={st}")

# 정상 변경
st, r = call("POST", "/api/partner/auth/change-password", token=ptoken,
             body={"currentPassword": "firstpass1", "newPassword": "secondpass2"})
check("정상 변경 200", st == 200, f"st={st}")

# 옛 비번 로그인 실패 / 새 비번 로그인 성공
st, r = call("POST", "/api/partner/auth/login", body={"email": email, "password": "firstpass1"})
check("옛 비번 로그인 실패", st != 200, f"st={st}")
st, r = call("POST", "/api/partner/auth/login", body={"email": email, "password": "secondpass2"})
check("새 비번 로그인 성공", st == 200 and bool(r.get("data", {}).get("accessToken")), f"st={st}")

print(f"\n===== 결과: {PASS} PASS / {FAIL} FAIL =====")

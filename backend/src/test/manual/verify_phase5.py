# -*- coding: utf-8 -*-
"""Phase 5 수동 검증 (partner + material). UTF-8 본문을 보장하기 위해 urllib 사용."""
import json
import urllib.request
import urllib.error
import urllib.parse
import io

BASE = "http://localhost:8080"
PASS = 0
FAIL = 0


def call(method, path, token=None, body=None, raw=None, ctype="application/json"):
    url = BASE + path
    data = None
    headers = {}
    if raw is not None:
        data = raw
        headers["Content-Type"] = ctype
    elif body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(raw_body)
        except Exception:
            return e.code, raw_body


def check(name, cond, detail=""):
    global PASS, FAIL
    mark = "PASS" if cond else "FAIL"
    if cond:
        PASS += 1
    else:
        FAIL += 1
    print(f"[{mark}] {name}" + (f"  -- {detail}" if detail else ""))


def multipart(fields, files):
    """fields: dict[str,str], files: list[(name, filename, ctype, bytes)] -> (ctype, body)"""
    boundary = "----ellinkBoundary7d91"
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


print("===== 인증 =====")
st, r = call("POST", "/api/admin/auth/login", body={"email": "admin@ecolink.demo", "password": "admin1234"})
admin = r["data"]["accessToken"]
check("관리자 로그인 200", st == 200 and admin)

print("\n===== partner 도메인 =====")
st, r = call("POST", "/api/admin/partners", token=admin,
             body={"email": "newpartner@acme.com", "companyName": "ACME 주식회사",
                   "contactName": "이담당", "phone": "010-1234-5678"})
check("파트너 등록 200", st == 200, f"st={st}")
temp_pw = r["data"]["temporaryPassword"] if st == 200 else None
check("임시비번 1회 노출(존재)", bool(temp_pw), f"temp_pw={temp_pw}")
check("등록 응답 한글 보존", st == 200 and r["data"]["companyName"] == "ACME 주식회사")

st, r = call("POST", "/api/admin/partners", token=admin,
             body={"email": "newpartner@acme.com", "companyName": "중복", "contactName": "중복"})
check("중복 이메일 409 DUPLICATE_EMAIL", st == 409 and r["error"]["code"] == "DUPLICATE_EMAIL", f"st={st}")

st, r = call("GET", "/api/admin/partners", token=admin)
ids = [p["id"] for p in r["data"] if p["email"] == "newpartner@acme.com"]
check("파트너 목록 조회", st == 200 and len(ids) == 1, f"count={len(r['data'])}")
pid = ids[0]

st, r = call("POST", "/api/partner/auth/login",
             body={"email": "newpartner@acme.com", "password": temp_pw})
check("신규 파트너 로그인 200", st == 200, f"st={st}")
check("로그인 mustChangePassword=true", st == 200 and r["data"]["mustChangePassword"] is True)
p_token = r["data"]["accessToken"] if st == 200 else None

st, r = call("GET", "/api/partner/me", token=p_token)
check("가드: 변경 전 me 403 PASSWORD_CHANGE_REQUIRED",
      st == 403 and r["error"]["code"] == "PASSWORD_CHANGE_REQUIRED", f"st={st}, body={r}")

st, r = call("POST", "/api/partner/auth/change-password", token=p_token,
             body={"currentPassword": temp_pw, "newPassword": "newpass1234"})
check("비번 변경 200 (가드 예외 경로)", st == 200, f"st={st}")

st, r = call("POST", "/api/partner/auth/login",
             body={"email": "newpartner@acme.com", "password": "newpass1234"})
check("변경 후 재로그인 mustChangePassword=false",
      st == 200 and r["data"]["mustChangePassword"] is False, f"st={st}")
p_token2 = r["data"]["accessToken"] if st == 200 else None

st, r = call("GET", "/api/partner/me", token=p_token2)
check("가드 통과: me 200", st == 200 and r["data"]["email"] == "newpartner@acme.com", f"st={st}")
check("me 응답 한글 보존", st == 200 and r["data"]["contactName"] == "이담당")

st, r = call("PATCH", f"/api/admin/partners/{pid}/status", token=admin, body={"status": "DISABLED"})
check("상태 DISABLED 변경 200", st == 200 and r["data"]["status"] == "DISABLED", f"st={st}")

st, r = call("GET", "/api/partner/me", token=p_token2)
check("비활성 후 기존 토큰 me 403 ACCOUNT_DISABLED",
      st == 403 and r["error"]["code"] == "ACCOUNT_DISABLED", f"st={st}")

st, r = call("POST", "/api/partner/auth/login",
             body={"email": "newpartner@acme.com", "password": "newpass1234"})
check("비활성 후 로그인 403 ACCOUNT_DISABLED",
      st == 403 and r["error"]["code"] == "ACCOUNT_DISABLED", f"st={st}")

st, r = call("PATCH", f"/api/admin/partners/{pid}/status", token=admin, body={"status": "INVITED"})
check("INVITED로 변경 시도 400 거부", st == 400, f"st={st}")

print("\n===== material 도메인 (실제 Gemini 호출) =====")
sample = ("EcoLink는 LG에너지솔루션 임직원과 함께 폐장난감을 분해하고 부품을 분류하는 "
          "업사이클링 체험 봉사활동을 진행했습니다. 수거된 장난감은 소독 후 재조립되어 "
          "지역아동센터에 기부되었고, 참가자들은 자원순환의 가치를 직접 경험했습니다.")

st, r = call("POST", "/api/admin/materials/analyze", token=admin,
             raw=multipart({"text": sample}, [])[1], ctype=multipart({"text": sample}, [])[0])
check("analyze(텍스트) 200", st == 200, f"st={st}, body={str(r)[:300]}")
analysis = None
if st == 200:
    analysis = r["data"]["analysis"]
    print("  분석결과:", json.dumps(analysis, ensure_ascii=False))
    check("analyze category 포함", analysis.get("category") in ["환경 교육", "체험", "봉사", "업사이클링"],
          f"category={analysis.get('category')}")
    # non_null 직렬화로 file=null이면 키 자체가 생략됨 → .get() 사용
    check("analyze 파일 없음 file=null", r["data"].get("file") is None)

# 파일(text/plain) 첨부 analyze
fctype, fbody = multipart({}, [("file", "activity.txt", "text/plain",
                                sample.encode("utf-8"))])
st, r = call("POST", "/api/admin/materials/analyze", token=admin, raw=fbody, ctype=fctype)
check("analyze(파일 첨부) 200", st == 200, f"st={st}, body={str(r)[:200]}")
file_ref = r["data"]["file"] if st == 200 else None
check("파일 메타데이터(fileKey) 반환", bool(file_ref and file_ref.get("fileKey")),
      f"file={file_ref}")

# 확정 저장
save_body = {
    "title": (analysis or {}).get("title") or "폐장난감 업사이클 봉사",
    "summary": (analysis or {}).get("introduction") or "폐장난감 분해·분류 업사이클링 체험 봉사",
    "category": (analysis or {}).get("category") or "봉사",
    "keywords": (analysis or {}).get("keywords") or "자원순환,업사이클링,봉사활동",
    "files": [file_ref] if file_ref else [],
}
st, r = call("POST", "/api/admin/materials", token=admin, body=save_body)
check("확정 저장 200", st == 200, f"st={st}, body={str(r)[:200]}")
mid = r["data"]["id"] if st == 200 else None
check("저장 응답 uploadedByName=관리자", st == 200 and r["data"]["uploadedByName"] == "관리자")
check("저장 응답 파일 1건", st == 200 and len(r["data"]["files"]) == 1)

st, r = call("GET", "/api/admin/materials", token=admin)
check("목록 200 + 1건 이상", st == 200 and len(r["data"]) >= 1, f"count={len(r['data']) if st==200 else '-'}")

cat = save_body["category"]
st, r = call("GET", f"/api/admin/materials?category={urllib.parse.quote(cat)}", token=admin)
check(f"카테고리 필터({cat})", st == 200 and all(m["category"] == cat for m in r["data"]),
      f"count={len(r['data']) if st==200 else '-'}")

st, r = call("GET", "/api/admin/materials?keyword=" + urllib.parse.quote("업사이클"), token=admin)
check("키워드 필터(업사이클)", st == 200, f"count={len(r['data']) if st==200 else '-'}")

st, r = call("GET", f"/api/admin/materials/{mid}", token=admin)
check("단건 조회 200", st == 200 and r["data"]["id"] == mid)

st, r = call("DELETE", f"/api/admin/materials/{mid}", token=admin)
check("삭제 200", st == 200)
st, r = call("GET", f"/api/admin/materials/{mid}", token=admin)
check("삭제 후 단건 404 MATERIAL_NOT_FOUND", st == 404 and r["error"]["code"] == "MATERIAL_NOT_FOUND",
      f"st={st}")

print(f"\n===== 결과: {PASS} PASS / {FAIL} FAIL =====")

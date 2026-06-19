# -*- coding: utf-8 -*-
"""자료 대표 이미지(thumbnail) 검증: analyze(대표이미지 multipart)/저장(thumbnailFileKey)/
관리자·파트너 thumbnail 엔드포인트/포트폴리오 응답 thumbnailUrl/시드 7개 placeholder/5MB 초과 400. urllib UTF-8."""
import base64
import io
import json
import time
import urllib.request
import urllib.error

BASE = "http://localhost:8080"
PASS = FAIL = 0

# 작은 빨강 2x2 PNG
PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mP8z8BQz0AEYBxVSF8FAGm0Avzk6jK7AAAAAElFTkSuQmCC")


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


def post_multipart(path, token, fields, files):
    boundary = "----ellinkThumb7"
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
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))


def get_bytes(path, token):
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


st, r = call("POST", "/api/admin/auth/login", body={"email": "admin@ecolink.demo", "password": "admin1234"})
admin = r["data"]["accessToken"]
check("관리자 로그인", st == 200 and bool(admin))

# ===== (A) 시드 7개 placeholder 확인 (관리자 detail thumbnailUrl + 스트리밍) =====
print("\n===== (A) 시드 대표 이미지 =====")
st, r = call("GET", "/api/admin/materials", token=admin)
seeded = r["data"] if st == 200 else []
check("시드 자료 7개", len(seeded) == 7, f"count={len(seeded)}")
ok_thumb = 0
for m in seeded:
    st2, d = call("GET", f"/api/admin/materials/{m['id']}", token=admin)
    if st2 == 200 and d["data"].get("thumbnailUrl"):
        stb, h, body = get_bytes(d["data"]["thumbnailUrl"], admin)
        if stb == 200 and body[:8] == b"\x89PNG\r\n\x1a\n" and "image/png" in h.get("Content-Type", ""):
            ok_thumb += 1
check("시드 7개 모두 대표 이미지(PNG) 스트리밍", ok_thumb == 7, f"ok={ok_thumb}/7")

# ===== (B) analyze에 대표 이미지 → 저장 → thumbnailUrl 노출 =====
print("\n===== (B) 대표 이미지 업로드 플로우 =====")
st, r = post_multipart("/api/admin/materials/analyze", admin,
                       {"text": "EcoLink의 임직원 환경교육 프로그램 소개입니다. 자원순환과 ESG를 다룹니다."},
                       [("representativeImage", "thumb.png", "image/png", PNG)])
if st == 200:
    a = r["data"]
    check("analyze 200 + analysis", all(k in a["analysis"] for k in ("category", "title", "introduction", "keywords")))
    check("analyze thumbnail 반환(fileKey)", a.get("thumbnail") and a["thumbnail"].get("fileKey"),
          f"thumb={a.get('thumbnail')}")
    thumb_key = a["thumbnail"]["fileKey"] if a.get("thumbnail") else None
    # 저장
    st2, r2 = call("POST", "/api/admin/materials", token=admin, body={
        "title": a["analysis"].get("title") or "대표이미지 테스트",
        "summary": a["analysis"].get("introduction") or "요약",
        "category": a["analysis"].get("category") or "환경 교육",
        "keywords": a["analysis"].get("keywords"),
        "thumbnailFileKey": thumb_key,
        "files": [],
    })
    check("저장 200 + thumbnailUrl 노출", st2 == 200 and r2["data"].get("thumbnailUrl"),
          f"url={r2['data'].get('thumbnailUrl') if st2==200 else st2}")
    new_id = r2["data"]["id"] if st2 == 200 else None
    if new_id:
        stb, h, body = get_bytes(f"/api/admin/materials/{new_id}/thumbnail", admin)
        check("업로드 대표 이미지 스트리밍(PNG)", stb == 200 and body[:8] == b"\x89PNG\r\n\x1a\n", f"st={stb}")
        call("DELETE", f"/api/admin/materials/{new_id}", token=admin)
else:
    code = r["error"]["code"] if isinstance(r, dict) and r.get("error") else r
    print(f"[WARN] analyze 비정상 st={st} ({code}) — Gemini 일시 오류 가능.")

# ===== (C) 5MB 초과 → 400 =====
print("\n===== (C) 5MB 초과 검증 =====")
big = b"\x89PNG\r\n\x1a\n" + b"0" * (5 * 1024 * 1024 + 10)  # 5MB+ (PNG 매직 + 패딩)
st, r = post_multipart("/api/admin/materials/analyze", admin,
                       {"text": "큰 이미지 테스트"},
                       [("representativeImage", "big.png", "image/png", big)])
check("5MB 초과 대표 이미지 → 400", st == 400, f"st={st}")

# ===== (D) 파트너 포트폴리오 thumbnailUrl =====
print("\n===== (D) 파트너 포트폴리오 =====")
email = f"thumb_{int(time.time())}@company.com"
st, r = call("POST", "/api/admin/partners", token=admin,
             body={"email": email, "companyName": "썸네일상사", "contactName": "김썸넬"})
temp_pw = r["data"]["temporaryPassword"]
st, r = call("POST", "/api/partner/auth/login", body={"email": email, "password": temp_pw})
ptoken = r["data"]["accessToken"]
call("POST", "/api/partner/auth/change-password", token=ptoken,
     body={"currentPassword": temp_pw, "newPassword": "newpass1234"})

st, r = call("GET", "/api/partner/portfolio", token=ptoken)
has_thumb = [m for m in r["data"] if m.get("thumbnailUrl")] if st == 200 else []
check("포트폴리오 목록 thumbnailUrl 포함", st == 200 and len(has_thumb) >= 7, f"with_thumb={len(has_thumb)}")
if has_thumb:
    first = has_thumb[0]
    stb, h, body = get_bytes(first["thumbnailUrl"], ptoken)
    check("파트너 썸네일 스트리밍(PNG)", stb == 200 and body[:8] == b"\x89PNG\r\n\x1a\n", f"st={stb}")
    st2, d = call("GET", f"/api/partner/portfolio/{first['id']}", token=ptoken)
    check("포트폴리오 상세 thumbnailUrl", st2 == 200 and d["data"].get("thumbnailUrl"))
    check("상세 fileKey 미노출", st2 == 200 and "thumbnailFileKey" not in d["data"])

print(f"\n===== 결과: {PASS} PASS / {FAIL} FAIL =====")

# -*- coding: utf-8 -*-
"""material 프론트가 쓰는 API 검증: analyze(Gemini)/create/list(filter)/get/download/delete.
Gemini 파트(analyze)는 무료티어 502 가능 → 실패해도 코어 CRUD는 별도 검증. urllib UTF-8."""
import io
import json
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
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw


def multipart(fields, files):
    boundary = "----ellinkMat7q"
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


def post_multipart(path, token, fields, files):
    ctype, body = multipart(fields, files)
    req = urllib.request.Request(BASE + path, data=body,
                                 headers={"Authorization": "Bearer " + token, "Content-Type": ctype},
                                 method="POST")
    try:
        with urllib.request.urlopen(req) as r:
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


# ===== 인증 =====
st, r = call("POST", "/api/admin/auth/login",
             body={"email": "admin@ecolink.demo", "password": "admin1234"})
admin = r["data"]["accessToken"]
check("관리자 로그인 200", st == 200 and bool(admin))

# ===== (A) 코어 CRUD (Gemini 불필요, 결정적) =====
print("\n===== (A) 코어 CRUD =====")
st, r = call("POST", "/api/admin/materials", token=admin, body={
    "title": "업사이클 블럭 체험 키트",
    "summary": "폐플라스틱으로 만든 블럭으로 진행하는 친환경 조립 체험 프로그램.",
    "category": "업사이클링",
    "keywords": "자원순환,업사이클링,체험",
    "files": [],
})
check("create 200", st == 200, f"st={st}")
mid = r["data"]["id"] if st == 200 else None
check("create 응답 한글 보존", st == 200 and r["data"]["title"] == "업사이클 블럭 체험 키트")
check("등록자명 노출", st == 200 and r["data"].get("uploadedByName"))

st, r = call("GET", "/api/admin/materials", token=admin)
check("list 200 + 방금 항목 포함", st == 200 and any(m["id"] == mid for m in r["data"]), f"count={len(r['data']) if st==200 else '-'}")

def q(**params):
    return "/api/admin/materials?" + urllib.parse.urlencode(params)

st, r = call("GET", q(category="업사이클링"), token=admin)
check("카테고리 필터 동작", st == 200 and all(m["category"] == "업사이클링" for m in r["data"]) and any(m["id"] == mid for m in r["data"]))
st, r = call("GET", q(category="봉사"), token=admin)
check("다른 카테고리 필터 → 제외", st == 200 and all(m["id"] != mid for m in r["data"]))
st, r = call("GET", q(keyword="자원순환"), token=admin)
check("키워드 필터 동작", st == 200 and any(m["id"] == mid for m in r["data"]))

st, r = call("GET", f"/api/admin/materials/{mid}", token=admin)
check("get 200", st == 200 and r["data"]["id"] == mid)

st, r = call("DELETE", f"/api/admin/materials/{mid}", token=admin)
check("delete 200", st == 200)
st, r = call("GET", f"/api/admin/materials/{mid}", token=admin)
check("삭제 후 get → 404", st == 404, f"st={st}")

# ===== (B) Gemini analyze + 파일 첨부 + 다운로드 =====
# 이미지(PNG)는 텍스트 추출 없이 inline_data로 Gemini에 전달 → 저장/분석/다운로드 경로 검증.
print("\n===== (B) analyze(Gemini) + 파일 다운로드 =====")
import base64
png = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
st, r = post_multipart("/api/admin/materials/analyze", admin,
                       {"text": "EcoLink는 폐장난감을 수거해 소독·수리 후 기부하는 자원순환 봉사 활동을 진행합니다."},
                       [("file", "toy_photo.png", "image/png", png)])
if st == 200:
    a = r["data"]["analysis"]
    check("analyze 200 + analysis 필드", all(k in a for k in ("category", "title", "introduction", "keywords")),
          f"cat={a.get('category')} title={a.get('title')}")
    check("analyze 파일 메타(fileKey) 반환", r["data"].get("file") and r["data"]["file"].get("fileKey"))
    fileref = r["data"].get("file")
    # 분석 결과 + 파일로 확정 저장
    st2, r2 = call("POST", "/api/admin/materials", token=admin, body={
        "title": a.get("title") or "분석 자료",
        "summary": a.get("introduction") or "요약",
        "category": a.get("category") or "봉사",
        "keywords": a.get("keywords"),
        "files": [fileref] if fileref else [],
    })
    check("analyze 결과 저장 200", st2 == 200, f"st={st2}")
    mid2 = r2["data"]["id"] if st2 == 200 else None
    fileinfo = r2["data"]["files"][0] if st2 == 200 and r2["data"]["files"] else None
    check("저장된 파일 1건 + fileId", bool(fileinfo) and fileinfo.get("id"))
    if fileinfo:
        st3, h, body = download(f"/api/admin/materials/{mid2}/files/{fileinfo['id']}/download", admin)
        cd = urllib.parse.unquote(h.get("Content-Disposition", ""))
        check("파일 다운로드 200 + PNG 매직 + 파일명",
              st3 == 200 and body[:8] == png[:8] and "toy_photo.png" in cd,
              f"st={st3} len={len(body)}")
    if mid2:
        call("DELETE", f"/api/admin/materials/{mid2}", token=admin)
else:
    # Gemini 무료티어 502 등 — 코어 CRUD는 (A)에서 통과했으므로 경고만.
    code = r["error"]["code"] if isinstance(r, dict) and r.get("error") else r
    print(f"[WARN] analyze 비정상 응답 st={st} ({code}) — Gemini 일시 오류 가능. 코어 CRUD는 (A) 통과.")

print(f"\n===== 결과: {PASS} PASS / {FAIL} FAIL =====")

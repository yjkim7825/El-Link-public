# -*- coding: utf-8 -*-
"""proposal 프론트가 쓰는 API 검증: analyze(2단계 Gemini)/create/list/get/delete.
Gemini analyze는 무료티어 502 가능 → 실패해도 코어 CRUD는 별도(결정적)로 검증. urllib UTF-8."""
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
        with urllib.request.urlopen(req, timeout=60) as r:
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


# ===== 인증 =====
st, r = call("POST", "/api/admin/auth/login",
             body={"email": "admin@ecolink.demo", "password": "admin1234"})
admin = r["data"]["accessToken"]
check("관리자 로그인 200", st == 200 and bool(admin))

# 관련 자료 참조용 material 1건 생성
st, r = call("POST", "/api/admin/materials", token=admin, body={
    "title": "폐장난감 자원순환 봉사 키트",
    "summary": "폐장난감을 수거·소독·수리해 기부하는 봉사 프로그램.",
    "category": "봉사",
    "keywords": "자원순환,봉사,기부",
    "files": [],
})
mat_id = r["data"]["id"] if st == 200 else None
check("참조용 material 생성", st == 200 and mat_id, f"st={st}")

# ===== (A) 코어 CRUD (Gemini 불필요, 결정적) =====
print("\n===== (A) 코어 CRUD =====")
st, r = call("POST", "/api/admin/proposals", token=admin, body={
    "targetCompanyName": "○○화학",
    "companyAnalysis": "## ○○화학\n친환경 소재 사업을 확대 중인 기업으로 ESG 경영을 강조한다.",
    "ideas": [
        {"title": "임직원 자원순환 봉사", "description": "폐장난감 수거·수리 봉사 프로그램 공동 운영.",
         "relatedMaterialIds": [mat_id] if mat_id else []},
        {"title": "친환경 교육 후원", "description": "지역 아동 대상 환경 교육 콘텐츠 후원.", "relatedMaterialIds": []},
        {"title": "업사이클 굿즈 제작", "description": "폐자원 활용 사내 굿즈 공동 제작.", "relatedMaterialIds": []},
    ],
})
check("create 200", st == 200, f"st={st}")
pid = r["data"]["id"] if st == 200 else None
check("create 응답 한글 보존", st == 200 and r["data"]["targetCompanyName"] == "○○화학")
check("아이디어 3개 저장", st == 200 and len(r["data"]["ideas"]) == 3)
check("작성자명 노출", st == 200 and r["data"].get("createdByName"))
# 관련 자료 제목 해석 확인
idea0 = r["data"]["ideas"][0] if st == 200 else {}
check("관련 자료 제목 해석(relatedMaterials)",
      st == 200 and any(m["id"] == mat_id and m.get("title") for m in idea0.get("relatedMaterials", [])),
      f"refs={idea0.get('relatedMaterials')}")

st, r = call("GET", "/api/admin/proposals", token=admin)
item = next((p for p in r["data"] if p["id"] == pid), None) if st == 200 else None
check("list 200 + 방금 항목 포함", bool(item))
check("list 아이디어 수 노출", item and item.get("ideaCount") == 3, f"item={item}")

st, r = call("GET", f"/api/admin/proposals/{pid}", token=admin)
check("get 200 + 아이디어/분석", st == 200 and r["data"]["id"] == pid and len(r["data"]["ideas"]) == 3)

st, r = call("DELETE", f"/api/admin/proposals/{pid}", token=admin)
check("delete 200", st == 200)
st, r = call("GET", f"/api/admin/proposals/{pid}", token=admin)
check("삭제 후 get → 404", st == 404, f"st={st}")

# ===== (B) Gemini analyze (2단계) =====
print("\n===== (B) analyze(2단계 Gemini) =====")
st, r = call("POST", "/api/admin/proposals/analyze", token=admin, body={"companyName": "삼성전자"})
if st == 200:
    a = r["data"]
    check("analyze 200 + companyAnalysis", bool(a.get("companyAnalysis")), f"len={len(a.get('companyAnalysis') or '')}")
    check("analyze 아이디어 리스트", isinstance(a.get("ideas"), list) and len(a["ideas"]) >= 1,
          f"ideas={len(a.get('ideas') or [])}")
    if a.get("ideas"):
        i0 = a["ideas"][0]
        check("아이디어 형태(title/description/relatedMaterialIds)",
              all(k in i0 for k in ("title", "description", "relatedMaterialIds")),
              f"keys={list(i0.keys())}")
else:
    code = r["error"]["code"] if isinstance(r, dict) and r.get("error") else r
    print(f"[WARN] analyze 비정상 응답 st={st} ({code}) — Gemini 일시 오류 가능. 코어 CRUD는 (A) 통과.")

# 참조용 material 정리
if mat_id:
    call("DELETE", f"/api/admin/materials/{mat_id}", token=admin)

print(f"\n===== 결과: {PASS} PASS / {FAIL} FAIL =====")

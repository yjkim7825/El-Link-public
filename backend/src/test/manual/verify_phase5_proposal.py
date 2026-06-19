# -*- coding: utf-8 -*-
"""Phase 5 proposal 도메인 수동 검증. UTF-8 본문 보장을 위해 urllib 사용.
실제 Gemini를 2단계로 호출하므로 무료 티어 쿼터에 유의(호출 사이 sleep)."""
import json
import time
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


st, r = call("POST", "/api/admin/auth/login",
             body={"email": "admin@ecolink.demo", "password": "admin1234"})
admin = r["data"]["accessToken"]
check("관리자 로그인 200", st == 200 and admin)

# ============ (1) 빈 Material 상태에서 analyze ============
print("\n===== (1) 빈 Material 상태 analyze (일반론 아이디어 허용) =====")
st, r = call("GET", "/api/admin/materials", token=admin)
check("사전 조건: Material 비어있음", st == 200 and len(r["data"]) == 0, f"count={len(r['data']) if st==200 else '-'}")

st, r = call("POST", "/api/admin/proposals/analyze", token=admin, body={"companyName": "삼성전자"})
check("analyze 200 (2단계 호출 성공)", st == 200, f"st={st}, body={str(r)[:200]}")
empty_ideas = []
if st == 200:
    d = r["data"]
    check("1단계 기업분석 텍스트 존재", bool(d["companyAnalysis"]) and len(d["companyAnalysis"]) > 50,
          f"len={len(d['companyAnalysis'])}")
    check("companyName 반영", d["companyName"] == "삼성전자")
    empty_ideas = d["ideas"]
    check("2단계 아이디어 3개", len(empty_ideas) == 3, f"count={len(empty_ideas)}")
    check("각 아이디어 title/description 채워짐",
          all(i["title"] and i["description"] for i in empty_ideas))
    check("빈 Material → relatedMaterialIds 전부 빈 배열",
          all(i["relatedMaterialIds"] == [] for i in empty_ideas),
          f"ids={[i['relatedMaterialIds'] for i in empty_ideas]}")
    print("  예시 아이디어[0]:", json.dumps(
        {"title": empty_ideas[0]["title"], "desc": empty_ideas[0]["description"][:60]},
        ensure_ascii=False))

# 저장 → 목록 → 단건 → 삭제 (happy path)
print("\n===== (2) 저장 → 목록 → 단건 → 삭제 =====")
save_body = {
    "targetCompanyName": "삼성전자",
    "companyAnalysis": r["data"]["companyAnalysis"] if st == 200 else "분석 텍스트",
    "ideas": [{"title": i["title"], "description": i["description"],
               "relatedMaterialIds": i["relatedMaterialIds"]} for i in empty_ideas]
    if empty_ideas else [{"title": "t", "description": "d", "relatedMaterialIds": []}],
}
st, r = call("POST", "/api/admin/proposals", token=admin, body=save_body)
check("확정 저장 200", st == 200, f"st={st}, body={str(r)[:200]}")
pid = r["data"]["id"] if st == 200 else None
check("저장 응답 createdByName=관리자", st == 200 and r["data"]["createdByName"] == "관리자")
check("저장 응답 아이디어 3개 + orderIndex 0..2",
      st == 200 and [i["orderIndex"] for i in r["data"]["ideas"]] == [0, 1, 2],
      f"orders={[i['orderIndex'] for i in r['data']['ideas']] if st==200 else '-'}")

st, r = call("GET", "/api/admin/proposals", token=admin)
check("목록 200 + 1건", st == 200 and len(r["data"]) == 1 and r["data"][0]["ideaCount"] == 3,
      f"count={len(r['data']) if st==200 else '-'}")

st, r = call("GET", f"/api/admin/proposals/{pid}", token=admin)
check("단건 조회 200", st == 200 and r["data"]["id"] == pid)

st, r = call("DELETE", f"/api/admin/proposals/{pid}", token=admin)
check("삭제 200", st == 200)
st, r = call("GET", f"/api/admin/proposals/{pid}", token=admin)
check("삭제 후 404 PROPOSAL_NOT_FOUND", st == 404 and r["error"]["code"] == "PROPOSAL_NOT_FOUND",
      f"st={st}")

# ============ (3) Material 존재 상태 analyze (관련자료 연결 best-effort) ============
print("\n===== (3) Material 시드 후 analyze (relatedMaterials 연결 확인) =====")
seed = [
    {"title": "폐장난감 업사이클 키링 만들기", "summary": "폐장난감을 분해해 키링으로 업사이클링하는 체험",
     "category": "업사이클링", "keywords": "업사이클링,자원순환,체험", "files": []},
    {"title": "EcoLink 환경 교육 프로그램", "summary": "임직원 대상 자원순환 환경 교육",
     "category": "환경 교육", "keywords": "환경교육,ESG,임직원", "files": []},
]
seeded_ids = []
for s in seed:
    st, r = call("POST", "/api/admin/materials", token=admin, body=s)
    if st == 200:
        seeded_ids.append(r["data"]["id"])
check("Material 2건 시드", len(seeded_ids) == 2, f"ids={seeded_ids}")

time.sleep(2)  # 쿼터 여유
st, r = call("POST", "/api/admin/proposals/analyze", token=admin, body={"companyName": "LG에너지솔루션"})
check("analyze(자료 있음) 200", st == 200, f"st={st}, body={str(r)[:200]}")
linked_total = 0
if st == 200:
    ideas = r["data"]["ideas"]
    check("아이디어 3개", len(ideas) == 3, f"count={len(ideas)}")
    all_ids = [mid for i in ideas for mid in i["relatedMaterialIds"]]
    linked_total = len(all_ids)
    check("relatedMaterialIds는 실제 시드 id만 (유효성 필터)",
          all(mid in seeded_ids for mid in all_ids), f"all_ids={all_ids}")
    print(f"  연결된 relatedMaterialIds 총 {linked_total}건 (모델 판단, best-effort): {all_ids}")
    # 저장 후 단건 조회에서 relatedMaterials 제목 해석 확인
    save2 = {
        "targetCompanyName": "LG에너지솔루션",
        "companyAnalysis": r["data"]["companyAnalysis"],
        "ideas": [{"title": i["title"], "description": i["description"],
                   "relatedMaterialIds": i["relatedMaterialIds"]} for i in ideas],
    }
    st2, r2 = call("POST", "/api/admin/proposals", token=admin, body=save2)
    check("저장 200", st2 == 200, f"st={st2}")
    if st2 == 200:
        pid2 = r2["data"]["id"]
        st3, r3 = call("GET", f"/api/admin/proposals/{pid2}", token=admin)
        # relatedMaterials는 id+title 해석 결과(있을 때만)
        resolved = [m for i in r3["data"]["ideas"] for m in i.get("relatedMaterials", [])]
        check("단건 조회 relatedMaterials 제목 해석 정합",
              all(m["id"] in seeded_ids and m["title"] for m in resolved),
              f"resolved={resolved}")
        call("DELETE", f"/api/admin/proposals/{pid2}", token=admin)
# 정리
for mid in seeded_ids:
    call("DELETE", f"/api/admin/materials/{mid}", token=admin)

print(f"\n===== 결과: {PASS} PASS / {FAIL} FAIL =====")

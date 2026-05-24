# portfolio-visual-embedding Planning Document

> **Summary**: CLIP 로컬 모델로 portfolio 이미지의 픽셀-기반 임베딩(`image_embedding vector(768)`)을 신규 생성·인덱싱하고, Style 탭에 "사진 업로드 → 시각적으로 비슷한 portfolio" 검색 UI를 추가한다. 텍스트 임베딩 이중화 vs 단일화는 Design 단계 architecture 선택에서 결정. 부수적으로 designer_profile 임시 컬럼 등 미사용 컬럼을 정리한다.
>
> **Project**: curling-front
> **Version**: 0.2.0
> **Author**: syk
> **Date**: 2026-05-15
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 현재 portfolio 검색은 `이미지 → Vision LLM 자연어 description → text-embedding-3-large(1536d)` 경로의 텍스트 임베딩에 의존. "caramel 톤 vs ash 톤" 같은 미세 색조·텍스처 차이는 description 으로 압축되며 손실됨. 또한 image-to-image 시각 유사도 검색 시나리오(사진 업로드 → 비슷한 portfolio)를 지원하지 못함. |
| **Solution** | `@xenova/transformers` 로컬 CLIP(ViT-L/14, 768d) 또는 SigLIP 모델로 portfolio 이미지를 픽셀-기반으로 임베딩하여 `portfolio.image_embedding vector(768)` 신규 컬럼에 저장. RPC `search_portfolios` 를 확장해 (a) 텍스트 쿼리 (b) 사진 업로드 쿼리 (c) 하이브리드 3가지 경로 지원. Style 탭에 사진 업로드 검색 UI 추가. designer_profile 의 시드 임시 컬럼 등 미사용 컬럼 cleanup. |
| **Function/UX Effect** | (1) "이거랑 비슷한 사진" 검색 — Style 탭의 사진 아이콘 클릭 → 파일 선택 → CLIP 임베딩 → 시각적으로 비슷한 portfolio 카드 그리드 반환. (2) 자연어 검색의 fine-grained 시각 정확도 향상 (Design 에서 이중화 선택 시). (3) 외부 LLM API 호출 의존 감소 가능. |
| **Core Value** | image-to-image 검색이 가능해지면서 "한 컷에 꽂혔는데 누가 한 건지 모를 때" 사용자가 이미지로 디자이너를 찾을 수 있다. Pinterest-style visual discovery 의 기반 인프라 확보. |

---

## Context Anchor

> Auto-generated from Executive Summary. Propagated to Design/Do documents for context continuity.

| Key | Value |
|-----|-------|
| **WHY** | 텍스트 임베딩은 vision LLM 의 description 한 줄로 시각 정보를 압축하므로 미세 색조/텍스처 차이가 손실되고, image-to-image 검색을 지원하지 못한다. 외부 stock 이미지의 색조 차이가 검색에 반영 안 되는 현 상태에서 시각 유사도 검색 기반을 깐다. |
| **WHO** | (1) 다른 사용자의 헤어 사진을 발견하고 "이거랑 비슷한 거 만들어주는 디자이너 찾고 싶은" 고객. (2) 자연어로 표현하기 어려운 톤·텍스처 차이(예: warm vs cool blonde)로 후보를 좁히고 싶은 고객. |
| **RISK** | (1) CLIP 모델 첫 다운로드(~300MB) 가 dev/CI 환경에서 시간/대역폭 소비. (2) `image_embedding` 차원(768)이 기존 `embedding(1536)` 과 달라 RPC·인덱스 분리 필요 — 텍스트와 같은 공간으로 fusion 하려면 별도 normalize/scaling 전략 필요. (3) 사진 업로드 검색은 클라이언트에서 CLIP 추론 X — 업로드 → 서버 → CLIP → 검색 → 결과 흐름이라 latency 추가. (4) 한국어 검색을 CLIP text encoder 로 통합할 경우 정확도 저하(CLIP base 는 영어 중심). |
| **SUCCESS** | (a) `pnpm portfolio:embed-images` 로 360 portfolio rows 모두 `image_embedding` 채워짐. (b) `_check-search.ts` 에 image-based 쿼리 시나리오 추가, 같은 키워드의 image-image 매칭이 텍스트 매칭과 유사하거나 더 정확. (c) Style 탭 검색 input 의 photo 아이콘 클릭 → 파일 업로드 → 300ms 이내 spinner 표시 후 결과 그리드 렌더. (d) designer_profile 의 `_temp_*` 컬럼 DROP 완료, 다른 미사용 잔재 정리. (e) 기존 자연어 검색 회귀 없음. |
| **SCOPE** | IN: `image_embedding` 컬럼 + HNSW 인덱스 마이그레이션, `@xenova/transformers` 설치, CLIP 임베딩 시드 스크립트, RPC 확장(또는 새 RPC), 사진 업로드 검색 API route, Style 탭 photo 검색 UI(파일 선택→업로드→결과), 미사용 컬럼 cleanup 마이그레이션. OUT: designer 본인이 portfolio 이미지를 직접 업로드/관리하는 흐름, 모바일 카메라 직접 캡처, 이미지 crop/zoom UX, 한국어 검색 품질 개선 자체(별도 PDCA), CLIP 모델 fine-tuning, 사진 기반 비공개 검색(인증 미도입), 결과 페이지네이션 무한 스크롤 자체 변경(기존 그대로 사용). |

---

## 1. Overview

### 1.1 Purpose

직전 PDCA(`portfolio-search-impl`, 2026-05-15)에서 360장 portfolio mock 데이터에 vision LLM 기반 텍스트 임베딩으로 자연어 검색을 구현했다. 그러나 텍스트 임베딩은 본질적으로 LLM 이 description 으로 압축한 텍스트의 벡터이므로 시각적 미세 차이(특히 색조)가 손실된다. 본 PDCA 는 CLIP 픽셀-기반 임베딩을 별도 컬럼에 추가하여 image-to-image 시각 유사도 검색 시나리오를 가능하게 하고, Style 탭에 사진 업로드 검색 UI 를 붙인다.

### 1.2 Background

- 직전 PDCA 산출물: `public.portfolio` 360 rows, `embedding vector(1536)` (text-embedding-3-large), `search_doc tsvector`, RPC `search_portfolios`.
- 사용자 통찰(2026-05-15 대화): "이미지 → Vision LLM → 텍스트 → 임베딩" 흐름에서 "같은 balayage 의 caramel vs ash 톤" 같은 미세 차이는 description 에 안 적히면 임베딩에서 사라짐을 지적.
- Figma 디자인(node 547-13544)의 검색 input 우측에 `Search by photo` 아이콘이 이미 정의되어 있어 UI 진입점은 기존 디자인에 존재.
- `@xenova/transformers` 는 HuggingFace 의 ONNX-변환 모델을 브라우저/Node 에서 돌리는 라이브러리. CLIP/SigLIP 모두 ONNX 빌드 존재. 외부 API 의존 0, 비용 0, 첫 다운로드 후 캐시.
- 인접 사실: designer_profile 마이그레이션 코멘트에 `_temp_specialties`, `_temp_hair_type_experience`, `external_ref` 가 후속 DROP 예정으로 명시되어 있음. designer_keyword 시드는 이미 완료(2250 rows) 라 `_temp_*` 는 안전하게 정리 가능.

### 1.3 Related Documents

- 직전 PDCA TIL: [`2026-05-15-portfolio-search-impl-pexels-시드-vision-llm-style-탭`](Obsidian)
- 의사결정 TIL: [`2026-05-10-search-engine-selection-pivot-to-postgres`](Obsidian)
- 직전 마이그레이션:
  - `supabase/migrations/_apply_all_portfolio.sql` (portfolio 테이블 + pgvector + 초기 RPC)
  - `supabase/migrations/_fix_search_portfolios_ambiguous_id.sql` (RPC 버그 fix)
- 디자인 토큰: `src/app/globals.css`, `src/styles/typography.css`
- Figma node: `https://www.figma.com/design/1EccDx1qvrkFZBsNEFbWjj/Curling-Design?node-id=547-13544` (Style 탭, photo 아이콘 위치)

---

## 2. Scope

### 2.1 In Scope

**DB / 마이그레이션**
- [ ] `portfolio.image_embedding vector(768)` 컬럼 추가 (NULL 허용)
- [ ] `portfolio.image_embedding` 에 HNSW(vector_cosine_ops) 인덱스 추가
- [ ] RPC `search_portfolios` 확장 또는 새 RPC `search_portfolios_visual` 추가 — Design 단계에서 결정
- [ ] **Cleanup 마이그레이션**:
  - `designer_profile._temp_specialties` DROP
  - `designer_profile._temp_hair_type_experience` DROP
  - 직전 PDCA 의 Meilisearch 관련 잔재가 DB 에 있는지 점검 후 제거 (현재로선 없을 가능성 — Design 단계 confirm)
  - 텍스트 `portfolio.embedding(1536)` 의 유지/제거는 Design 단계 architecture 선택에서 결정 (이중화 vs CLIP 단일화 vs 텍스트 임베딩 컬럼 차원 변경)

**임베딩 파이프라인**
- [ ] `@xenova/transformers` devDependency 추가
- [ ] `scripts/portfolio/embed-images-clip.ts` — Supabase Storage URL 또는 로컬 `tmp/portfolio-images/<slug>/<n>.jpg` 를 입력으로 CLIP 추론 → `portfolio.image_embedding` UPDATE
- [ ] CLIP 모델 캐시 위치 설정 (`tmp/models/` 또는 ENV-controlled)
- [ ] 모델 차원 선택: 권장 ViT-L/14 (768d). 차선 ViT-B/32 (512d) — 차원이 결정되면 마이그레이션·RPC 도 동일 차원으로 잡음

**서버 (API)**
- [ ] `src/lib/portfolio-search/embed-image.ts` — 런타임 이미지 → CLIP 임베딩 (서버 사이드)
- [ ] `src/lib/portfolio-search/search.ts` 또는 새 함수: image_embedding 기반 검색 흐름
- [ ] API route `POST /api/style/search-by-image` (또는 Server Action) — multipart/form-data 또는 base64 받아서 CLIP → RPC → 결과

**UI**
- [ ] `StyleSearchInput.tsx` 의 photo 아이콘 활성화 (현재는 클릭만 받고 동작 없음): `<input type="file" accept="image/*">` hidden 트리거
- [ ] 파일 선택 시 검색 모드를 "photo search" 로 전환 — input 영역에 선택된 파일명·thumbnail 표시
- [ ] 검색 진행 중 spinner + 결과 영역 dim (직전 PDCA 의 동일 패턴 재사용)
- [ ] 결과 렌더는 기존 `PortfolioGrid` 재사용
- [ ] photo 검색 모드 해제(X 클릭) → 텍스트 검색 모드로 복귀

**검증**
- [ ] `scripts/portfolio/_check-image-search.ts` — 같은 키워드의 portfolio 한 장을 query 로 주고 같은 키워드의 다른 portfolio 들이 top N 에 잡히는지 sanity 검증
- [ ] 직전 PDCA 의 `_check-search.ts` 자연어 시나리오 회귀 없음 확인

### 2.2 Out of Scope

- designer 본인이 portfolio 를 신규 업로드하는 UX (Storage upload from client + designer auth flow)
- 모바일 카메라 직접 캡처(`capture="environment"`) — Phase 후속
- 업로드 이미지 crop/zoom/회전 도구
- CLIP fine-tuning, hair-domain 특화 모델 학습
- 한국어 검색 품질 개선 — 별도 PDCA(시드 한/영 병기 또는 검색어 translation step)
- 사진 검색 결과의 페이지네이션 무한 스크롤 자체 변경 (기존 그대로 재사용, 사진 검색의 cursor 시맨틱은 Design 에서 확정)
- 인증·privacy (현재 미도입). 업로드된 사진은 임시 처리 후 폐기, DB 저장 안 함 (Design 에서 명시)
- 사진 검색 결과를 텍스트 결과와 unified RRF 로 섞는 advanced fusion (Design 에서 옵션 검토하되 미채택 시 OUT)
- portfolio.embedding(텍스트) 의 한국어 다국어화

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-1 | 360 portfolio rows 모두 `image_embedding` 값을 가진다 (NULL 0개) | P0 |
| FR-2 | Style 탭 검색바의 photo 아이콘 클릭 → 파일 picker 표시 → 이미지 선택 → 자동 검색 트리거 | P0 |
| FR-3 | 파일 업로드부터 결과 첫 그리드 렌더까지 사용자 인지 latency < 2.5s (CLIP 추론 + RPC + 네트워크 포함, 5MB 이하 이미지 기준) | P1 |
| FR-4 | 사진 검색 모드일 때 입력 input 자리에 파일 thumbnail + 파일명 + 제거(X) 버튼 표시 | P1 |
| FR-5 | photo 검색 + 키워드 칩 필터 동시 적용 가능 (`keywords && filter_keywords` 그대로 활용) | P2 |
| FR-6 | 사진 검색 결과 카드는 기존 텍스트 검색과 동일한 `StylePortfolioCard` 형태 | P0 |
| FR-7 | 사진 검색 결과는 score 내림차순 정렬 (CLIP cosine 유사도) | P0 |
| FR-8 | 미사용 컬럼 cleanup 후 기존 자연어 검색 및 designer/discover 기능 회귀 없음 | P0 |

### 3.2 Non-Functional Requirements

| ID | 요구사항 | 측정 |
|----|----------|------|
| NFR-1 | CLIP 추론은 서버 사이드에서만 수행 (클라이언트 번들 사이즈 증가 X) | 번들 사이즈 diff < 50KB |
| NFR-2 | 모델 다운로드는 1회만 (캐시 활용) | 두 번째 호출 시 모델 로드 < 200ms |
| NFR-3 | 업로드 이미지는 검색 처리 후 즉시 폐기 (디스크/Storage 저장 X) | Storage 새 객체 0개 |
| NFR-4 | image_embedding 인덱스(HNSW) cosine 거리 검색 < 50ms (360 rows 기준) | EXPLAIN ANALYZE |
| NFR-5 | `@xenova/transformers` 추가로 인한 `pnpm install` 시간 증가 < 15s | install timing |

### 3.3 Data Requirements

- 모델 후보 (Design 에서 1개 채택)
  - `Xenova/clip-vit-large-patch14` — CLIP ViT-L/14, 768d, ~300MB
  - `Xenova/clip-vit-base-patch32` — CLIP ViT-B/32, 512d, ~150MB
  - `Xenova/siglip-base-patch16-224` — SigLIP base, 768d, ~200MB (정확도 우위, 영문 기준)
- 차원이 다르면 `image_embedding vector(<dim>)` 컬럼 차원도 함께 변경
- 임베딩 정규화: CLIP/SigLIP 출력은 일반적으로 L2 normalize 후 cosine 사용

### 3.4 Integration Requirements

- 기존 `search_portfolios` RPC 시그니처 호환: 새 파라미터는 nullable optional 로 추가하여 기존 텍스트 검색 호출은 깨지지 않음 — 또는 새 RPC `search_portfolios_visual` 별도 — Design 에서 결정
- `src/lib/style/actions.ts` 의 `searchStyle` 어댑터는 텍스트/이미지 두 경로를 모두 노출 (예: `searchStyleByImage(File)` 추가)
- `StylePortfolioCard` 타입은 변경 없음

---

## 4. Risk

| 위험 | 영향 | 발생 가능성 | 대응 |
|------|------|------------|------|
| CLIP 모델 첫 다운로드가 dev 환경에서 5분+ 걸림 | 개발 흐름 정체 | 중 | (1) ENV 변수로 모델 캐시 디렉토리 명시 + .gitignore 추가 (2) README 에 사전 다운로드 명령 안내 (3) CI 에선 캐시 키 활용 |
| `image_embedding` 차원이 텍스트 임베딩(1536) 과 달라 unified search 가 까다로움 | 자연어 + 사진 동시 검색 시나리오의 RRF 가 복잡 | 중 | (1) Design 에서 두 RPC 분리 안 선호 (2) 단순화: 사진 검색 모드와 텍스트 검색 모드는 mutually exclusive UI 로 시작 |
| ViT-L/14 추론이 서버 메모리(예: Vercel serverless 1024MB) 한도 초과 | 운영 환경 OOM | 중 | (1) ViT-B/32 로 fallback (2) 자체 호스팅 / Edge function 또는 Background worker 검토 (3) 시드 단계는 로컬 머신에서만 돌리는 1회성으로 분리, 런타임은 ViT-B/32 |
| 사용자 업로드 이미지가 매우 크거나 비-이미지 파일 | 파싱 실패/지연 | 중 | (1) 클라 측에서 5MB cap + MIME 검사 (2) 서버에서 sharp 로 리사이즈 후 CLIP 입력 (e.g. 224×224) |
| portfolio.embedding(텍스트) 를 DROP 했을 때 자연어 검색 회귀 | 직전 PDCA 산출물 손상 | 저(Design 에서 이중화 선택 시 0) | (1) Design 단계의 architecture 선택에서 명확히 결정 (2) 단일화로 가도 CLIP text encoder + BM25 RRF 로 동등 이상 품질 검증 후만 DROP |
| `_temp_*` 컬럼 DROP 시 다른 코드에서 참조 | 런타임 에러 | 저 | grep 으로 코드베이스 전체 검색 후 참조 0건 확인 |
| 한국어 쿼리 정확도 (CLIP 단일화 시) | 한국어 사용자 UX 저하 | 중 | 본 PDCA 는 영어만 다룬다고 명시, 한국어는 별도 PDCA |

---

## 5. Timeline (예상)

| 단계 | 기간 | 산출물 |
|------|------|--------|
| Plan | 0.5d | 본 문서 |
| Design | 0.5d | 3 architecture options + 선택된 안의 detailed spec |
| Do — Schema/시드 | 0.5d | migration + CLIP 시드 스크립트 + 360 rows 채움 |
| Do — RPC | 0.3d | RPC 확장/신규 + sanity 검증 |
| Do — API/UI | 0.7d | Server action + Style 탭 photo 검색 UI |
| Check | 0.3d | gap-detector + sanity 검색 시나리오 |
| Act/Report | 0.2d | iteration + report |
| **합계** | **~3d** | |

---

## 6. Success Criteria

| ID | 기준 | 측정 방법 |
|----|------|----------|
| SC-1 | 360 portfolio rows 모두 `image_embedding IS NOT NULL` | `SELECT COUNT(*) WHERE image_embedding IS NULL` = 0 |
| SC-2 | 사진 업로드 검색 — 같은 키워드의 한 장을 query 로 주면 같은 키워드의 다른 장이 top 5 안에 ≥ 3개 | `_check-image-search.ts` 자동 검증 |
| SC-3 | 자연어 검색 회귀 없음 — `_check-search.ts` 의 기존 4개 NL 쿼리가 동일 top 1 결과 유지 (또는 더 좋아짐) | `_check-search.ts` diff |
| SC-4 | UI 흐름 — photo 아이콘 클릭 → 파일 선택 → 2.5s 이내 결과 그리드 렌더 | 수동 + 콘솔 timing log |
| SC-5 | `designer_profile` 의 `_temp_specialties`, `_temp_hair_type_experience` 컬럼이 schema 에 없음 | `\d designer_profile` |
| SC-6 | 기존 designer/discover 페이지 회귀 없음 | 수동 smoke (designer list/detail, discover 필터 토글) |
| SC-7 | `@xenova/transformers` 추가 후 클라이언트 번들 사이즈 증가 < 50KB | `pnpm build` 결과의 chunk size diff |

---

## 7. Stakeholders

| 역할 | 담당 |
|------|------|
| 의사결정 | syk |
| 구현 | syk (with Claude Code) |
| 검증 | syk (manual) + `_check-image-search.ts` 자동 |

---

## 8. Open Questions for Design

> Design 단계 architecture 선택 시 명확히 답해야 할 항목:

1. **CLIP 모델 차원** — ViT-L/14(768d) vs ViT-B/32(512d) vs SigLIP(768d). 정확도와 모델 사이즈/추론 시간 트레이드오프
2. **임베딩 컬럼 전략**:
   - (A) 이중화 — 기존 `embedding(1536)` 유지 + 신규 `image_embedding(768)` 추가
   - (B) CLIP 단일화 — `embedding` 차원을 768 로 변경하고 CLIP text encoder 로 자연어 검색도 통합
   - (C) image_embedding 만 추가하고 `embedding` 은 그대로 두지만 자연어 검색은 BM25(search_doc) 위주로 fallback
3. **RPC 전략** — 기존 RPC 파라미터 확장 vs 새 RPC 별도 추가
4. **사진 검색 UI 동작 모델** — 사진 검색 모드와 텍스트 검색 모드를 mutually exclusive 로 할지, 동시 발동 (사진 + 키워드 칩 동시 필터) 까지 허용할지
5. **임베딩 시드 위치** — 로컬 머신 1회성 vs 매번 dev 시작 시 vs CI/CD 의 빌드 step

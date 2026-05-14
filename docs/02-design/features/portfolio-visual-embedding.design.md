# portfolio-visual-embedding Design Document

> **Project**: curling-front
> **Version**: 0.2.0
> **Author**: syk
> **Date**: 2026-05-15
> **Status**: Draft
> **Plan Ref**: [`docs/01-plan/features/portfolio-visual-embedding.plan.md`](../../01-plan/features/portfolio-visual-embedding.plan.md)
> **Selected Architecture**: **Option B — Clean (CLIP 단일화, unified embedding space)**

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 텍스트 임베딩은 vision LLM 의 description 한 줄로 시각 정보를 압축하므로 미세 색조/텍스처 차이가 손실되고, image-to-image 검색을 지원하지 못한다. CLIP unified space 로 텍스트/이미지 모두 같은 768d 에 임베딩하면 OpenAI 의존도 제거되고 cross-modal 검색이 자연스러움. |
| **WHO** | (1) 다른 사용자의 헤어 사진을 발견하고 "이거랑 비슷한 거 만들어주는 디자이너 찾고 싶은" 고객. (2) 자연어로 표현하기 어려운 톤·텍스처 차이로 후보를 좁히고 싶은 고객. |
| **RISK** | 모델 다운로드(~300MB), 자연어 검색 backend 교체로 인한 회귀 위험, 서버 메모리 OOM(Vercel) 가능. |
| **SUCCESS** | 360 rows 모두 image_embedding(=embedding) 채움, photo 검색 UI 정상 < 2.5s, 미사용 컬럼 정리, 자연어 검색 회귀 없음(top 1 동등 이상). |
| **SCOPE** | IN: 컬럼 차원 변경(1536→768), CLIP 시드 (text+image), RPC 갱신, Server Action, photo 검색 UI, cleanup migration. OUT: 디자이너 직접 업로드, 카메라 캡처, crop, 한국어 품질 개선, fine-tuning, 인증. |

---

## 1. Overview

### 1.1 Selected Architecture — Option B

- CLIP **ViT-L/14 (768d)** 단일 모델로 텍스트/이미지 모두 임베딩
- 기존 `embedding vector(1536)` (text-embedding-3-large) **DROP**, 같은 컬럼을 `vector(768)` 으로 재생성하여 CLIP 결과 저장
- 신규 컬럼 `image_embedding vector(768)` 은 별도 추가 (이미지 픽셀 임베딩 전용). `embedding` 컬럼은 "텍스트(title+description+keywords) 의 CLIP 임베딩" 전용
- 자연어 검색: CLIP text encoder + BM25(tsvector) RRF
- 사진 검색: CLIP image encoder cosine
- Cross-modal: 같은 768d 공간이라 text query 로도 image_embedding 검색 가능 (선택 분기)
- OpenAI 의존 (text-embedding-3-large) **완전 제거**

### 1.2 Why B over C (한 줄)

CLIP text encoder 는 "이미지를 묘사하는 텍스트" 로 학습되어 portfolio description 의 의도(시각 검색용 텍스트)와 정합. 같은 공간에 텍스트/이미지가 있어 cross-modal 자연스러움. OpenAI 의존 제거로 단순성 + 비용 절감. 회귀 위험은 검증 스크립트로 control.

### 1.3 High-Level Flow

```
[시드 1회성 — 텍스트 + 이미지 둘 다 재임베딩]
portfolio.title/description/keywords + image_path 360 rows
    ↓
text → CLIP text encoder  ──┐
image (224×224) → CLIP image encoder ──┤
                            ↓
        UPDATE portfolio SET
          embedding = clip_text_vec,
          image_embedding = clip_image_vec

[런타임 — 자연어 검색]
사용자 "long blonde balayage"
    ↓ embedTextQuery() — CLIP text encoder (768d, 서버)
RPC search_portfolios(query_text, query_embedding, filter_keywords)
    ↓ tsvector BM25 + embedding(CLIP text) RRF
top N rows

[런타임 — 사진 검색]
사용자가 사진 업로드
    ↓ Server Action 수신, Sharp 224×224
CLIP image encoder (768d, 서버)
    ↓
RPC search_portfolios(..., query_image_embedding=...)
    ↓ image_embedding cosine
top N rows

[런타임 — Cross-modal (선택)]
사용자 텍스트 → CLIP text encoder (768d)
    ↓ 이 벡터로 image_embedding 검색도 가능
"painted into a corner" 시나리오에 대비한 추가 분기 (v2)
```

---

## 2. Data Model

### 2.1 Schema 변경 (Migration `_visual_embedding_clip_migration.sql`)

⚠ 이 마이그레이션은 기존 360 rows 의 `embedding` 컬럼 데이터를 버린다 (text-embedding-3-large → CLIP 으로 재계산 필요). 시드 다시 도는 게 전제.

```sql
BEGIN;

-- 1) 기존 HNSW 인덱스 drop (vector(1536) 의존)
DROP INDEX IF EXISTS public.idx_portfolio_embedding;

-- 2) embedding 컬럼 차원 변경 (1536 → 768)
-- 기존 데이터 무효화. vector(768) 로 재생성.
ALTER TABLE public.portfolio DROP COLUMN IF EXISTS embedding;
ALTER TABLE public.portfolio ADD COLUMN embedding vector(768);

-- 3) image_embedding 컬럼 추가 (신규)
ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS image_embedding vector(768);

-- 4) 새 HNSW 인덱스 (cosine 거리)
CREATE INDEX IF NOT EXISTS idx_portfolio_embedding
  ON public.portfolio USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_portfolio_image_embedding
  ON public.portfolio USING hnsw (image_embedding vector_cosine_ops);

-- 5) cleanup — designer_keyword 시드 완료 후 _temp_* DROP
ALTER TABLE public.designer_profile
  DROP COLUMN IF EXISTS _temp_specialties,
  DROP COLUMN IF EXISTS _temp_hair_type_experience;

COMMIT;

-- ⚠ external_ref 는 Auth 도입 시 별도 PDCA
```

### 2.2 portfolio 최종 컬럼

| Column | Type | 용도 |
|---|---|---|
| id, designer_id, image_path, title, description, keywords, display_order, search_doc, created_at, updated_at | (변경 없음) | |
| **`embedding`** | **`vector(768)`** (변경) | **CLIP text encoder 결과** — 자연어 검색용 |
| **`image_embedding`** | **`vector(768)`** (신규) | **CLIP image encoder 결과** — 사진 검색용 |

### 2.3 RPC 갱신 (Migration `_search_portfolios_clip.sql`)

`query_embedding` 차원 1536 → 768 변경. 사진 분기 추가.

```sql
CREATE OR REPLACE FUNCTION public.search_portfolios(
  query_text             TEXT,
  query_embedding        vector(768),        -- CLIP text (차원 변경)
  filter_keywords        TEXT[],
  result_limit           INT  DEFAULT 30,
  result_offset          INT  DEFAULT 0,
  query_image_embedding  vector(768) DEFAULT NULL  -- CLIP image (신규)
)
RETURNS TABLE ( ... )  -- 동일
LANGUAGE plpgsql STABLE
AS $$
DECLARE ...
BEGIN
  -- (사진 검색) image_embedding cosine — 우선
  IF query_image_embedding IS NOT NULL THEN
    RETURN QUERY
    SELECT p.id, p.designer_id, p.image_path, p.title::TEXT, p.description, p.keywords,
           d.display_name::TEXT, d.profile_image_url::TEXT, d.salon_id, s.name::TEXT,
           d.rating_avg::DOUBLE PRECISION,
           (1.0 - (p.image_embedding <=> query_image_embedding))::DOUBLE PRECISION AS score
    FROM public.portfolio p
    JOIN public.designer_profile d ON d.id = p.designer_id
    LEFT JOIN public.salon s ON s.id = d.salon_id
    WHERE p.image_embedding IS NOT NULL
      AND (NOT has_keywords OR p.keywords && filter_keywords)
    ORDER BY p.image_embedding <=> query_image_embedding ASC
    LIMIT result_limit OFFSET result_offset;
    RETURN;
  END IF;

  -- (빈 쿼리) rating fallback — 기존 동일
  IF NOT has_query THEN
    RETURN QUERY ...;
    RETURN;
  END IF;

  -- (자연어 hybrid) BM25 + CLIP text embedding RRF — 기존 RRF 로직 그대로,
  --   단 query_embedding 차원만 768 로 바뀜
  RETURN QUERY WITH kw_match AS (...), vec_match AS (...), fused AS (...) ...;
END; $$;
```

---

## 3. CLIP 통합

### 3.1 의존성

- `@xenova/transformers` (devDependency + runtime)
- `sharp` (이미지 224×224 + RGB 정규화)

### 3.2 모델 / 캐시

- 모델 ID: `Xenova/clip-vit-large-patch14`
- 캐시: `process.env.TRANSFORMERS_CACHE ?? "/tmp/transformers-cache"` (Vercel 호환)
- `.gitignore` 에 `tmp/transformers-cache/` 추가

### 3.3 임베딩 라이브러리 (`src/lib/portfolio-search/clip.ts`, 신규)

`embed-image.ts` 가 아닌 `clip.ts` 로 묶어서 text+image 둘 다 한 파일.

```ts
import { pipeline, env, RawImage } from "@xenova/transformers";

env.allowLocalModels = false;
env.allowRemoteModels = true;
env.cacheDir = process.env.TRANSFORMERS_CACHE ?? "/tmp/transformers-cache";

const MODEL_ID = "Xenova/clip-vit-large-patch14";
export const CLIP_DIMS = 768;

let _imageExtractor: any | null = null;
let _textExtractor: any | null = null;

async function getImageExtractor() {
  if (_imageExtractor) return _imageExtractor;
  _imageExtractor = await pipeline("image-feature-extraction", MODEL_ID, {
    quantized: false,
  });
  return _imageExtractor;
}

async function getTextExtractor() {
  if (_textExtractor) return _textExtractor;
  _textExtractor = await pipeline("feature-extraction", MODEL_ID, {
    quantized: false,
  });
  return _textExtractor;
}

export async function embedImage(input: Buffer | string): Promise<number[]> {
  const extractor = await getImageExtractor();
  const img = typeof input === "string"
    ? await RawImage.fromURL(input)
    : await RawImage.fromBlob(new Blob([input]));
  const out = await extractor(img, { pooling: "mean", normalize: true });
  const v = Array.from(out.data as Float32Array);
  if (v.length !== CLIP_DIMS) throw new Error(`unexpected dims: ${v.length}`);
  return v;
}

export async function embedText(text: string): Promise<number[]> {
  const extractor = await getTextExtractor();
  const out = await extractor(text.slice(0, 200), { pooling: "mean", normalize: true });
  const v = Array.from(out.data as Float32Array);
  if (v.length !== CLIP_DIMS) throw new Error(`unexpected dims: ${v.length}`);
  return v;
}
```

> ⚠ CLIP 의 `transformers.js` 통합 시 image / text 가 각각 다른 pipeline name 일 수 있음. Do 단계에서 정확한 API 시그니처 확인 (`zero-shot-image-classification` 패턴 참고).

### 3.4 검색 임베딩 진입점 변경

`src/lib/portfolio-search/embed.ts` (기존) → text-embedding-3-large 호출 부분 교체:

```ts
import { embedText } from "./clip";
import { EMBED_DIMENSIONS } from "./types";

export async function embedQuery(query: string): Promise<number[] | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  return embedText(trimmed);   // ← OpenAI 호출 제거, CLIP text encoder 로
}
```

`types.ts` 의 `EMBED_DIMENSIONS = 1536` → `768` 로 변경.

---

## 4. 시드 스크립트

### 4.1 `scripts/portfolio/embed-all-clip.ts` (신규)

기존 `seed-portfolio-from-storage.ts` 는 유지하되, 본 스크립트는 **이미 INSERT 된 360 rows 의 `embedding` + `image_embedding` 을 CLIP 으로 갱신**.

```ts
// 1) 360 rows fetch (id, image_path, title, description, keywords)
// 2) 각 row 에 대해:
//    a) text = `${title}. ${description}. Keywords: ${keywords.join(", ")}`
//    b) embedText(text) → 768d
//    c) localImagePath = `tmp/portfolio-images/${slug}/${n}.jpg` (image_path 로부터 매핑)
//       embedImage(localImagePath) → 768d
//    d) UPDATE portfolio SET embedding = ..., image_embedding = ... WHERE id = ...
// 3) 100 rows chunk
// 4) idempotent — 이미 채워진 row 는 --reset 없으면 skip
```

비용/시간:
- 모델 다운로드 1회 ~300MB (~30s)
- text embedding: ~50ms/row
- image embedding: ~500ms/row
- 360 rows × 0.55s = **~3.3분**
- 비용 0

### 4.2 pnpm 스크립트

```jsonc
"portfolio:embed-clip": "tsx --env-file=.env scripts/portfolio/embed-all-clip.ts",
"portfolio:embed-clip-reset": "tsx --env-file=.env scripts/portfolio/embed-all-clip.ts --reset"
```

`portfolio:seed-kw` (기존) 와 별도 — `seed-kw` 는 portfolio row INSERT 까지만 하고 embedding 은 비우거나 0 벡터로. Do 단계에서 결정 (기존 seed 도 수정해서 vision LLM caption 만 만들고 embedding 은 비울 수도).

> **결정 항목**: 기존 `seed-portfolio-from-storage.ts` 가 LLM caption + OpenAI embedding 까지 하는데, B 채택으로 OpenAI embedding 은 무효. 두 선택:
>   - (i) `seed-kw` 에서 embedding 생성 자체를 제거 (LLM caption 만), `embed-clip` 별도 step
>   - (ii) `seed-kw` 를 CLIP 으로 통합 — Do 단계에서 결정

---

## 5. API (Server Action)

기존 `searchStyle` 는 시그니처 유지 + 내부에서 CLIP text encoder 사용. 신규 `searchStyleByImage` 추가.

```ts
// src/lib/style/actions.ts (수정)
"use server";
import { searchPortfolios } from "@/lib/portfolio-search/search";
import { embedImage } from "@/lib/portfolio-search/clip";
import sharp from "sharp";

export async function searchStyle(params): Promise<StyleSearchResult> {
  // 내부에서 embedQuery() 가 이제 CLIP text 호출
  // adapter 동일
}

export async function searchStyleByImage(
  formData: FormData,
): Promise<StyleSearchResult> {
  const file = formData.get("image") as File | null;
  if (!file) throw new Error("no image");
  if (file.size > 5 * 1024 * 1024) throw new Error("image too large (>5MB)");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("unsupported image type");
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const normalized = await sharp(buf)
    .resize(224, 224, { fit: "cover" })
    .jpeg({ quality: 85 })
    .toBuffer();

  const queryImageEmbedding = await embedImage(normalized);

  // portfolio-search 를 통해 RPC 호출 (query_image_embedding 만)
  const result = await searchPortfoliosByImage({
    queryImageEmbedding,
    keywordSlugs: ...,
    limit: ...,
  });

  // 기존 adapter
  return result;
}
```

`src/lib/portfolio-search/search.ts` 에 `searchPortfoliosByImage` 추가 (또는 `searchPortfolios` 시그니처 확장).

---

## 6. UI

### 6.1 `StyleSearchInput.tsx`

- 신규 `onFileSelect: (file: File) => void` prop
- photo 아이콘 클릭 → hidden `<input type="file" accept="image/jpeg,image/png,image/webp">` 트리거
- 파일 선택 시 `onFileSelect(file)`

### 6.2 `StyleClient.tsx`

state 추가:
```ts
const [searchMode, setSearchMode] = useState<"text" | "photo">("text");
const [photoFile, setPhotoFile] = useState<File | null>(null);
const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
```

분기:
- text 모드: 기존 그대로
- photo 모드:
  - 파일 변경 시 `searchStyleByImage(formData)` 즉시 호출 (debounce 없음)
  - input 자리에 `<PhotoSearchChip>` 표시
  - 추천 키워드 칩 활성 (photo + 키워드 동시 가능)
- mode 전환:
  - 사진 선택 → photo 모드 진입
  - PhotoSearchChip 의 X → text 모드 복귀, photoPreviewUrl URL.revokeObjectURL

### 6.3 `PhotoSearchChip.tsx` (신규)

```tsx
<div className="flex items-center gap-2 h-12 rounded-full bg-surface-200 pl-1 pr-3 min-w-0 flex-1">
  <img src={previewUrl} className="size-10 rounded-full object-cover" />
  <span className="flex-1 typo-body2 text-surface-900 truncate">{fileName}</span>
  <button onClick={onRemove} aria-label="Remove photo" className="size-8 ...">
    <XIcon />
  </button>
</div>
```

기존 `StyleSearchInput` 영역을 통째로 대체 (mutually exclusive UI).

### 6.4 로딩 상태

기존 spinner UX 그대로 재사용:
- isLoading 동안 우측 search 아이콘 → spinner
- 결과 그리드 dim
- 빈 상태 시 중앙 spinner

---

## 7. Test Plan

### 7.1 시드 검증
- `pnpm portfolio:embed-clip` 1회 → `SELECT COUNT(*) WHERE embedding IS NULL OR image_embedding IS NULL` = 0

### 7.2 자연어 검색 회귀 (B 채택의 핵심 검증)
- `_check-search.ts` 의 4개 NL 쿼리를 다시 실행
- 기존 top 1 결과와 비교
- 허용 기준: top 5 안에 기존 top 1 이 포함되면 OK (rank 미세 변동은 수용)
- 만약 명백히 의미 없는 결과가 top 5 안에 들어오면 회귀 — BM25 가중치 조정 또는 fallback

### 7.3 사진 검색 self-similarity
- `_check-image-search.ts`: 같은 image_path 를 query 로 → top 1 == 자기 자신, score > 0.95

### 7.4 사진 검색 cross-portfolio similarity
- balayage 키워드의 portfolio 한 장 → 다른 balayage 가 top 5 안에 ≥ 3개

### 7.5 UI 수동
- /style → photo 아이콘 → 파일 선택 → 2.5s 이내 결과
- X 클릭 → text 모드 복귀

### 7.6 회귀 — designer/discover
- 영향 없는지 확인 (RPC 시그니처 변경이 이쪽엔 영향 X)

---

## 8. Risks & Mitigations

| 위험 | 대응 |
|---|---|
| CLIP text encoder 자연어 quality 가 text-embedding-3-large 보다 명백히 떨어짐 | (1) BM25(tsvector) 가중치 ↑ + RRF 로 보강 (2) 한국어 별도 PDCA 에서 multilingual CLIP / 번역 step 검토 |
| ViT-L/14 가 Vercel serverless 1024MB 초과 | (1) ViT-B/32 (512d) fallback — 시드 + 마이그레이션 다시 (2) self-host inference endpoint 분리 PDCA |
| HF Hub 다운로드 차단/느림 | 모델 파일 Storage 미러링 (별도 PDCA) |
| 자연어 검색 회귀가 명백 → 사용자 검증 결과 "안 좋아짐" | B → C 로 rollback. 이 경우 migration 도 되돌려야 함 (embedding 1536 으로 재변경 + text-embedding-3-large 시드 재실행). 비용 ~$0.007, 시간 ~6분 |

---

## 9. Implementation Guide

### 9.1 파일 변경/생성 목록

**신규**
- `supabase/migrations/_visual_embedding_clip_migration.sql` — 컬럼 차원 변경 + image_embedding + cleanup
- `supabase/migrations/_search_portfolios_clip.sql` — RPC 갱신 (768d + 사진 분기)
- `scripts/portfolio/embed-all-clip.ts` — text+image CLIP 시드
- `scripts/portfolio/_check-image-search.ts` — 사진 검색 검증
- `src/lib/portfolio-search/clip.ts` — embedImage + embedText
- `src/app/(main)/style/components/PhotoSearchChip.tsx`

**수정**
- `package.json` — `@xenova/transformers`, `sharp` deps + `portfolio:embed-clip` 스크립트
- `src/lib/portfolio-search/embed.ts` — embedQuery 가 CLIP text encoder 호출
- `src/lib/portfolio-search/types.ts` — `EMBED_DIMENSIONS = 768`
- `src/lib/portfolio-search/search.ts` — `searchPortfoliosByImage` 추가
- `src/lib/style/actions.ts` — `searchStyleByImage` 추가
- `src/app/(main)/style/StyleClient.tsx` — searchMode + photo flow
- `src/app/(main)/style/components/StyleSearchInput.tsx` — file input + onFileSelect
- `src/app/(main)/style/components/StyleSearchTab.tsx` — onFileSelect pass-through
- `.gitignore` — `tmp/transformers-cache/`

**삭제 / 정리**
- DB 컬럼: `designer_profile._temp_specialties`, `_temp_hair_type_experience`
- 기존 `seed-portfolio-from-storage.ts` 의 OpenAI embedding 호출은 deprecated (Do 단계에서 정리)

### 9.2 Implementation Order

1. **Module-1 — CLIP 라이브러리 + 단위 검증** (1시간)
   - `@xenova/transformers` 설치
   - `clip.ts` 작성
   - 단일 이미지/텍스트 → 768d 출력 검증 (`_check-clip-sanity.ts` 임시)
2. **Module-2 — Schema 마이그레이션** (15분)
   - `_visual_embedding_clip_migration.sql` 작성 + dashboard 적용
   - `_check-tables.ts` 로 컬럼 확인
3. **Module-3 — 시드 스크립트** (1.5시간)
   - `embed-all-clip.ts` 작성 + 실행 → 360 rows UPDATE
   - 텍스트/이미지 둘 다 채움
4. **Module-4 — RPC 갱신** (30분)
   - `_search_portfolios_clip.sql` 작성 + dashboard 적용
   - 직접 RPC 호출로 분기 검증 (사진/자연어/키워드/빈)
5. **Module-5 — 자연어 회귀 검증 (B 핵심 게이트)** (30분)
   - `_check-search.ts` 재실행 + 결과 비교
   - 명백한 회귀 발생 시 BM25 가중치 조정 또는 rollback 결정
6. **Module-6 — Server Action + UI** (2시간)
   - `searchStyleByImage` 작성
   - StyleSearchInput 파일 input
   - StyleClient searchMode 분기
   - PhotoSearchChip
   - 브라우저 수동 검증
7. **Module-7 — 사진 검색 검증 + 회귀** (30분)
   - `_check-image-search.ts`
   - designer/discover 회귀 확인

### 9.3 Session Guide

- **Session 1**: Module 1-3 (CLIP + 시드까지)
- **Session 2**: Module 4-5 (RPC + 자연어 회귀 검증 — B 채택 검증 게이트)
- **Session 3**: Module 6-7 (UI + 사진 검색)

`/pdca do portfolio-visual-embedding --scope module-1,module-2,module-3` 첫 세션 권장.

---

## 10. Open Items (Do 전 확정)

1. **transformers.js 의 CLIP image / text pipeline API 정확한 시그니처** — Do Module-1 에서 단위 검증 시 확정.
2. **기존 `seed-portfolio-from-storage.ts` 처리** — embedding 생성 부분 제거 vs CLIP 으로 교체 (Do Module-3 에서 결정).
3. **자연어 회귀 게이트 통과 기준** — 4개 쿼리 중 몇 개 통과해야 B 채택 확정? 권장 4/4 (즉 회귀 0). 1개 이상 회귀 시 rollback 또는 BM25 보강.

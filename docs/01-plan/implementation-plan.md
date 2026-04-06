# AI 디자이너 매칭 — 구현 계획서 (벡터 임베딩 방식)

## 현재 상태

| 항목 | 상태 |
|---|---|
| 이미지 수집 스크립트 | ✅ 완료 — Pexels 30장 |
| 태그 체계 + 태깅 스크립트 | ✅ 완료 — 보조 설명용으로 유지 |
| Supabase 프로젝트 | ✅ 생성됨 — .env 설정 완료 |
| Supabase SDK | ✅ 설치됨 |
| Supabase 클라이언트 | ✅ 생성됨 (browser + server) |
| pgvector 확장 | ❌ 미활성화 |
| CLIP 임베딩 파이프라인 | ❌ 없음 |
| DB 테이블 | ❌ 미생성 |
| API Routes | ❌ 없음 |
| 프론트엔드 UI | ❌ 없음 |

---

## 핵심 아키텍처

```
유저가 헤어 이미지 업로드
    ↓
Next.js API Route
    ↓
CLIP 모델로 이미지 → 벡터(512차원) 변환
    ↓
Supabase pgvector에서 cosine similarity 검색
    ↓
가장 유사한 포트폴리오를 가진 디자이너 반환
```

---

## 구현 순서

### Phase 1: Supabase DB + pgvector 세팅

> **예상 소요: 1일**

#### 1-1. pgvector 활성화 + 테이블 생성 (Supabase SQL Editor)

```sql
-- pgvector 확장 활성화
create extension if not exists vector;

-- 디자이너
create table designers (
  id bigserial primary key,
  name text not null,
  profile_image text,
  bio text,
  role text default 'Designer',
  languages text[] default '{}',
  created_at timestamptz default now()
);

-- 디자이너 포트폴리오 (벡터 임베딩 포함)
create table portfolios (
  id bigserial primary key,
  designer_id bigint references designers(id) on delete cascade,
  image_url text not null,
  description text,
  embedding vector(512),       -- CLIP ViT-B/32 출력 차원
  created_at timestamptz default now()
);

-- 유저 업로드 분석 로그
create table upload_analyses (
  id bigserial primary key,
  image_url text,
  embedding vector(512),
  matched_designers jsonb,
  created_at timestamptz default now()
);

-- 벡터 검색 인덱스 (IVFFlat — 1만 장 이하에서 적합)
create index idx_portfolios_embedding
  on portfolios using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index idx_portfolios_designer on portfolios(designer_id);
```

#### 1-2. 벡터 유사도 검색 함수

```sql
-- 업로드 벡터와 가장 유사한 포트폴리오 찾기
create or replace function match_portfolios(
  query_embedding vector(512),
  match_count int default 5
)
returns table (
  portfolio_id bigint,
  designer_id bigint,
  image_url text,
  similarity float
)
language sql stable
as $$
  select
    p.id as portfolio_id,
    p.designer_id,
    p.image_url,
    1 - (p.embedding <=> query_embedding) as similarity
  from portfolios p
  where p.embedding is not null
  order by p.embedding <=> query_embedding
  limit match_count;
$$;
```

---

### Phase 2: CLIP 임베딩 파이프라인

> **예상 소요: 2일**

#### 2-1. Python 환경 세팅

```bash
pip install sentence-transformers pillow supabase
```

#### 2-2. 임베딩 + DB 저장 스크립트

```
scripts/embedding/
  embed-images.py     ← 이미지 폴더 → CLIP 벡터 → Supabase 저장
  embed-single.py     ← 단일 이미지 → 벡터 반환 (API에서 호출)
  seed-demo.py        ← 데모 디자이너 + 포트폴리오 30장 시드
```

**embed-images.py 핵심 로직:**
```python
from sentence_transformers import SentenceTransformer
from PIL import Image
from supabase import create_client

model = SentenceTransformer("clip-ViT-B-32")

# 이미지 → 벡터
img = Image.open("hair-001.jpg")
vector = model.encode(img).tolist()  # [0.23, -0.41, ..., 0.15] (512차원)

# Supabase에 저장
supabase.table("portfolios").update({
  "embedding": vector
}).eq("id", portfolio_id).execute()
```

**seed-demo.py:**
- 데모 디자이너 10명 생성
- sample-data/images/ 30장을 포트폴리오로 등록
- 각 이미지의 CLIP 임베딩을 계산하여 embedding 컬럼에 저장

#### 2-3. 업로드 이미지 임베딩 API

유저가 이미지를 업로드하면 실시간으로 벡터를 만들어야 함.
두 가지 방법:

| 방법 | 장점 | 단점 |
|---|---|---|
| **A. Python 마이크로서버** | CLIP 직접 실행, 무료 | 별도 서버 운영 필요 |
| **B. Hugging Face Inference API** | 서버 불필요, HTTP 호출만 | 무료 티어 제한 있음 |

**추천: B (Hugging Face)** — MVP에서 별도 서버 없이 가능

```typescript
// Next.js API Route에서 Hugging Face API 호출
const response = await fetch(
  "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32",
  {
    method: "POST",
    headers: { Authorization: "Bearer hf_xxx" },
    body: imageBuffer,
  }
);
const embedding = await response.json(); // [0.23, -0.41, ...]
```

---

### Phase 3: Next.js API Routes

> **예상 소요: 2일**

```
src/app/api/
  search/route.ts     ← POST: 이미지 → 임베딩 → 유사 디자이너 반환
  designers/route.ts  ← GET: 디자이너 목록
```

**POST /api/search**
```
Request:  { image: base64 }

Process:
  1. base64 → Hugging Face CLIP API → 벡터(512)
  2. Supabase match_portfolios(벡터, 5) → 유사 포트폴리오
  3. 디자이너 정보 조인

Response: {
  matches: [
    {
      designer: { id, name, profileImage, bio },
      portfolio: { imageUrl },
      similarity: 0.94   // 94% 유사
    }
  ]
}
```

---

### Phase 4: 프론트엔드 UI

> **예상 소요: 3일**

#### 4-1. 유저 플로우

```
Discover 페이지
  └─ [AI 매칭] 버튼 클릭
      └─ 이미지 업로드 모달
          ├─ 드래그앤드롭 / 파일 선택
          ├─ 이미지 미리보기
          └─ [매칭 시작] 클릭
              └─ 로딩 (벡터 변환 + 검색)
                  └─ 매칭 결과 리스트
                      ├─ DesignerCard (기존 컴포넌트 재활용)
                      ├─ 유사도 % 표시
                      └─ 포트폴리오 이미지 비교 (업로드 vs 매칭)
```

태깅 방식과 다르게 **태그 확인/수정 단계가 없음** — 업로드 → 바로 결과.
UX가 더 단순해짐.

#### 4-2. 컴포넌트 구조

```
src/features/ai-match/
  components/
    ImageUploader.tsx        ← 드래그앤드롭 + 미리보기
    MatchedDesignerList.tsx  ← 매칭 결과 리스트
    SimilarityBadge.tsx      ← 유사도 % 뱃지
    CompareView.tsx          ← 업로드 이미지 vs 매칭 이미지 비교
  hooks/
    useSearch.ts             ← /api/search 호출
  store/
    matchStore.ts            ← Zustand: 업로드 상태, 결과
```

#### 4-3. 상태 관리 (Zustand)

```typescript
interface MatchStore {
  // 단계 (태깅보다 단순)
  step: 'upload' | 'searching' | 'results';

  // 업로드
  imageFile: File | null;
  imagePreview: string | null;

  // 결과
  matches: {
    designer: Designer;
    portfolio: Portfolio;
    similarity: number;
  }[];
  isSearching: boolean;
  error: string | null;
}
```

---

### Phase 5: 연동 + 테스트

> **예상 소요: 2일**

- [ ] Python 시드 스크립트로 데모 데이터 30장 임베딩 + 저장
- [ ] 프론트 → API Route → Hugging Face → Supabase 전체 플로우
- [ ] 에러 상태 처리 (API 실패, 이미지 형식 오류)
- [ ] 유사도 결과 품질 검증 (30장 데이터로 의미 있는 결과 나오는지)
- [ ] Storybook에 각 컴포넌트 스토리 추가

---

## 태깅 vs 벡터 비교 (이 프로젝트 기준)

| | 태깅 (이전 계획) | 벡터 (현재 계획) |
|---|---|---|
| 유저 플로우 | 업로드 → 태그 확인 → 매칭 | 업로드 → **바로 매칭** |
| 매칭 정확도 | 태그 범위에 한정 | 이미지 전체 뉘앙스 포착 |
| 매칭 설명 | "웜톤 + 레이어드 일치" | "94% 유사" (이유 없음) |
| 오매칭 문제 | 색상 다른데 높은 점수 가능 | 거의 없음 |
| 구현 난이도 | 낮음 | 중간 (Python + pgvector) |
| 추가 비용 | Claude Vision API | 무료 (CLIP 로컬 또는 HF 무료 티어) |

**보완**: 벡터 매칭 결과에 태깅 스크립트를 보조로 돌려서 "왜 유사한지" 설명 추가 가능 (v2)

---

## 기술 스택 확정

| 영역 | 기술 |
|---|---|
| 프론트엔드 | Next.js 16 (App Router) + React 19 + Tailwind v4 |
| 상태관리 | Zustand |
| 백엔드/DB | Supabase (PostgreSQL + pgvector) |
| 이미지 저장 | Supabase Storage |
| 이미지 임베딩 | CLIP ViT-B/32 (로컬 Python + HF API) |
| API | Next.js API Routes (서버사이드) |

---

## v2 확장 계획

- [ ] 태깅 보조 설명: 벡터 매칭 결과에 "공통점" 텍스트 추가
- [ ] 디자이너 프로필 텍스트 보조 신호
- [ ] 유저 클릭 데이터 기반 피드백 루프
- [ ] 임베딩 모델 업그레이드 (CLIP → SigLIP 등)

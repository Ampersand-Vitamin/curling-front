# AI 헤어 이미지 기반 디자이너 매칭 — 통합 계획서

> 4개 문서(ai-designer-matching, approach-comparison, implementation-plan, timeline)를 통합한 단일 기획 문서

---

## 1. 개요

사용자가 원하는 헤어스타일 이미지를 업로드하면, 해당 스타일과 유사한 포트폴리오를 가진 디자이너 목록을 추천하는 기능.

**본질**: "이미지 유사도"가 아니라 **"헤어 스타일 유사도"**. 얼굴, 배경, 옷은 무시해야 함.

---

## 2. 현재 상태

| 항목 | 상태 |
|---|---|
| Pexels 이미지 30장 수집 | ✅ |
| 태그 체계 정의 (K-Hairstyle 기반) | ✅ |
| 태깅 스크립트 (Claude Vision) | ✅ |
| 태그 매칭 로직 (가중치 + mustMatch) | ✅ |
| Supabase 프로젝트 + `.env` | ✅ |
| 벡터 임베딩 실험 (Jina CLIP v2) | ✅ → `legacy/vector-embedding/` 보관 |
| DB 테이블 (태그 방식) | ❌ |
| API Routes (신규) | ❌ |
| 프론트엔드 UI (신규) | ❌ |

---

## 3. 접근 방식 비교

### 접근 A: 태깅 (Vision AI로 헤어 개념 추출)

```
이미지 → Vision AI (Claude/GPT/Gemini) → 헤어 태그 추출 → DB 검색
예: "미디엄 레이어드 웜톤 브라운 여성"
```

**장점**
- **언어 기반 이해** — Vision AI가 "헤어"를 개념적으로 이해. 얼굴/배경을 자동으로 무시
- **각도 무관** — 정면/측면/후면 어떤 각도든 Vision AI가 헤어 식별
- **전처리 불필요** — 얼굴 제거, 크롭, 세그멘테이션 필요 없음
- **설명 가능** — "웜톤 + 레이어드 일치" 같은 매칭 근거 표시 가능
- **구조화된 태그** — 우리 taxonomy로 결과 강제 가능
- **라이선스 안전** — 자체 데이터로 파인튜닝 가능 (v2)

**단점**
- API 호출당 비용 (GPT-4o mini 기준 월 ~$15 @ 1만 건)
- 정보 손실 (이미지 → 태그)
- Vision AI의 헤어 지식 수준에 품질 의존
- 동일 이미지에 대한 태그 일관성 이슈 (temperature 0으로 완화 가능)

### 접근 B: 이미지 직접 벡터화 + 전처리

```
이미지 → 얼굴 제거/크롭 → 임베딩 모델 (Jina CLIP v2, SigLIP 2) → 벡터 → DB 검색
```

**장점**
- **시각적 뉘앙스 포착** — 태그로 못 담는 분위기, 질감, 구도
- **호출당 비용 낮음** — 임베딩 API는 Vision AI보다 저렴 (~1/10)
- **자연어 검색 통일 가능** — 멀티모달 모델이면 텍스트 검색도 한 파이프라인
- **데이터 축적 무관** — 사전학습 모델 바로 사용 가능

**단점 — 각도별로 영향 다름**

| 각도 | 얼굴 비중 | 문제 심각도 | 필요 전처리 |
|---|---|---|---|
| **정면** | 40~50% | 큼 (얼굴이 벡터 지배) | 얼굴 제거/크롭 필수 |
| **측면** | 15~20% | 중간 | 선택적 |
| **후면** | 0% | 없음 | 불필요 |

- 범용 임베딩 모델은 **헤어를 개념적으로 모름** (시각적 유사도만)
- 전처리 파이프라인 필요 (세그멘테이션, 얼굴 검출)
- 옆/뒷모습에서 얼굴 검출 실패 가능
- 설명 불가 ("93% 유사"만)

### 접근 C: 오픈소스 데이터셋 파인튜닝 (K-Hairstyle 등)

```
K-Hairstyle 50만 장 → 분류 모델 파인튜닝 (ResNet, ViT) → 자체 헤어 분류기
```

**장점**: 전문가 태깅, 헤어 특화, 빠른 추론
**단점**: **CC BY-NC 라이선스** (상업 불가), 한국인 편향, ML 엔지니어링 역량 필요
**결론**: **사용 불가** (상업 서비스 기준). 분류 체계만 참고.

---

## 4. 비교표

| 기준 | A. 태깅 | B. 이미지 벡터 | C. 오픈소스 파인튜닝 |
|---|---|---|---|
| MVP 속도 | **빠름** | 중간 | 느림 |
| 헤어 개념 이해 | **강함** | 약함 | 강함 |
| 얼굴 중심 문제 | **없음** | 정면에서 큼 | 없음 |
| 각도 대응 | **모든 각도 OK** | 측/후면 유리 | 모든 각도 OK |
| 전처리 필요 | **없음** | 필요 (정면일 때) | 없음 |
| 설명 가능성 | **높음** | 없음 | 높음 |
| 자연어 검색 | 가능 | 가능 | 불가 |
| 구현 복잡도 | **낮음** | 중간 | 높음 |
| 월 비용 (1만 건) | ~$15 | $0~30 | $5~50 (호스팅) |
| 라이선스 리스크 | **없음** | 없음 | **있음** |
| 파인튜닝 경로 | 자체 데이터 쉬움 | 필수 | 이미 완료 |

---

## 5. 유즈케이스별 적합도

| 유저 행동 | 주 각도 | 적합한 방식 |
|---|---|---|
| 연예인 사진 참고 | 정면 | **A** (태깅) |
| 셀카로 "이렇게 해주세요" | 정면 | **A** |
| 핀터레스트 스크린샷 | 섞임 | 둘 다 |
| 살롱 포트폴리오 캡처 | 측/후면 | **B** (이미지 벡터) |

**실제 유저 업로드는 섞여 있을 가능성이 높음** → 30장 테스트로 검증 권장.

---

## 6. 최종 선택

### MVP: **접근 A (Vision AI 태깅)**

**선택 이유**
1. 헤어 스타일은 본질적으로 **언어로 정의되는 개념** (레이어드, 웨이브, 웜톤)
2. 이미지 벡터 방식이 겪는 문제(얼굴, 각도, 배경)를 **Vision AI는 구조적으로 겪지 않음**
3. 구현과 유지보수가 **단순**
4. 유저에게 **매칭 근거 설명** 가능 → 신뢰도 상승
5. 비용 문제는 **GPT-4o mini**로 1/10 절감 가능
6. 서비스 운영하며 **자연스럽게 학습 데이터 축적** (v2 파인튜닝 대비)

### 공통: UX 힌트 (필수)

```
💡 팁: 헤어가 선명하게 보이는 사진일수록 정확도가 높습니다
   - 얼굴과 머리가 중앙에 오도록
   - 배경이 단순할수록 좋아요
   - 한 사람만 나오는 사진 권장
```

어느 방식이든 **구현 복잡도 0으로 품질을 20~30% 올리는** 효과.

---

## 7. 태그 체계 (K-Hairstyle 기반)

참고: https://psh01087.github.io/K-Hairstyle/
라이선스: 분류 체계(카테고리/태그 이름)는 **개념**이라 참고 가능

### 카테고리

| 카테고리 | 가중치 | 필수? | 태그 예시 |
|---|---|---|---|
| **basestyle** (31) | 3 | X | Hershey, Dandy, Bob, Comma, Pomade... |
| **length** | 2 | X | short, medium, long, female short |
| **curl** | 2 | X | S, C, J, SC, CS, CC, X |
| **bang** | 2 | X | full bang, see-through, choppy, slightly swept |
| **color** | 3 | **✅** | black, reddish brown, natural brown, ash brown, Ombre |
| **partition** | 1 | X | 9:1, 7:3, 5:5, None |
| **side** | 1 | X | one-block, two-block, None |
| **exceptional** | 1 | X | ponytail, braided, buzz cut, accessories |
| **gender** | 2 | X | female, male |
| **loss** | 1 | X | None, partial, early stage |

실제 구현은 [taxonomy.ts](../../scripts/tag-system/taxonomy.ts) 참고.

---

## 8. 매칭 로직

### 문제: 단순 태그 카운트의 한계

```
업로드:      브라운, 레이어드, 단발, 웜톤, 캐주얼
디자이너 A:  브라운, 레이어드, 단발, 웜톤, 모던   → 4/5 = 80% ✅
디자이너 B:  실버, 레이어드, 단발, 쿨톤, 캐주얼   → 3/5 = 60% ❌ 색상 완전 다름
```

### 해결책 (우선순위순)

**1. 카테고리별 가중치** (필수)
```
색상/톤: ×3, 컷/길이: ×2, 무드/텍스처: ×1
```

**2. 필수 태그 필터 (mustMatch)** (필수)
```
색상, 톤이 불일치하면 후보에서 제외
유저가 "색상 상관없음" 토글로 해제 가능
```

**3. 유저 확인 단계** (선택)
```
AI 추출 태그 → 유저 수정 가능 → 매칭 실행
```

**4. 카테고리 내 유사도 매핑** (v2)
```
브라운 ↔ 다크브라운 = 0.9
브라운 ↔ 실버       = 0.0
```

### 매칭 점수 공식

```
점수 = Σ(겹치는 태그 × 카테고리 가중치) / Σ(전체 태그 × 카테고리 가중치)
```

---

## 9. 아키텍처

```
┌─────────────┐   업로드   ┌──────────────┐  태그추출  ┌─────────────┐
│  프론트엔드 │ ────────→ │ /api/analyze │ ────────→ │  GPT-4o mini│
│  (Next.js)  │           │              │           │   (Vision)  │
└─────────────┘           └──────────────┘           └─────────────┘
       │                         │ 태그 반환
       │                         ↓
       │                  ┌──────────────┐  태그매칭  ┌─────────────┐
       └─ 결과 표시 ← ─── │  /api/match  │ ────────→ │   Supabase  │
                          │              │           │  PostgreSQL │
                          └──────────────┘           └─────────────┘
```

---

## 10. 구현 로드맵

### Phase 0: 기반 (완료)

- 태그 체계, Pexels 수집, 태깅 스크립트, 매칭 로직, Supabase 세팅, 벡터 실험 (legacy 이동)

### Phase 1: MVP 완성 (2주)

**Week 1: 백엔드**

| 일 | 할 일 |
|---|---|
| Day 1 | Supabase 태그 테이블 + K-Hairstyle 기반 시드 데이터 |
| Day 2 | `/api/analyze` — 이미지 → GPT-4o mini → 태그 추출 |
| Day 3 | `/api/match` — 태그 → DB 매칭 (가중치 + mustMatch) |
| Day 4 | Supabase Storage 포트폴리오 이미지 업로드 파이프라인 |
| Day 5 | 데모 디자이너 데이터 보강 (프로필, 상세) |

**Week 2: 프론트엔드 + 연동**

| 일 | 할 일 |
|---|---|
| Day 6 | 이미지 업로드 UI (드래그앤드롭, 미리보기, UX 힌트) |
| Day 7 | 태그 결과 화면 (추출된 태그, 유저 수정 가능) |
| Day 8 | 매칭 결과 (DesignerCard 재활용, 매칭율/근거 표시) |
| Day 9 | Discover 페이지 진입점 추가 |
| Day 10 | E2E 테스트 + 버그 수정 |

**산출물**: `/discover/ai-match` 동작, 데모 디자이너 10명 + 포트폴리오 30장

### Phase 2: 실서비스 준비 (3주)

**Week 3: 디자이너 온보딩**
- Supabase Auth 기반 가입/로그인
- 포트폴리오 업로드 UI
- 업로드 시 자동 태깅
- 디자이너 프로필 편집

**Week 4: 유저 경험 개선**
- 태그 기반 필터바
- 검색 히스토리
- 디자이너 상세 페이지 (포트폴리오 갤러리)
- 모바일 반응형

**Week 5: 안정화 + 배포**
- 에러 처리 강화, 로딩 UX
- Vercel 배포
- 모니터링 (API 비용, 에러 로깅)

### Phase 3: 데이터 축적 (1~3개월)

- 유저 피드백 수집, 태그 체계 조정
- 목표: **5,000~10,000장 태깅 데이터 축적**
- 자동 축적: 유저 업로드 + 디자이너 포트폴리오 모두 태깅 저장

### Phase 4: 분기 판단 및 고도화

**분기 기준:**

| 지표 | Route A (파인튜닝) | Route B (하이브리드) |
|---|---|---|
| 태그 매칭 만족도 | 높음 (80%+) | 낮음 (60% 이하) |
| "비슷한데 왜 안 나와요" 불만 | 적음 | 많음 |
| 주요 문제 | API 비용/속도 | 태그로 못 잡는 뉘앙스 |

**Route A: 파인튜닝 전환 (2주)**
- 자체 데이터로 ViT 파인튜닝 (Google Colab + HF Trainer)
- Vision AI → 자체 모델 전환
- 효과: 비용 ~$0, 속도 수십ms, 외부 의존 제거

**Route B: 하이브리드 전환 (3주)**
- `legacy/vector-embedding/` 코드 복원 + 헤어 CLIP 파인튜닝
- 태그 필터 → 벡터 정렬 조합
- 효과: 최고 품질 매칭 (설명 + 뉘앙스)

### 전체 타임라인 요약

```
  Phase 0     Phase 1     Phase 2       Phase 3              Phase 4
  (완료)      (2주)       (3주)         (1~3개월)
  ─────       ─────       ─────         ─────────           ┌─ Route A: 파인튜닝 (2주)
  ✅    ──→  MVP   ──→  실서비스  ──→  데이터 축적  ──→ 분기 ─┤
              데모        배포         5,000~10,000장        └─ Route B: 하이브리드 (3주)
```

| 마일스톤 | 시점 | 핵심 |
|---|---|---|
| MVP 데모 | **+2주** | 동작하는 프로토타입 |
| 실서비스 배포 | **+5주** | 디자이너 가입 + 유저 사용 |
| 분기 판단 | **+3~6개월** | 데이터 축적 후 방향 결정 |
| Route A 완료 | **+3~6개월 + 2주** | 자체 모델, API 비용 0 |
| Route B 완료 | **+3~6개월 + 3주** | 태그 + 벡터 최고 품질 |

---

## 11. 기술 스택

| 영역 | 기술 |
|---|---|
| 프론트엔드 | Next.js 16 (App Router) + React 19 + Tailwind v4 |
| 상태관리 | Zustand |
| 백엔드/DB | Supabase (PostgreSQL) |
| 이미지 저장 | Supabase Storage |
| **AI 태그 추출** | **GPT-4o mini** (저렴, 충분한 품질) |
| API | Next.js API Routes |
| 배포 | Vercel |
| 파인튜닝 (v2) | Google Colab + HuggingFace Trainer |

### 비용 최적화

- **Vision 모델**: GPT-4o mini ~$0.00015/이미지 → 월 1만 건 기준 ~$15
- **결과 캐싱**: 같은 이미지 해시는 재처리 안 함
- **요청 제한**: 유저당 일일 한도
- **자동 파인튜닝 전환**: 1만 장 축적 시 API 비용 0원

---

## 12. DB 스키마

```sql
-- 태그 마스터
create table tags (
  id bigserial primary key,
  category text not null,
  name text not null,
  slug text not null unique,
  weight int default 1,
  must_match boolean default false,
  created_at timestamptz default now()
);

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

-- 디자이너 포트폴리오
create table portfolios (
  id bigserial primary key,
  designer_id bigint references designers(id) on delete cascade,
  image_url text not null,
  description text,
  created_at timestamptz default now()
);

-- 포트폴리오 ↔ 태그 (M:N)
create table portfolio_tags (
  portfolio_id bigint references portfolios(id) on delete cascade,
  tag_id bigint references tags(id) on delete cascade,
  confidence real default 1.0,
  primary key (portfolio_id, tag_id)
);

-- 유저 업로드 분석 로그 (파인튜닝 학습 데이터로도 활용)
create table upload_analyses (
  id bigserial primary key,
  image_url text,
  tags jsonb not null,
  matched_designers jsonb,
  created_at timestamptz default now()
);
```

---

## 13. 프론트엔드 구조

```
src/
  lib/
    supabase.ts               ← 브라우저 클라이언트
    supabase-server.ts        ← 서버 클라이언트 (service role)
  app/api/
    analyze/route.ts          ← POST: 이미지 → Vision AI → 태그
    match/route.ts            ← POST: 태그 → DB 매칭
    designers/route.ts        ← GET: 디자이너 목록
  features/ai-match/
    AIMatchPanel.tsx          ← 메인 패널
    components/
      ImageUploader.tsx       ← 드래그앤드롭 + UX 힌트
      TagResult.tsx           ← 추출된 태그 표시/수정
      MatchedDesignerList.tsx ← 매칭 결과 (DesignerCard 재활용)
    store/matchStore.ts       ← Zustand
```

### 상태 관리

```typescript
interface MatchStore {
  step: 'upload' | 'tags' | 'results';
  imageFile: File | null;
  imagePreview: string | null;
  tags: Record<string, string | string[] | null>;
  ignoreMustMatch: boolean;
  matches: MatchResult[];
  isAnalyzing: boolean;
  isMatching: boolean;
  error: string | null;
}
```

---

## 14. 현재 프로젝트와의 연결점

- `DesignerCard` — 매칭 결과 리스트에 그대로 재활용
- `DesignerCarousel` — 매칭 결과 캐러셀로 표시 가능
- `KeywordFilter` — 태그 필터바 UI 참고/확장
- Discover 페이지 — AI 매칭 진입점 추가

---

## 15. 다음 단계

1. **Supabase 태그 테이블 생성 + 시드 데이터**
2. `/api/analyze` 구현 (GPT-4o mini)
3. `/api/match` 구현 (가중치 + mustMatch)
4. 프론트엔드 UI 구현
5. E2E 테스트

Phase 1 Day 1부터 순서대로 진행.

# Portfolio 시드 스크립트

Style 탭 검색 대상인 `portfolio` 테이블에 mock 데이터 + CLIP 임베딩을 채우는 1회성 CLI 모음.

## 파이프라인 (4단계)

```
1. fetch-pexels.ts        → Pexels API 로 키워드별 이미지 다운로드
                            tmp/portfolio-images/<slug>/<n>.jpg + _index.json
2. upload-storage.ts      → Supabase Storage 'portfolio' bucket 업로드
3. seed-portfolio-from-storage.ts
                          → gpt-4o-mini Vision 으로 title/description/keywords 생성 + INSERT
4. embed-all-clip.ts      → CLIP image encoder 로 image_embedding (768d) 채움
```

## 사전 준비

1. **마이그레이션 적용 (Supabase Dashboard SQL Editor)**
   - `20260510000001_enable_pgvector.sql`
   - `20260510000002_create_portfolio.sql`
   - `20260510000003_search_portfolios_function.sql`
   - `_apply_all_portfolio.sql` 통합본 OK
   - `_visual_embedding_clip_migration.sql` (vector 1536→768 + image_embedding 추가)
   - `_search_portfolios_clip_v2_cross_modal.sql` (RPC cross-modal)
   - `_drop_text_embedding_column.sql` (text embedding 컬럼 cleanup)

2. **`.env` 환경변수**
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...     # service_role
   OPENAI_API_KEY=sk-...             # gpt-4o-mini Vision 용 (시드 시에만)
   PEXELS_API_KEY=...                # 이미지 다운로드용
   ```

## 실행

```bash
# Stage 1 — Pexels 에서 키워드별 10장 다운로드
pnpm portfolio:fetch

# Stage 2 — Supabase Storage 'portfolio' 버킷 업로드
pnpm portfolio:upload

# Stage 3 — Vision LLM 으로 메타 생성 + INSERT (idempotent)
pnpm portfolio:seed-kw

# Stage 4 — CLIP image embedding 시드 (idempotent, ~3분)
pnpm portfolio:embed-clip
```

## 검증 스크립트

```bash
pnpm tsx --env-file=.env scripts/portfolio/_check-tables.ts        # 테이블/컬럼 + NULL 카운트
pnpm tsx --env-file=.env scripts/portfolio/_check-clip-sanity.ts   # CLIP 라이브러리 단위 검증
TRANSFORMERS_CACHE=tmp/transformers-cache pnpm tsx --env-file=.env scripts/portfolio/_check-search.ts       # 자연어 검색 회귀
TRANSFORMERS_CACHE=tmp/transformers-cache pnpm tsx --env-file=.env scripts/portfolio/_check-image-search.ts # 사진 검색 sanity
```

## 비용 (1회 풀 시드 기준)

| 항목 | 단가 | 추정 (360 rows) |
|---|---|---|
| Pexels API | 무료 | $0 |
| gpt-4o-mini Vision (detail=low) | ~$0.0001/img | ~$0.04 |
| CLIP 추론 (로컬 ONNX) | 무료 | $0 |
| **합계** | | **~$0.04** |

## 트러블슈팅

| 증상 | 원인 / 대응 |
|---|---|
| `429 Too Many Requests` (gpt-4o-mini) | OpenAI rate limit. `BATCH_CONCURRENCY` 5→2 |
| `42P01 relation "portfolio" does not exist` | 마이그레이션 미적용. dashboard SQL 실행 |
| `extension "vector" not available` | Supabase 대시보드 → Database → Extensions → vector enable |
| `Could not choose the best candidate function` | RPC overload 충돌. `_search_portfolios_clip*.sql` 의 DROP FUNCTION 부분 재실행 |
| CLIP 모델 다운로드 ~300MB 가 느림 | 첫 실행만 발생. `tmp/transformers-cache/` 캐시 후 재사용 |

## 주의

- `seed-portfolio-from-storage.ts` 의 OpenAI Vision 호출은 **시드 단계만** — 런타임 검색은 OpenAI 의존 0
- `embed-all-clip.ts` 의 CLIP 추론은 **로컬 ONNX** (`@xenova/transformers`) — API key 불필요
- service_role 키는 절대 클라이언트에 노출 금지. `.env` 에만

# Portfolio 시드 스크립트

Style 탭 검색 대상인 `portfolio` 테이블에 mock 메타데이터 + 임베딩을 채워넣는 1회성 CLI.

## 사전 준비

1. **마이그레이션 적용** — Supabase 에 다음 3개가 적용되어 있어야 함
   - `20260510000001_enable_pgvector.sql`
   - `20260510000002_create_portfolio.sql`
   - `20260510000003_search_portfolios_function.sql`

   Supabase CLI 사용 시:
   ```bash
   supabase db push
   ```
   또는 대시보드 SQL Editor 에서 순서대로 실행.

2. **`.env` 환경변수**
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...     # service_role (인덱싱 전용)
   OPENAI_API_KEY=sk-...
   ```

## 실행

```bash
# 처음 실행 — 모든 디자이너의 portfolio_images 를 portfolio 테이블로 마이그레이션 + LLM 메타 + 임베딩
pnpm portfolio:seed

# 기존 portfolio 전부 삭제 후 재생성 (예: LLM 모델/프롬프트 변경)
pnpm portfolio:reset
```

`pnpm portfolio:seed`는 **idempotent** — 이미 있는 `(designer_id, image_path)` 조합은 skip. 디자이너가 추가되거나 portfolio_images 가 늘어났을 때 재실행 안전.

## 동작

```
1) Supabase: designer_profile + designer_keyword + keyword + salon fetch
2) 각 designer.portfolio_images[] 평탄화 → "할 일" 목록 생성
3) 이미 portfolio 에 있는 row 는 skip
4) BATCH_CONCURRENCY(5) 동시성으로 각 job 실행:
   a) gpt-4o-mini → { title, description, keywords[] } 생성
   b) text-embedding-3-large (1536d) 임베딩 생성
5) 100 row 씩 chunk INSERT
6) trigger 가 search_doc(tsvector) 자동 갱신
```

## 비용 (1회 풀 시드 추정)

| 항목 | 단가 | 추정 |
|---|---|---|
| LLM (gpt-4o-mini, ~700 tok/row) | $0.15/1M in + $0.60/1M out | ~$0.15 (디자이너 150명 × 평균 5장 = 750 rows) |
| 임베딩 (text-embedding-3-large, ~150 tok/row) | $0.13/1M | ~$0.015 |
| **합계** | | **~$0.20** |

## 트러블슈팅

| 증상 | 원인 / 대응 |
|---|---|
| `429 Too Many Requests` | OpenAI rate limit. `BATCH_CONCURRENCY` 를 5 → 2 로 낮추고 재시도 |
| `42P01 relation "portfolio" does not exist` | 마이그레이션 미적용. `supabase db push` 또는 대시보드에서 SQL 실행 |
| `extension "vector" not available` | pgvector 미활성. Supabase 대시보드 → Database → Extensions → vector enable |
| 일부 row 만 `failed` | LLM JSON 파싱 실패. 그 row 만 skip 하고 끝까지 진행. 재실행으로 보강 가능 (idempotent) |
| 같은 디자이너의 5장 portfolio 가 모두 비슷한 title | LLM temperature 0.7 인데도 단조로움. 프롬프트의 "Vary..." 지시 강화 또는 model 을 gpt-4o 로 일시 변경 |

## 주의

- **운영 DB 에 직접 쓰는 스크립트** — staging/dev 에서 먼저 검증
- service_role 키는 절대 클라이언트에 노출 금지. `.env` 에만
- 시드 1회 비용은 작지만 `--reset` 반복 호출은 비용 누적
- LLM 출력은 검증 가벼움 — 부적절한 description 이 섞일 수 있음. PoC 단계 허용

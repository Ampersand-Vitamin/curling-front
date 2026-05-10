# Meilisearch — Style 탭 자연어 검색 (로컬 PoC)

Style 탭(`/style`)의 검색 백엔드. BM25 + OpenAI auto-embedding 하이브리드.

## 사전 준비

`.env`에 다음 변수들을 추가합니다 (이 프로젝트는 `.env`로 통일되어 있습니다 — 둘 다 gitignore).

```
# Meilisearch — Style 탭 자연어 검색 (로컬 PoC)
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=<32+ char 랜덤 문자열>

# OpenAI auto-embedding (text-embedding-3-large)
OPENAI_API_KEY=<sk-...>

# (이미 있을 가능성 높음)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`MEILI_MASTER_KEY` 생성 예: `openssl rand -hex 32`

## 실행 절차 (첫 셋업)

```bash
# 1. Meilisearch 컨테이너 기동 (포트 7700, 볼륨 docker/meilisearch/data.ms/)
pnpm meili:up

# 2. 헬스 체크
pnpm meili:health

# 3. 인덱스 + settings (searchable / filterable / embedders) 적용
pnpm meili:setup

# 4. Supabase → Meilisearch 풀 인덱싱 (auto-embedding 호출 — 분 단위 소요)
pnpm meili:index

# 5. Style 탭 확인
pnpm dev
# → http://localhost:3000/style
```

## 자주 쓰는 명령

| 명령 | 동작 |
|---|---|
| `pnpm meili:up` | docker compose up -d (백그라운드) |
| `pnpm meili:down` | 컨테이너 정지 (데이터는 보존) |
| `pnpm meili:logs` | 컨테이너 로그 follow |
| `pnpm meili:health` | 인덱스/embedder 상태 점검 |
| `pnpm meili:setup` | 인덱스 settings 재적용 (idempotent) |
| `pnpm meili:index` | 풀 인덱싱 (재실행 시 같은 id는 upsert) |
| `pnpm meili:reset` | 인덱스 삭제 + setup 재실행. 이후 `meili:index` 직접 실행 |

## 검증 (curl)

```bash
# 헬스
curl http://localhost:7700/health

# 인덱스 stats (master key 필요)
curl -H "Authorization: Bearer $MEILI_MASTER_KEY" \
     http://localhost:7700/indexes/designers/stats | jq

# embedder 등록 확인
curl -H "Authorization: Bearer $MEILI_MASTER_KEY" \
     http://localhost:7700/indexes/designers/settings | jq '.embedders'

# 검색 (서버 SDK 거치지 않고 직접)
curl -X POST -H "Authorization: Bearer $MEILI_MASTER_KEY" \
     -H "Content-Type: application/json" \
     -d '{"q":"balayage","limit":5,"hybrid":{"embedder":"openai_3_large","semanticRatio":0.5}}' \
     http://localhost:7700/indexes/designers/search | jq '.hits[].displayName'
```

## 트러블슈팅

- **`MEILI_MASTER_KEY required`** — docker-compose 가 `.env` 의 `MEILI_MASTER_KEY` 를 읽지 못함. `pnpm meili:up` 의 `--env-file .env` 인자 확인.
- **임베딩이 0건** — `pnpm meili:setup` 이 OPENAI_API_KEY 검증을 통과하지 못한 채로 settings 만 일부 적용된 경우. `pnpm meili:reset` 후 처음부터.
- **인덱싱이 멈춘 듯 보임** — text-embedding-3-large 호출이 batch 50건당 10~20초씩 걸림. 150건이면 1~2분. 로그(`pnpm meili:logs`)에 임베딩 호출 흐름 확인 가능.
- **`429` from OpenAI** — 동시 요청 너무 많음. 현재 batch=50 + waitForTask 직렬화로 보통 회피되지만, 더 큰 데이터셋에서 발생하면 batch 를 25 로 낮출 것.

## 현재 단계의 한계

- 호스팅: 로컬 Docker 만. 운영 호스팅(Cloud / Fly.io)은 후속 라운드.
- 동기화: 1회성 풀 인덱싱. Admin 흐름이 추가되면 dual-write hook 필요.
- 인덱스 단위: 디자이너 1명 = 1 도큐먼트. 포트폴리오 단위 인덱싱은 schema 변경 + 별도 인덱스 필요.
- search-only key: 미발급. 모든 호출이 server-side(Server Action)로만 일어나므로 master key 만 사용.

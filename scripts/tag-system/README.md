# 헤어 이미지 자동 태깅 시스템

헤어 이미지를 수집하고, Vision AI로 자동 태그를 붙이고, 매칭 로직을 테스트하는 스크립트 모음.

## 실행 순서

### 1. API 키 준비

| 서비스 | 용도 | 발급 |
|---|---|---|
| Pexels | 무료 이미지 수집 | https://www.pexels.com/api/ |
| Anthropic | Claude Vision 태깅 | https://console.anthropic.com/ |
| OpenAI (선택) | GPT-4o Vision 태깅 | https://platform.openai.com/api-keys |

### 2. 이미지 수집

```bash
PEXELS_API_KEY=xxx npx tsx scripts/tag-system/fetch-images.ts
```

- Pexels에서 헤어 관련 이미지 ~30장 다운로드
- `sample-data/images/` 에 저장
- `sample-data/image-manifest.json` 에 출처 기록

### 3. 자동 태깅

```bash
# Claude 사용 (기본)
ANTHROPIC_API_KEY=xxx npx tsx scripts/tag-system/tag-images.ts

# 또는 OpenAI 사용
OPENAI_API_KEY=xxx VISION_PROVIDER=openai npx tsx scripts/tag-system/tag-images.ts
```

- 각 이미지를 Vision AI에 보내서 태그 추출
- `sample-data/tagged-results.json` 에 결과 저장

### 4. 매칭 테스트

```bash
npx tsx scripts/tag-system/match.ts
```

- 첫 번째 이미지를 "유저 업로드"로 가정
- 나머지를 "디자이너 포트폴리오"로 가정
- 가중치 기반 매칭 점수 계산 및 정렬

## 파일 구조

```
scripts/tag-system/
  taxonomy.ts       ← 태그 체계 정의 (카테고리, 가중치, 필수 여부)
  fetch-images.ts   ← Pexels에서 이미지 수집
  tag-images.ts     ← Vision AI 자동 태깅
  match.ts          ← 매칭 로직 + 데모

sample-data/
  images/           ← 다운로드된 이미지
  image-manifest.json    ← 이미지 출처 정보
  tagged-results.json    ← 태깅 결과
  match-demo.json        ← 매칭 데모 결과
```

## 태그 체계 커스터마이징

`taxonomy.ts`에서 수정:

- **태그 추가/삭제**: `tags` 배열 수정
- **가중치 변경**: `weight` 값 조정 (높을수록 매칭에서 중요)
- **필수 매칭**: `mustMatch: true` → 이 카테고리가 불일치하면 매칭에서 제외

# CLAUDE.md — Curling Front

## Project

- Next.js 16 (App Router) + React 19 + Tailwind v4 + Zustand
- Package manager: pnpm
- Testing: Vitest + Playwright
- Storybook 10 for component docs
- i18n: `src/messages/` (ko, en)

## Directory Structure

```
src/
  app/          # App Router pages & layouts
  components/   # 공통 UI 컴포넌트
  features/     # 도메인별 기능 모듈
  lib/          # 유틸리티, 헬퍼
  store/        # Zustand stores
  stories/      # Storybook stories
  types/        # 공유 타입 정의
```

## Git Workflow

- **Main branch**: `main` (protected)
- **Branch naming**: `feat/<feature>`, `fix/<issue>`, `chore/<task>`
- **PR 필수**: main에 직접 push 금지. 항상 PR을 통해 merge
- **Merge strategy**: Squash merge (PR 단위로 깔끔한 히스토리)

### Commit Convention

```
<type>: <description>

type: feat | fix | chore | refactor | style | docs | test
```

- 커밋 메시지는 **한글 또는 영어** (팀원 재량)
- 예시: `feat: 디스커버 페이지 맵뷰 추가`, `fix: 캐러셀 스크롤 버그 수정`

### PR 규칙

- PR 제목은 커밋 컨벤션과 동일한 포맷
- PR 본문에 변경 사항 요약 포함
- 리뷰어 1명 이상 승인 후 merge

## Design System (필수)

- 모든 UI는 **디자인 시스템 기반**으로 구현. 임의의 색상/간격/폰트 사용 금지
- 디자인 토큰(색상, 타이포, 간격, 라운딩 등)이 정의되면 반드시 토큰을 참조
- 하드코딩된 값 (`#FF0000`, `16px`, `8px`) 대신 토큰 변수 사용
- 새 컴포넌트 작성 시 기존 디자인 시스템 컴포넌트 재사용 우선
- Figma 디자인과 1:1 대응되는 토큰 체계를 따를 것
- 디자인 토큰 미정의 상태에서는 시맨틱 네이밍으로 placeholder 변수를 두고, 나중에 토큰으로 교체할 수 있게 작성

## Coding Conventions

- TypeScript strict mode
- 컴포넌트: PascalCase (`ViewToggle.tsx`)
- 유틸/훅: camelCase (`useMap.ts`)
- CSS: Tailwind 유틸리티 클래스 우선. 커스텀 CSS 최소화
- `"use client"` 는 필요한 컴포넌트에만 명시

## Commands

```bash
pnpm dev           # 개발 서버
pnpm build         # 프로덕션 빌드
pnpm lint          # ESLint
pnpm storybook     # Storybook 실행
```

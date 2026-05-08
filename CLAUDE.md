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

## Git Workflow (절대 규칙)

- **Main branch**: `main` (protected)
- **절대 main에 직접 push 하지 않는다.** 반드시 브랜치를 생성하고 PR을 올린다
- **Branch naming**: `feat/<feature>`, `fix/<issue>`, `chore/<task>`
- **PR 필수**: 항상 PR을 통해 merge
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

## Design System (필수 — 절대 규칙)

- **반드시 디자인 시스템에 정의된 색상과 폰트만 사용한다.** 임의의 색상/폰트 절대 금지
- 디자인 토큰(색상, 타이포, 간격, 라운딩 등)이 정의되면 반드시 토큰을 참조
- 하드코딩된 값 (`#FF0000`, `16px`, `8px`) 대신 토큰 변수 사용
- 새 컴포넌트 작성 시 기존 디자인 시스템 컴포넌트 재사용 우선
- Figma 디자인과 1:1 대응되는 토큰 체계를 따를 것
- 디자인 토큰 미정의 상태에서는 시맨틱 네이밍으로 placeholder 변수를 두고, 나중에 토큰으로 교체할 수 있게 작성

### Color Tokens (`src/app/globals.css`)

| 카테고리 | 스텝 | 용도 |
|---------|------|-----|
| `surface-*` | white, 50–950 | 배경, 텍스트 (warm grey) |
| `primary-*` | 50–900 | 브랜드 메인 컬러 (브라운/웜) |
| `secondary-*` | 50–900 | 보조 컬러 (테라코타/베이지) |
| `accent-*` | 50–900 | 강조 컬러 (블루 계열) |
| `alert-*` | 100, 500 | 알림/경고 (옐로우-그린) |

### Typography Tokens (`src/styles/typography.css`)

| 클래스 | 사이즈/행간 | 굵기 | 자간 |
|--------|-----------|------|------|
| `typo-h1` | 40/52 | SemiBold (600) | -2% |
| `typo-h2` | 32/40 | SemiBold (600) | -2% |
| `typo-h3` | 24/32 | Medium (500) | -1.5% |
| `typo-h4` | 20/28 | Medium (500) | -1.5% |
| `typo-h5` | 18/26 | Medium (500) | -1% |
| `typo-h6` | 16/24 | Medium (500) | -1% |
| `typo-body1` | 16/24 | Regular (400) | -1% |
| `typo-body2` | 14/20 | Regular (400) | -1% |
| `typo-caption` | 12/16 | Regular (400) | -0.5% |
| `typo-caption2` | 11/13 | Regular (400) | -0.5% |
| `typo-button` | 14/16 | Medium (500) | -1.5% |

## 작업 규칙

- **작업 후 `pnpm build` 검증을 실행하지 않는다.** 빌드 체크는 사용자가 직접 수행한다.

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

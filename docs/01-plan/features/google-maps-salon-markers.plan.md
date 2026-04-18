# Google Maps 살롱 마커 표시

> **Created**: 2026-04-18
> **Status**: Draft
> **Feature**: google-maps-salon-markers
> **Phase**: Plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | Discover 탭의 MapView가 placeholder 상태로, 사용자가 살롱 위치를 시각적으로 탐색할 수 없다 |
| **Solution** | Google Maps API를 연동하고 DB의 살롱 좌표를 마커로 표시한다 |
| **기능 UX 효과** | 지도에서 살롱 위치를 한눈에 파악하여 근처 살롱을 직관적으로 탐색 가능 |
| **핵심 가치** | 위치 기반 탐색이라는 Discover 탭의 핵심 사용자 경험 실현 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | Discover 탭의 핵심인 지도 기반 살롱 탐색을 실현하기 위해 |
| **WHO** | 컬리 헤어 시술을 받고 싶은 고객 (근처 살롱 탐색) |
| **RISK** | Google Maps API 키 노출, 지도 로딩 성능, API 비용 |
| **SUCCESS** | 지도가 렌더링되고 Mock 살롱 위치에 마커가 정상 표시됨 |
| **SCOPE** | Google Maps 렌더링 + 살롱 마커 표시 (클릭/클러스터링 제외) |

---

## 1. 요구사항

### 1.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-01 | MapView placeholder를 Google Maps 인터랙티브 지도로 교체 | Must |
| FR-02 | Mock 살롱 데이터의 latitude/longitude 좌표에 마커 표시 | Must |
| FR-03 | 지도 초기 중심 좌표 및 줌 레벨 설정 | Must |
| FR-04 | 지도 줌/팬 인터랙션 지원 | Must |

### 1.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|---------|------|
| NFR-01 | 지도 초기 로딩 시간 | 3초 이내 (LTE 환경) |
| NFR-02 | API 키 보안 | 환경변수로 관리, 클라이언트 노출 최소화 |
| NFR-03 | 반응형 레이아웃 | 기존 MapView 영역(전체 화면) 유지 |

### 1.3 범위 제외 (Out of Scope)

- 마커 클릭 시 상세 정보 표시 (InfoWindow)
- 마커 클러스터링
- 현재 위치 기반 지도 중심 설정 (Geolocation API)
- 실제 백엔드 API 연동 (Mock 데이터 우선)
- 리스트 뷰 모드 전환 시 지도 상태 유지

---

## 2. 데이터 모델

### 2.1 Mock 살롱 데이터 구조

ERD의 Salon 테이블 기반으로 Mock 데이터를 정의한다.

```typescript
interface Salon {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
}
```

### 2.2 Mock 데이터 예시

뉴욕 맨해튼 기준 5~8개의 Mock 살롱 데이터를 준비한다.
(Curling은 글로벌 컬리헤어 플랫폼이므로 영문 기반)

---

## 3. 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 지도 라이브러리 | `@vis.gl/react-google-maps` | Google 공식 React 래퍼, React 19 호환, 경량 |
| API | Google Maps JavaScript API | 글로벌 서비스 대응, 풍부한 커스터마이징 |
| 환경변수 | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Next.js 클라이언트 환경변수 컨벤션 |

### 3.1 패키지 설치

```bash
pnpm add @vis.gl/react-google-maps
```

### 3.2 Google Maps API 키 설정

1. Google Cloud Console에서 Maps JavaScript API 활성화
2. API 키 생성 후 HTTP 리퍼러 제한 설정
3. `.env.local`에 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...` 추가
4. `.env.local`은 `.gitignore`에 포함되어 있으므로 커밋되지 않음

---

## 4. 구현 계획

### 4.1 파일 구조

```
src/
  app/discover/
    components/
      MapView.tsx          # Google Maps 연동으로 리팩터링
    data/
      mock-salons.ts       # Mock 살롱 데이터
  types/
    salon.ts               # Salon 타입 정의
```

### 4.2 구현 순서

| 순서 | 작업 | 파일 |
|------|------|------|
| 1 | Salon 타입 정의 | `src/types/salon.ts` |
| 2 | Mock 살롱 데이터 작성 | `src/app/discover/data/mock-salons.ts` |
| 3 | MapView를 Google Maps로 교체 | `src/app/discover/components/MapView.tsx` |
| 4 | 환경변수 설정 (.env.local) | `.env.local` |

### 4.3 MapView 컴포넌트 설계

```
MapView (use client)
├── APIProvider (API 키 주입)
│   └── Map (지도 렌더링, 중심 좌표/줌 설정)
│       └── Marker[] (살롱 좌표별 마커)
```

- `APIProvider`: Google Maps API 로드 담당
- `Map`: 지도 인스턴스 렌더링 (center, zoom props)
- `AdvancedMarker` 또는 `Marker`: 각 살롱 좌표에 마커 배치

---

## 5. 성공 기준

| ID | 기준 | 검증 방법 |
|----|------|----------|
| SC-01 | Google Maps가 MapView 영역에 정상 렌더링됨 | 브라우저에서 지도 확인 |
| SC-02 | Mock 살롱 위치에 마커가 표시됨 | 마커 개수 = Mock 데이터 개수 |
| SC-03 | 지도 줌/팬이 정상 동작함 | 수동 인터랙션 테스트 |
| SC-04 | 기존 ViewToggle, PullBar와 레이아웃 충돌 없음 | Discover 페이지 전체 확인 |
| SC-05 | API 키가 소스 코드에 하드코딩되지 않음 | 코드 리뷰 |

---

## 6. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Google Maps API 키 미발급 | 지도 로딩 불가 | 사용자에게 발급 가이드 제공, 키 없을 시 fallback UI |
| API 호출 비용 | 월 과금 | Maps JavaScript API는 월 28,000 로드 무료, 개발 단계에서 충분 |
| `@vis.gl/react-google-maps`의 React 19 호환성 | 빌드 실패 | 최신 버전 사용, 호환 안 되면 `@googlemaps/js-api-loader` 대안 |

---

## 7. 의존성

| 항목 | 상태 | 비고 |
|------|------|------|
| Google Cloud 프로젝트 | 사용자 준비 필요 | API 키 발급 |
| ERD Salon 테이블 정의 | 완료 | `docs/01-plan/erd.md` |
| MapView placeholder | 완료 | 현재 빈 컴포넌트 상태 |
| discover/page.tsx 레이아웃 | 완료 | MapView를 전체 화면으로 렌더링 |

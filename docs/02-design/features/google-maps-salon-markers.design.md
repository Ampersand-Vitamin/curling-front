# Google Maps 살롱 마커 표시 — Design

> **Created**: 2026-04-18
> **Status**: Draft
> **Feature**: google-maps-salon-markers
> **Phase**: Design
> **Architecture**: Option C — Pragmatic Balance

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

## 1. Overview

Discover 탭의 MapView placeholder를 Google Maps 인터랙티브 지도로 교체하고, Mock 살롱 좌표에 마커를 표시한다.

### 1.1 선택된 아키텍처: Option C — Pragmatic Balance

- **타입**(`Salon`)과 **Mock 데이터**는 별도 파일로 분리하여 재사용성 확보
- **MapView**는 하나의 컴포넌트로 유지 (APIProvider + Map + Marker 통합)
- 현재 범위(마커 표시만)에서 과도한 분리 없이 실용적 구조

---

## 2. File Structure

```
src/
  types/
    salon.ts                           # [신규] Salon 인터페이스
  app/discover/
    data/
      mock-salons.ts                   # [신규] Mock 살롱 데이터
    components/
      MapView.tsx                      # [수정] Google Maps 연동
```

### 2.1 File Responsibilities

| 파일 | 책임 | 변경 |
|------|------|------|
| `src/types/salon.ts` | Salon 타입 정의 (ERD 기반) | 신규 |
| `src/app/discover/data/mock-salons.ts` | 뉴욕 기준 Mock 살롱 6개 | 신규 |
| `src/app/discover/components/MapView.tsx` | Google Maps 렌더링 + 마커 배치 | 수정 |

---

## 3. Data Model

### 3.1 Salon Type

ERD `Salon` 테이블에서 MapView에 필요한 필드만 추출한 인터페이스.

```typescript
// src/types/salon.ts

export interface Salon {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
}
```

> 향후 API 연동 시 ERD의 `languages`, `specialty`, `is_featured` 등 확장 가능

### 3.2 Mock Data

뉴욕 맨해튼 기반 6개 살롱. 실제 컬리헤어 살롱 영역(Harlem, Brooklyn, Midtown 등)을 참고한 좌표.

```typescript
// src/app/discover/data/mock-salons.ts

import type { Salon } from "@/types/salon";

export const MOCK_SALONS: Salon[] = [
  {
    id: "salon-1",
    name: "CurlBar NYC",
    address: "123 W 125th St, New York, NY",
    latitude: 40.8088,
    longitude: -73.9502,
  },
  {
    id: "salon-2",
    name: "Natural Hair Haven",
    address: "456 Fulton St, Brooklyn, NY",
    latitude: 40.6872,
    longitude: -73.9777,
  },
  // ... 4개 추가 (총 6개)
];

export const DEFAULT_CENTER = { lat: 40.7580, lng: -73.9855 }; // Times Square
export const DEFAULT_ZOOM = 12;
```

---

## 4. Component Design

### 4.1 MapView Component

```
MapView ("use client")
│
├── API 키 체크
│   ├── 키 없음 → Fallback UI (기존 placeholder 유사)
│   └── 키 있음 ↓
│
├── <APIProvider apiKey={...}>
│   └── <Map
│   │     defaultCenter={DEFAULT_CENTER}
│   │     defaultZoom={DEFAULT_ZOOM}
│   │     mapId="discover-map"
│   │     style={{ width: "100%", height: "100%" }}
│   │     disableDefaultUI={true}
│   │     zoomControl={true}
│   │   >
│   │     {MOCK_SALONS.map(salon =>
│   │       <AdvancedMarker
│   │         key={salon.id}
│   │         position={{ lat: salon.latitude, lng: salon.longitude }}
│   │         title={salon.name}
│   │       />
│   │     )}
│   └── </Map>
└── </APIProvider>
```

### 4.2 Props / State

| 항목 | 타입 | 설명 |
|------|------|------|
| Props | 없음 | 현재 단계에서는 self-contained |
| 내부 상태 | 없음 | Mock 데이터 직접 import, 지도 상태는 Google Maps 내부 관리 |

### 4.3 API Key Handling

```typescript
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  return (
    <div className="w-full h-full bg-surface-200 flex items-center justify-center">
      <p className="text-surface-500 typo-body2">
        Google Maps API key is not configured
      </p>
    </div>
  );
}
```

- 환경변수 없을 시 기존 placeholder와 유사한 fallback UI 표시
- 디자인 토큰 `surface-200`, `surface-500` 사용

### 4.4 Map Configuration

| 설정 | 값 | 이유 |
|------|-----|------|
| `defaultCenter` | Times Square (40.7580, -73.9855) | 뉴욕 중심부, Mock 살롱들 포괄 |
| `defaultZoom` | 12 | 맨해튼 + 브루클린 범위 커버 |
| `disableDefaultUI` | true | 모바일 퍼스트, 깔끔한 UI |
| `zoomControl` | true | 줌 컨트롤만 표시 |
| `mapId` | "discover-map" | Cloud 기반 맵 스타일링 대비 |

### 4.5 Marker Configuration

- `AdvancedMarker` 사용 (Google Maps 최신 권장 API)
- 기본 핀 마커 사용 (커스텀 마커 아이콘은 Out of Scope)
- `title` prop으로 hover 시 살롱명 표시

---

## 5. Dependencies

### 5.1 패키지

```bash
pnpm add @vis.gl/react-google-maps
```

### 5.2 환경변수

```env
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 5.3 Google Cloud Console 설정

1. Maps JavaScript API 활성화
2. API 키 생성
3. HTTP 리퍼러 제한: `localhost:*`, 배포 도메인

---

## 6. Layout Integration

### 6.1 기존 Discover 페이지 구조

```
DiscoverPage (page.tsx)
├── ViewToggle (absolute, z-10, top-14)
├── MapView (absolute, inset-0)       ← 이 컴포넌트만 수정
└── PullBar (relative, z-10, mt-auto)
```

### 6.2 영향 범위

- `MapView.tsx`만 수정. `page.tsx`, `ViewToggle`, `PullBar`는 변경 없음
- MapView는 `absolute inset-0`으로 전체 화면 차지 → Google Maps `style={{ width: "100%", height: "100%" }}`로 동일 영역 커버
- z-index 충돌 없음: ViewToggle(z-10), PullBar(z-10)은 MapView 위에 위치

---

## 7. Error Handling

| 시나리오 | 처리 |
|---------|------|
| API 키 미설정 | Fallback UI 표시 (§4.3) |
| API 키 유효하지 않음 | Google Maps 자체 에러 표시 (라이브러리 기본 동작) |
| 네트워크 오류 | Google Maps SDK 자체 재시도 로직에 의존 |

---

## 8. Test Plan

| ID | 시나리오 | 기대 결과 | 검증 방법 |
|----|---------|----------|----------|
| T-01 | 유효한 API 키로 페이지 로드 | Google Maps 렌더링됨 | 브라우저 확인 |
| T-02 | Mock 살롱 마커 표시 | 6개 마커가 지도에 표시됨 | 시각적 확인 |
| T-03 | 줌 인/아웃 | 지도 줌 정상 동작 | 수동 테스트 |
| T-04 | 팬(드래그) | 지도 이동 정상 동작 | 수동 테스트 |
| T-05 | API 키 없이 로드 | Fallback UI 표시 | 환경변수 제거 후 확인 |
| T-06 | ViewToggle/PullBar 레이아웃 | 기존 UI 요소와 충돌 없음 | 시각적 확인 |

---

## 9. Security Considerations

| 항목 | 대응 |
|------|------|
| API 키 노출 | `NEXT_PUBLIC_*` 환경변수 사용 (클라이언트 노출은 불가피하나, HTTP 리퍼러 제한으로 악용 방지) |
| 키 커밋 방지 | `.env.local`은 `.gitignore`에 포함 |
| API 사용량 | Google Cloud Console에서 일일/월별 한도 설정 권장 |

---

## 10. Future Considerations

이번 범위에서 제외되었지만 다음 반복에서 고려할 항목:

| 항목 | 예상 접근 |
|------|----------|
| 마커 클릭 InfoWindow | `AdvancedMarker` 자식으로 커스텀 컴포넌트 렌더링 |
| 마커 클러스터링 | `@googlemaps/markerclusterer` 패키지 |
| 현재 위치 중심 | Geolocation API + `Map` center 동적 변경 |
| 커스텀 마커 아이콘 | `AdvancedMarker` 자식으로 디자인 토큰 기반 SVG |
| API 연동 | Mock import를 fetch + SWR/React Query로 교체 |

---

## 11. Implementation Guide

### 11.1 구현 순서

| Step | 작업 | 파일 | 예상 라인 |
|------|------|------|----------|
| 1 | Salon 타입 정의 | `src/types/salon.ts` | ~10 |
| 2 | Mock 살롱 데이터 작성 | `src/app/discover/data/mock-salons.ts` | ~45 |
| 3 | MapView Google Maps 연동 | `src/app/discover/components/MapView.tsx` | ~40 |
| 4 | .env.local 설정 | `.env.local` | ~2 |

### 11.2 핵심 의사결정

| 결정 | 선택 | 근거 |
|------|------|------|
| 지도 라이브러리 | `@vis.gl/react-google-maps` | Google 공식, React 19 호환 |
| 마커 타입 | `AdvancedMarker` | Google 최신 권장, 커스텀 확장 용이 |
| UI 컨트롤 | 기본 UI 비활성화 + 줌만 표시 | 모바일 퍼스트, 깔끔한 UX |
| Fallback | API 키 없을 시 placeholder | 개발 편의성 + 에러 방지 |

### 11.3 Session Guide

#### Module Map

| Module | 파일 | 의존성 |
|--------|------|--------|
| module-1: types | `src/types/salon.ts` | 없음 |
| module-2: data | `src/app/discover/data/mock-salons.ts` | module-1 |
| module-3: map | `src/app/discover/components/MapView.tsx` | module-1, module-2 |

#### Recommended Session Plan

이 기능은 단일 세션(~30분)에 완료 가능한 소규모 작업입니다.

```
Session 1 (전체): module-1 → module-2 → module-3
  /pdca do google-maps-salon-markers
```

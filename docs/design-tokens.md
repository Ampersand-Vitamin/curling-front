# Curling Design Tokens Guide

> Figma 디자인 토큰을 Tailwind CSS v4로 매핑한 사용 가이드
>
> **Figma**: Batch1_Design (Color System + Typography)
> **Source**: `src/app/globals.css` (Color), `src/styles/typography.css` (Typography)

---

## 1. Color Tokens

Tailwind 클래스에서 `{속성}-{그룹}-{스케일}` 형태로 사용합니다.

### 1.1 Color Palette

#### Primary — 브랜드 메인 컬러 (핑크/레드 계열)

| Scale | Hex | Tailwind Class | 용도 |
|-------|-----|----------------|------|
| 50 | `#faf2f5` | `bg-primary-50` | 배경 (hover, subtle) |
| 200 | `#f8dae2` | `bg-primary-200` | 배경 (light) |
| 300 | `#fcb2c7` | `bg-primary-300` | 배경 (medium) |
| 400 | `#ff80a4` | `text-primary-400` | 아이콘, 보조 강조 |
| 600 | `#ed1250` | `bg-primary-600` | **CTA 버튼, 주요 강조** |
| 700 | `#c20138` | `bg-primary-700` | hover 상태, 진한 강조 |

#### Secondary — 보조 컬러 (베이지/웜 계열)

| Scale | Hex | Tailwind Class | 용도 |
|-------|-----|----------------|------|
| 50 | `#f9f5f1` | `bg-secondary-50` | 태그/뱃지 배경 |
| 200 | `#f7e5d5` | `bg-secondary-200` | 카드 배경 (warm) |
| 300 | `#fbc99d` | `bg-secondary-300` | 강조 배경 |
| 400 | `#ebae79` | `text-secondary-400` | 아이콘 |
| 500 | `#da904e` | `text-secondary-500` | 텍스트 강조 |
| 600 | `#b16b2d` | `text-secondary-600` | 태그/뱃지 텍스트 |

#### Surface — 중립 컬러 (Figma: warm grey)

| Scale | Hex | Tailwind Class | 용도 |
|-------|-----|----------------|------|
| 50 | `#fcfbf8` | `bg-surface-50` | **페이지 배경** |
| 100 | `#f7f6f3` | `bg-surface-100` | 섹션 배경 |
| 200 | `#f0efec` | `border-surface-200` | **카드 테두리, 구분선** |
| 300 | `#e0dfdd` | `border-surface-300` | 입력 필드 테두리 |
| 400 | `#b8b7b5` | `text-surface-400` | placeholder, 비활성 |
| 500 | `#8c8b8a` | `text-surface-500` | **보조 텍스트** |
| 600 | `#696867` | `text-surface-600` | 부가 정보 |
| 700 | `#545353` | `text-surface-700` | **본문 텍스트** |
| 800 | `#3b3a3a` | `text-surface-800` | 소제목 |
| 900 | `#292828` | `text-surface-900` | 제목 |
| 950 | `#171717` | `text-surface-950` | **최진한 텍스트** |

#### Accent — 강조 컬러 (네이비/블루 계열)

| Scale | Hex | Tailwind Class | 용도 |
|-------|-----|----------------|------|
| 100 | `#f1f5f9` | `bg-accent-100` | 정보 배경 |
| 300 | `#cbd5e1` | `border-accent-300` | 테두리 |
| 400 | `#94a3b8` | `text-accent-400` | 보조 아이콘 |
| 500 | `#657b9b` | `text-accent-500` | 링크 텍스트 |
| 700 | `#2a3f5f` | `text-accent-700` | 강조 텍스트 |
| 900 | `#152343` | `text-accent-900` | **페이지 제목 (dark)** |

#### Success — 성공/긍정 상태 (그린 계열)

| Scale | Hex | Tailwind Class | 용도 |
|-------|-----|----------------|------|
| 100 | `#e6f2ca` | `bg-success-100` | 성공 배경 |
| 500 | `#6ebd44` | `text-success-500` | 성공 텍스트, 아이콘 |

### 1.2 Color 사용 가능한 속성

```tsx
// 배경색
<div className="bg-primary-600" />

// 글자색
<p className="text-surface-950" />

// 테두리
<div className="border border-surface-200" />

// hover / focus / active 상태
<button className="bg-primary-600 hover:bg-primary-700 active:bg-primary-700" />

// ring (포커스 링)
<input className="ring-primary-600 focus:ring-2" />

// divide (구분선)
<div className="divide-y divide-surface-200" />
```

---

## 2. Typography Tokens

`text-{스타일}` 하나로 `font-size`, `font-weight`, `line-height`, `letter-spacing`이 동시에 적용됩니다.

### 2.1 Typography Scale

| Class | Size | Weight | Line Height | Letter Spacing | 용도 |
|-------|------|--------|-------------|----------------|------|
| `text-h1` | 40px | 600 (SemiBold) | 52px | -0.8px | 히어로 제목 |
| `text-h2` | 32px | 600 (SemiBold) | 40px | -0.64px | 페이지 제목 |
| `text-h3` | 24px | 500 (Medium) | 32px | -0.36px | 섹션 제목 |
| `text-h4` | 20px | 500 (Medium) | 28px | -0.3px | 카드 제목 (큰) |
| `text-h5` | 18px | 500 (Medium) | 26px | -0.18px | 카드 제목 |
| `text-h6` | 16px | 500 (Medium) | 24px | -0.16px | 소제목, 라벨 (bold) |
| `text-body` | 16px | 400 (Regular) | 24px | 0 | 본문 텍스트 |
| `text-body2` | 14px | 400 (Regular) | 20px | -0.14px | 작은 본문, 설명 |
| `text-caption` | 12px | 400 (Regular) | 16px | -0.06px | 캡션, 메타 정보 |
| `text-button1` | 14px | 500 (Medium) | 16px | -0.21px | 버튼 텍스트 |

### 2.2 Typography + Color 조합 패턴

```tsx
// 페이지 제목
<h1 className="text-h1 text-surface-950">나를 이해하는 스타일리스트 찾기</h1>

// 섹션 제목
<h2 className="text-h3 text-surface-900">Popular Stylists</h2>

// 카드 제목
<h3 className="text-h5 text-surface-950">스타일리스트 이름</h3>

// 본문
<p className="text-body text-surface-700">서비스 설명이 여기에 들어갑니다.</p>

// 보조 텍스트
<p className="text-body2 text-surface-500">강남구 · 영어 가능</p>

// 캡션 / 메타 정보
<span className="text-caption text-surface-400">2일 전</span>

// 강조 캡션
<span className="text-caption text-primary-600">4.8 ★</span>

// 버튼
<button className="text-button1 text-white">예약하기</button>
```

---

## 3. 실전 조합 예시

### 3.1 CTA 버튼

```tsx
// Primary 버튼
<button className="bg-primary-600 hover:bg-primary-700 text-white text-button1 px-6 py-3 rounded-lg">
  예약하기
</button>

// Secondary (outline) 버튼
<button className="border border-surface-300 hover:border-surface-400 text-surface-700 text-button1 px-6 py-3 rounded-lg">
  더보기
</button>

// Ghost 버튼
<button className="text-primary-600 hover:bg-primary-50 text-button1 px-4 py-2 rounded-lg">
  취소
</button>
```

### 3.2 카드

```tsx
<div className="bg-white rounded-xl p-4 border border-surface-200">
  <img src="..." className="w-full h-48 object-cover rounded-lg" />
  <div className="mt-3">
    <h3 className="text-h5 text-surface-950">Jimin Hair Studio</h3>
    <p className="text-body2 text-surface-500 mt-1">강남구 · English, 한국어</p>
    <div className="flex items-center gap-2 mt-2">
      <span className="text-caption text-primary-600">4.8 ★</span>
      <span className="text-caption text-surface-400">리뷰 128</span>
    </div>
  </div>
</div>
```

### 3.3 태그 / 뱃지

```tsx
// 모질 타입 태그
<span className="bg-secondary-50 text-secondary-600 text-caption px-3 py-1 rounded-full">
  Type 3C
</span>

// 언어 뱃지
<span className="bg-accent-100 text-accent-700 text-caption px-2 py-0.5 rounded">
  English
</span>

// 성공 상태
<span className="bg-success-100 text-success-500 text-caption px-2 py-0.5 rounded">
  Available
</span>
```

### 3.4 페이지 레이아웃

```tsx
<div className="min-h-screen bg-surface-50">
  {/* 헤더 */}
  <header className="bg-white border-b border-surface-200 px-4 py-3">
    <h1 className="text-h5 text-accent-900">Curling</h1>
  </header>

  {/* 히어로 섹션 */}
  <section className="px-4 py-8">
    <h2 className="text-h2 text-surface-950">Discover</h2>
    <p className="text-body2 text-surface-500 mt-1">
      Find a stylist who understands your hair
    </p>
  </section>

  {/* 컨텐츠 영역 */}
  <section className="px-4">
    <h3 className="text-h6 text-surface-700 mb-3">Nearby Salons</h3>
    {/* 카드 리스트 */}
  </section>

  {/* 하단 탭바 */}
  <nav className="fixed bottom-0 w-full bg-white border-t border-surface-200 px-4 py-2">
    <div className="flex justify-around">
      <span className="text-caption text-primary-600">Discover</span>
      <span className="text-caption text-surface-400">Styles</span>
      <span className="text-caption text-surface-400">My</span>
    </div>
  </nav>
</div>
```

### 3.5 입력 필드

```tsx
<div className="flex flex-col gap-1">
  <label className="text-caption text-surface-600">Hair Type</label>
  <select className="border border-surface-300 rounded-lg px-3 py-2 text-body2 text-surface-950 focus:border-primary-600 focus:ring-1 focus:ring-primary-600">
    <option>Select your hair type</option>
  </select>
  <p className="text-caption text-surface-400">Choose from 1A to 4C</p>
</div>
```

---

## 4. Quick Reference

### 자주 쓰는 조합

| 용도 | 클래스 |
|------|--------|
| 페이지 배경 | `bg-surface-50` |
| 카드 | `bg-white border border-surface-200 rounded-xl` |
| 페이지 제목 | `text-h2 text-surface-950` |
| 섹션 제목 | `text-h5 text-surface-900` |
| 본문 | `text-body text-surface-700` |
| 보조 텍스트 | `text-body2 text-surface-500` |
| 캡션 | `text-caption text-surface-400` |
| CTA 버튼 | `bg-primary-600 hover:bg-primary-700 text-white text-button1 rounded-lg` |
| 보조 버튼 | `border border-surface-300 text-surface-700 text-button1 rounded-lg` |
| 태그 | `bg-secondary-50 text-secondary-600 text-caption rounded-full` |
| 구분선 | `border-t border-surface-200` |
| 성공 상태 | `bg-success-100 text-success-500` |
| 링크 | `text-accent-500 hover:text-accent-700` |

### 텍스트 색상 계층

```
text-surface-950  — 제목, 가장 중요한 텍스트
text-surface-900  — 소제목
text-surface-700  — 본문
text-surface-500  — 보조 설명
text-surface-400  — placeholder, 비활성, 메타 정보
```

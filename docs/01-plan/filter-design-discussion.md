# Filter 설계 논의

> **작성일**: 2026-04-18
> **상태**: 논의 필요
> **관련**: FilterPopup UI, ERD KeywordCategory/Keyword, 디자이너/살롱 데이터 구조

---

## 1. 현재 상황

FilterPopup에 하드코딩된 키워드와 실제 디자이너/살롱 데이터가 맞지 않는다.

### 하드코딩된 FilterPopup (10개 카테고리, 60+ 키워드)

```
Recommended Keywords | Hair Type | Treatment | Style | Hair Concern
Languages | Special Offers | Current Hair Color | Current Hair Length | Treatment History
```

### 실제 디자이너 데이터의 서비스/전문분야

```
Curly Cut, Locs, Big Chop, Scalp Treatment, Protective Styles,
Braids, Balayage, Fade, Taper, Afro Trim, Keratin Treatment,
Korean Perm, Layered Cut, Natural Hair Styling, Twist Out...
```

### 불일치 예시

| FilterPopup에 있지만 데이터에 없음 | 데이터에 있지만 FilterPopup에 없음 |
|-------------------------------|-------------------------------|
| Down Perm, Wig, Grey Coverage | Braids, Balayage, Curly Cut, Locs |
| Root Touch-up | Fade, Taper, Keratin Treatment |
| | Layered Cut, Protective Styles |

---

## 2. 핵심 문제: 필터의 성격이 섞여있다

현재 FilterPopup에 **두 종류의 키워드가 공존**하고 있다.

### A. 검색 필터 — "이런 곳을 찾고 싶다"

| 카테고리 | 의미 | 매칭 대상 |
|---------|------|----------|
| Treatment/Service | 원하는 시술 | DesignerKeyword |
| Languages | 소통 가능 언어 | DesignerProfile.languages |
| Style | 스타일 방향 | DesignerKeyword |
| Special Offers | 살롱 시설/정책 | SalonKeyword |
| Hair Type (Expertise) | 내 모질을 다뤄본 디자이너 | DesignerKeyword |

### B. 고객 프로필 — "내 머리는 이렇다"

| 카테고리 | 의미 | 저장 위치 |
|---------|------|----------|
| ~~Current Hair Color~~ | 내 현재 머리색 | HairProfile |
| ~~Current Hair Length~~ | 내 현재 머리 길이 | HairProfile |
| ~~Treatment History~~ | 과거 시술 이력 | HairProfile |
| ~~Hair Concern~~ | 내 머리 고민 | HairProfile |

**"Blonde"를 선택하는 건 "Blonde 전문 살롱"을 찾는 게 아니라 "내가 Blonde"라는 뜻이다.**
이건 검색 필터가 아니라 프로필 정보이며, My 탭의 Hair Profile에서 관리하는 게 적합하다.

---

## 3. 제안: FilterPopup 개편

### FilterPopup에 남길 카테고리 (검색 필터)

| 카테고리 | 키워드 소스 | 비고 |
|---------|-----------|------|
| **Service** | DB Keyword (Treatment 카테고리) | 시술 종류 |
| **Hair Type Expertise** | DB Keyword | 디자이너가 다룰 수 있는 모질 |
| **Style** | DB Keyword | 스타일 방향성 |
| **Languages** | 고정 목록 or DB | 소통 언어 |
| **Salon Features** | DB Keyword (Special Offers) | Pet Friendly, Private Room 등 |

### My 탭으로 이동할 카테고리 (고객 프로필)

| 항목 | HairProfile 컬럼 | 용도 |
|------|-----------------|------|
| Hair Type (내 모질) | `hair_type` | 매칭/추천 |
| Hair Color | `color` | 매칭/추천 |
| Hair Length | `length` | 매칭/추천 |
| Hair Concern | `hair_concern` | 매칭/추천 |
| Treatment History | 신규 컬럼 or JSONB | 매칭/추천 |

고객이 Hair Profile을 입력하면 → "나와 비슷한 머리를 다뤄본 디자이너" 추천에 활용.
필터에서 매번 선택하는 게 아니라 한 번 입력하면 계속 반영.

---

## 4. 키워드가 너무 많아지는 문제

DB에서 키워드를 동적으로 불러오면 Service만 30개+가 될 수 있다.

### 방안 A: 인기순 + 더보기

```
Service
┌─────────────────────────────────────────┐
│ Haircut  Balayage  Braids  Head Spa     │  ← 인기순 상위 6개
│ Perm     Coloring                       │
│                           + 18개 더보기  │
└─────────────────────────────────────────┘
```

- Keyword에 `usage_count` 추가, 많이 쓰는 순으로 정렬
- 기본 6개 노출, "더보기" 탭하면 전체
- **장점**: 구현 단순, 현재 UI와 호환
- **단점**: 더보기 안 누르면 놓치는 키워드 존재

### 방안 B: 상위 그룹 → 하위 펼침

```
Service
┌─────────────────────────────────────────┐
│  Cut  Color  Perm  Braids  Care  Barber │  ← 그룹 칩
└─────────────────────────────────────────┘
         ↓ "Color" 탭
┌─────────────────────────────────────────┐
│  Coloring  Balayage  Highlights         │
│  Root Touch-up  Grey Coverage           │
└─────────────────────────────────────────┘
```

- Keyword에 `group_name` 추가
- 2단계 탐색: 그룹 선택 → 세부 키워드
- **장점**: 깔끔한 정리, 확장성 좋음
- **단점**: UX 복잡도 증가, 디자인 추가 필요

### 방안 C: 하드코딩 유지 + 스코어링 매칭

- FilterPopup은 고정된 "고객 친화적" 키워드만 유지
- 선택된 필터 → 관련 DesignerKeyword와 유사도 스코어링으로 매칭
- 예: 필터 "Curly Hair" → DesignerKeyword "Curly Cut", "Coily Cut", "Big Chop" 등과 연관 매칭
- **장점**: 고객 UX 변화 없음
- **단점**: 매핑 테이블 필요, 관리 비용

---

## 5. 매칭 방식

필터 선택 → 디자이너 검색 시 1:1 매칭이 안 될 수 있다.

### 스코어링 기반 검색 (추천)

```sql
SELECT d.*, COUNT(dk.keyword_id) as match_score
FROM DesignerProfile d
JOIN DesignerKeyword dk ON d.id = dk.designer_id
WHERE dk.keyword_id IN (선택한 키워드들)
GROUP BY d.id
ORDER BY match_score DESC
```

- 3/3 매칭 디자이너가 상위, 1/3 매칭도 하위에 노출
- 결과 0개 문제 해결
- 카테고리별 가중치 적용 가능 (Service +3, Language +2, Style +1)

---

## 6. 논의 포인트

### 반드시 결정할 것

1. **고객 프로필 카테고리 분리 여부**
   - Hair Color, Hair Length, Treatment History → FilterPopup에서 빼고 My 탭으로?
   - Hair Concern도 분리?

2. **키워드 소스**
   - 하드코딩 유지 vs DB 동적 로딩?
   - DB라면 키워드 관리 주체는? (어드민 패널 필요?)

3. **키워드 과다 시 UI**
   - 방안 A (인기순 + 더보기) vs 방안 B (그룹 + 펼침) vs 방안 C (하드코딩 + 스코어링)?

### 나중에 결정해도 되는 것

- 카테고리별 가중치 수치
- Recommended Keywords 선정 로직 (인기순? 수동?)
- Hair Profile 기반 자동 추천 알고리즘

---

## 7. 유력 방향: Discover vs Style 탭 역할 분리

### 탭별 역할

| | **Discover** | **Style** |
|---|---|---|
| **사용자 상태** | "주변에 뭐가 있지?" (탐색) | "3c 컬 할 수 있는 디자이너 찾아줘" (검색) |
| **핵심 UI** | 지도 + 주변 살롱 브라우징 | 자연어 검색 → 벡터 매칭 → 결과 |
| **인터랙션** | 마커 탭, 둘러보기, 간단 필터 | 텍스트 입력, 구체적 질문 |

### Discover 필터 — 위치 기반 탐색에 필요한 것만

자연어 검색은 Style 탭에서 담당. Discover 필터는 4가지:

| 필터 | 매칭 대상 | 키워드 |
|------|----------|--------|
| **Language** | `DesignerProfile.languages` | English, Korean, 中文, 日本語 등 |
| **Hair Type** | `hair_type_experience` or `DesignerKeyword` | Straight, Wavy, Curly, Coily |
| **Service** | `DesignerKeyword` | 그룹 칩: Cut, Color, Perm, Braids & Locs, Care, Barber |
| **Salon Features** | `SalonKeyword` | Foreigner Friendly, Pet Friendly, Tax-free 등 |

→ 총 4카테고리
→ Service는 30개+ 세부 키워드를 6개 그룹으로 묶어서 표시
→ 세부 서비스 검색("발라야쥬 잘하는 곳")은 Style 탭 자연어에서 처리

#### Service 그룹 매핑

| 그룹 칩 | 포함 키워드 |
|---------|-----------|
| Cut | Haircut, Layered Cut, Curly Cut, Big Chop, Afro Cut, Coily Cut |
| Color | Coloring, Balayage, Highlights, Root Touch-up, Grey Coverage, Natural Hair Coloring |
| Perm | Perm, Korean Perm, Down Perm, Keratin Treatment |
| Braids & Locs | Braids, Locs, Cornrow, Protective Styles, Twist Out, Locs Installation, Locs Maintenance |
| Care | Head Spa, Scalp Treatment, Moisture Treatment, Blow Dry & Styling |
| Barber | Fade, Taper, Beard Trim, Line-up, Buzz Cut, Afro Trim, Hot Towel Shave |

### Style 탭 — 자연어 검색

```
"3c 컬 헤어 할 수 있는 디자이너 찾고싶어"
→ 벡터 연산으로 DesignerKeyword + hair_type_experience 매핑
→ 스코어링 기반 결과 정렬
```

- KeywordCategory/Keyword 시스템은 벡터 검색의 매칭 소스로 활용
- FilterPopup의 키워드 과다 문제 자체가 사라짐 (자연어가 대체)

### Hair Profile 연동

HairProfile에 내 머리 정보 저장 → Discover에서 "내 헤어타입 매칭" 토글로 활용 가능:
- 매번 필터에서 고르지 않아도 됨
- Style 탭 자연어 검색에서도 컨텍스트로 활용 ("내 머리에 맞는 디자이너")

### 이 방향의 장점

- FilterPopup 키워드 과다/불일치 문제 해결
- 탭 간 역할 명확 (위치 기반 탐색 vs 의도 기반 검색)
- ERD 단순화 (Discover 필터는 기존 컬럼으로 충분)

---

## 8. 현재 ERD 반영 상태

이미 반영된 것:
- `Salon.specialty[]` 제거 → 디자이너 키워드에서 집계
- `DesignerProfile.specialty[]` 제거 → `DesignerKeyword`로 통일
- `SalonKeyword` 역할 축소 → 시설/정책 키워드만
- `Salon` 테이블에 `type`, `neighborhood`, `introduction`, `designer_count` 추가

논의 후 반영할 것:
- `Keyword.usage_count` or `Keyword.group_name` (방안 A or B 선택 시)
- `KeywordCategory.weight` (스코어링 가중치)
- `HairProfile` 테이블 확장 (Treatment History 등)

# Curling Platform — ERD & DB Design

> **Created**: 2026-04-04
> **Updated**: 2026-04-18
> **Status**: Draft
> **Scope**: Phase별 점진적 확장

---

## 1. 도메인 개요

Curling은 **컬리 헤어 전문 디자이너 매칭 플랫폼**이다.
고객이 지도/필터로 디자이너를 탐색하고, 예약하고, 리뷰를 남기는 흐름이 핵심.

```
고객 → 탐색(Discover) → 예약(Booking) → 시술 → 리뷰(Review)
         ↕                    ↕
     필터/지도            채팅(Chat)
```

---

## 2. Phase 구분

| Phase | 범위 | Entity |
|-------|------|--------|
| **Phase 1 — Discover** | 디자이너/살롱 탐색, 맵뷰, 필터, 찜하기 | User, HairProfile, DesignerProfile, Salon, Portfolio, KeywordCategory, Keyword, DesignerKeyword, SalonKeyword, Favorite, Article |
> `DesignerKeyword`: 디자이너 스킬/서비스 키워드 (Hair Type, Treatment, Style 등)
> `SalonKeyword`: 살롱 시설/정책 키워드만 (Pet Friendly, Private Room 등)
> 살롱의 서비스 키워드는 소속 디자이너 키워드에서 집계
| **Phase 2 — Style** | 스타일 파인더, 이미지 검색, 유사 스타일, 용어 사전 | StyleTag, PortfolioStyleTag, TermDictionary |
| **Phase 3 — Message** | 1:1 채팅, 레퍼런스 이미지 공유 | ChatRoom, ChatMessage |
| **Phase 4 — Booking & Review** | 시술 메뉴, 예약, 리뷰 | Service, Booking, Review |

---

## 3. Phase 1 — Discover (현재)

### 3.1 ERD Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER & PROFILE                             │
│                                                                     │
│  ┌──────────────┐          ┌───────────────────┐                    │
│  │    User      │          │  DesignerProfile   │                   │
│  ├──────────────┤    1:1   ├───────────────────┤                    │
│  │ id (PK)      │─────────→│ id (PK)           │                   │
│  │ email        │          │ user_id (FK→User)  │                   │
│  │ password_hash│          │ salon_id (FK→Salon) │                  │
│  │ name         │          │ bio                │                   │
│  │ phone        │          │ years_of_exp       │                   │
│  │ role         │          │ rating_avg         │                   │
│  │ profile_image│          │ review_count       │                   │
│  │ locale       │          │ is_verified        │                   │
│  │ created_at   │          │ highlight_message  │                   │
│  │ updated_at   │          │ languages (array)  │                   │
│  └──────┬───────┘          │ created_at         │                   │
│         │                  └─────────┬─────────┘                    │
│         │                            │                              │
│  ┌──────┴───────┐                    │                              │
│  │ HairProfile  │                    │                              │
│  ├──────────────┤                    │                              │
│  │ id (PK)      │                    │                              │
│  │ user_id (FK) │                    │                              │
│  │ length       │                    │                              │
│  │ hair_type    │                    │                              │
│  │ color        │                    │                              │
│  │ ethnicity    │                    │                              │
│  │ hair_concern │                    │                              │
│  └──────────────┘                    │                              │
└──────────────────────────────────────┼──────────────────────────────┘
                                       │
┌──────────────────────────────────────┼──────────────────────────────┐
│              SALON & PORTFOLIO       │                              │
│                                      │                              │
│    ┌──────────────────────┐         │    ┌──────────────────┐      │
│    │       Salon           │         │    │   Portfolio       │      │
│    ├──────────────────────┤       N:1    ├──────────────────┤      │
│    │ id (PK)              │←────────┤    │ id (PK)          │      │
│    │ name                 │         └───→│ designer_id (FK) │      │
│    │ address              │         1:N  │ image_url        │      │
│    │ latitude             │              │ description      │      │
│    │ longitude            │              │ hair_type        │      │
│    │ phone                │              │ is_primary       │      │
│    │ type                 │              │ created_at       │      │
│    │ neighborhood         │              └──────────────────┘      │
│    │ introduction         │                                        │
│    │ languages (array)    │                                        │
│    │ is_featured          │                                        │
│    │ designer_count       │                                        │
│    │ created_at           │                                        │
│    └──────────┬───────────┘                                        │
│               │                                                    │
└───────────────┼────────────────────────────────────────────────────┘
                │
┌───────────────┼────────────────────────────────────────────────────┐
│               │    KEYWORD & FILTER                                │
│               │                                                    │
│    ┌──────────┴─────────┐                                          │
│    │   SalonKeyword     │       ┌──────────────────┐               │
│    │   (M:M 시설/정책만)│       │ KeywordCategory  │               │
│    ├────────────────────┤       ├──────────────────┤               │
│    │ salon_id (FK)      │       │ id (PK)          │               │
│    │ keyword_id (FK)    │       │ name             │               │
│    │ (PK: composite)    │       │ slug             │               │
│    └────────────────────┘       │ display_order    │               │
│                                 └────────┬─────────┘               │
│                                    1:N   │                         │
│    ┌────────────────────┐       ┌────────┴─────────┐               │
│    │ DesignerKeyword    │       │    Keyword        │               │
│    │ (M:M)              │       ├──────────────────┤               │
│    ├────────────────────┤  N:M  │ id (PK)          │               │
│    │ designer_id (FK)   │←─────→│ category_id (FK) │               │
│    │ keyword_id (FK)    │       │ name             │               │
│    │ (PK: composite)    │       │ slug             │               │
│    └────────────────────┘       │ display_order    │               │
│                                 └──────────────────┘               │
└────────────────────────────────────────────────────────────────────┘
```

### 3.2 테이블 상세

#### User

통합 사용자 테이블. 고객과 디자이너 모두 포함.

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 로그인 이메일 |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash |
| name | VARCHAR(100) | NOT NULL | 표시 이름 |
| phone | VARCHAR(20) | UNIQUE | 전화번호 |
| role | ENUM | NOT NULL | `CUSTOMER`, `DESIGNER`, `ADMIN` |
| profile_image | VARCHAR(500) | | 프로필 이미지 URL |
| locale | VARCHAR(5) | DEFAULT 'en' | `ko`, `en` |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

#### HairProfile

고객의 헤어 프로필. My 탭에서 관리. User와 1:1.

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| user_id | UUID | FK→User, UNIQUE | |
| length | VARCHAR(30) | | `short`, `medium`, `long` 등 |
| hair_type | VARCHAR(30) | | `curly`, `wavy`, `coily` 등 |
| color | VARCHAR(50) | | 현재 모발 색상 |
| ethnicity | VARCHAR(50) | | 인종/모질 특성 |
| hair_concern | TEXT | | 헤어 고민 (자유 텍스트) |
| updated_at | TIMESTAMP | NOT NULL | |
| created_at | TIMESTAMP | NOT NULL | |

> IA "My Hair Profile"에 대응. 디자이너 매칭/추천 시 활용

#### DesignerProfile

디자이너 전용 확장 프로필. User와 1:1.

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| user_id | UUID | FK→User, UNIQUE | |
| salon_id | UUID | FK→Salon, NULLABLE | 소속 살롱 |
| bio | TEXT | | 자기소개 |
| years_of_exp | INT | | 경력 연차 |
| rating_avg | DECIMAL(2,1) | DEFAULT 0 | 평균 평점 (1.0~5.0) |
| review_count | INT | DEFAULT 0 | 리뷰 수 (비정규화) |
| is_verified | BOOLEAN | DEFAULT false | 인증 디자이너 여부 |
| highlight_message | VARCHAR(200) | | 카드에 표시할 한 줄 소개 |
| languages | VARCHAR(20)[] | | `['korean', 'english']` |
| hair_type_experience | VARCHAR(50)[] | | 경험 모질 타입 `['Wavy Hair (2a-2c)', 'Coily Hair (4a-4c)']` |
| off_days | VARCHAR(10)[] | | 휴무일 `['MON', 'TUE']` |
| other_links | JSONB | | 외부 링크 `{instagram: "...", blog: "..."}` |
| created_at | TIMESTAMP | NOT NULL | |

> `highlight_message`는 프론트엔드 `message` 필드에 대응
> `languages`는 별도 조인 테이블 없이 배열 컬럼으로 처리
> `specialty`는 제거 — `DesignerKeyword`로 통일 (Curly Cut, Locs 등은 Treatment 카테고리 키워드)
> `hair_type_experience`는 배열 유지 — FilterPopup 키워드보다 세분화된 값 (2a-2c 등)
> `off_days`는 IA "Designer Profile" 확장 정보
> `other_links`는 JSONB로 유연하게 외부 링크 관리

#### Salon

살롱/매장. MapView에 마커로 표시.

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| name | VARCHAR(200) | NOT NULL | 살롱 이름 |
| address | VARCHAR(500) | NOT NULL | 주소 |
| latitude | DECIMAL(10,7) | NOT NULL | 위도 |
| longitude | DECIMAL(10,7) | NOT NULL | 경도 |
| phone | VARCHAR(20) | | 매장 전화번호 |
| type | VARCHAR(20) | NOT NULL | `salon`, `barber`, `specialty`, `independent` |
| neighborhood | VARCHAR(50) | | 지역명 (`Itaewon`, `Gangnam` 등) |
| introduction | TEXT | | 살롱 소개문 |
| languages | VARCHAR(20)[] | | 대응 가능 언어 |
| is_featured | BOOLEAN | DEFAULT false | 추천 살롱 여부 |
| designer_count | INT | DEFAULT 0 | 소속 디자이너 수 (비정규화) |
| created_at | TIMESTAMP | NOT NULL | |

> `type`으로 살롱 유형 구분 — 맵 마커 아이콘/필터에 활용
> `neighborhood`는 "Itaewon 근처" 같은 지역 기반 탐색에 사용
> `introduction`은 살롱 상세 페이지 및 카드에 표시
> `designer_count`는 DesignerProfile 추가/삭제 시 트리거로 갱신

#### Portfolio

디자이너 포트폴리오 이미지. DesignerCard 배경에 사용.

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| designer_id | UUID | FK→DesignerProfile | |
| image_url | VARCHAR(500) | NOT NULL | 이미지 URL |
| description | VARCHAR(300) | | 설명 |
| hair_type | VARCHAR(50) | | 시술 헤어 타입 태그 |
| is_primary | BOOLEAN | DEFAULT false | 대표 이미지 여부 |
| created_at | TIMESTAMP | NOT NULL | |

> `is_primary = true`인 항목이 DesignerCard의 `portfolioImage`로 사용

#### KeywordCategory + Keyword

Discover 페이지 필터 시스템. FilterPopup의 섹션 구조와 1:1 대응.

**KeywordCategory**

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| name | VARCHAR(50) | NOT NULL | 표시명 (`Hair Type`, `Treatment` 등) |
| slug | VARCHAR(50) | UNIQUE | URL/코드용 (`hair_type`, `treatment`) |
| display_order | INT | DEFAULT 0 | FilterPopup 내 표시 순서 |

**Keyword**

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| category_id | UUID | FK→KeywordCategory | |
| name | VARCHAR(100) | NOT NULL | 키워드명 (`Curly Hair`, `Braids` 등) |
| slug | VARCHAR(100) | | URL용 |
| display_order | INT | DEFAULT 0 | 카테고리 내 표시 순서 |

> FilterPopup 섹션 제목 = KeywordCategory.name
> 섹션 내 칩 = Keyword WHERE category_id = ?
> "Recommended Keywords"는 DB 카테고리가 아닌 인기/추천 로직으로 추출

**프론트엔드 ↔ DB 매핑 (FilterPopup)**

| FilterPopup 섹션 | KeywordCategory.slug |
|-----------------|---------------------|
| Hair Type | `hair_type` |
| Treatment | `treatment` |
| Style | `style` |
| Hair Concern | `hair_concern` |
| Languages | `languages` |
| Special Offers | `special_offers` |
| Current Hair Color | `hair_color` |
| Current Hair Length | `hair_length` |
| Treatment History | `treatment_history` |

**DesignerKeyword** (N:M 조인 테이블)

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| designer_id | UUID | FK→DesignerProfile | |
| keyword_id | UUID | FK→Keyword | |
| | | PK(designer_id, keyword_id) | |

**SalonKeyword** (N:M 조인 테이블 — 시설/정책 키워드 전용)

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| salon_id | UUID | FK→Salon | |
| keyword_id | UUID | FK→Keyword | |
| | | PK(salon_id, keyword_id) | |

> **살롱 시설/정책 키워드만 저장**: `Pet Friendly`, `Private Room`, `Tax-free`, `Vegan Products` 등
> 서비스/스킬 키워드(Braids, Haircut 등)는 소속 디자이너의 `DesignerKeyword`에서 집계:
> ```sql
> SELECT DISTINCT k.* FROM DesignerKeyword dk
> JOIN DesignerProfile dp ON dk.designer_id = dp.id
> JOIN Keyword k ON dk.keyword_id = k.id
> WHERE dp.salon_id = ?
> ```

#### Favorite

고객의 디자이너 찜하기.

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| customer_id | UUID | FK→User | |
| designer_id | UUID | FK→DesignerProfile | |
| created_at | TIMESTAMP | NOT NULL | |
| | | UNIQUE(customer_id, designer_id) | |

#### Article

Discover 탭 하단의 아티클/가이드 콘텐츠.

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| title | VARCHAR(300) | NOT NULL | 제목 |
| slug | VARCHAR(300) | UNIQUE | URL용 |
| content | TEXT | NOT NULL | 본문 (Markdown) |
| thumbnail_url | VARCHAR(500) | | 썸네일 이미지 |
| author_id | UUID | FK→User, NULLABLE | 작성자 (admin/editor) |
| is_published | BOOLEAN | DEFAULT false | 공개 여부 |
| published_at | TIMESTAMP | NULLABLE | 공개 일시 |
| created_at | TIMESTAMP | NOT NULL | |

> IA "Article/guide" 대응. Discover 탭에서 컬리헤어 관련 가이드 제공

### 3.3 관계 요약

```
User (1) ──── (1) HairProfile           [고객 헤어 프로필]
User (1) ──── (1) DesignerProfile
User (1) ──── (N) Favorite (as customer)
DesignerProfile (N) ──── (1) Salon
DesignerProfile (1) ──── (N) Portfolio
DesignerProfile (N) ──── (M) Keyword       [via DesignerKeyword — 스킬/서비스 전체]
Salon (N) ──── (M) Keyword                 [via SalonKeyword — 시설/정책만]
Salon → 서비스 키워드                       [소속 DesignerKeyword 집계로 유도]
DesignerProfile (1) ──── (N) Favorite
KeywordCategory (1) ──── (N) Keyword
User (1) ──── (N) Article (as author)    [아티클/가이드]
```

### 3.4 프론트엔드 ↔ DB 매핑

| 프론트엔드 | DB Source |
|-----------|-----------|
| `DesignerCard.name` | `User.name` (JOIN DesignerProfile) |
| `DesignerCard.role` | `DesignerProfile` 기반 |
| `DesignerCard.languages` | `DesignerProfile.languages` |
| `DesignerCard.profileImage` | `User.profile_image` |
| `DesignerCard.portfolioImage` | `Portfolio WHERE is_primary = true` |
| `DesignerCard.message` | `DesignerProfile.highlight_message` |
| FilterPopup 섹션 목록 | `KeywordCategory ORDER BY display_order` |
| FilterPopup 칩 목록 | `Keyword WHERE category_id = ? ORDER BY display_order` |
| `MapView` 마커 | `Salon.latitude`, `Salon.longitude` |
| 살롱 시설/정책 | `SalonKeyword JOIN Keyword` (Pet Friendly 등) |
| 살롱 제공 서비스 | `DesignerKeyword` 집계 (소속 디자이너 키워드 합집합) |

### 3.5 Mock 데이터 → DB 매핑

살롱 JSON 데이터의 각 필드가 DB에 어떻게 들어가는지:

| JSON 필드 | DB 매핑 | 비고 |
|-----------|---------|------|
| `name` | `Salon.name` | |
| `address` | `Salon.address` | |
| `latitude` | `Salon.latitude` | |
| `longitude` | `Salon.longitude` | |
| `phone` | `Salon.phone` | |
| `type` | `Salon.type` | `salon`, `barber`, `specialty`, `independent` |
| `neighborhood` | `Salon.neighborhood` | |
| `introduction` | `Salon.introduction` | |
| `english_available` | `Salon.languages` | `Yes` → `['english']`, `Partial` → `['english_partial']` |
| `services[]` | `DesignerKeyword` | 소속 디자이너의 키워드로 관리. 살롱 서비스 조회 시 디자이너 키워드 집계 |
| `number_of_designers` | `Salon.designer_count` | 비정규화 필드 |
| `distance_km` | 클라이언트 계산 | 저장하지 않음 — 사용자 위치 기반 실시간 계산 |

### 3.6 인덱스

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| User | `email` (UNIQUE) | 로그인 |
| DesignerProfile | `salon_id` | 살롱별 디자이너 조회 |
| Salon | `(latitude, longitude)` | 지도 범위 검색 (GiST) |
| Salon | `type` | 살롱 유형별 필터링 |
| Salon | `neighborhood` | 지역별 필터링 |
| Portfolio | `(designer_id, is_primary)` | 대표 이미지 조회 |
| DesignerKeyword | `keyword_id` | 키워드별 디자이너 필터링 |
| SalonKeyword | `keyword_id` | 키워드별 살롱 필터링 |

---

## 4. Phase 2 — Style (예정)

> 스타일 파인더, 이미지 검색, 유사 스타일 추천, 용어 사전

### 추가 Entity

#### StyleTag

포트폴리오 이미지에 연결되는 스타일 태그. Style Finder 검색에 사용.

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| name | VARCHAR(100) | NOT NULL, UNIQUE | 스타일명 (e.g. "Wash and Go", "Twist Out") |
| slug | VARCHAR(100) | UNIQUE | URL용 |
| category | VARCHAR(50) | | `cut`, `style`, `treatment` |
| created_at | TIMESTAMP | NOT NULL | |

#### PortfolioStyleTag (N:M 조인 테이블)

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| portfolio_id | UUID | FK→Portfolio | |
| style_tag_id | UUID | FK→StyleTag | |
| | | PK(portfolio_id, style_tag_id) | |

> Portfolio에 스타일 태그를 붙여서 "Similar styles" 검색 지원

#### TermDictionary

컬리헤어 용어 차이 사전. 번역/용어 통일에 활용.

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| term_ko | VARCHAR(100) | NOT NULL | 한국어 용어 |
| term_en | VARCHAR(100) | NOT NULL | 영어 용어 |
| description | TEXT | | 용어 설명 |
| category | VARCHAR(50) | | `hair_type`, `service`, `product` |
| created_at | TIMESTAMP | NOT NULL | |

> IA "Term Difference Dictionary" 대응

### 추가 관계

```
Portfolio (N) ──── (M) StyleTag    [via PortfolioStyleTag]
```

### 추가 인덱스

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| PortfolioStyleTag | `style_tag_id` | 스타일별 포트폴리오 검색 |
| TermDictionary | `(term_ko, term_en)` | 용어 검색 |

---

## 5. Phase 3 — Message (예정)

> 1:1 채팅, 레퍼런스 이미지 공유 기능 구현 시 추가

### 추가 Entity

#### ChatRoom

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| customer_id | UUID | FK→User | |
| designer_id | UUID | FK→DesignerProfile | |
| last_message_at | TIMESTAMP | | 마지막 메시지 시각 |
| created_at | TIMESTAMP | NOT NULL | |
| | | UNIQUE(customer_id, designer_id) | |

#### ChatMessage

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| room_id | UUID | FK→ChatRoom | |
| sender_id | UUID | FK→User | 발신자 |
| content | TEXT | NOT NULL | 메시지 내용 |
| message_type | ENUM | DEFAULT 'TEXT' | `TEXT`, `IMAGE`, `REFERENCE_IMAGE`, `BOOKING_LINK` |
| image_url | VARCHAR(500) | NULLABLE | 이미지/레퍼런스 이미지 URL |
| read_at | TIMESTAMP | NULLABLE | 읽은 시각 (NULL=미읽음) |
| created_at | TIMESTAMP | NOT NULL | |

> `REFERENCE_IMAGE` 타입은 IA "Reference Image Sharing" 대응
> 고객이 원하는 스타일 사진을 디자이너에게 공유할 때 사용

### 추가 인덱스

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| ChatMessage | `(room_id, created_at)` | 채팅 메시지 정렬 |

---

## 6. Phase 4 — Booking & Review (예정)

> 시술 메뉴, 예약, 리뷰 기능 구현 시 추가

### 추가 Entity

#### Service

예약 시 선택하는 시술 메뉴. 가격/소요시간 포함.
Phase 1의 `SalonKeyword`(탐색용 태그)와 구분됨.

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| salon_id | UUID | FK→Salon | |
| name | VARCHAR(200) | NOT NULL | 시술명 |
| description | TEXT | | 설명 |
| price | INT | NOT NULL | 가격 (원 단위) |
| duration_min | INT | NOT NULL | 소요 시간 (분) |
| category | VARCHAR(50) | | `cut`, `perm`, `color`, `treatment` |
| is_active | BOOLEAN | DEFAULT true | 활성 여부 |
| created_at | TIMESTAMP | NOT NULL | |

> `DesignerKeyword`는 "이 디자이너가 Braids를 다룬다"는 탐색용 태그
> `Service`는 "Braids — 80,000원 / 120분"이라는 예약용 상세 메뉴
> 같은 이름이라도 역할이 다름 (탐색 vs 예약)

#### Booking

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| customer_id | UUID | FK→User | 예약 고객 |
| designer_id | UUID | FK→DesignerProfile | 담당 디자이너 |
| service_id | UUID | FK→Service | 시술 메뉴 |
| salon_id | UUID | FK→Salon | 매장 |
| scheduled_at | TIMESTAMP | NOT NULL | 예약 일시 |
| status | ENUM | NOT NULL | `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED` |
| note | TEXT | | 고객 요청사항 |
| total_price | INT | | 최종 가격 |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

**Status Flow:** `PENDING → CONFIRMED → COMPLETED` / `PENDING|CONFIRMED → CANCELLED`

#### Review

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| booking_id | UUID | FK→Booking, UNIQUE | 예약당 1개 |
| customer_id | UUID | FK→User | 작성자 |
| designer_id | UUID | FK→DesignerProfile | 대상 디자이너 |
| rating | SMALLINT | NOT NULL, CHECK(1~5) | 평점 |
| content | TEXT | | 리뷰 내용 |
| images | VARCHAR(500)[] | | 리뷰 이미지 URL 배열 |
| created_at | TIMESTAMP | NOT NULL | |

> Review 생성 시 `DesignerProfile.rating_avg`, `review_count` 갱신

### 추가 관계

```
Salon (1) ──── (N) Service
Service (1) ──── (N) Booking
User (1) ──── (N) Booking (as customer)
DesignerProfile (1) ──── (N) Booking
Booking (1) ──── (1) Review
```

### 추가 인덱스

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| Booking | `(customer_id, status)` | 고객 예약 목록 |
| Booking | `(designer_id, scheduled_at)` | 디자이너 스케줄 |
| Review | `designer_id` | 디자이너 리뷰 목록 |

---

## 7. 비정규화 전략

| 대상 | 비정규화 필드 | Phase | 이유 |
|------|-------------|-------|------|
| DesignerProfile | `rating_avg`, `review_count` | Phase 4에서 활성화 | 카드 목록에서 매번 Review 집계 방지 |
| Salon | `designer_count` | Phase 1 | 살롱 카드에서 디자이너 수 표시, COUNT 쿼리 방지 |
| ChatRoom | `last_message_at` | Phase 3 | 채팅방 목록 정렬 |

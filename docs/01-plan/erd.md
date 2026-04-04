# Curling Platform — ERD & DB Design

> **Created**: 2026-04-04
> **Status**: Draft
> **Scope**: 전체 서비스 (Discover, Booking, Review, Chat)

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

## 2. Entity 목록

| # | Entity | 설명 | 비고 |
|---|--------|------|------|
| 1 | User | 모든 사용자 (고객 + 디자이너) | 통합 인증 |
| 2 | DesignerProfile | 디자이너 확장 프로필 | User 1:1 |
| 3 | Salon | 살롱/매장 | MapView 위치 |
| 4 | Portfolio | 디자이너 포트폴리오 이미지 | DesignerCard 배경 |
| 5 | KeywordCategory | 필터 카테고리 | Hair Type, Service, Length, Style |
| 6 | Keyword | 개별 키워드 태그 | KeywordFilter 칩 |
| 7 | Service | 시술 메뉴 | 살롱별 가격/소요시간 |
| 8 | Booking | 예약 | 핵심 트랜잭션 |
| 9 | Review | 리뷰/평점 | 예약 완료 후 |
| 10 | Favorite | 찜하기 | 고객 → 디자이너 |
| 11 | ChatRoom | 채팅방 | 1:1 고객-디자이너 |
| 12 | ChatMessage | 채팅 메시지 | ChatRoom 하위 |

---

## 3. ERD Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER & AUTH                                │
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
│  │ created_at   │          │ created_at         │                   │
│  │ updated_at   │          └─────────┬─────────┘                   │
│  └──────┬───────┘                    │                              │
│         │                            │                              │
└─────────┼────────────────────────────┼──────────────────────────────┘
          │                            │
          │                            │
┌─────────┼────────────────────────────┼──────────────────────────────┐
│         │        SALON & PORTFOLIO   │                              │
│         │                            │                              │
│         │    ┌──────────────────┐    │    ┌──────────────────┐      │
│         │    │     Salon        │    │    │   Portfolio       │      │
│         │    ├──────────────────┤  N:1   ├──────────────────┤      │
│         │    │ id (PK)          │←───┤    │ id (PK)          │      │
│         │    │ name             │    └───→│ designer_id (FK) │      │
│         │    │ address          │  1:N    │ image_url        │      │
│         │    │ latitude         │         │ description      │      │
│         │    │ longitude        │         │ hair_type        │      │
│         │    │ phone            │         │ is_primary       │      │
│         │    │ operating_hours  │         │ created_at       │      │
│         │    │ created_at       │         └──────────────────┘      │
│         │    └──────────────────┘                                   │
│         │                                                           │
└─────────┼───────────────────────────────────────────────────────────┘
          │
          │
┌─────────┼───────────────────────────────────────────────────────────┐
│         │        KEYWORD & FILTER SYSTEM                            │
│         │                                                           │
│         │    ┌──────────────────┐       ┌──────────────────┐        │
│         │    │ KeywordCategory  │  1:N  │    Keyword       │        │
│         │    ├──────────────────┤──────→├──────────────────┤        │
│         │    │ id (PK)          │       │ id (PK)          │        │
│         │    │ name             │       │ category_id (FK) │        │
│         │    │ slug             │       │ name             │        │
│         │    │ display_order    │       │ slug             │        │
│         │    └──────────────────┘       │ display_order    │        │
│         │                               └────────┬─────────┘        │
│         │                                        │                  │
│         │         ┌──────────────────────┐        │                  │
│         │         │ DesignerKeyword (M2M)│        │                  │
│         │         ├──────────────────────┤        │                  │
│         │         │ designer_id (FK)     │←───────┘                  │
│         │         │ keyword_id (FK)      │   N:M                    │
│         │         │ (PK: composite)      │   Designer ↔ Keyword     │
│         │         └──────────────────────┘                          │
│         │                                                           │
│         │         ┌──────────────────────┐                          │
│         │         │ DesignerLanguage     │                          │
│         │         ├──────────────────────┤                          │
│         │         │ designer_id (FK)     │   N:M                    │
│         │         │ language (enum)      │   Designer ↔ Language    │
│         │         │ (PK: composite)      │                          │
│         │         └──────────────────────┘                          │
│         │                                                           │
└─────────┼───────────────────────────────────────────────────────────┘
          │
          │
┌─────────┼───────────────────────────────────────────────────────────┐
│         │        SERVICE & BOOKING                                  │
│         │                                                           │
│         │    ┌──────────────────┐       ┌──────────────────────┐    │
│         │    │    Service       │       │     Booking           │    │
│         │    ├──────────────────┤  1:N  ├──────────────────────┤    │
│         │    │ id (PK)          │──────→│ id (PK)              │    │
│         │    │ salon_id (FK)    │       │ customer_id (FK→User)│←─┐ │
│         │    │ name             │       │ designer_id (FK)     │  │ │
│         │    │ description      │       │ service_id (FK)      │  │ │
│         │    │ price            │       │ salon_id (FK)        │  │ │
│         │    │ duration_min     │       │ scheduled_at         │  │ │
│         │    │ category         │       │ status               │  │ │
│         │    │ is_active        │       │ note                 │  │ │
│         │    │ created_at       │       │ total_price          │  │ │
│         │    └──────────────────┘       │ created_at           │  │ │
│         │                               │ updated_at           │  │ │
│         │                               └──────────────────────┘  │ │
│         │                                                         │ │
└─────────┼─────────────────────────────────────────────────────────┼─┘
          │                                                         │
          │                                                         │
┌─────────┼─────────────────────────────────────────────────────────┼─┐
│         │        REVIEW & SOCIAL                                  │ │
│         │                                                         │ │
│         │    ┌──────────────────┐       ┌──────────────────┐      │ │
│         │    │    Review        │       │    Favorite      │      │ │
│         │    ├──────────────────┤       ├──────────────────┤      │ │
│         └───→│ id (PK)          │       │ id (PK)          │←─────┘ │
│              │ booking_id (FK)  │       │ customer_id (FK) │        │
│              │ customer_id (FK) │       │ designer_id (FK) │        │
│              │ designer_id (FK) │       │ created_at       │        │
│              │ rating (1-5)     │       └──────────────────┘        │
│              │ content          │                                   │
│              │ images[]         │                                   │
│              │ created_at       │                                   │
│              └──────────────────┘                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                          CHAT                                       │
│                                                                     │
│  ┌──────────────────┐       ┌──────────────────────┐                │
│  │   ChatRoom       │  1:N  │   ChatMessage        │                │
│  ├──────────────────┤──────→├──────────────────────┤                │
│  │ id (PK)          │       │ id (PK)              │                │
│  │ customer_id (FK) │       │ room_id (FK)         │                │
│  │ designer_id (FK) │       │ sender_id (FK→User)  │                │
│  │ last_message_at  │       │ content              │                │
│  │ created_at       │       │ message_type         │                │
│  └──────────────────┘       │ read_at              │                │
│                              │ created_at           │                │
│                              └──────────────────────┘                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. 테이블 상세

### 4.1 User

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

### 4.2 DesignerProfile

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
| created_at | TIMESTAMP | NOT NULL | |

> `highlight_message`는 현재 프론트엔드의 `message` 필드에 대응
> ("98% of Curly hair women were satisfied with Sejin.")

### 4.3 Salon

살롱/매장. MapView에 마커로 표시.

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| name | VARCHAR(200) | NOT NULL | 살롱 이름 |
| address | VARCHAR(500) | NOT NULL | 주소 |
| latitude | DECIMAL(10,7) | NOT NULL | 위도 |
| longitude | DECIMAL(10,7) | NOT NULL | 경도 |
| phone | VARCHAR(20) | | 매장 전화번호 |
| operating_hours | JSONB | | `{"mon": "10:00-20:00", ...}` |
| image_url | VARCHAR(500) | | 매장 대표 이미지 |
| created_at | TIMESTAMP | NOT NULL | |

### 4.4 Portfolio

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

### 4.5 KeywordCategory + Keyword

Discover 페이지 필터 시스템.

**KeywordCategory**

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| name | VARCHAR(50) | NOT NULL | 카테고리명 |
| slug | VARCHAR(50) | UNIQUE | `hair_type`, `service`, `length`, `style` |
| display_order | INT | DEFAULT 0 | 표시 순서 |

**Keyword**

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| category_id | UUID | FK→KeywordCategory | |
| name | VARCHAR(100) | NOT NULL | 키워드명 (e.g. "Curly", "Wavy") |
| slug | VARCHAR(100) | | URL용 |
| display_order | INT | DEFAULT 0 | 표시 순서 |

**DesignerKeyword** (N:M 조인 테이블)

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| designer_id | UUID | FK→DesignerProfile | |
| keyword_id | UUID | FK→Keyword | |
| | | PK(designer_id, keyword_id) | |

**DesignerLanguage** (N:M)

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| designer_id | UUID | FK→DesignerProfile | |
| language | VARCHAR(20) | NOT NULL | `korean`, `english`, ... |
| | | PK(designer_id, language) | |

### 4.6 Service

살롱에서 제공하는 시술 메뉴.

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

### 4.7 Booking

예약. 핵심 트랜잭션 테이블.

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| customer_id | UUID | FK→User | 예약 고객 |
| designer_id | UUID | FK→DesignerProfile | 담당 디자이너 |
| service_id | UUID | FK→Service | 시술 메뉴 |
| salon_id | UUID | FK→Salon | 매장 |
| scheduled_at | TIMESTAMP | NOT NULL | 예약 일시 |
| status | ENUM | NOT NULL | 아래 상태 참조 |
| note | TEXT | | 고객 요청사항 |
| total_price | INT | | 최종 가격 |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

**Booking Status Flow:**
```
PENDING → CONFIRMED → COMPLETED
   │          │
   └→ CANCELLED ←┘
```

### 4.8 Review

예약 완료 후 고객이 남기는 리뷰.

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

> Review 생성 시 트리거로 `DesignerProfile.rating_avg`, `review_count` 갱신

### 4.9 Favorite

고객의 디자이너 찜하기.

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| customer_id | UUID | FK→User | |
| designer_id | UUID | FK→DesignerProfile | |
| created_at | TIMESTAMP | NOT NULL | |
| | | UNIQUE(customer_id, designer_id) | |

### 4.10 ChatRoom + ChatMessage

고객-디자이너 1:1 채팅.

**ChatRoom**

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| customer_id | UUID | FK→User | |
| designer_id | UUID | FK→DesignerProfile | |
| last_message_at | TIMESTAMP | | 마지막 메시지 시각 |
| created_at | TIMESTAMP | NOT NULL | |
| | | UNIQUE(customer_id, designer_id) | |

**ChatMessage**

| Column | Type | Constraint | 설명 |
|--------|------|-----------|------|
| id | UUID | PK | |
| room_id | UUID | FK→ChatRoom | |
| sender_id | UUID | FK→User | 발신자 |
| content | TEXT | NOT NULL | 메시지 내용 |
| message_type | ENUM | DEFAULT 'TEXT' | `TEXT`, `IMAGE`, `BOOKING_LINK` |
| read_at | TIMESTAMP | NULLABLE | 읽은 시각 (NULL=미읽음) |
| created_at | TIMESTAMP | NOT NULL | |

---

## 5. 관계 요약

```
User (1) ──── (1) DesignerProfile
User (1) ──── (N) Booking (as customer)
User (1) ──── (N) Review (as customer)
User (1) ──── (N) Favorite (as customer)
User (1) ──── (N) ChatRoom (as customer)

DesignerProfile (N) ──── (1) Salon
DesignerProfile (1) ──── (N) Portfolio
DesignerProfile (N) ──── (M) Keyword       [via DesignerKeyword]
DesignerProfile (1) ──── (N) DesignerLanguage
DesignerProfile (1) ──── (N) Booking
DesignerProfile (1) ──── (N) Review
DesignerProfile (1) ──── (N) ChatRoom

Salon (1) ──── (N) Service
Salon (1) ──── (N) Booking

Service (1) ──── (N) Booking
Booking (1) ──── (1) Review

ChatRoom (1) ──── (N) ChatMessage

KeywordCategory (1) ──── (N) Keyword
```

---

## 6. 프론트엔드 ↔ DB 매핑

현재 프론트엔드 Mock 데이터가 실제 DB에서 어떻게 조회되는지:

| 프론트엔드 | DB Source |
|-----------|-----------|
| `DesignerCard.name` | `User.name` (JOIN DesignerProfile) |
| `DesignerCard.role` | `DesignerProfile` 기반 (고정값 or 컬럼 추가) |
| `DesignerCard.languages` | `DesignerLanguage` JOIN |
| `DesignerCard.profileImage` | `User.profile_image` |
| `DesignerCard.portfolioImage` | `Portfolio WHERE is_primary = true` |
| `DesignerCard.message` | `DesignerProfile.highlight_message` |
| `KeywordFilter` 칩 목록 | `KeywordCategory` + `Keyword` |
| `MapView` 마커 | `Salon.latitude`, `Salon.longitude` |

---

## 7. 인덱스 권장

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| User | `email` (UNIQUE) | 로그인 |
| DesignerProfile | `salon_id` | 살롱별 디자이너 조회 |
| Salon | `(latitude, longitude)` | 지도 범위 검색 (GiST) |
| Portfolio | `(designer_id, is_primary)` | 대표 이미지 조회 |
| DesignerKeyword | `keyword_id` | 키워드별 디자이너 필터링 |
| Booking | `(customer_id, status)` | 고객 예약 목록 |
| Booking | `(designer_id, scheduled_at)` | 디자이너 스케줄 |
| Review | `designer_id` | 디자이너 리뷰 목록 |
| ChatMessage | `(room_id, created_at)` | 채팅 메시지 정렬 |

---

## 8. 비정규화 전략

| 대상 | 비정규화 필드 | 이유 |
|------|-------------|------|
| DesignerProfile | `rating_avg`, `review_count` | 카드 목록에서 매번 Review 집계 방지 |
| ChatRoom | `last_message_at` | 채팅방 목록 정렬 |

> Review INSERT/UPDATE/DELETE 시 트리거 또는 애플리케이션 레벨에서 동기화

# Phase 1 SQL — Supabase 스키마 & 시드

> **Created**: 2026-04-20
> **Status**: Draft
> **Feature**: phase1-sql
> **Phase**: Plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | ERD §3 Phase 1이 문서 상태에 머물러 있어 실제 DB가 없고, Mock JSON(users/salons/designers)을 기반으로 한 Discover 기능을 백엔드로 전환할 수 없다 |
| **Solution** | Supabase(PostgreSQL) 기반으로 Phase 1 스키마 DDL + Keyword 마스터 + Mock 데이터 시드 SQL을 단계적으로 작성한다 |
| **기능 UX 효과** | 앱이 더 이상 하드코딩된 JSON이 아닌 실제 DB에서 살롱/디자이너/키워드를 조회하게 된다 |
| **핵심 가치** | ERD가 실행 가능한 DB로 구체화되어, 필터/검색/찜하기 등 Discover 기능이 실 데이터 위에서 동작할 토대를 마련 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | Mock JSON 기반 UI를 실제 DB 기반으로 전환하기 위한 첫 단계 |
| **WHO** | 백엔드 연동을 시작하는 개발자(본인), Discover 탭을 사용하는 고객 |
| **RISK** | `_ref` → UUID 매핑 실수로 FK 불일치, 키워드 분류 오류로 필터 결과 왜곡, RLS 부재로 인한 쓰기 보안 공백 |
| **SUCCESS** | Supabase 프로젝트에서 마이그레이션이 1회 실행으로 완료되고, 시드 후 Salon×N, Designer×N, Keyword×M 개가 정합성 있게 적재됨 |
| **SCOPE** | Phase 1 스키마 DDL + 인덱스 + Keyword 마스터 + users/salons/designers 시드. HairProfile/Article/Portfolio/Favorite은 스키마만. RLS 제외 |

---

## 1. 요구사항

### 1.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-01 | ERD §3 Phase 1의 11개 엔티티를 Supabase 마이그레이션 SQL로 생성 | Must |
| FR-02 | ERD §3.6 인덱스(GiST 포함) 생성 | Must |
| FR-03 | `KeywordCategory` 9개 + `Keyword` 마스터 데이터 시드 | Must |
| FR-04 | `Keyword.group_name` 컬럼 추가 (필터 §4 방안 B: 그룹 → 하위 펼침) | Must |
| FR-05 | `users.json` → `User` 테이블 시드 (임시 `external_ref`로 매핑) | Must |
| FR-06 | `salons.json` → `Salon` + `SalonKeyword`(시설/정책만) 시드 | Must |
| FR-07 | `designers.json` → `DesignerProfile` + `DesignerKeyword` 시드 | Must |
| FR-08 | `salons.json.services[]`를 소속 디자이너 전체의 `DesignerKeyword`에도 병합 부여 (A-2 정책) | Must |
| FR-09 | 시드 완료 후 `external_ref` 임시 컬럼 DROP | Should |
| FR-10 | `Salon.designer_count`를 디자이너 시드 후 UPDATE로 집계 | Should |
| FR-11 | `HairProfile` / `Article` / `Portfolio` / `Favorite`은 DDL만 생성, 시드 제외 | Must |

### 1.2 비기능 요구사항

| ID | 요구사항 | 기준 |
|----|---------|------|
| NFR-01 | 마이그레이션 재현성 | `supabase db reset` 한 번으로 깨끗하게 재생성 |
| NFR-02 | 파일 분리 | 스키마 / 인덱스 / 마스터 데이터 / Mock 시드를 별도 파일로 분리 |
| NFR-03 | 명명 규칙 | 테이블 `snake_case` (PostgreSQL 컨벤션), ERD의 PascalCase는 DDL에서 snake_case로 변환 (`designer_profile`, `salon_keyword`) |
| NFR-04 | 트랜잭션 | 각 시드 파일은 `BEGIN; ... COMMIT;`으로 원자성 보장 |
| NFR-05 | 멱등성 | 마스터 데이터 시드는 `ON CONFLICT DO NOTHING`으로 중복 실행 방지 |

### 1.3 범위 제외 (Out of Scope)

- RLS(Row-Level Security) 정책 — Auth 구현 시점에 별도 진행
- Phase 2/3/4 엔티티 (StyleTag, ChatRoom, Booking, Review 등)
- `HairProfile` / `Article` / `Portfolio` / `Favorite` 시드 데이터 (스키마만 생성)
- Prisma/Drizzle 등 ORM 연동 (향후 별도 PDCA)
- 애플리케이션 코드에서의 쿼리 레이어
- Storage(이미지 업로드) 버킷 설정 — `profile_photo` 파일명만 문자열로 저장
- 테스트 데이터 팩토리/시딩 자동화

---

## 2. 데이터 모델

### 2.1 테이블 목록 (ERD §3.2 기준)

| 테이블 (snake_case) | 시드 여부 | 비고 |
|---|---|---|
| `user` | ✅ | `users.json` |
| `salon` | ✅ | `salons.json` |
| `designer_profile` | ✅ | `designers.json` |
| `keyword_category` | ✅ | 마스터 9개 |
| `keyword` | ✅ | 마스터 (방안 B `group_name` 포함) |
| `designer_keyword` | ✅ | `_specialties` + `_hair_type_experience` + 살롱 `services` 집계 |
| `salon_keyword` | ✅ | 시설/정책만 |
| `hair_profile` | ❌ | 스키마만 |
| `article` | ❌ | 스키마만 |
| `portfolio` | ❌ | 스키마만 |
| `favorite` | ❌ | 스키마만 |

> `user`는 PostgreSQL 예약어와 충돌 가능 → 테이블명은 `"user"` 인용 또는 `app_user`로 리네임 검토 (Design phase에서 확정)

### 2.2 ERD 대비 추가/변경 컬럼

| 테이블 | 컬럼 | 이유 |
|--------|------|------|
| `user` | `external_ref VARCHAR(10) UNIQUE NULLABLE` | Mock `_ref` 매핑용 임시, 시드 후 DROP |
| `salon` | `external_ref VARCHAR(10) UNIQUE NULLABLE` | 동일 |
| `keyword` | `group_name VARCHAR(30)` | 필터 §4 방안 B (Cut/Color/Perm/Braids & Locs/Care/Barber 등 그룹) |

### 2.3 Keyword 그룹 매핑 (필터 §7 참조)

| group_name | 포함 Keyword 예시 | category_slug |
|---|---|---|
| Cut | Haircut, Layered Cut, Curly Cut, Big Chop, Afro Cut, Coily Cut, Kids Cut | treatment |
| Color | Coloring, Balayage, Highlights, Hair Coloring, Natural Hair Coloring, Grey Coverage | treatment |
| Perm | Perm, Korean Perm, Down Perm, Keratin Treatment | treatment |
| Braids & Locs | Braids, Locs, Cornrow, Protective Styles, Hair Extensions | treatment |
| Care | Head Spa, Scalp Treatment, Moisture Treatment, Blow Dry & Styling | treatment |
| Barber | Fade, Taper, Beard Trim, Line-up, Buzz Cut, Afro Trim, Hot Towel Shave | treatment |
| Hair Type | Fine Hair, Thick/Coarse Hair, Wavy Hair (2a-2c), Curly Hair (3a-3c), Coily Hair (4a-4c), Afro-Textured Hair, Bleached/Damaged Hair, Natural Hair, Asian Hair | hair_type |
| Facility | Pet Friendly, Private Room, Tax-free, English-speaking | special_offers |

> `group_name`은 `treatment`, `hair_type` 카테고리 내부에서 2단계 그룹핑 용도
> 다른 카테고리는 `group_name = NULL` 허용

---

## 3. 파일 구조

```
supabase/
  migrations/
    20260420000001_phase1_schema.sql      # CREATE TABLE (11개)
    20260420000002_phase1_indexes.sql     # CREATE INDEX (ERD §3.6)
    20260420000003_phase1_keywords.sql    # KeywordCategory + Keyword 마스터
  seed/
    10_users.sql                          # users.json → user (external_ref)
    20_salons.sql                         # salons.json → salon (external_ref)
    30_designers.sql                      # designers.json → designer_profile + designer_keyword
    40_salon_keywords.sql                 # salon_keyword (시설/정책 수동 지정)
    50_salon_services_merge.sql           # A-2: salons.services → 소속 디자이너 모두에게 추가 부여
    99_cleanup_refs.sql                   # external_ref 컬럼 DROP + designer_count UPDATE
```

> `supabase/seed.sql`은 위 seed 파일들을 `\i`로 include 하거나, Supabase CLI가 지원하는 방식으로 병합

---

## 4. 시드 실행 순서

```
1. migrations/20260420000001_phase1_schema.sql       (DDL)
2. migrations/20260420000002_phase1_indexes.sql      (INDEX)
3. migrations/20260420000003_phase1_keywords.sql     (KeywordCategory + Keyword)
   ↓
4. seed/10_users.sql                                 (user + external_ref='U001'…)
5. seed/20_salons.sql                                (salon + external_ref='S001'…)
6. seed/30_designers.sql                             (designer_profile: user/salon JOIN via external_ref)
                                                    (designer_keyword: _specialties + _hair_type_experience)
7. seed/40_salon_keywords.sql                        (salon_keyword: Facility 키워드 수동 부여)
8. seed/50_salon_services_merge.sql                  (A-2: salons.services → 소속 디자이너에게 추가)
9. seed/99_cleanup_refs.sql                          (external_ref DROP + designer_count UPDATE)
```

---

## 5. `_ref` 매핑 전략 (Q2 확정안: A)

### 5.1 왜 필요한가

Mock JSON은 디자이너가 `_salon_ref: "S001"`로 살롱을 참조하지만, DB의 실제 PK는 `UUID`다.
"Mock ID → UUID" 변환이 없으면 FK가 연결되지 않는다.

### 5.2 구현 방식

```sql
-- schema.sql
CREATE TABLE "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_ref VARCHAR(10) UNIQUE,   -- 'U001' 같은 Mock ID
  email VARCHAR(255) UNIQUE NOT NULL,
  ...
);

-- 10_users.sql
INSERT INTO "user" (external_ref, email, name, profile_image, role, password_hash, created_at, updated_at)
VALUES
  ('U001', 'u001@placeholder.local', 'Amara Diallo',  'photo_001.jpg', 'DESIGNER', '', NOW(), NOW()),
  ...

-- 30_designers.sql
INSERT INTO designer_profile (user_id, salon_id, bio, years_of_exp, ...)
SELECT
  u.id,
  s.id,
  'Specialist in Afro...',
  5,
  ...
FROM "user" u
JOIN salon s ON s.external_ref = 'S001'
WHERE u.external_ref = 'U001';

-- 99_cleanup_refs.sql
ALTER TABLE "user" DROP COLUMN external_ref;
ALTER TABLE salon DROP COLUMN external_ref;
```

---

## 6. 핵심 시드 규칙

### 6.1 `designer_keyword` 생성 로직

각 디자이너마다:
1. `_specialties[]` → `designer_keyword` (예: `Balayage`, `Curly Cut`)
2. `_hair_type_experience[]` → `designer_keyword` (예: `Curly Hair (3a-3c)`)
3. **소속 살롱의 `services[]`를 추가 부여** (A-2)
   → 예: `S001`의 `services`가 `Fade`, `Afro Trim` 등이면, `S001` 소속 디자이너 모두에게 해당 키워드 부여
   → 중복 방지: `ON CONFLICT (designer_id, keyword_id) DO NOTHING`

### 6.2 `salon_keyword` 생성 로직

- 시설/정책 키워드만 저장 (Pet Friendly, Private Room, Tax-free, English-speaking)
- `salons.json.english_available`이 `"Yes"` 또는 `"Partial"`이면 `English-speaking` 부여
- 나머지 시설 키워드는 Mock에 명시되어 있지 않으므로 **수동 샘플**로 2~3개 살롱에 부여 (`S001`→Barber 분위기, `S002`→English-speaking 등)

### 6.3 `salon.designer_count` 집계

```sql
UPDATE salon s
SET designer_count = (
  SELECT COUNT(*) FROM designer_profile dp WHERE dp.salon_id = s.id
);
```

### 6.4 `user.email`, `password_hash`

Mock에 없는 필드. 플레이스홀더 값 사용:
- `email`: `{ref_lowercase}@placeholder.local` (예: `u001@placeholder.local`)
- `password_hash`: 빈 문자열 `''` (NOT NULL 제약 대응, 실제 Auth는 Supabase Auth로 교체 예정)

---

## 7. 성공 기준

| ID | 기준 | 측정 방법 |
|----|------|---------|
| SC-01 | 스키마 11개 테이블이 ERD §3.2와 1:1 일치 | `\dt` 비교 |
| SC-02 | 인덱스 7개 생성 (ERD §3.6) | `\di` 비교 |
| SC-03 | `keyword_category` 9행, `keyword` N행 시드 | `SELECT COUNT(*)` |
| SC-04 | `user` = users.json 건수, `salon` = salons.json 건수, `designer_profile` = designers.json 건수 | `SELECT COUNT(*)` vs JSON 길이 |
| SC-05 | 모든 `designer_profile.salon_id`가 유효 (`IS NOT NULL` AND FK 참조 성공) | `LEFT JOIN` NULL 체크 |
| SC-06 | `designer_keyword` 수 = 각 디자이너별 (`_specialties` + `_hair_type_experience` + 살롱 `services`)의 중복 제거 합 | 샘플 디자이너 2~3명 수동 검증 |
| SC-07 | `salon.designer_count`가 실제 소속 디자이너 수와 일치 | `COUNT(*)` 비교 |
| SC-08 | `external_ref` 컬럼이 최종 상태에 존재하지 않음 | `\d "user"`, `\d salon` |
| SC-09 | `supabase db reset` 후 전체 파이프라인이 에러 없이 완료 | CLI exit code 0 |

---

## 8. 리스크 및 완화

| 리스크 | 영향 | 완화 방안 |
|--------|------|-----------|
| `_ref` 매핑 실수 (디자이너가 잘못된 살롱에 연결) | Discover 결과 오류 | SC-05로 검증, `FOREIGN KEY` NOT NULL 제약 |
| 키워드 이름 대소문자/공백 차이로 중복 키워드 생성 | 필터 결과 파편화 | `keyword.slug` UNIQUE로 정규화, 시드 전 normalize 스크립트 |
| `services[]`의 키워드가 `keyword` 테이블에 없음 | INSERT 실패 | 시드 시 `INSERT ... ON CONFLICT DO NOTHING` + 사전 존재 검증 쿼리 |
| `user` 예약어 충돌 | 쿼리 파싱 에러 | `"user"` 인용 또는 `app_user`로 리네임 (Design에서 결정) |
| RLS 부재 상태에서 Supabase 클라이언트가 쓰기 가능 | 보안 공백 | Phase 1은 `service_role` 키로만 접근, 클라이언트는 읽기 전용 RLS 적용은 Phase 2 |
| `password_hash = ''`가 Supabase Auth와 충돌 | 로그인 실패 | Auth 전환 시 `user` 테이블을 `auth.users`와 분리/링크하는 설계 재검토 (Phase 2) |

---

## 9. 작업 단계 (차근차근)

사용자 요청에 따라 단계별로 확인받으며 진행.

| Step | 산출물 | 확인 포인트 |
|------|--------|------------|
| 1 | `20260420000001_phase1_schema.sql` | 테이블/컬럼/ENUM 이름, 타입, 제약조건 |
| 2 | `20260420000002_phase1_indexes.sql` | 인덱스 선택, GiST vs B-tree |
| 3 | `20260420000003_phase1_keywords.sql` | 9개 카테고리 + Keyword 마스터 리스트 + group_name 분류 |
| 4 | `10_users.sql` + `20_salons.sql` | `external_ref` 매핑, 플레이스홀더 값 |
| 5 | `30_designers.sql` | JOIN 기반 FK 연결, `_specialties` + `_hair_type_experience` 변환 |
| 6 | `40_salon_keywords.sql` + `50_salon_services_merge.sql` | A-2 병합 로직, 중복 방지 |
| 7 | `99_cleanup_refs.sql` | 최종 정리, `designer_count` 집계 |
| 8 | `supabase db reset` 검증 | SC 전체 통과 |

각 Step 완료 후 사용자 리뷰 → 다음 Step 진행.

---

## 10. 관련 문서

- [ERD](../erd.md) — Phase 1 엔티티 정의
- [Filter Design Discussion](../filter-design-discussion.md) §4 방안 B, §7 Service 그룹 매핑
- [Directory Structure](../directory-structure.md)

---

## 11. 다음 단계

- `/pdca design phase1-sql` — 3가지 아키텍처 옵션 비교 후 DDL 세부 설계
- 또는 Plan 그대로 OK면 Design 생략하고 `/pdca do phase1-sql`로 Step 1부터 진행 (사용자 선택)

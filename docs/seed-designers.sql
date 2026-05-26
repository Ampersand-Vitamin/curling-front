-- ============================================================
-- 디자이너 목데이터 시드 (8명 + 포트폴리오 각 4장)
-- ============================================================

DO $$
DECLARE
  d1 uuid := 'a0000000-0000-0000-0000-000000000001';
  d2 uuid := 'a0000000-0000-0000-0000-000000000002';
  d3 uuid := 'a0000000-0000-0000-0000-000000000003';
  d4 uuid := 'a0000000-0000-0000-0000-000000000004';
  d5 uuid := 'a0000000-0000-0000-0000-000000000005';
  d6 uuid := 'a0000000-0000-0000-0000-000000000006';
  d7 uuid := 'a0000000-0000-0000-0000-000000000007';
  d8 uuid := 'a0000000-0000-0000-0000-000000000008';
  me uuid;
BEGIN
  SELECT id INTO me FROM auth.users ORDER BY created_at DESC LIMIT 1;

  -- ── 0. 기존 테스트 데이터 정리 ────────────────────────────
  DELETE FROM favorite_designer
  WHERE designer_id IN (d1, d2, d3, d4, d5, d6, d7, d8);

  DELETE FROM onboarding_profiles
  WHERE user_id IN (d1::text, d2::text, d3::text, d4::text, d5::text,
                    d6::text, d7::text, d8::text);

  DELETE FROM auth.users
  WHERE id IN (d1, d2, d3, d4, d5, d6, d7, d8);

  -- ── 1. auth.users ──────────────────────────────────────────
  INSERT INTO auth.users (id, aud, role, email, encrypted_password, created_at, updated_at, is_sso_user)
  VALUES
    (d1, 'authenticated', 'authenticated', 'sejin@curling.test',   '', now(), now(), false),
    (d2, 'authenticated', 'authenticated', 'mina@curling.test',    '', now(), now(), false),
    (d3, 'authenticated', 'authenticated', 'amy@curling.test',     '', now(), now(), false),
    (d4, 'authenticated', 'authenticated', 'jiyeon@curling.test',  '', now(), now(), false),
    (d5, 'authenticated', 'authenticated', 'haerin@curling.test',  '', now(), now(), false),
    (d6, 'authenticated', 'authenticated', 'soyeon@curling.test',  '', now(), now(), false),
    (d7, 'authenticated', 'authenticated', 'rachel@curling.test',  '', now(), now(), false),
    (d8, 'authenticated', 'authenticated', 'yuna@curling.test',    '', now(), now(), false)
  ON CONFLICT (id) DO NOTHING;

  -- ── 2. onboarding_profiles ────────────────────────────────
  -- avatar_url은 null (추후 Supabase Storage 업로드 후 UPDATE)
  INSERT INTO onboarding_profiles (
    user_id, account_mode,
    name, salon_name, languages, avatar_url,
    specialty,
    updated_at
  ) VALUES
    (d1, 'designer', 'Sejin',  'Salon de Sea',    ARRAY['ko','en'],      null, ARRAY['Balayage','Color','Curl Perm'],               now()),
    (d2, 'designer', 'Mina',   'Hair Studio M',   ARRAY['ko','ja'],      null, ARRAY['Layered Cut','Straight Perm','Treatment'],    now()),
    (d3, 'designer', 'Amy',    'The Curl Bar',    ARRAY['ko','en','zh'], null, ARRAY['Curly Cut','Curl Perm','Curl Styling'],        now()),
    (d4, 'designer', 'Jiyeon', 'Studio J',        ARRAY['ko','en'],      null, ARRAY['Men''s Cut','Fade Cut','Men''s Styling'],      now()),
    (d5, 'designer', 'Haerin', 'Nouvelle Hair',   ARRAY['ko','fr'],      null, ARRAY['Lived-in Color','Highlights','Glossy Treatment'], now()),
    (d6, 'designer', 'Soyeon', 'Atelier So',      ARRAY['ko','en','ja'], null, ARRAY['Root Shadow','Wolf Cut','Perm'],               now()),
    (d7, 'designer', 'Rachel', 'R Hair Studio',   ARRAY['ko','en'],      null, ARRAY['Highlights','Curtain Bangs','Moisture Care'],  now()),
    (d8, 'designer', 'Yuna',   'Bloom Hair',      ARRAY['ko','zh'],      null, ARRAY['C-Curl Perm','Natural Dyeing','Scalp Spa'],    now())
  ON CONFLICT (user_id) DO UPDATE SET
    name       = EXCLUDED.name,
    salon_name = EXCLUDED.salon_name,
    languages  = EXCLUDED.languages,
    specialty  = EXCLUDED.specialty,
    updated_at = now();

  -- ── 3. designer_portfolio (인당 4장) ───────────────────────
  DELETE FROM designer_portfolio
  WHERE designer_id IN (d1, d2, d3, d4, d5, d6, d7, d8);

  INSERT INTO designer_portfolio (designer_id, image_url, sort_order) VALUES
    -- Sejin (5장)
    (d1, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Sejin/Sejin-1.jpg', 0),
    (d1, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Sejin/Sejin-2.jpg', 1),
    (d1, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Sejin/Sejin-3.jpg', 2),
    (d1, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Sejin/Sejin-4.jpg', 3),
    (d1, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Sejin/Sejin-5.jpg', 4),
    -- Mina (4장)
    (d2, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Mina/Mina-1.jpg', 0),
    (d2, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Mina/Mina-2.jpg', 1),
    (d2, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Mina/Mina-3.jpg', 2),
    (d2, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Mina/Mina-4.jpg', 3),
    -- Amy (8장)
    (d3, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Amy/Amy-1.jpg', 0),
    (d3, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Amy/Amy-2.jpg', 1),
    (d3, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Amy/Amy-3.jpg', 2),
    (d3, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Amy/Amy-4.jpg', 3),
    (d3, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Amy/Amy-5.jpg', 4),
    (d3, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Amy/Amy-6.jpg', 5),
    (d3, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Amy/Amy-7.jpg', 6),
    (d3, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Amy/Amy-8.jpg', 7),
    -- Jiyeon (4장)
    (d4, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Jiyeon/Jiyeon-1.jpg', 0),
    (d4, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Jiyeon/Jiyeon-2.jpg', 1),
    (d4, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Jiyeon/Jiyeon-3.jpg', 2),
    (d4, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Jiyeon/Jiyeon-4.jpg', 3),
    -- Haerin (6장)
    (d5, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Haerin/Haerin-1.jpg', 0),
    (d5, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Haerin/Haerin-2.jpg', 1),
    (d5, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Haerin/Haerin-3.jpg', 2),
    (d5, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Haerin/Haerin-4.jpg', 3),
    (d5, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Haerin/Haerin-5.jpg', 4),
    (d5, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Haerin/Haerin-6.jpg', 5),
    -- Soyeon (5장)
    (d6, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Soyeon/Soyeon-1.jpg', 0),
    (d6, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Soyeon/Soyeon-2.jpg', 1),
    (d6, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Soyeon/Soyeon-3.jpg', 2),
    (d6, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Soyeon/Soyeon-4.jpg', 3),
    (d6, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Soyeon/Soyeon-5.jpg', 4),
    -- Rachel (4장)
    (d7, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Rachel/Rachel-1.jpg', 0),
    (d7, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Rachel/Rachel-2.jpg', 1),
    (d7, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Rachel/Rachel-3.jpg', 2),
    (d7, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Rachel/Rachel-4.jpg', 3),
    -- Yuna (4장)
    (d8, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Yuna/Yuna-1.jpg', 0),
    (d8, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Yuna/Yuna-2.jpg', 1),
    (d8, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Yuna/Yuna-3.jpg', 2),
    (d8, 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Portfolios/Yuna/Yuna-4.jpg', 3);

  -- ── 4. favorite_designer (본인 → 2명만) ──────────────────────
  INSERT INTO favorite_designer (user_id, designer_id)
  VALUES
    (me, d1),  -- Sejin
    (me, d3)   -- Amy
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Done — 8 designers seeded / my id: %', me;
END $$;

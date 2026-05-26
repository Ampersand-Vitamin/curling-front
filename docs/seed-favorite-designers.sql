-- 테스트용 디자이너 3명 + 즐겨찾기 시드 데이터
-- 현재 로그인한 유저(본인)를 자동으로 즐겨찾기 주인으로 사용

DO $$
DECLARE
  d1 uuid := 'a0000000-0000-0000-0000-000000000001';
  d2 uuid := 'a0000000-0000-0000-0000-000000000002';
  d3 uuid := 'a0000000-0000-0000-0000-000000000003';
  me uuid;
BEGIN
  -- 현재 유저 ID (가장 최근 가입 = 본인)
  SELECT id INTO me FROM auth.users ORDER BY created_at DESC LIMIT 1;

  -- auth.users에 더미 디자이너 삽입
  INSERT INTO auth.users (id, aud, role, email, encrypted_password, created_at, updated_at, is_sso_user)
  VALUES
    (d1, 'authenticated', 'authenticated', 'sejin@curling.test', '', now(), now(), false),
    (d2, 'authenticated', 'authenticated', 'mina@curling.test',  '', now(), now(), false),
    (d3, 'authenticated', 'authenticated', 'amy@curling.test',   '', now(), now(), false)
  ON CONFLICT (id) DO NOTHING;

  -- 디자이너 프로필
  INSERT INTO onboarding_profiles (user_id, account_mode, name, updated_at)
  VALUES
    (d1, 'designer', 'Sejin', now()),
    (d2, 'designer', 'Mina',  now()),
    (d3, 'designer', 'Amy',   now())
  ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name;

  -- 즐겨찾기 연결
  INSERT INTO favorite_designer (user_id, designer_id)
  VALUES
    (me, d1),
    (me, d2),
    (me, d3)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Done — me: %, Sejin: %, Mina: %, Amy: %', me, d1, d2, d3;
END $$;

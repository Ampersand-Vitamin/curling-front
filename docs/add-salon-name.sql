-- onboarding_profiles에 salon_name 컬럼 추가
ALTER TABLE onboarding_profiles
  ADD COLUMN IF NOT EXISTS salon_name TEXT;

-- 기존 시드 디자이너 살롱명 업데이트
UPDATE onboarding_profiles SET salon_name = 'Salon de Sea'  WHERE user_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE onboarding_profiles SET salon_name = 'Hair Studio M' WHERE user_id = 'a0000000-0000-0000-0000-000000000002';
UPDATE onboarding_profiles SET salon_name = 'The Curl Bar'  WHERE user_id = 'a0000000-0000-0000-0000-000000000003';

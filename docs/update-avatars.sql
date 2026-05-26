-- 디자이너 프로필 사진 URL 업데이트
-- Supabase Storage > Avatars 버킷에 업로드 후 실행

UPDATE onboarding_profiles SET avatar_url = 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Avatars/Sejin.jpg'
WHERE user_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE onboarding_profiles SET avatar_url = 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Avatars/Mina.jpg'
WHERE user_id = 'a0000000-0000-0000-0000-000000000002';

UPDATE onboarding_profiles SET avatar_url = 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Avatars/Amy.jpg'
WHERE user_id = 'a0000000-0000-0000-0000-000000000003';

UPDATE onboarding_profiles SET avatar_url = 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Avatars/Jiyeon.jpg'
WHERE user_id = 'a0000000-0000-0000-0000-000000000004';

UPDATE onboarding_profiles SET avatar_url = 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Avatars/Haerin.jpg'
WHERE user_id = 'a0000000-0000-0000-0000-000000000005';

UPDATE onboarding_profiles SET avatar_url = 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Avatars/Soyeon.jpg'
WHERE user_id = 'a0000000-0000-0000-0000-000000000006';

UPDATE onboarding_profiles SET avatar_url = 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Avatars/Rachel.jpg'
WHERE user_id = 'a0000000-0000-0000-0000-000000000007';

UPDATE onboarding_profiles SET avatar_url = 'https://xzjhaobvxvjmeoqipatu.supabase.co/storage/v1/object/public/Avatars/Yuna.jpg'
WHERE user_id = 'a0000000-0000-0000-0000-000000000008';

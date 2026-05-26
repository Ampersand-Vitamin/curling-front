-- 메시지에 이미지 지원 추가
-- message_type: 'text' (기본) | 'image'
-- image_url: Storage 경로 (message_type = 'image' 일 때 사용)

ALTER TABLE public.message
  ADD COLUMN IF NOT EXISTS message_type VARCHAR(10) NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- chat-images 버킷 (없으면 생성)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- 인증 유저 업로드 허용
CREATE POLICY "chat_images_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-images' AND auth.uid() IS NOT NULL);

-- 공개 읽기
CREATE POLICY "chat_images_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');

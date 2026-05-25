CREATE TABLE IF NOT EXISTS public.quick_reply (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL DEFAULT 'greeting',
  content JSONB NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quick_reply ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quick_reply_select" ON public.quick_reply;
CREATE POLICY "quick_reply_select" ON public.quick_reply FOR SELECT
  USING (true);

INSERT INTO public.quick_reply (type, content, sort_order)
SELECT type, content::jsonb, sort_order
FROM (
  VALUES
    ('greeting', '{"ko":"안녕하세요! 상담 받고 싶어요","en":"Hi! I''d like a consultation","ja":"こんにちは！相談したいです"}', 1),
    ('booking', '{"ko":"예약 가능한 날짜가 언제인가요?","en":"When are you available?","ja":"予約可能な日はいつですか？"}', 2),
    ('price', '{"ko":"가격이 어떻게 되나요?","en":"How much does it cost?","ja":"料金はいくらですか？"}', 3)
) AS seed(type, content, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.quick_reply existing
  WHERE existing.type = seed.type
    AND existing.sort_order = seed.sort_order
);

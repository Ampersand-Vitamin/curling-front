-- ============================================================
-- 메시지 시스템 MVP — conversation + message
-- 클라이언트 ↔ 디자이너 1:1 텍스트 채팅
--
-- 전제: designer_profile.user_id 가 Auth 연결되어 있어야 RLS 동작
--
-- 확장 포인트 (ALTER TABLE ADD):
--   conversation: status, blocked_by, last_message_preview, unread_count
--   message:      message_type, metadata(JSONB), read_at, deleted_at
-- ============================================================


-- ─── 1. conversation (대화방) ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.conversation (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  designer_id     UUID NOT NULL REFERENCES public.designer_profile(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,     -- 목록 정렬 기준
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, designer_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_client_latest
  ON public.conversation (client_id, last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_conv_designer_latest
  ON public.conversation (designer_id, last_message_at DESC NULLS LAST);


-- ─── 2. message (메시지) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.message (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversation(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_msg_conv_created
  ON public.message (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_msg_unread
  ON public.message (conversation_id, is_read) WHERE is_read = false;


-- ─── 3. 헬퍼 함수 ───────────────────────────────────────────

-- 참여자 확인 (RLS용)
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation c
    LEFT JOIN public.designer_profile dp ON dp.id = c.designer_id
    WHERE c.id = conv_id
      AND (c.client_id = auth.uid() OR dp.user_id = auth.uid())
  );
$$;


-- ─── 4. 트리거: last_message_at 갱신 ────────────────────────

CREATE OR REPLACE FUNCTION public.on_message_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.conversation
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_message_insert
  AFTER INSERT ON public.message
  FOR EACH ROW EXECUTE FUNCTION public.on_message_insert();


-- ─── 5. RPC ──────────────────────────────────────────────────

-- 대화방 get-or-create (디자이너 프로필에서 "메시지" 클릭 시)
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_designer_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_conv_id UUID;
BEGIN
  SELECT id INTO v_conv_id
  FROM public.conversation
  WHERE client_id = auth.uid() AND designer_id = p_designer_id;

  IF v_conv_id IS NULL THEN
    INSERT INTO public.conversation (client_id, designer_id)
    VALUES (auth.uid(), p_designer_id)
    RETURNING id INTO v_conv_id;
  END IF;

  RETURN v_conv_id;
END;
$$;

-- 읽음 처리 (대화방 진입 시 호출)
CREATE OR REPLACE FUNCTION public.mark_messages_read(p_conversation_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_conversation_participant(p_conversation_id) THEN
    RAISE EXCEPTION 'Not a participant';
  END IF;

  UPDATE public.message
  SET is_read = true
  WHERE conversation_id = p_conversation_id
    AND is_read = false
    AND sender_id IS DISTINCT FROM auth.uid();
END;
$$;


-- ─── 6. RLS ──────────────────────────────────────────────────

ALTER TABLE public.conversation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message      ENABLE ROW LEVEL SECURITY;

-- conversation: 참여자만 조회
CREATE POLICY "conversation_select" ON public.conversation FOR SELECT USING (
  client_id = auth.uid()
  OR designer_id IN (SELECT id FROM public.designer_profile WHERE user_id = auth.uid())
);

-- conversation: 클라이언트만 생성
CREATE POLICY "conversation_insert" ON public.conversation FOR INSERT
  WITH CHECK (client_id = auth.uid());

-- message: 참여자만 조회
CREATE POLICY "message_select" ON public.message FOR SELECT USING (
  public.is_conversation_participant(conversation_id)
);

-- message: 참여자만 발신
CREATE POLICY "message_insert" ON public.message FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND public.is_conversation_participant(conversation_id)
);

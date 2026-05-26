-- ================================================================
-- 미용실 예약/채팅 서비스 DB 스키마
-- ================================================================


-- ----------------------------------------------------------------
-- 1. 기본 채팅 테이블
-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS conversation (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  designer_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  status          TEXT DEFAULT 'active',
  -- 'active' | 'closed'
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS message (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     UUID NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
  sender_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content             TEXT NOT NULL,
  is_read             BOOLEAN DEFAULT false,
  content_translated  JSONB,
  -- { "ko": "...", "en": "...", "ja": "...", "zh": "..." }
  is_quick_reply      BOOLEAN DEFAULT false,
  sender_lang         VARCHAR(10),
  created_at          TIMESTAMPTZ DEFAULT now()
);


-- ----------------------------------------------------------------
-- 2. 자동응답 템플릿
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quick_reply (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type       TEXT NOT NULL,
  -- 'available_times' | 'services' | 'prices' | 'booking'
  content    JSONB NOT NULL,
  -- { "ko": "...", "en": "...", "ja": "...", "zh": "..." }
  sort_order INT     DEFAULT 0,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO quick_reply (type, content, sort_order) VALUES
  ('available_times', '{"ko":"예약 가능 시간을 확인해드릴게요!","en":"Let me show you our available times!","ja":"予約可能な時間をご案内します！","zh":"为您查看可预约时间！"}', 1),
  ('services',        '{"ko":"시술 목록을 안내해드릴게요!","en":"Here are our services!","ja":"施術メニューをご案内します！","zh":"为您介绍我们的服务！"}', 2),
  ('prices',          '{"ko":"가격표를 안내해드릴게요!","en":"Here is our price list!","ja":"料金表をご案内します！","zh":"为您介绍价格表！"}', 3),
  ('booking',         '{"ko":"예약을 도와드릴게요!","en":"Let me help you with a booking!","ja":"予約のお手伝いをします！","zh":"为您协助预约！"}', 4)
ON CONFLICT DO NOTHING;


-- ----------------------------------------------------------------
-- 3. 시술 (서비스) — 디자이너별
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         JSONB NOT NULL,
  -- { "ko": "펌", "en": "Perm", "ja": "パーマ", "zh": "烫发" }
  description  JSONB,
  price        INT  NOT NULL,   -- 원화 기준
  duration_min INT  NOT NULL DEFAULT 60,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);


-- ----------------------------------------------------------------
-- 4. 영업시간 (요일별 기본) — 디자이너별
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_hours (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INT  NOT NULL,
  -- 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
  open_time   TIME NOT NULL DEFAULT '10:00',
  close_time  TIME NOT NULL DEFAULT '19:00',
  is_closed   BOOLEAN DEFAULT false,
  UNIQUE (designer_id, day_of_week)
);


-- ----------------------------------------------------------------
-- 5. 예외 날짜 (휴무, 단축 등) — 디자이너별
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedule_exception (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  is_closed   BOOLEAN DEFAULT false,
  open_time   TIME,   -- null이면 당일 전체 휴무
  close_time  TIME,
  reason      TEXT,   -- "개인 사정", "공휴일" 등
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (designer_id, date)
);


-- ----------------------------------------------------------------
-- 6. 예약
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversation(id) ON DELETE SET NULL,
  client_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  designer_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id      UUID REFERENCES service(id) ON DELETE SET NULL,
  booking_date    DATE NOT NULL,
  booking_time    TIME NOT NULL,
  status          TEXT DEFAULT 'pending',
  -- 'pending' | 'confirmed' | 'rejected'
  client_memo     TEXT,
  designer_memo   TEXT,
  rejected_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);


-- ----------------------------------------------------------------
-- 7. updated_at 자동 갱신 트리거
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_service_updated_at
  BEFORE UPDATE ON service
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_booking_updated_at
  BEFORE UPDATE ON booking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ----------------------------------------------------------------
-- 8. 인덱스
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_message_conversation_id    ON message(conversation_id);
CREATE INDEX IF NOT EXISTS idx_service_designer_id        ON service(designer_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_designer_id ON business_hours(designer_id);
CREATE INDEX IF NOT EXISTS idx_schedule_exception_date    ON schedule_exception(designer_id, date);
CREATE INDEX IF NOT EXISTS idx_booking_client_id          ON booking(client_id);
CREATE INDEX IF NOT EXISTS idx_booking_designer_id        ON booking(designer_id);
CREATE INDEX IF NOT EXISTS idx_booking_status             ON booking(status);
CREATE INDEX IF NOT EXISTS idx_booking_date               ON booking(booking_date);


-- ----------------------------------------------------------------
-- 9. RLS (Row Level Security)
-- ----------------------------------------------------------------

-- message: 해당 conversation 참여자(client/designer)만 접근
ALTER TABLE message ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message: participant read" ON message
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversation
      WHERE client_id = auth.uid() OR designer_id = auth.uid()
    )
  );

CREATE POLICY "message: participant insert" ON message
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM conversation
      WHERE client_id = auth.uid() OR designer_id = auth.uid()
    )
  );

CREATE POLICY "message: participant update" ON message
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM conversation
      WHERE client_id = auth.uid() OR designer_id = auth.uid()
    )
  );

-- conversation: 참여자만 접근
ALTER TABLE conversation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversation: participant only" ON conversation
  USING (client_id = auth.uid() OR designer_id = auth.uid());

-- booking: 고객 또는 해당 디자이너만 접근
ALTER TABLE booking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking: own read" ON booking
  FOR SELECT USING (client_id = auth.uid() OR designer_id = auth.uid());

CREATE POLICY "booking: client insert" ON booking
  FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "booking: designer update" ON booking
  FOR UPDATE USING (designer_id = auth.uid());

-- service: 누구나 조회, 본인(디자이너)만 수정
ALTER TABLE service ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service: public read" ON service
  FOR SELECT USING (true);

CREATE POLICY "service: designer write" ON service
  FOR ALL USING (designer_id = auth.uid());

-- business_hours: 누구나 조회, 본인(디자이너)만 수정
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_hours: public read" ON business_hours
  FOR SELECT USING (true);

CREATE POLICY "business_hours: designer write" ON business_hours
  FOR ALL USING (designer_id = auth.uid());

-- schedule_exception: 누구나 조회, 본인(디자이너)만 수정
ALTER TABLE schedule_exception ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedule_exception: public read" ON schedule_exception
  FOR SELECT USING (true);

CREATE POLICY "schedule_exception: designer write" ON schedule_exception
  FOR ALL USING (designer_id = auth.uid());

-- quick_reply: 누구나 읽기 (관리자가 별도 관리)
ALTER TABLE quick_reply ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quick_reply: public read" ON quick_reply
  FOR SELECT USING (true);


-- ----------------------------------------------------------------
-- 10. Supabase Realtime 활성화
-- ----------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE message;
ALTER PUBLICATION supabase_realtime ADD TABLE booking;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation;

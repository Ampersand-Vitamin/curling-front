-- ================================================================
-- 테스트용 채팅 시드 데이터
-- Sejin → chloeshin0614@gmail.com 메시지 삽입
-- Supabase Dashboard > SQL Editor에서 실행 (service_role 권한)
-- ================================================================

DO $$
DECLARE
  sejin_id   UUID := 'a0000000-0000-0000-0000-000000000001';
  v_client_id UUID;
  conv_id    UUID;
BEGIN

  -- 1. chloeshin0614@gmail.com 의 user_id 조회
  SELECT id INTO v_client_id
  FROM auth.users
  WHERE email = 'chloeshin0614@gmail.com'
  LIMIT 1;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'chloeshin0614@gmail.com 유저를 찾을 수 없습니다.';
  END IF;

  -- 2. 기존 conversation 조회 또는 새로 생성
  SELECT id INTO conv_id
  FROM conversation
  WHERE client_id = v_client_id
    AND designer_id = sejin_id
  LIMIT 1;

  IF conv_id IS NULL THEN
    INSERT INTO conversation (client_id, designer_id, last_message_at, status)
    VALUES (v_client_id, sejin_id, now(), 'active')
    RETURNING id INTO conv_id;
  END IF;

  -- 3. Sejin이 보내는 메시지 삽입
  -- content_translated는 NULL로 둠 → 채팅 화면 진입 시 Google Translate API가 자동 번역 후 DB에 캐싱
  INSERT INTO message (
    conversation_id,
    sender_id,
    content,
    sender_lang,
    is_read,
    created_at
  ) VALUES (
    conv_id,
    sejin_id,
    '네 말씀하신 스타일로 예약 도와드릴게요!',
    'ko',
    false,
    now()
  );

  -- 4. conversation last_message_at 갱신
  UPDATE conversation
  SET last_message_at = now()
  WHERE id = conv_id;

  RAISE NOTICE '완료: conversation_id = %, client_id = %', conv_id, v_client_id;
END $$;

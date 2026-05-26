-- 중복 conversation 삭제 (client+designer 쌍에서 가장 오래된 것만 유지)
DELETE FROM conversation
WHERE id NOT IN (
  SELECT DISTINCT ON (client_id, designer_id) id
  FROM conversation
  ORDER BY client_id, designer_id, created_at ASC
);

-- 동일 client+designer 쌍으로 conversation 중복 생성 방지
ALTER TABLE conversation
  DROP CONSTRAINT IF EXISTS conversation_client_designer_unique;

ALTER TABLE conversation
  ADD CONSTRAINT conversation_client_designer_unique
  UNIQUE (client_id, designer_id);

-- favorite_portfolio 테이블 생성
-- 사용자가 즐겨찾기한 포트폴리오 이미지 관리

CREATE TABLE IF NOT EXISTS favorite_portfolio (
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_id UUID        NOT NULL REFERENCES designer_portfolio(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, portfolio_id)
);

ALTER TABLE favorite_portfolio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fp_select_own" ON favorite_portfolio;
DROP POLICY IF EXISTS "fp_insert_own" ON favorite_portfolio;
DROP POLICY IF EXISTS "fp_delete_own" ON favorite_portfolio;

CREATE POLICY "fp_select_own" ON favorite_portfolio FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "fp_insert_own" ON favorite_portfolio FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "fp_delete_own" ON favorite_portfolio FOR DELETE USING (user_id = auth.uid());

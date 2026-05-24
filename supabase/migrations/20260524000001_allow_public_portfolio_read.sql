-- Discover/Style public read access for portfolio thumbnails.
-- Portfolio rows are public browsing content; writes stay restricted.

ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portfolio_public_read ON public.portfolio;

CREATE POLICY portfolio_public_read
  ON public.portfolio
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.portfolio TO anon, authenticated;

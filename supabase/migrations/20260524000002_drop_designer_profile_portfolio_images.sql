-- Portfolio images now live in public.portfolio.
-- Designer detail and Discover read portfolio.image_path through portfolio.designer_id.

ALTER TABLE public.designer_profile
  DROP COLUMN IF EXISTS portfolio_images;

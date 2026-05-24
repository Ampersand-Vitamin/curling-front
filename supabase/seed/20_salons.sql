-- Phase 1 — Salon 시드 (50 rows from salons.json)
-- 원본: docs/00-mock/salons.json (또는 Downloads/salons.json)
--
-- 변환 규칙:
--   type:              "Barber" → 'barber' 등 lowercase
--   english_available: "Yes"     → ARRAY['english']
--                      "Partial" → ARRAY['english_partial']
--   designer_count:    JSON number_of_designers 그대로 (나중에 COUNT로 재집계)
--   is_featured:       기본 false (운영 시 수동 지정)

BEGIN;

INSERT INTO public.salon
  (external_ref, name, address, latitude, longitude, phone, type, neighborhood, introduction, languages, designer_count)
VALUES
  ('S001', 'Bros Barbershop', '성수이로 14길 22, 성동구', 37.5450183, 127.054475, '02-440-5012', 'barber', 'Seongsu', 'Classic cuts, modern fades. We''ve worked with every hair type — from fine to coarse, straight to coily.', ARRAY['english'], 1),
  ('S002', 'Velvet Cut', '경리단길 30, 용산구', 37.5379696, 126.9893094, '02-646-9935', 'salon', 'Gyeongnidan', 'A welcoming space for foreigners in Seoul. We speak your language and understand your hair.', ARRAY['english'], 2),
  ('S003', 'Atelier Hair', '서교동 407-7, 마포구', 37.5550608, 126.9223658, '02-315-2535', 'salon', 'Seogyo-dong', 'A welcoming space for foreigners in Seoul. We speak your language and understand your hair.', ARRAY['english'], 1),
  ('S004', 'CurlHaven Seoul', '압구정로 46길 9, 강남구', 37.5261559, 127.0276161, '02-313-4257', 'specialty', 'Apgujeong', 'Specializing exclusively in textured hair — 3a through 4c. No straightening, no guessing.', ARRAY['english'], 1),
  ('S005', 'The Hair Room', '삼청로 24, 종로구', 37.5844481, 126.981704, '02-514-4611', 'salon', 'Samcheong', 'We believe every hair type deserves expert care. Our multilingual team is ready to help you achieve your dream look.', ARRAY['english'], 5),
  ('S006', 'Cloud Nine Hair', '보광로 60, 용산구', 37.5311476, 126.9965346, '02-745-1106', 'salon', 'Bogwang-dong', 'We believe every hair type deserves expert care. Our multilingual team is ready to help you achieve your dream look.', ARRAY['english'], 1),
  ('S007', 'Mono Hair Studio', '이태원로 27길 18, 용산구', 37.5354764, 126.993579, '02-516-6574', 'salon', 'Itaewon', 'We believe every hair type deserves expert care. Our multilingual team is ready to help you achieve your dream look.', ARRAY['english'], 3),
  ('S008', 'Palette Hair', '삼청로 24, 종로구', 37.5831336, 126.9802459, '02-690-6514', 'salon', 'Samcheong', 'Seoul''s go-to studio for balayage, textured cuts, and curl-friendly services.', ARRAY['english'], 1),
  ('S009', 'Bloom Hair Lounge', '신촌로 45, 서대문구', 37.5584066, 126.9421398, '02-483-6635', 'salon', 'Sinchon', 'A welcoming space for foreigners in Seoul. We speak your language and understand your hair.', ARRAY['english_partial'], 3),
  ('S010', 'The Barber Collective', '서교동 407-7, 마포구', 37.5566112, 126.9235214, '02-673-8527', 'barber', 'Seogyo-dong', 'Classic cuts, modern fades. We''ve worked with every hair type — from fine to coarse, straight to coily.', ARRAY['english'], 4),
  ('S011', 'Noona Hair', '테헤란로 38, 강남구', 37.5016087, 127.0409193, '02-493-2291', 'salon', 'Gangnam', 'From sleek bobs to voluminous curls — our stylists are trained in a wide range of textures and styles.', ARRAY['english'], 3),
  ('S012', 'District Barber', '한남대로 42길 5, 용산구', 37.5345561, 127.0021882, '02-616-6925', 'barber', 'Hannam-dong', 'A laid-back barbershop where every head gets the attention it deserves.', ARRAY['english'], 2),
  ('S013', 'Chaehee''s Corner', '테헤란로 38, 강남구', 37.5017321, 127.0401137, '02-323-4733', 'independent', 'Gangnam', 'By appointment only. Specializing in curly and wavy hair for Seoul''s expat community.', ARRAY['english'], 2),
  ('S014', 'Möbius Hair', '삼청로 24, 종로구', 37.5846192, 126.9825557, '02-737-4814', 'salon', 'Samcheong', 'A modern hair studio in the heart of Seoul, specializing in diverse hair textures and international clientele.', ARRAY['english'], 4),
  ('S015', 'Texture Studio', '서교동 407-7, 마포구', 37.5573995, 126.9222404, '02-532-6977', 'specialty', 'Seogyo-dong', 'We live and breathe curls. Our team is certified in the Curly Girl Method and trained in protective styles.', ARRAY['english'], 5),
  ('S016', 'Afro Asia Studio', '경리단길 30, 용산구', 37.537788, 126.9881658, '02-643-5374', 'specialty', 'Gyeongnidan', 'Seoul''s first dedicated curly and coily hair studio. If you''ve struggled to find someone who gets your hair, you''re home.', ARRAY['english'], 4),
  ('S017', 'Signal Hair', '을지로 3가 15, 중구', 37.5668055, 126.9918506, '02-336-3803', 'salon', 'Euljiro', 'From sleek bobs to voluminous curls — our stylists are trained in a wide range of textures and styles.', ARRAY['english_partial'], 5),
  ('S018', 'Faded Seoul', '녹사평대로 196, 용산구', 37.5346024, 126.9869344, '02-536-7216', 'barber', 'Nokseopyeong', 'Seoul''s most foreigner-friendly barbershop. Walk-ins welcome, English spoken.', ARRAY['english'], 1),
  ('S019', 'Sora''s Place', '테헤란로 38, 강남구', 37.5008098, 127.0407762, '02-652-4598', 'independent', 'Gangnam', 'Small shop, big results. Book directly with the stylist for a truly personalized experience.', ARRAY['english_partial'], 1),
  ('S020', 'Sharp & Sons', '한남대로 42길 5, 용산구', 37.5349538, 127.0022286, '02-697-1916', 'barber', 'Hannam-dong', 'A laid-back barbershop where every head gets the attention it deserves.', ARRAY['english'], 1),
  ('S021', 'Iron & Blade', '삼청로 24, 종로구', 37.5829871, 126.9796963, '02-461-7572', 'barber', 'Samcheong', 'Classic cuts, modern fades. We''ve worked with every hair type — from fine to coarse, straight to coily.', ARRAY['english'], 5),
  ('S022', 'Clippers & Co.', '신촌로 45, 서대문구', 37.5589032, 126.9416329, '02-782-6155', 'barber', 'Sinchon', 'A laid-back barbershop where every head gets the attention it deserves.', ARRAY['english'], 1),
  ('S023', 'Hajin''s Place', '신촌로 45, 서대문구', 37.5587379, 126.9424977, '02-752-8517', 'independent', 'Sinchon', 'A quiet, private space for those who want quality over quantity. Foreign hair types always welcome.', ARRAY['english'], 1),
  ('S024', 'Ember Hair', '서교동 407-7, 마포구', 37.5552286, 126.9215189, '02-681-9830', 'salon', 'Seogyo-dong', 'From sleek bobs to voluminous curls — our stylists are trained in a wide range of textures and styles.', ARRAY['english_partial'], 2),
  ('S025', 'By Yura', '보광로 60, 용산구', 37.5305882, 126.9974538, '02-759-7543', 'independent', 'Bogwang-dong', 'A quiet, private space for those who want quality over quantity. Foreign hair types always welcome.', ARRAY['english'], 5),
  ('S026', 'Dami''s Cut', '을지로 3가 15, 중구', 37.565786, 126.992792, '02-370-9348', 'independent', 'Euljiro', 'Small shop, big results. Book directly with the stylist for a truly personalized experience.', ARRAY['english'], 2),
  ('S027', 'Craft Barber Seoul', '신촌로 45, 서대문구', 37.5595805, 126.9432673, '02-740-2796', 'barber', 'Sinchon', 'Seoul''s most foreigner-friendly barbershop. Walk-ins welcome, English spoken.', ARRAY['english'], 4),
  ('S028', 'Kink & Coil Lab', '서교동 407-7, 마포구', 37.5552585, 126.9215799, '02-648-7916', 'specialty', 'Seogyo-dong', 'Specializing exclusively in textured hair — 3a through 4c. No straightening, no guessing.', ARRAY['english'], 4),
  ('S029', 'Itaewon Cuts', '압구정로 46길 9, 강남구', 37.5272892, 127.0272543, '02-605-8668', 'barber', 'Apgujeong', 'A laid-back barbershop where every head gets the attention it deserves.', ARRAY['english'], 4),
  ('S030', 'Forme Studio', '을지로 3가 15, 중구', 37.5662873, 126.9927132, '02-740-1188', 'salon', 'Euljiro', 'Seoul''s go-to studio for balayage, textured cuts, and curl-friendly services.', ARRAY['english'], 4),
  ('S031', 'The Gentleman''s Cut', '경리단길 30, 용산구', 37.5393409, 126.9874437, '02-753-9797', 'barber', 'Gyeongnidan', 'Classic cuts, modern fades. We''ve worked with every hair type — from fine to coarse, straight to coily.', ARRAY['english'], 5),
  ('S032', 'Hue Studio', '연희로 11나길 8, 서대문구', 37.5685526, 126.9341058, '02-474-2827', 'salon', 'Yeonhee-dong', 'From sleek bobs to voluminous curls — our stylists are trained in a wide range of textures and styles.', ARRAY['english_partial'], 5),
  ('S033', 'King''s Barber', '보광로 60, 용산구', 37.5306805, 126.9961745, '02-301-5315', 'barber', 'Bogwang-dong', 'Classic cuts, modern fades. We''ve worked with every hair type — from fine to coarse, straight to coily.', ARRAY['english'], 2),
  ('S034', 'Salon de Miel', '경리단길 30, 용산구', 37.5402157, 126.9893859, '02-559-2743', 'independent', 'Gyeongnidan', 'A quiet, private space for those who want quality over quantity. Foreign hair types always welcome.', ARRAY['english'], 1),
  ('S035', 'Strand Theory', '녹사평대로 196, 용산구', 37.5356116, 126.9870953, '02-627-9317', 'salon', 'Nokseopyeong', 'A modern hair studio in the heart of Seoul, specializing in diverse hair textures and international clientele.', ARRAY['english'], 2),
  ('S036', 'Fade Culture', '테헤란로 38, 강남구', 37.5018269, 127.0384585, '02-690-3646', 'barber', 'Gangnam', 'Precision cuts for every texture. Our barbers are experienced with Afro, curly, and wavy hair.', ARRAY['english'], 5),
  ('S037', 'Hannam Barber Co.', '녹사평대로 196, 용산구', 37.5346181, 126.9885359, '02-571-1009', 'barber', 'Nokseopyeong', 'Classic cuts, modern fades. We''ve worked with every hair type — from fine to coarse, straight to coily.', ARRAY['english'], 3),
  ('S038', 'The Curl Lab', '삼청로 24, 종로구', 37.5840968, 126.9810658, '02-357-6947', 'salon', 'Samcheong', 'From sleek bobs to voluminous curls — our stylists are trained in a wide range of textures and styles.', ARRAY['english_partial'], 1),
  ('S039', 'Tint & Texture', '홍익로 5길 12, 마포구', 37.5574362, 126.925995, '02-457-4923', 'salon', 'Hongdae', 'A modern hair studio in the heart of Seoul, specializing in diverse hair textures and international clientele.', ARRAY['english'], 5),
  ('S040', 'Harbor Cut', '신촌로 45, 서대문구', 37.5582738, 126.943634, '02-784-2290', 'salon', 'Sinchon', 'A welcoming space for foreigners in Seoul. We speak your language and understand your hair.', ARRAY['english'], 5),
  ('S041', 'Soyeon Studio', '연희로 11나길 8, 서대문구', 37.566557, 126.933258, '02-335-9727', 'independent', 'Yeonhee-dong', 'By appointment only. Specializing in curly and wavy hair for Seoul''s expat community.', ARRAY['english'], 2),
  ('S042', 'Refinery Seoul', '신촌로 45, 서대문구', 37.5603975, 126.9413852, '02-543-3705', 'salon', 'Sinchon', 'Seoul''s go-to studio for balayage, textured cuts, and curl-friendly services.', ARRAY['english'], 3),
  ('S043', 'Minkyung Hair', '테헤란로 38, 강남구', 37.5007952, 127.0406173, '02-516-4470', 'independent', 'Gangnam', 'A cozy one-person studio run by a passionate stylist with 8+ years of experience in foreign hair textures.', ARRAY['english_partial'], 4),
  ('S044', 'Raw Studio', '을지로 3가 15, 중구', 37.5674867, 126.9920658, '02-653-4295', 'salon', 'Euljiro', 'A modern hair studio in the heart of Seoul, specializing in diverse hair textures and international clientele.', ARRAY['english_partial'], 5),
  ('S045', 'Miru Hair', '삼청로 24, 종로구', 37.5844388, 126.980797, '02-643-7118', 'independent', 'Samcheong', 'A quiet, private space for those who want quality over quantity. Foreign hair types always welcome.', ARRAY['english'], 4),
  ('S046', 'Colonial Barber', '한남대로 42길 5, 용산구', 37.5342143, 127.0012527, '02-361-5061', 'barber', 'Hannam-dong', 'A laid-back barbershop where every head gets the attention it deserves.', ARRAY['english'], 5),
  ('S047', 'Studio Yeon', '서교동 407-7, 마포구', 37.5554741, 126.9221143, '02-601-4770', 'salon', 'Seogyo-dong', 'A welcoming space for foreigners in Seoul. We speak your language and understand your hair.', ARRAY['english'], 3),
  ('S048', 'Lune Hair', '보광로 60, 용산구', 37.5315653, 126.9957216, '02-662-1964', 'salon', 'Bogwang-dong', 'A modern hair studio in the heart of Seoul, specializing in diverse hair textures and international clientele.', ARRAY['english_partial'], 1),
  ('S049', 'Aura Hair', '이태원로 27길 18, 용산구', 37.5338868, 126.9958163, '02-740-6413', 'salon', 'Itaewon', 'A modern hair studio in the heart of Seoul, specializing in diverse hair textures and international clientele.', ARRAY['english_partial'], 1),
  ('S050', 'Jiyeon Hair', '녹사평대로 196, 용산구', 37.5332126, 126.986914, '02-642-8953', 'independent', 'Nokseopyeong', 'A cozy one-person studio run by a passionate stylist with 8+ years of experience in foreign hair textures.', ARRAY['english'], 6)
ON CONFLICT (external_ref) DO NOTHING;

COMMIT;

-- 검증 쿼리
-- SELECT COUNT(*) FROM public.salon;                              -- 50이어야 함
-- SELECT type, COUNT(*) FROM public.salon GROUP BY type;          -- salon/barber/specialty/independent 분포
-- SELECT neighborhood, COUNT(*) FROM public.salon GROUP BY neighborhood ORDER BY 2 DESC;
-- SELECT COUNT(*) FROM public.salon WHERE 'english_partial' = ANY(languages);  -- Partial 살롱 수

import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { supabaseAdmin } from "@/lib/supabase-server";

const JINA_API_URL = "https://api.jina.ai/v1/embeddings";
const JINA_API_KEY = process.env.JINA_API_KEY;

/**
 * POST /api/search
 *
 * 이미지를 받아서:
 * 1. 헤어 영역 크롭 → Voyage AI로 벡터 변환
 * 2. Supabase pgvector에서 유사 포트폴리오 검색
 * 3. 디자이너 정보와 함께 반환
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "이미지가 필요합니다." },
        { status: 400 },
      );
    }

    // 1. 헤어 영역 크롭 → 벡터 변환
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const croppedBuffer = await cropHairRegion(rawBuffer);
    const resizedBuffer = await sharp(croppedBuffer)
      .resize(224, 224, { fit: "cover" })
      .jpeg({ quality: 85 })
      .toBuffer();

    const embedding = await getEmbedding(resizedBuffer);

    if (!embedding) {
      return NextResponse.json(
        { error: "이미지 벡터 변환에 실패했습니다." },
        { status: 500 },
      );
    }

    // 2. Supabase에서 유사도 검색
    const { data: matches, error } = await supabaseAdmin.rpc(
      "match_portfolios",
      {
        query_embedding: embedding,
        match_count: 5,
      },
    );

    if (error) {
      console.error("Supabase 검색 오류:", error);
      return NextResponse.json(
        { error: "검색에 실패했습니다." },
        { status: 500 },
      );
    }

    // 3. 디자이너 정보 조인
    const designerIds = [
      ...new Set(matches.map((m: { designer_id: number }) => m.designer_id)),
    ];

    const { data: designers } = await supabaseAdmin
      .from("designers")
      .select("*")
      .in("id", designerIds);

    const designerMap = new Map(
      designers?.map((d: { id: number }) => [d.id, d]) ?? [],
    );

    const results = matches.map(
      (m: {
        portfolio_id: number;
        designer_id: number;
        image_url: string;
        similarity: number;
      }) => ({
        portfolio: {
          id: m.portfolio_id,
          imageUrl: m.image_url,
        },
        designer: designerMap.get(m.designer_id),
        similarity: Math.round(m.similarity * 1000) / 10,
      }),
    );

    return NextResponse.json({ matches: results });
  } catch (err) {
    console.error("검색 API 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

/**
 * Jina AI CLIP v2로 이미지 임베딩 벡터 생성
 */
async function getEmbedding(imageBuffer: Buffer): Promise<number[] | null> {
  if (!JINA_API_KEY) {
    console.error("JINA_API_KEY가 설정되지 않았습니다.");
    return null;
  }

  const base64Image = imageBuffer.toString("base64");

  try {
    const res = await fetch(JINA_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${JINA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "jina-clip-v2",
        input: [
          { image: `data:image/jpeg;base64,${base64Image}` },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Jina API 오류:", res.status, err);
      return null;
    }

    const data = await res.json();

    if (data.data?.[0]?.embedding) {
      return data.data[0].embedding;
    }

    console.error("예상치 못한 Jina API 응답:", JSON.stringify(data).slice(0, 200));
    return null;
  } catch (err) {
    console.error("임베딩 오류:", err);
    return null;
  }
}

/**
 * 헤어 영역 크롭
 * 이미지 상단 60%를 사용 (얼굴 위 헤어 영역 포함)
 */
async function cropHairRegion(imageBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width!;
  const height = metadata.height!;

  return sharp(imageBuffer)
    .extract({ left: 0, top: 0, width, height: Math.round(height * 0.6) })
    .toBuffer();
}

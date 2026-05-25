import { NextRequest, NextResponse } from "next/server";

const GOOGLE_TRANSLATE_URL =
  "https://translation.googleapis.com/language/translate/v2";

export async function POST(req: NextRequest) {
  const { text, targetLang, sourceLang } = await req.json();

  if (!text || !targetLang) {
    return NextResponse.json({ error: "text and targetLang are required" }, { status: 400 });
  }

  if (sourceLang && sourceLang === targetLang) {
    return NextResponse.json({ translatedText: text });
  }

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Translation API not configured" }, { status: 500 });
  }

  const res = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      target: targetLang,
      ...(sourceLang ? { source: sourceLang } : {}),
      format: "text",
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  const translatedText = data.data.translations[0].translatedText as string;

  return NextResponse.json({ translatedText });
}

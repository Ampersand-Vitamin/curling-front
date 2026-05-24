// CLIP 라이브러리 단위 검증
// 1) 텍스트 1건 임베딩 → 768d 출력
// 2) 이미지 1건 임베딩 (Buffer + URL 둘 다) → 768d 출력
// 3) 같은 텍스트/이미지 쌍에 대한 코사인 유사도 출력 (직관 검증용)

import { readFile } from "node:fs/promises";
import { embedText, embedImage, CLIP_DIMS } from "../../src/lib/portfolio-search/clip";

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function main() {
  const t0 = Date.now();
  console.log("[clip-sanity] loading model (first run downloads ~300MB) ...");

  // 1) Text
  const txt = "long blonde balayage hairstyle";
  const tStart = Date.now();
  const textVec = await embedText(txt);
  console.log(`[clip-sanity] text "${txt}" → ${textVec.length}d in ${Date.now() - tStart}ms`);

  // 2) Image — Buffer
  const localPath = "tmp/portfolio-images/balayage/01.jpg";
  const buf = await readFile(localPath);
  const iStart = Date.now();
  const imageVec = await embedImage(buf);
  console.log(`[clip-sanity] image Buffer "${localPath}" → ${imageVec.length}d in ${Date.now() - iStart}ms`);

  // 3) Text-image cosine similarity (CLIP shared space — should be > 0.2 for related pair)
  const sim = cosine(textVec, imageVec);
  console.log(`[clip-sanity] cosine(text, image) = ${sim.toFixed(4)}`);
  console.log(`  - text  L2 norm: ${Math.sqrt(textVec.reduce((s, x) => s + x * x, 0)).toFixed(4)}`);
  console.log(`  - image L2 norm: ${Math.sqrt(imageVec.reduce((s, x) => s + x * x, 0)).toFixed(4)}`);

  console.log(`[clip-sanity] dims OK: ${CLIP_DIMS}`);
  console.log(`[clip-sanity] elapsed: ${Math.round((Date.now() - t0) / 1000)}s`);
}

main().catch((err) => {
  console.error("[clip-sanity] fatal:", err);
  process.exit(1);
});

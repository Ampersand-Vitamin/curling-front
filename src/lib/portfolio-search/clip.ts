// CLIP unified embedding (text + image) — server-only.
//
// Design Ref: §3 — Option B (CLIP unified 768d projection space).
// 모델: Xenova/clip-vit-large-patch14 — vision + text sub-model 분리 호출 필요.
//   (generic feature-extraction pipeline 은 multimodal 결합 입력만 받아 단독 호출 불가)
//
// 출력:
//   - text_embeds / image_embeds 모두 768d projection
//   - 같은 공간 — cross-modal cosine similarity 가능
//   - L2 normalize 는 명시적으로 수행 (transformers.js 가 자동 처리 안 함)

import {
  AutoTokenizer,
  AutoProcessor,
  CLIPTextModelWithProjection,
  CLIPVisionModelWithProjection,
  RawImage,
  env,
  type PreTrainedTokenizer,
  type Processor,
  type PreTrainedModel,
} from "@xenova/transformers";
import sharp from "sharp";

// 모델 다운로드 캐시 — Vercel serverless 는 /tmp 만 쓰기 가능
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.cacheDir = process.env.TRANSFORMERS_CACHE ?? "/tmp/transformers-cache";

const MODEL_ID = "Xenova/clip-vit-large-patch14";
export const CLIP_DIMS = 768;

// 모듈 lifetime 캐시
let _tokenizer: PreTrainedTokenizer | null = null;
let _processor: Processor | null = null;
let _textModel: PreTrainedModel | null = null;
let _visionModel: PreTrainedModel | null = null;

function ensureServer() {
  if (typeof window !== "undefined") {
    throw new Error("[clip] CLIP inference is server-only");
  }
}

async function getText(): Promise<{ tokenizer: PreTrainedTokenizer; model: PreTrainedModel }> {
  ensureServer();
  if (_tokenizer && _textModel) return { tokenizer: _tokenizer, model: _textModel };
  _tokenizer = (await AutoTokenizer.from_pretrained(MODEL_ID)) as PreTrainedTokenizer;
  _textModel = (await CLIPTextModelWithProjection.from_pretrained(MODEL_ID)) as PreTrainedModel;
  return { tokenizer: _tokenizer, model: _textModel };
}

async function getVision(): Promise<{ processor: Processor; model: PreTrainedModel }> {
  ensureServer();
  if (_processor && _visionModel) return { processor: _processor, model: _visionModel };
  _processor = (await AutoProcessor.from_pretrained(MODEL_ID)) as Processor;
  _visionModel = (await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID)) as PreTrainedModel;
  return { processor: _processor, model: _visionModel };
}

function l2Normalize(v: number[]): number[] {
  let sum = 0;
  for (const x of v) sum += x * x;
  const norm = Math.sqrt(sum);
  if (norm === 0) return v;
  return v.map((x) => x / norm);
}

/**
 * Buffer → RawImage (sharp 로 raw RGB 픽셀 추출).
 * @xenova/transformers v2.17 의 RawImage.read 는 Buffer/Blob 입력 미지원 — 수동 변환 필요.
 */
async function bufferToRawImage(buf: Buffer): Promise<RawImage> {
  const { data, info } = await sharp(buf)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // RawImage(data: Uint8ClampedArray, width, height, channels)
  return new RawImage(new Uint8ClampedArray(data), info.width, info.height, info.channels);
}

/** 이미지를 768d L2-normalized 벡터로. input: Buffer | file path | URL string */
export async function embedImage(input: Buffer | string): Promise<number[]> {
  const { processor, model } = await getVision();

  const img =
    typeof input === "string"
      ? await RawImage.read(input)
      : await bufferToRawImage(input);

  // AutoProcessor 가 224x224 리사이즈 + 정규화 처리
  const image_inputs = await processor(img);
  const { image_embeds } = await model(image_inputs);
  const data = image_embeds.data as Float32Array;
  const v = Array.from(data);
  if (v.length !== CLIP_DIMS) {
    throw new Error(`[clip/image] unexpected dims: ${v.length}`);
  }
  return l2Normalize(v);
}

/** 텍스트를 768d L2-normalized 벡터로. CLIP context 77 token. */
export async function embedText(text: string): Promise<number[]> {
  const { tokenizer, model } = await getText();
  const trimmed = text.trim().slice(0, 200);
  if (!trimmed) throw new Error("[clip/text] empty input");

  const text_inputs = tokenizer([trimmed], { padding: true, truncation: true });
  const { text_embeds } = await model(text_inputs);
  const data = text_embeds.data as Float32Array;
  const v = Array.from(data);
  if (v.length !== CLIP_DIMS) {
    throw new Error(`[clip/text] unexpected dims: ${v.length}`);
  }
  return l2Normalize(v);
}

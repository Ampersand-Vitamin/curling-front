"""
데모 디자이너 + 포트폴리오 시드 스크립트 (Voyage AI)

1. 데모 디자이너 10명 생성
2. sample-data/images/ 30장을 포트폴리오로 등록
3. 각 이미지의 Voyage AI 임베딩을 계산하여 DB에 저장

사용법:
  python3 scripts/embedding/seed-demo.py

필요:
  pip3 install requests python-dotenv supabase
  .env에 SUPABASE_SERVICE_ROLE_KEY, VOYAGE_API_KEY 설정
"""

from __future__ import annotations

import os
import sys
import base64
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

# .env 로드
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
JINA_API_KEY = os.environ.get("JINA_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ .env에 NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 설정해주세요.")
    sys.exit(1)

if not JINA_API_KEY:
    print("❌ .env에 JINA_API_KEY를 설정해주세요.")
    sys.exit(1)

from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

IMAGES_DIR = Path(__file__).resolve().parents[2] / "sample-data" / "images"
JINA_API_URL = "https://api.jina.ai/v1/embeddings"

# ── 데모 디자이너 ────────────────────────────────

DEMO_DESIGNERS = [
    {"name": "김서연", "bio": "웜톤 레이어드 전문", "role": "Hair Designer", "languages": ["korean"]},
    {"name": "이준호", "bio": "남성 투블럭/테이퍼 전문", "role": "Hair Designer", "languages": ["korean"]},
    {"name": "박지은", "bio": "보브컷/숏컷 전문가", "role": "Hair Designer", "languages": ["korean", "english"]},
    {"name": "최민수", "bio": "컬/웨이브 퍼머 전문", "role": "Hair Designer", "languages": ["korean"]},
    {"name": "정하늘", "bio": "애쉬/실버 염색 전문", "role": "Color Specialist", "languages": ["korean", "english"]},
    {"name": "Yuki", "bio": "ピクシーカット専門", "role": "Hair Designer", "languages": ["korean", "english"]},
    {"name": "강다인", "bio": "롱헤어 스타일링 전문", "role": "Hair Designer", "languages": ["korean"]},
    {"name": "오세진", "bio": "블론드/하이라이트 전문", "role": "Color Specialist", "languages": ["korean", "english"]},
    {"name": "한소율", "bio": "빈티지/레트로 스타일 전문", "role": "Hair Designer", "languages": ["korean"]},
    {"name": "윤태영", "bio": "남성 클래식컷 전문", "role": "Hair Designer", "languages": ["korean"]},
]


def get_embedding(image_path: Path) -> list[float] | None:
    """Jina AI CLIP v2로 이미지 임베딩 생성"""
    with open(image_path, "rb") as f:
        base64_image = base64.b64encode(f.read()).decode("utf-8")

    # 이미지 확장자 감지
    ext = image_path.suffix.lower()
    mime = {"jpg": "jpeg", "jpeg": "jpeg", "png": "png", "webp": "webp"}.get(ext.lstrip("."), "jpeg")

    res = requests.post(
        JINA_API_URL,
        headers={
            "Authorization": f"Bearer {JINA_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": "jina-clip-v2",
            "input": [
                {"image": f"data:image/{mime};base64,{base64_image}"}
            ],
        },
        timeout=30,
    )

    if res.status_code != 200:
        print(f"   ❌ Jina API 오류: {res.status_code} {res.text[:200]}")
        return None

    data = res.json()
    if data.get("data") and data["data"][0].get("embedding"):
        return data["data"][0]["embedding"]

    return None


def main():
    image_files = sorted([
        f for f in IMAGES_DIR.iterdir()
        if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")
    ])

    if not image_files:
        print(f"❌ {IMAGES_DIR}에 이미지가 없습니다.")
        sys.exit(1)

    print(f"📁 이미지 {len(image_files)}장 발견\n")

    # 1. 기존 데이터 정리
    print("🗑️  기존 데모 데이터 정리...")
    supabase.table("portfolios").delete().neq("id", 0).execute()
    supabase.table("designers").delete().neq("id", 0).execute()

    # 2. 디자이너 생성
    print("👤 디자이너 10명 생성...")
    designer_ids = []
    for d in DEMO_DESIGNERS:
        result = supabase.table("designers").insert(d).execute()
        designer_ids.append(result.data[0]["id"])
        print(f"   ✅ {d['name']}")

    # 3. 포트폴리오 생성 + 임베딩
    print(f"\n🖼️  포트폴리오 {len(image_files)}장 임베딩 + 저장...\n")

    for i, img_path in enumerate(image_files):
        designer_idx = i % len(designer_ids)
        designer_id = designer_ids[designer_idx]
        designer_name = DEMO_DESIGNERS[designer_idx]["name"]

        vector = get_embedding(img_path)
        if not vector:
            continue

        portfolio_data = {
            "designer_id": designer_id,
            "image_url": f"/sample-data/images/{img_path.name}",
            "description": img_path.stem,
            "embedding": vector,
        }

        supabase.table("portfolios").insert(portfolio_data).execute()
        print(f"   ✅ {img_path.name} → {designer_name} (벡터 {len(vector)}차원)")

        # Rate limit 방지
        time.sleep(0.5)

    # 4. 확인
    count = supabase.table("portfolios").select("id", count="exact").execute()
    print(f"\n✅ 완료: 디자이너 {len(designer_ids)}명, 포트폴리오 {count.count}장")


if __name__ == "__main__":
    main()

"use client";

import { useMatchStore, type MatchedDesigner } from "../store/matchStore";

function SimilarityBadge({ value }: { value: number }) {
  const color =
    value >= 80
      ? "bg-green-500/20 text-green-400"
      : value >= 60
        ? "bg-yellow-500/20 text-yellow-400"
        : "bg-surface-500/20 text-surface-300";

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {value}%
    </span>
  );
}

function MatchCard({ match }: { match: MatchedDesigner }) {
  const { designer, portfolio, similarity } = match;

  return (
    <div className="flex gap-3 p-3 rounded-xl bg-surface-800">
      {/* 포트폴리오 이미지 */}
      <div className="w-[80px] h-[80px] rounded-lg overflow-hidden shrink-0 bg-surface-700">
        <img
          src={portfolio.imageUrl}
          alt={`${designer.name}의 포트폴리오`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 디자이너 정보 */}
      <div className="flex flex-col justify-center gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-surface-50 font-medium text-sm truncate">
            {designer.name}
          </span>
          <SimilarityBadge value={similarity} />
        </div>
        <span className="text-surface-400 text-xs">{designer.role}</span>
        {designer.bio && (
          <p className="text-surface-300 text-xs truncate">{designer.bio}</p>
        )}
      </div>
    </div>
  );
}

export default function MatchedDesignerList() {
  const { matches, imagePreview, reset } = useMatchStore();

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-surface-400 text-sm">매칭 결과가 없습니다.</p>
        <button
          type="button"
          onClick={reset}
          className="text-surface-300 text-sm underline"
        >
          다시 시��
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 업로드 이미지 미리보기 (작게) */}
      {imagePreview && (
        <div className="flex items-center gap-3">
          <div className="w-[48px] h-[48px] rounded-lg overflow-hidden shrink-0">
            <img
              src={imagePreview}
              alt="업로드 이미지"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-surface-50 text-sm font-medium">
              유사한 디자이너 {matches.length}명
            </p>
            <p className="text-surface-400 text-xs">
              벡터 유사도 기반 매칭
            </p>
          </div>
        </div>
      )}

      {/* 매칭 결과 리스트 */}
      <div className="flex flex-col gap-2">
        {matches.map((match) => (
          <MatchCard key={match.portfolio.id} match={match} />
        ))}
      </div>

      {/* 다시 검색 */}
      <button
        type="button"
        onClick={reset}
        className="w-full py-3 rounded-xl border border-surface-600 text-surface-300 text-sm hover:bg-surface-800 transition-colors"
      >
        다른 이미지로 검색
      </button>
    </div>
  );
}

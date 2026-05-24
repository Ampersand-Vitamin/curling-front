// Figma Ref: 363:11550 (Review — 수평 스크롤 카드)
// Mock 데이터 (DS-11). designerId 해시로 변형 분기.

import { getMockReviews, type MockReview } from "@/mocks/designer-reviews";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 text-secondary-400" aria-label={`${rating} of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={i < rating ? "currentColor" : "none"}
          stroke={i < rating ? "none" : "currentColor"}
          strokeWidth="1.5"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: MockReview }) {
  return (
    <article className="w-[280px] shrink-0 bg-surface-100 rounded-lg px-4 py-3 flex flex-col gap-2.5">
      <StarRating rating={review.rating} />
      <div className="flex flex-col gap-1">
        <p className="typo-h6 text-surface-950 line-clamp-2">
          &ldquo;{review.body}&rdquo;
        </p>
        <p className="typo-caption text-surface-600 line-clamp-3">
          — {review.authorName}
        </p>
      </div>
    </article>
  );
}

interface Props {
  designerId: string;
}

export default function ReviewSection({ designerId }: Props) {
  const reviews = getMockReviews(designerId);
  if (reviews.length === 0) return null;

  return (
    <section className="py-5">
      <div className="flex justify-between items-center px-4 mb-3">
        <h2 className="typo-h4 text-surface-950">Review</h2>
        <button type="button" className="typo-caption text-surface-400 underline">
          view all
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide">
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
    </section>
  );
}

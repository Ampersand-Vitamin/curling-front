// Design Ref: §4.17, §6.9, FR-14 — designer-detail
// Mock 데이터 (DS-11). designerId 해시로 변형 분기.

import { getMockReviews, type MockReview } from "@/mocks/designer-reviews";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-alert-500" aria-label={`${rating} of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="12"
          height="12"
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
    <article className="border border-surface-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <StarRating rating={review.rating} />
        <span className="typo-caption2 text-surface-500">{review.authorName}</span>
      </div>
      <p className="typo-body2 text-surface-700 leading-relaxed">{review.body}</p>
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
    <section className="px-4 py-5">
      <div className="flex justify-between items-center mb-3">
        <h2 className="typo-h6 text-surface-950">Review</h2>
        <button type="button" className="typo-button text-surface-500 active:text-surface-700">
          View more
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
    </section>
  );
}

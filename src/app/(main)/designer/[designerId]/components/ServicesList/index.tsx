// Design Ref: §4.16, §6.8, FR-13 — designer-detail
// Mock 데이터 (DS-11). designerId 해시로 변형 분기.

import { getMockServices } from "@/mocks/designer-services";

const KRW = new Intl.NumberFormat("ko-KR");

interface Props {
  designerId: string;
}

export default function ServicesList({ designerId }: Props) {
  const services = getMockServices(designerId);
  if (services.length === 0) return null;

  return (
    <section className="px-4 py-5 border-b border-surface-100">
      <div className="flex justify-between items-center mb-2">
        <h2 className="typo-h6 text-surface-950">Providing Services & Price</h2>
        <button type="button" className="typo-button text-surface-500 active:text-surface-700">
          View more
        </button>
      </div>
      <ul className="flex flex-col">
        {services.map((s) => (
          <li
            key={s.id}
            className="flex justify-between items-center py-3 border-b border-surface-100 last:border-b-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="typo-body1 text-surface-950 truncate">{s.name}</span>
              {s.tag && (
                <span
                  className={`typo-caption2 px-1.5 py-0.5 rounded-md shrink-0 ${
                    s.tag === "Popular"
                      ? "bg-secondary-50 text-secondary-500"
                      : "bg-accent-50 text-accent-500"
                  }`}
                >
                  {s.tag}
                </span>
              )}
            </div>
            <span className="typo-h6 text-surface-950 shrink-0 ml-2">
              ₩{KRW.format(s.price)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

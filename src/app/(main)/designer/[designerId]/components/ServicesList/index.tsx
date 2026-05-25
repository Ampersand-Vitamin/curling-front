// Figma Ref: 363:11514 (Providing Services & Price)
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
    <section className="px-4 py-5 border-b border-surface-100 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h2 className="typo-h4 text-surface-950">Providing Services & Price</h2>
        <button type="button" className="typo-caption text-surface-400 underline">
          view all
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {services.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-4 bg-surface-100 rounded-lg p-3"
          >
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              {s.tag && (
                <div className="flex gap-1">
                  {s.tag === "Popular" && (
                    <>
                      <span className="typo-caption2 px-2 py-1 rounded-full bg-primary-400 text-surface-white">
                        Best
                      </span>
                      <span className="typo-caption2 px-2 py-1 rounded-full bg-surface-950 text-surface-white">
                        Popular
                      </span>
                    </>
                  )}
                  {s.tag === "New" && (
                    <span className="typo-caption2 px-2 py-1 rounded-full bg-surface-950 text-surface-white">
                      New
                    </span>
                  )}
                </div>
              )}
              <span className="typo-h6 text-surface-950">{s.name}</span>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="typo-caption text-surface-500">from</span>
              <span className="typo-body1 text-surface-950">
                ₩{KRW.format(s.price)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

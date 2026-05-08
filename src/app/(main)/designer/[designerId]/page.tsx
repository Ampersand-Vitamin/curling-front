// Design Ref: §4.4, DS-9, DS-10 — designer-detail
// Plan FR-01, FR-21
//
// Server Component — params.designerId(UUID)로 단건 fetch.
// invalid UUID 또는 행 없음 → notFound() (Next.js 기본 404).

import { notFound } from "next/navigation";
import { getDesignerById } from "@/lib/designers";
import DesignerDetailClient from "./DesignerDetailClient";

interface PageProps {
  params: Promise<{ designerId: string }>;
}

export default async function DesignerDetailPage({ params }: PageProps) {
  const { designerId } = await params;
  const designer = await getDesignerById(designerId);
  if (!designer) notFound();
  return <DesignerDetailClient designer={designer} />;
}

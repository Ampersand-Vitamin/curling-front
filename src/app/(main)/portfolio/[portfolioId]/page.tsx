import { notFound } from "next/navigation";
import { getPortfolioDetail } from "./actions";
import PortfolioDetailClient from "./PortfolioDetailClient";

interface PageProps {
  params: Promise<{ portfolioId: string }>;
}

export default async function PortfolioDetailPage({ params }: PageProps) {
  const { portfolioId } = await params;
  const portfolio = await getPortfolioDetail(portfolioId);
  if (!portfolio) notFound();
  return <PortfolioDetailClient portfolio={portfolio} />;
}

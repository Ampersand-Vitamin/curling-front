"use client";

import { useMatchStore } from "./store/matchStore";
import ImageUploader from "./components/ImageUploader";
import SearchLoading from "./components/SearchLoading";
import MatchedDesignerList from "./components/MatchedDesignerList";

export default function AIMatchPanel() {
  const { step } = useMatchStore();

  return (
    <div className="flex flex-col items-center px-4 py-6 w-full max-w-[400px] mx-auto">
      <h2 className="text-surface-50 text-lg font-medium mb-6">
        AI 디자이너 매칭
      </h2>

      {step === "upload" && <ImageUploader />}
      {step === "searching" && <SearchLoading />}
      {step === "results" && <MatchedDesignerList />}
    </div>
  );
}

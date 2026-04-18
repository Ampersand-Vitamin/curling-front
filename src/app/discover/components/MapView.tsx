// Design Ref: §4 — APIProvider + Map + AdvancedMarker 통합 컴포넌트
// Figma Ref: 254:21435 — 커스텀 살롱 핀 마커 (흰색 원형 + barber pole 아이콘)
"use client";

import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { storageUrl } from "@/lib/storage";
import { MOCK_SALONS, DEFAULT_CENTER, DEFAULT_ZOOM } from "../data/mock-salons";

function SalonPin() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center rounded-full bg-surface-white p-1 shadow-[0px_2px_8px_rgba(0,0,0,0.15)]">
        <img src={storageUrl("asset/discover/salon.svg")} alt="salon" width={16} height={16} />
      </div>
      <svg
        width="6"
        height="4"
        viewBox="0 0 6 4"
        fill="none"
        className="-mt-px"
      >
        <path d="M3 4L0 0H6L3 4Z" fill="white" />
      </svg>
    </div>
  );
}

export default function MapView() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-surface-200 flex items-center justify-center">
        <p className="text-surface-500 typo-body2">
          Google Maps API key is not configured
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        mapId="671d8b693bbcd9d324bfc862"
        style={{ width: "100%", height: "100%" }}
        disableDefaultUI
        zoomControl
      >
        {MOCK_SALONS.map((salon) => (
          <AdvancedMarker
            key={salon.id}
            position={{ lat: salon.latitude, lng: salon.longitude }}
            title={salon.name}
          >
            <SalonPin />
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}

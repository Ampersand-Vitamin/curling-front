// Design Ref: §4 — APIProvider + Map + AdvancedMarker 통합 컴포넌트
// Figma Ref: 254:21435 — 커스텀 살롱 핀 마커 (흰색 원형 + barber pole 아이콘)
"use client";

import { useEffect, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from "@vis.gl/react-google-maps";
import { storageUrl } from "@/lib/storage";
import { MOCK_SALONS, DEFAULT_CENTER, DEFAULT_ZOOM } from "../data/mock-salons";
import { MOCK_DESIGNER_MAP_ITEMS } from "../data/mock-designers";
import type { DiscoverMode } from "@/types/discover";

type LatLng = { lat: number; lng: number };

// Figma Ref: 254:21362 — 본인 위치 마커 (secondary-400 컬러)
function UserLocationPin() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute w-6 h-6 rounded-full bg-secondary-400/30 [animation:pulseSoft_1s_ease-in-out_infinite]" />
      <div className="w-4 h-4 rounded-full bg-secondary-400 border-2 border-surface-white shadow-[0px_2px_6px_rgba(0,0,0,0.2)]" />
    </div>
  );
}

function UserLocationTracker({
  position,
  onResolved,
}: {
  position: LatLng | null;
  onResolved: (pos: LatLng) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (position || typeof window === "undefined" || !navigator.geolocation)
      return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onResolved({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn("[MapView] geolocation error", err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [position, onResolved]);

  useEffect(() => {
    if (map && position) {
      map.panTo(position);
    }
  }, [map, position]);

  return null;
}

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

function DesignerPin({ count }: { count: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1 rounded-full bg-surface-white pl-1.5 pr-2 py-1 shadow-[0px_2px_8px_rgba(0,0,0,0.15)]">
        <img src={storageUrl("asset/discover/designer.svg")} alt="designer" width={16} height={16} />
        {count > 1 && (
          <span className="typo-caption2 text-surface-900">{count}</span>
        )}
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

interface MapViewProps {
  mode?: DiscoverMode;
}

export default function MapView({ mode = "salon" }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [userPos, setUserPos] = useState<LatLng | null>(null);

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
        <UserLocationTracker position={userPos} onResolved={setUserPos} />
        {userPos && (
          <AdvancedMarker position={userPos} title="내 위치">
            <UserLocationPin />
          </AdvancedMarker>
        )}
        {mode === "salon"
          ? MOCK_SALONS.map((salon) => (
              <AdvancedMarker
                key={salon.id}
                position={{ lat: salon.latitude, lng: salon.longitude }}
                title={salon.name}
              >
                <SalonPin />
              </AdvancedMarker>
            ))
          : MOCK_DESIGNER_MAP_ITEMS.map((item) => (
              <AdvancedMarker
                key={item.salonId}
                position={{ lat: item.latitude, lng: item.longitude }}
                title={item.salonName}
              >
                <DesignerPin count={item.designerCount} />
              </AdvancedMarker>
            ))}
      </Map>
    </APIProvider>
  );
}

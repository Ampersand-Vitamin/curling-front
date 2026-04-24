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
import type { DiscoverMode } from "@/types/discover";
import type { Salon } from "@/types/salon";
import type { DesignerMapItem } from "@/lib/designers";
import type { PullBarVariant } from "./PullBar";

// 지도 초기 중심/줌 (뉴욕 기반 — 실서비스 시 유저 위치로 대체)
const DEFAULT_CENTER = { lat: 40.758, lng: -73.9855 };
const DEFAULT_ZOOM = 12;
const MY_LOCATION_ZOOM = 14;

// PullBar 노출 높이 (handle 24px + content). Design Ref: §3.1
const PULLBAR_HEIGHT: Record<PullBarVariant, number> = {
  collapsed: 24,
  compact: 324,
  expanded: 0,
};

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

function MyLocationIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <line x1="12" y1="2" x2="12" y2="4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="19.5" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="12" x2="4.5" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19.5" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MyLocationButton({
  userPos,
  setUserPos,
  bottomOffset,
  visible,
}: {
  userPos: LatLng | null;
  setUserPos: (pos: LatLng) => void;
  bottomOffset: number;
  visible: boolean;
}) {
  const map = useMap();

  const handleClick = () => {
    const recenter = (pos: LatLng) => {
      if (!map) return;
      map.panTo(pos);
      const currentZoom = map.getZoom() ?? DEFAULT_ZOOM;
      if (currentZoom < MY_LOCATION_ZOOM) map.setZoom(MY_LOCATION_ZOOM);
    };
    if (userPos) {
      recenter(userPos);
      return;
    }
    if (typeof window === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(next);
        recenter(next);
      },
      (err) => console.warn("[MapView] geolocation error", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="내 위치로 이동"
      className="absolute right-4 z-10 w-11 h-11 rounded-full bg-surface-white shadow-[0px_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-center text-surface-700 active:bg-surface-100"
      style={{
        bottom: bottomOffset,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition:
          "bottom 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s ease",
      }}
    >
      <MyLocationIcon />
    </button>
  );
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
        <span className="typo-caption2 text-surface-900">{count}</span>
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
  salons: Salon[];
  designerMapItems: DesignerMapItem[];
  pullBarVariant?: PullBarVariant;
}

export default function MapView({
  mode = "salon",
  salons,
  designerMapItems,
  pullBarVariant = "compact",
}: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [userPos, setUserPos] = useState<LatLng | null>(null);

  const myLocationBottom = PULLBAR_HEIGHT[pullBarVariant] + 12;
  const myLocationVisible = pullBarVariant !== "expanded";

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
    <div className="relative w-full h-full">
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
            ? salons.map((salon) => (
                <AdvancedMarker
                  key={salon.id}
                  position={{ lat: salon.latitude, lng: salon.longitude }}
                  title={salon.name}
                >
                  <SalonPin />
                </AdvancedMarker>
              ))
            : designerMapItems.map((item) => (
                <AdvancedMarker
                  key={item.salonId}
                  position={{ lat: item.latitude, lng: item.longitude }}
                  title={item.salonName}
                >
                  <DesignerPin count={item.designerCount} />
                </AdvancedMarker>
              ))}
        </Map>
        <MyLocationButton
          userPos={userPos}
          setUserPos={setUserPos}
          bottomOffset={myLocationBottom}
          visible={myLocationVisible}
        />
      </APIProvider>
    </div>
  );
}

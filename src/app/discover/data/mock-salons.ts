// Design Ref: §3.2 — 뉴욕 기반 Mock 살롱 데이터, 실제 컬리헤어 살롱 영역 참고

import type { Salon } from "@/types/salon";

export const MOCK_SALONS: Salon[] = [
  {
    id: "salon-1",
    name: "CurlBar NYC",
    address: "123 W 125th St, New York, NY 10027",
    latitude: 40.8088,
    longitude: -73.9502,
    phone: "+1-212-555-0101",
  },
  {
    id: "salon-2",
    name: "Natural Hair Haven",
    address: "456 Fulton St, Brooklyn, NY 11217",
    latitude: 40.6872,
    longitude: -73.9777,
    phone: "+1-718-555-0102",
  },
  {
    id: "salon-3",
    name: "Curl Culture Studio",
    address: "789 Lenox Ave, New York, NY 10039",
    latitude: 40.8234,
    longitude: -73.9387,
    phone: "+1-212-555-0103",
  },
  {
    id: "salon-4",
    name: "Twisted Roots Salon",
    address: "321 Atlantic Ave, Brooklyn, NY 11217",
    latitude: 40.6862,
    longitude: -73.9782,
  },
  {
    id: "salon-5",
    name: "Bounce & Body Hair",
    address: "555 W 42nd St, New York, NY 10036",
    latitude: 40.7591,
    longitude: -73.9937,
    phone: "+1-212-555-0105",
  },
  {
    id: "salon-6",
    name: "Coily Crown Collective",
    address: "88 E 116th St, New York, NY 10029",
    latitude: 40.7985,
    longitude: -73.9432,
    phone: "+1-212-555-0106",
  },
];

export const DEFAULT_CENTER = { lat: 40.758, lng: -73.9855 };
export const DEFAULT_ZOOM = 12;

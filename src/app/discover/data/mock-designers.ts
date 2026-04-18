// 디자이너 모드 마커용 mock 데이터
// ERD: DesignerProfile.salon_id → Salon.(latitude, longitude)
// 같은 살롱에 여러 디자이너가 소속될 수 있음 → 위치별 그룹핑 필요

export interface MockDesignerMapItem {
  salonId: string;
  salonName: string;
  latitude: number;
  longitude: number;
  designerCount: number;
}

// 살롱 위치 기준으로 디자이너 수를 집계한 결과 (실제로는 API에서 GROUP BY)
export const MOCK_DESIGNER_MAP_ITEMS: MockDesignerMapItem[] = [
  {
    salonId: "salon-1",
    salonName: "CurlBar NYC",
    latitude: 40.8088,
    longitude: -73.9502,
    designerCount: 2,
  },
  {
    salonId: "salon-2",
    salonName: "Natural Hair Haven",
    latitude: 40.6872,
    longitude: -73.9777,
    designerCount: 1,
  },
  {
    salonId: "salon-3",
    salonName: "Curl Culture Studio",
    latitude: 40.8234,
    longitude: -73.9387,
    designerCount: 3,
  },
  {
    salonId: "salon-5",
    salonName: "Bounce & Body Hair",
    latitude: 40.7591,
    longitude: -73.9937,
    designerCount: 1,
  },
];

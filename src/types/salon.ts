// Design Ref: §3.1 — ERD Salon 테이블 기반, MapView에 필요한 필드만 추출

export interface Salon {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
}

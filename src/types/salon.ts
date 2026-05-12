// Design Ref: §3.1 — ERD Salon 테이블 기반, MapView에 필요한 필드만 추출

export interface Salon {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  /** 살롱에 직접 연결된 keyword slug (salon_keyword 조인 결과).
   *  amenities / inclusivity 등 살롱 단위 속성에만 해당.
   *  디자이너 키워드 union 매칭은 호출 측에서 처리. */
  keywordSlugs: string[];
}

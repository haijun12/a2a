export interface Shipment {
  id: number;
  lat: number;
  lon: number;
  temp: number;
  status: 'alert' | 'warning' | 'normal';
  city: string;
  eta: number;
  minsLeft: number;
  product: string;
}

export interface Depot {
  id: number;
  name: string;
  lat: number;
  lon: number;
  leadTime: number;
  phone: string;
  region: 'americas' | 'asia';
}

export const mockShipments: Shipment[] = [
  { id: 42, lat: 36.73, lon: -119.7, temp: 12.3, status: 'alert', city: 'Fresno', eta: 120, minsLeft: 180, product: 'mRNA Vaccine' },
  { id: 43, lat: 37.77, lon: -122.42, temp: 6.2, status: 'normal', city: 'San Francisco', eta: 45, minsLeft: 480, product: 'Insulin' },
  { id: 44, lat: 34.05, lon: -118.24, temp: 7.8, status: 'warning', city: 'Los Angeles', eta: 90, minsLeft: 240, product: 'Blood Plasma' },
  // Asia demo data
  { id: 45, lat: 31.23, lon: 121.47, temp: 13.1, status: 'alert', city: 'Shanghai', eta: 90, minsLeft: 150, product: 'mRNA Vaccine' },
  { id: 46, lat: 1.35, lon: 103.87, temp: 7.1, status: 'normal', city: 'Singapore', eta: 60, minsLeft: 300, product: 'Blood Products' }
];

export const mockDepots: Depot[] = [
  // Americas
  { id: 1, name: 'Fresno DC', lat: 36.74, lon: -119.69, leadTime: 60, phone: '+15550789', region: 'americas' },
  { id: 2, name: 'SF Hub', lat: 37.78, lon: -122.41, leadTime: 30, phone: '+15550321', region: 'americas' },
  { id: 3, name: 'LA Center', lat: 34.06, lon: -118.23, leadTime: 45, phone: '+15550654', region: 'americas' },
  // Asia
  { id: 4, name: 'Shanghai Distribution', lat: 31.22, lon: 121.48, leadTime: 75, phone: '+862112345678', region: 'asia' },
  { id: 5, name: 'Singapore Hub', lat: 1.36, lon: 103.86, leadTime: 45, phone: '+6591234567', region: 'asia' }
];
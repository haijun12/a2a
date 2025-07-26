'use client';

import React from 'react';

interface Shipment {
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

interface Depot {
  id: number;
  name: string;
  lat: number;
  lon: number;
  leadTime: number;
  phone: string;
  region: 'americas' | 'asia';
}

interface WorldMapProps {
  shipments: Shipment[];
  depots: Depot[];
  selectedAlert: Shipment | null;
  onMarkerClick: (shipment: Shipment) => void;
}

export default function WorldMap({ shipments, depots, selectedAlert, onMarkerClick }: WorldMapProps) {
  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'alert': return '#dc2626';
      case 'warning': return '#d97706';
      case 'normal': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getMarkerIcon = (status: string) => {
    switch (status) {
      case 'alert': return '🚨';
      case 'warning': return '⚠️';
      case 'normal': return '✅';
      default: return '📍';
    }
  };

  const mapWidth = 800;
  const mapHeight = 400;
  
  // Convert lat/lon to SVG coordinates (simplified world projection)
  const latLonToSVG = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * mapWidth;
    const y = ((90 - lat) / 180) * mapHeight;
    return { x, y };
  };

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border bg-blue-50 relative">
      <svg width="100%" height="100%" viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="absolute inset-0">
        
        {/* Simple world map outline */}
        <rect x="0" y="0" width={mapWidth} height={mapHeight} fill="#e0f2fe" opacity="0.3" />
        
        {/* Grid lines */}
        {[...Array(9)].map((_, i) => (
          <g key={i}>
            <line x1={i * 100} y1="0" x2={i * 100} y2={mapHeight} stroke="#cbd5e1" strokeWidth="1" opacity="0.3" />
          </g>
        ))}
        {[...Array(5)].map((_, i) => (
          <line key={i} x1="0" y1={i * 100} x2={mapWidth} y2={i * 100} stroke="#cbd5e1" strokeWidth="1" opacity="0.3" />
        ))}

        {/* Americas continent outline */}
        <rect x="100" y="60" width="200" height="280" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" opacity="0.4" rx="20" />
        <text x="200" y="210" textAnchor="middle" className="text-sm font-bold fill-blue-700">AMERICAS</text>

        {/* Asia continent outline */}
        <rect x="500" y="80" width="180" height="200" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" opacity="0.4" rx="15" />
        <text x="590" y="185" textAnchor="middle" className="text-sm font-bold fill-amber-700">ASIA</text>

        {/* Shipment markers */}
        {shipments.map(shipment => {
          const pos = latLonToSVG(shipment.lat, shipment.lon);
          return (
            <g key={shipment.id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r="8"
                fill={getMarkerColor(shipment.status)}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer hover:r-10 transition-all"
                onClick={() => onMarkerClick(shipment)}
              />
              <text
                x={pos.x}
                y={pos.y + 3}
                textAnchor="middle"
                className="text-xs font-bold fill-white pointer-events-none"
              >
                {shipment.id}
              </text>
              
              <text
                x={pos.x - 15}
                y={pos.y - 12}
                className="text-sm pointer-events-none"
              >
                {getMarkerIcon(shipment.status)}
              </text>
              
              {shipment.status === 'alert' && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="8"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2"
                  opacity="0.6"
                  className="animate-ping"
                />
              )}
            </g>
          );
        })}

        {/* Depot markers */}
        {depots.map(depot => {
          const pos = latLonToSVG(depot.lat, depot.lon);
          return (
            <g key={depot.id}>
              <rect
                x={pos.x - 6}
                y={pos.y - 6}
                width="12"
                height="12"
                fill={depot.region === 'americas' ? '#3b82f6' : '#f59e0b'}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer"
              />
              <text
                x={pos.x - 10}
                y={pos.y - 10}
                className="text-xs pointer-events-none"
              >
                🏭
              </text>
            </g>
          );
        })}

        {/* Route line for active alert */}
        {selectedAlert && selectedAlert.status === 'alert' && (
          <g>
            {(() => {
              const alertPos = latLonToSVG(selectedAlert.lat, selectedAlert.lon);
              const alertRegion = selectedAlert.lat > 40 || selectedAlert.lon < 0 ? 'americas' : 'asia';
              const nearestDepot = depots.find(d => d.region === alertRegion);
              if (!nearestDepot) return null;
              
              const depotPos = latLonToSVG(nearestDepot.lat, nearestDepot.lon);
              return (
                <line
                  x1={alertPos.x}
                  y1={alertPos.y}
                  x2={depotPos.x}
                  y2={depotPos.y}
                  stroke="#dc2626"
                  strokeWidth="3"
                  strokeDasharray="10,5"
                  opacity="0.8"
                  className="animate-pulse"
                />
              );
            })()}
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md text-xs">
        <div className="font-bold mb-2">Legend</div>
        <div className="flex items-center space-x-2 mb-1">
          <div className="w-3 h-3 bg-red-600 rounded-full"></div>
          <span>Critical Alert</span>
        </div>
        <div className="flex items-center space-x-2 mb-1">
          <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
          <span>Warning</span>
        </div>
        <div className="flex items-center space-x-2 mb-1">
          <div className="w-3 h-3 bg-green-600 rounded-full"></div>
          <span>Normal</span>
        </div>
        <div className="flex items-center space-x-2 mb-1">
          <div className="w-3 h-3 bg-blue-600"></div>
          <span>Americas Depot</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-amber-600"></div>
          <span>Asia Depot</span>
        </div>
      </div>

      {/* Info overlay for selected alert */}
      {selectedAlert && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg max-w-xs">
          <div className="font-bold text-lg mb-2">
            {getMarkerIcon(selectedAlert.status)} Pallet {selectedAlert.id}
          </div>
          <div className="text-sm space-y-1">
            <div><strong>Product:</strong> {selectedAlert.product}</div>
            <div><strong>Location:</strong> {selectedAlert.city}</div>
            <div><strong>Temperature:</strong> <span className={selectedAlert.status === 'alert' ? 'text-red-600 font-bold' : ''}>{selectedAlert.temp}°C</span></div>
            <div><strong>Time to failure:</strong> <span className="text-red-600">{selectedAlert.minsLeft}min</span></div>
            <div><strong>Next stop ETA:</strong> {selectedAlert.eta}min</div>
            <div><strong>Region:</strong> {selectedAlert.lat > 40 || selectedAlert.lon < 0 ? 'Americas' : 'Asia'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
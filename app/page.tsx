'use client';

import React, { useState, useEffect } from 'react';
import { Thermometer } from 'lucide-react';
import WorldMap from '@/components/WorldMap';
import AlertDrawer from '@/components/AlertDrawer';
import DemoControls from '@/components/DemoControls';
import KPIDashboard from '@/components/KPIDashboard';
import { mockShipments, mockDepots, type Shipment } from '@/lib/data/mockData';
import { datadogService } from '@/lib/services/datadog';


export default function ColdChainGuardian() {
  const [selectedAlert, setSelectedAlert] = useState<Shipment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [alerts, setAlerts] = useState(mockShipments);
  const [events, setEvents] = useState<any[]>([]);

  // Real-time SSE connection
  useEffect(() => {
    const eventSource = new EventSource('/api/events');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents(prev => [data, ...prev.slice(0, 19)]); // Keep last 20 events
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Start Datadog MCP proactive monitoring
  useEffect(() => {
    // Start monitoring with 30-second intervals
    datadogService.startProactiveMonitoring(30000);
  }, []);

  const handleMarkerClick = (shipment: Shipment) => {
    setSelectedAlert(shipment);
    setDrawerOpen(true);
  };

  const handleTriggerAlert = async (region: 'americas' | 'asia') => {
    let targetShipment;
    if (region === 'americas') {
      targetShipment = alerts.find(alert => alert.id === 43);
      if (targetShipment) {
        const updatedAlerts = alerts.map(alert => 
          alert.id === 43 ? { ...alert, status: 'alert' as const, temp: 11.8 } : alert
        );
        setAlerts(updatedAlerts);
      }
    } else {
      targetShipment = alerts.find(alert => alert.id === 46);
      if (targetShipment) {
        const updatedAlerts = alerts.map(alert => 
          alert.id === 46 ? { ...alert, status: 'alert' as const, temp: 12.5 } : alert
        );
        setAlerts(updatedAlerts);
      }
    }

    // Send to actual API
    if (targetShipment) {
      try {
        const response = await fetch('/api/datadog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: targetShipment.id,
            temp: region === 'americas' ? 11.8 : 12.5,
            duration: 600,
            lat: targetShipment.lat,
            lon: targetShipment.lon,
            minutes_to_failure: targetShipment.minsLeft,
            next_stop: {
              city: targetShipment.city,
              eta_minutes: targetShipment.eta,
              lat: targetShipment.lat + 0.1,
              lon: targetShipment.lon + 0.1
            }
          })
        });
        console.log('Alert sent to API:', response.ok);
      } catch (error) {
        console.error('Failed to send alert:', error);
      }
    }
  };

  const handleSimulateApproval = async () => {
    try {
      await fetch('/api/approve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 42,
          approved: true,
          feedback: 'Plan approved - proceed with ice delivery'
        })
      });
    } catch (error) {
      console.error('Failed to simulate approval:', error);
    }
  };

  const handleSimulateRejection = async () => {
    try {
      await fetch('/api/approve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 42,
          approved: false,
          feedback: 'Ice depot unavailable - need alternative plan'
        })
      });
    } catch (error) {
      console.error('Failed to simulate rejection:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Thermometer className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold">Cold-Chain Guardian</h1>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
              LIVE
            </span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Kimi AI Connected</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>LlamaIndex Ready</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Vapi Connected</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Demo Controls */}
        <DemoControls 
          onTriggerAlert={handleTriggerAlert}
          onSimulateApproval={handleSimulateApproval}
          onSimulateRejection={handleSimulateRejection}
        />

        {/* KPI Dashboard */}
        <KPIDashboard alerts={alerts} />

        {/* Main Content */}
        <div className="grid grid-cols-4 gap-6">
          {/* Map */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h2 className="font-bold mb-4">🌎 Global Shipment Tracking (Americas & Asia)</h2>
              <WorldMap 
                shipments={alerts}
                depots={mockDepots}
                selectedAlert={selectedAlert}
                onMarkerClick={handleMarkerClick}
              />
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Active Alerts */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-bold mb-3">🚨 Active Alerts</h3>
              <div className="space-y-2">
                {alerts.filter(a => a.status === 'alert').map(alert => (
                  <div 
                    key={alert.id} 
                    className="p-3 bg-red-50 rounded border cursor-pointer hover:bg-red-100"
                    onClick={() => handleMarkerClick(alert)}
                  >
                    <div className="font-medium">Pallet {alert.id}</div>
                    <div className="text-sm text-red-600">{alert.temp}°C • {alert.minsLeft}min left</div>
                    <div className="text-xs text-gray-500">{alert.lat > 40 || alert.lon < 0 ? 'Americas' : 'Asia'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Events */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-bold mb-3">📡 Live Events</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {events.map((event, idx) => (
                  <div key={idx} className="text-xs p-2 bg-gray-50 rounded">
                    <div className="text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</div>
                    <div className="font-medium">{event.type}</div>
                    <div>{event.message || JSON.stringify(event).substring(0, 50)}...</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Drawer */}
      <AlertDrawer 
        alert={selectedAlert}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
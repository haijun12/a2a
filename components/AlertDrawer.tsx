'use client';

import React from 'react';
import { Phone, Thermometer, Clock, AlertTriangle, CheckCircle, FileText, MapPin } from 'lucide-react';

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

interface AlertDrawerProps {
  alert: Shipment | null;
  isOpen: boolean;
  onClose: () => void;
}

const alertTimeline = [
  { step: 'Alert Detected', status: 'completed', time: '12:30:15', icon: AlertTriangle },
  { step: 'Region Identified', status: 'completed', time: '12:30:16', icon: MapPin },
  { step: 'SOP Queried', status: 'completed', time: '12:30:18', icon: FileText },
  { step: 'Plan Generated', status: 'completed', time: '12:30:20', icon: CheckCircle },
  { step: 'Voice Call Initiated', status: 'active', time: '12:30:22', icon: Phone },
  { step: 'Awaiting Approval', status: 'active', time: '', icon: Clock },
  { step: 'Plan Execution', status: 'pending', time: '', icon: CheckCircle },
  { step: 'Resolved', status: 'pending', time: '', icon: CheckCircle }
];

export default function AlertDrawer({ alert, isOpen, onClose }: AlertDrawerProps) {
  if (!isOpen || !alert) return null;

  // Generate region-specific plan
  const region = alert.lat > 40 || alert.lon < 0 ? 'Americas' : 'Asia';
  const isAmericasAlert = region === 'Americas';
  
  const plan = isAmericasAlert ? 
    `AMERICAS PROTOCOL ACTIVATED:
1. Contact Fresno DC (+15550789) - Order 5kg dry ice
2. Delivery to truck's next stop: ${alert.city} 
3. ETA: 60 minutes (120min buffer before spoilage)
4. Backup: Reroute to Sacramento facility if delayed
5. Log incident #${alert.id} in FDA compliance system` :
    `ASIA PROTOCOL ACTIVATED:
1. Contact Shanghai Distribution (+862112345678) - Order ice delivery
2. Delivery to truck location: ${alert.city}
3. ETA: 75 minutes (75min buffer before spoilage) 
4. Backup: Reroute to Singapore Hub if needed
5. Log incident #${alert.id} in local regulatory system`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-96 h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-red-600">🚨 Alert #{alert.id} - {region}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          {/* Alert Summary */}
          <div className="bg-red-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Product</div>
                <div>{alert.product}</div>
              </div>
              <div>
                <div className="font-medium">Temperature</div>
                <div className="text-red-600 font-bold">{alert.temp}°C</div>
              </div>
              <div>
                <div className="font-medium">Time to Failure</div>
                <div className="text-red-600">{alert.minsLeft} minutes</div>
              </div>
              <div>
                <div className="font-medium">Location</div>
                <div>{alert.city} ({region})</div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-6">
            <h3 className="font-bold mb-4">Response Timeline</h3>
            <div className="space-y-3">
              {alertTimeline.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.status === 'completed' ? 'bg-green-100 text-green-600' :
                      item.status === 'active' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{item.step}</div>
                      {item.time && <div className="text-xs text-gray-500">{item.time}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generated Plan */}
          <div className="mb-6">
            <h3 className="font-bold mb-2">AI-Generated Plan ({region})</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm whitespace-pre-line">{plan}</div>
              <div className="mt-2 text-xs text-blue-600">Confidence: 94% | Based on {region} SOP</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700">
              📞 Call {isAmericasAlert ? 'Fresno DC' : 'Shanghai Distribution'} for Approval
            </button>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700">
              🔄 Regenerate Plan
            </button>
            <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700">
              📄 Download Audit PDF
            </button>
          </div>

          {/* Live Log */}
          <div className="mt-6">
            <h3 className="font-bold mb-2">Live System Log</h3>
            <div className="bg-black text-green-400 p-3 rounded font-mono text-xs h-32 overflow-y-auto">
              <div>[12:30:15] ALERT: Pallet {alert.id} temp breach detected</div>
              <div>[12:30:16] REGION: {region} protocol activated</div>
              <div>[12:30:18] KIMI API: Querying {region} SOP database...</div>
              <div>[12:30:20] LLAMAINDEX: Plan generated with 94% confidence</div>
              <div>[12:30:22] VAPI: Voice call initiated to {isAmericasAlert ? '+15550789' : '+862112345678'}</div>
              <div className="animate-pulse">[12:30:28] SYSTEM: Awaiting voice approval...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
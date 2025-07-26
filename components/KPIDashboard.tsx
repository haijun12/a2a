'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Shipment {
  id: number;
  status: 'alert' | 'warning' | 'normal';
}

interface KPIDashboardProps {
  alerts: Shipment[];
}

export default function KPIDashboard({ alerts }: KPIDashboardProps) {
  const activeAlerts = alerts.filter(a => a.status === 'alert').length;
  const totalSaved = 285000; // Mock calculation
  const avgResponseTime = 22; // seconds

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="text-red-600" size={20} />
          <div>
            <div className="text-2xl font-bold text-red-600">{activeAlerts}</div>
            <div className="text-sm text-red-600">Active Alerts</div>
          </div>
        </div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <CheckCircle className="text-green-600" size={20} />
          <div>
            <div className="text-2xl font-bold text-green-600">${totalSaved.toLocaleString()}</div>
            <div className="text-sm text-green-600">Cost Avoided Today</div>
          </div>
        </div>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <Clock className="text-blue-600" size={20} />
          <div>
            <div className="text-2xl font-bold text-blue-600">{avgResponseTime}s</div>
            <div className="text-sm text-blue-600">Avg Response Time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import React from 'react';

interface DemoControlsProps {
  onTriggerAlert: (region: 'americas' | 'asia') => void;
  onSimulateApproval: () => void;
  onSimulateRejection: () => void;
}

export default function DemoControls({ onTriggerAlert, onSimulateApproval, onSimulateRejection }: DemoControlsProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 className="font-bold text-yellow-800 mb-3">🎬 Demo Controls</h3>
      <div className="flex space-x-3 flex-wrap">
        <button 
          onClick={() => onTriggerAlert('americas')}
          className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 mb-2"
        >
          🇺🇸 Trigger Americas Alert
        </button>
        <button 
          onClick={() => onTriggerAlert('asia')}
          className="bg-amber-600 text-white px-4 py-2 rounded font-medium hover:bg-amber-700 mb-2"
        >
          🇨🇳 Trigger Asia Alert
        </button>
        <button 
          onClick={onSimulateApproval}
          className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 mb-2"
        >
          ✅ Simulate Approval
        </button>
        <button 
          onClick={onSimulateRejection}
          className="bg-red-600 text-white px-4 py-2 rounded font-medium hover:bg-red-700 mb-2"
        >
          ❌ Simulate Rejection
        </button>
      </div>
    </div>
  );
}
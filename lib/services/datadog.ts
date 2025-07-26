// Consolidated Datadog service: MCP monitoring + StatsD metrics
export interface DatadogAlert {
  id: number;
  temp: number;
  duration: number;
  lat: number;
  lon: number;
  minutes_to_failure: number;
  next_stop: {
    city: string;
    eta_minutes: number;
    lat: number;
    lon: number;
  };
  product: string;
  tags: string[];
  timestamp?: string;
}

// Mock StatsD client (replace with real node-statsd when installed)
class MockStatsD {
  gauge(metric: string, value: number, tags?: Record<string, string>) {
    console.log(`📊 [METRIC] ${metric}: ${value}`, tags);
  }
  
  increment(metric: string, value: number, tags?: Record<string, string>) {
    console.log(`📈 [COUNTER] ${metric}: +${value}`, tags);
  }
  
  timing(metric: string, value: number, tags?: Record<string, string>) {
    console.log(`⏱️ [TIMING] ${metric}: ${value}ms`, tags);
  }
}

export class DatadogService {
  private baseUrl: string;
  private client: MockStatsD;

  constructor() {
    this.baseUrl = '/api/datadog';
    this.client = new MockStatsD();
  }

  // MCP: Query temperature alerts
  async queryTemperatureAlerts(): Promise<DatadogAlert[]> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Datadog query failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.alerts || [];
      
    } catch (error) {
      console.error('Error querying Datadog metrics:', error);
      return [];
    }
  }

  // MCP: Start proactive monitoring
  async startProactiveMonitoring(intervalMs: number = 30000) {
    console.log('🔍 Starting proactive Datadog monitoring...');
    
    const monitor = async () => {
      const alerts = await this.queryTemperatureAlerts();
      
      if (alerts.length > 0) {
        console.log(`🚨 Found ${alerts.length} critical temperature alerts`);
        for (const alert of alerts) {
          await this.processAlert(alert);
        }
      }
    };
    
    await monitor();
    setInterval(monitor, intervalMs);
  }

  private async processAlert(alert: DatadogAlert) {
    console.log(`Processing alert for pallet ${alert.id}: ${alert.temp}°C`);
    
    try {
      const response = await fetch('/api/datadog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
      
      if (response.ok) {
        console.log(`✅ Alert ${alert.id} processed successfully`);
      } else {
        console.error(`❌ Failed to process alert ${alert.id}`);
      }
    } catch (error) {
      console.error(`Error processing alert ${alert.id}:`, error);
    }
  }

  // Metrics: Temperature
  recordTemperature(shipmentId: number, temperature: number, region: string, product: string) {
    this.client.gauge('coldchain.temperature.current', temperature, {
      shipment: shipmentId.toString(),
      region,
      product
    });

    if (temperature > 8.0) {
      this.client.increment('coldchain.temperature.threshold_breach', 1, {
        shipment: shipmentId.toString(),
        region,
        product,
        severity: temperature > 12 ? 'critical' : 'warning'
      });
    }
  }

  // Metrics: Time-critical
  recordTimeMetrics(shipmentId: number, timeToFailure: number, rescueWindow: number, region: string) {
    this.client.gauge('coldchain.time_to_failure', timeToFailure, {
      shipment: shipmentId.toString(),
      region
    });

    this.client.gauge('coldchain.rescue_window', rescueWindow, {
      shipment: shipmentId.toString(),
      region,
      viable: rescueWindow > 0 ? 'yes' : 'no'
    });

    if (timeToFailure < 60) {
      this.client.increment('coldchain.incidents.critical_timing', 1, {
        shipment: shipmentId.toString(),
        region
      });
    }
  }

  // Metrics: Logistics
  recordLogistics(shipmentId: number, depotDistance: number, depotETA: number, nextStopETA: number, region: string) {
    this.client.gauge('coldchain.depot.distance_km', depotDistance, {
      shipment: shipmentId.toString(),
      region
    });

    this.client.gauge('coldchain.depot.eta_minutes', depotETA, {
      shipment: shipmentId.toString(),
      region
    });

    this.client.gauge('coldchain.route.next_stop_eta', nextStopETA, {
      shipment: shipmentId.toString(),
      region
    });
  }

  // Metrics: Plan generation
  recordPlanGeneration(shipmentId: number, generationTimeMs: number, confidence: number, region: string) {
    this.client.timing('coldchain.plan.generation_time', generationTimeMs, {
      shipment: shipmentId.toString(),
      region
    });

    this.client.gauge('coldchain.plan.confidence', confidence, {
      shipment: shipmentId.toString(),
      region
    });
  }

  // Metrics: Voice calls
  recordVoiceCall(shipmentId: number, success: boolean, responseTimeMs: number, region: string) {
    this.client.increment('coldchain.call.attempts', 1, {
      shipment: shipmentId.toString(),
      region,
      success: success.toString()
    });

    if (success) {
      this.client.timing('coldchain.call.response_time', responseTimeMs, {
        shipment: shipmentId.toString(),
        region
      });
    }
  }

  // Helpers
  calculateRescueWindow(timeToFailure: number, depotETA: number): number {
    return Math.max(0, timeToFailure - depotETA - 30);
  }

  estimateCostAvoided(product: string): number {
    const costMap: Record<string, number> = {
      'mRNA Vaccine': 50000,
      'Blood Plasma': 25000,
      'Insulin': 15000,
      'Blood Products': 30000
    };
    return costMap[product] || 20000;
  }
}

export const datadogService = new DatadogService();
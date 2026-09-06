/**
 * Client API Client for Trading Intelligence Platform
 */

const API_BASE = '/api/v1';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getAccounts() {
    const res = await fetch(`${API_BASE}/accounts`);
    return res.json();
  },

  async switchAccount(accountId: string) {
    const res = await fetch(`${API_BASE}/accounts/switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    });
    return res.json();
  },

  async getPortfolio() {
    const res = await fetch(`${API_BASE}/portfolio`);
    return res.json();
  },

  async getOverview() {
    const res = await fetch(`${API_BASE}/portfolio`);
    const data = await res.json();
    return {
      metrics: data.metrics,
      killSwitch: { isActive: false, triggeredAt: null, triggeredBy: null, reason: null },
      ...data,
    };
  },

  async getEquityHistory() {
    const res = await fetch(`${API_BASE}/portfolio`);
    const data = await res.json();
    return { history: data.equityHistory || [] };
  },

  async getPositions() {
    const res = await fetch(`${API_BASE}/positions`);
    return res.json();
  },

  async closePosition(positionId: string) {
    const res = await fetch(`${API_BASE}/positions/${positionId}/close`, {
      method: 'POST',
    });
    return res.json();
  },

  async getOrders() {
    const res = await fetch(`${API_BASE}/orders`);
    return res.json();
  },

  async submitOrder(orderData: any) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    return res.json();
  },

  async cancelOrder(orderId: string) {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async getExecutions() {
    const res = await fetch(`${API_BASE}/executions`);
    return res.json();
  },

  async getJournal() {
    const res = await fetch(`${API_BASE}/journal`);
    return res.json();
  },

  async createJournalEntry(entry: any) {
    const res = await fetch(`${API_BASE}/journal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    return res.json();
  },

  async updateJournalEntry(id: string, updates: any) {
    const res = await fetch(`${API_BASE}/journal/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async getStrategies() {
    const res = await fetch(`${API_BASE}/strategies`);
    return res.json();
  },

  async getBots() {
    const res = await fetch(`${API_BASE}/bots`);
    return res.json();
  },

  async updateBotStatus(botId: string, status: string) {
    const res = await fetch(`${API_BASE}/bots/${botId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async postBotEvent(botId: string, eventType: string, payload: any = {}) {
    const res = await fetch(`${API_BASE}/bots/${botId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, payload }),
    });
    return res.json();
  },

  async getRiskRules() {
    const res = await fetch(`${API_BASE}/risk/rules`);
    return res.json();
  },

  async getRiskState() {
    const [rulesRes, decisionsRes] = await Promise.all([
      fetch(`${API_BASE}/risk/rules`).then((r) => r.json()),
      fetch(`${API_BASE}/risk/decisions`).then((r) => r.json()),
    ]);
    return {
      rules: rulesRes.rules || [],
      killSwitch: rulesRes.killSwitch || { isActive: false, triggeredAt: null, triggeredBy: null, reason: null },
      recentDecisions: decisionsRes.decisions || [],
    };
  },

  async updateRiskRule(ruleId: string, updates: any) {
    const res = await fetch(`${API_BASE}/risk/rules/${ruleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async toggleKillSwitch(activate: boolean, reason?: string, cancelOrders: boolean = true) {
    const res = await fetch(`${API_BASE}/risk/kill-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activate, reason, cancelOrders }),
    });
    return res.json();
  },

  async activateKillSwitch(reason?: string) {
    return this.toggleKillSwitch(true, reason, true);
  },

  async deactivateKillSwitch() {
    return this.toggleKillSwitch(false);
  },

  async getRiskDecisions() {
    const res = await fetch(`${API_BASE}/risk/decisions`);
    return res.json();
  },

  async getBehaviorAnalytics() {
    const res = await fetch(`${API_BASE}/analytics/behavior`);
    return res.json();
  },

  async getExecutionAnalytics() {
    const res = await fetch(`${API_BASE}/analytics/execution`);
    return res.json();
  },

  async getExecutionQuality() {
    return this.getExecutionAnalytics();
  },

  async getMarketQuotes() {
    const res = await fetch(`${API_BASE}/market-data/quotes`);
    return res.json();
  },

  async getQuotes() {
    return this.getMarketQuotes();
  },

  async getMarketBars(symbol: string) {
    const res = await fetch(`${API_BASE}/market-data/bars/${encodeURIComponent(symbol)}`);
    return res.json();
  },

  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/audit`);
    return res.json();
  },

  async getAiMarketPulse(symbol: string) {
    const res = await fetch(`${API_BASE}/ai/market-pulse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });
    return res.json();
  },

  async getAiTradeReview(tradeData: any) {
    const res = await fetch(`${API_BASE}/ai/trade-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tradeData),
    });
    return res.json();
  },

  setupEventSource(onEvent: (event: any) => void, onStatusChange?: (connected: boolean) => void): () => void {
    let es: EventSource | null = null;
    try {
      es = new EventSource(`${API_BASE}/events`);
      es.onopen = () => onStatusChange?.(true);
      es.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          onEvent(parsed);
        } catch {
          // ignore non-json pings
        }
      };
      es.onerror = () => onStatusChange?.(false);
    } catch {
      onStatusChange?.(false);
    }

    return () => {
      es?.close();
    };
  },

  connectEventStream(onEvent: (event: any) => void): EventSource | null {
    try {
      const es = new EventSource(`${API_BASE}/events`);
      es.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          onEvent(parsed);
        } catch {
          // heartbeat
        }
      };
      return es;
    } catch {
      return null;
    }
  },
};

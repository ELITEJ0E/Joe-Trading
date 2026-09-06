import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header.tsx';
import { Navigation } from './components/layout/Navigation.tsx';
import { KillSwitchBanner } from './components/common/KillSwitchBanner.tsx';
import { KillSwitchModal } from './components/common/KillSwitchModal.tsx';
import { OrderModal } from './components/common/OrderModal.tsx';
import { NewJournalEntryModal } from './components/views/NewJournalEntryModal.tsx';
import { JournalDetailView } from './components/views/JournalDetailView.tsx';

// Views
import { DashboardView } from './components/views/DashboardView.tsx';
import { PortfolioView } from './components/views/PortfolioView.tsx';
import { PositionsView } from './components/views/PositionsView.tsx';
import { OrdersView } from './components/views/OrdersView.tsx';
import { JournalView } from './components/views/JournalView.tsx';
import { StrategiesView } from './components/views/StrategiesView.tsx';
import { BotsView } from './components/views/BotsView.tsx';
import { RiskCenterView } from './components/views/RiskCenterView.tsx';
import { BehaviorAnalyticsView } from './components/views/BehaviorAnalyticsView.tsx';
import { ExecutionAnalyticsView } from './components/views/ExecutionAnalyticsView.tsx';
import { MarketTerminalView } from './components/views/MarketTerminalView.tsx';
import { AuditTrailView } from './components/views/AuditTrailView.tsx';
import { DocsView } from './components/views/DocsView.tsx';

// Types & API
import {
  AppTab,
  TradingAccount,
  Position,
  Order,
  Execution,
  JournalEntry,
  TradingBot,
  Strategy,
  RiskRule,
  RiskDecision,
  KillSwitchState,
  MarketQuote,
  PortfolioMetrics,
  AuditLogEntry,
} from './types/client.ts';
import { api } from './lib/api.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('DASHBOARD');
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  // Core Data State
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<TradingAccount | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<JournalEntry | null>(null);
  const [bots, setBots] = useState<TradingBot[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [riskRules, setRiskRules] = useState<RiskRule[]>([]);
  const [recentDecisions, setRecentDecisions] = useState<RiskDecision[]>([]);
  const [killSwitch, setKillSwitch] = useState<KillSwitchState>({
    isActive: false,
    triggeredAt: null,
    triggeredBy: null,
    reason: null,
  });
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [equityHistory, setEquityHistory] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [behaviorData, setBehaviorData] = useState<any>(null);
  const [executionData, setExecutionData] = useState<any>(null);
  const [selectedMarketSymbol, setSelectedMarketSymbol] = useState<string>('BTC/USDT');

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isKillSwitchModalOpen, setIsKillSwitchModalOpen] = useState(false);
  const [isNewJournalModalOpen, setIsNewJournalModalOpen] = useState(false);

  // Initial Load
  const fetchAllData = useCallback(async () => {
    try {
      const [
        overviewRes,
        accountsRes,
        positionsRes,
        ordersRes,
        journalRes,
        botsRes,
        stratRes,
        riskRes,
        quotesRes,
        equityRes,
        auditRes,
        behaviorRes,
        execRes,
      ] = await Promise.all([
        api.getOverview().catch(() => null),
        api.getAccounts().catch(() => ({ accounts: [] })),
        api.getPositions().catch(() => ({ positions: [] })),
        api.getOrders().catch(() => ({ orders: [], executions: [] })),
        api.getJournal().catch(() => ({ entries: [] })),
        api.getBots().catch(() => ({ bots: [] })),
        api.getStrategies().catch(() => ({ strategies: [] })),
        api.getRiskState().catch(() => null),
        api.getQuotes().catch(() => ({ quotes: [] })),
        api.getEquityHistory().catch(() => ({ history: [] })),
        api.getAuditLogs().catch(() => ({ logs: [] })),
        api.getBehaviorAnalytics().catch(() => null),
        api.getExecutionQuality().catch(() => null),
      ]);

      if (accountsRes.accounts?.length) {
        setAccounts(accountsRes.accounts);
        setActiveAccount(accountsRes.accounts[0]);
      }
      if (positionsRes.positions) setPositions(positionsRes.positions);
      if (ordersRes.orders) setOrders(ordersRes.orders);
      if (ordersRes.executions) setExecutions(ordersRes.executions);
      if (journalRes.entries) setJournalEntries(journalRes.entries);
      if (botsRes.bots) setBots(botsRes.bots);
      if (stratRes.strategies) setStrategies(stratRes.strategies);
      if (quotesRes.quotes) setQuotes(quotesRes.quotes);
      if (equityRes.history) setEquityHistory(equityRes.history);
      if (auditRes.logs) setAuditLogs(auditRes.logs);
      if (behaviorRes) setBehaviorData(behaviorRes);
      if (execRes) setExecutionData(execRes);

      if (overviewRes) {
        setKillSwitch(overviewRes.killSwitch);
        setMetrics(overviewRes.metrics);
      } else if (riskRes) {
        setKillSwitch(riskRes.killSwitch);
        setRiskRules(riskRes.rules || []);
        setRecentDecisions(riskRes.recentDecisions || []);
      }

      if (riskRes?.rules) {
        setRiskRules(riskRes.rules);
        setRecentDecisions(riskRes.recentDecisions || []);
      }

      setLastSyncTime(new Date().toLocaleTimeString());
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to initialize app state:', err);
    }
  }, []);

  useEffect(() => {
    fetchAllData();

    // SSE Event Stream Integration
    let eventSource: EventSource | null = null;
    try {
      eventSource = api.connectEventStream((event) => {
        setIsConnected(true);
        setLastSyncTime(new Date().toLocaleTimeString());

        if (event.type === 'PRICE_TICK') {
          setQuotes((prev) =>
            prev.map((q) => (q.symbol === event.data.symbol ? { ...q, ...event.data } : q))
          );
        } else if (event.type === 'KILL_SWITCH_TRIGGERED') {
          setKillSwitch({
            isActive: true,
            triggeredAt: event.data.timestamp,
            triggeredBy: event.data.triggeredBy,
            reason: event.data.reason,
          });
        } else if (event.type === 'KILL_SWITCH_DEACTIVATED') {
          setKillSwitch({
            isActive: false,
            triggeredAt: null,
            triggeredBy: null,
            reason: null,
          });
        } else if (event.type === 'ORDER_FILLED' || event.type === 'ORDER_CREATED') {
          fetchAllData();
        }
      });
    } catch (e) {
      console.warn('SSE subscription notice:', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [fetchAllData]);

  // Handlers
  const handleSwitchAccount = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (acc) setActiveAccount(acc);
  };

  const handleClosePosition = async (positionId: string) => {
    try {
      await api.closePosition(positionId);
      fetchAllData();
    } catch (err) {
      console.error('Error closing position:', err);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await api.cancelOrder(orderId);
      fetchAllData();
    } catch (err) {
      console.error('Error cancelling order:', err);
    }
  };

  const handleActivateKillSwitch = async (reason: string) => {
    try {
      await api.activateKillSwitch(reason);
      setKillSwitch({
        isActive: true,
        triggeredAt: new Date().toISOString(),
        triggeredBy: 'Lead Trader',
        reason,
      });
      setIsKillSwitchModalOpen(false);
      fetchAllData();
    } catch (err) {
      console.error('Kill Switch error:', err);
    }
  };

  const handleDeactivateKillSwitch = async () => {
    try {
      await api.deactivateKillSwitch();
      setKillSwitch({
        isActive: false,
        triggeredAt: null,
        triggeredBy: null,
        reason: null,
      });
      fetchAllData();
    } catch (err) {
      console.error('Failed to resume trading:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* 1. Header Bar */}
      <Header
        activeAccount={activeAccount}
        accounts={accounts}
        killSwitch={killSwitch}
        onSwitchAccount={handleSwitchAccount}
        onOpenKillSwitchModal={() => setIsKillSwitchModalOpen(true)}
        onOpenOrderModal={() => setIsOrderModalOpen(true)}
        isConnected={isConnected}
        lastSyncTime={lastSyncTime}
      />

      {/* 2. Emergency Kill Switch Banner (if active) */}
      <KillSwitchBanner
        killSwitch={killSwitch}
        onDeactivate={handleDeactivateKillSwitch}
      />

      {/* 3. Navigation Rail */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setSelectedJournalEntry(null);
          setActiveTab(tab);
        }}
        openPositionsCount={positions.filter((p) => p.isOpen).length}
        activeBotsCount={bots.filter((b) => b.status === 'RUNNING').length}
        isKillSwitchActive={killSwitch.isActive}
      />

      {/* 4. Main Stage Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-20">
        {activeTab === 'DASHBOARD' && (
          <DashboardView
            account={activeAccount}
            activeAccount={activeAccount}
            metrics={metrics}
            positions={positions}
            orders={orders}
            equityHistory={equityHistory}
            quotes={quotes}
            marketQuotes={quotes}
            bots={bots}
            recentRiskDecisions={recentDecisions}
            onSelectSymbol={(sym) => {
              setSelectedMarketSymbol(sym);
              setActiveTab('MARKET');
            }}
            onClosePosition={handleClosePosition}
            onNavigateTab={(tab) => {
              if (tab === 'positions') setActiveTab('POSITIONS');
              else if (tab === 'bots') setActiveTab('BOTS');
              else if (tab === 'market') setActiveTab('MARKET');
              else if (tab === 'orders') setActiveTab('ORDERS');
            }}
            onOpenOrderModal={() => setIsOrderModalOpen(true)}
            onSelectPosition={(pos) => {
              setActiveTab('POSITIONS');
            }}
          />
        )}

        {activeTab === 'PORTFOLIO' && (
          <PortfolioView
            accounts={accounts}
            activeAccount={activeAccount}
            metrics={metrics}
            equityHistory={equityHistory}
            onSwitchAccount={handleSwitchAccount}
          />
        )}

        {activeTab === 'POSITIONS' && (
          <PositionsView
            positions={positions}
            onClosePosition={handleClosePosition}
            onOpenOrderModal={() => setIsOrderModalOpen(true)}
          />
        )}

        {activeTab === 'ORDERS' && (
          <OrdersView
            orders={orders}
            executions={executions}
            onCancelOrder={handleCancelOrder}
            onOpenOrderModal={() => setIsOrderModalOpen(true)}
          />
        )}

        {activeTab === 'JOURNAL' && (
          selectedJournalEntry ? (
            <JournalDetailView
              entry={selectedJournalEntry}
              onBack={() => setSelectedJournalEntry(null)}
              onUpdateEntry={(updated) => {
                setSelectedJournalEntry(updated);
                setJournalEntries((prev) =>
                  prev.map((e) => (e.id === updated.id ? updated : e))
                );
              }}
            />
          ) : (
            <JournalView
              entries={journalEntries}
              onSelectEntry={(entry) => setSelectedJournalEntry(entry)}
              onOpenNewEntryModal={() => setIsNewJournalModalOpen(true)}
            />
          )
        )}

        {activeTab === 'STRATEGIES' && <StrategiesView strategies={strategies} />}

        {activeTab === 'BOTS' && (
          <BotsView bots={bots} onRefreshBots={fetchAllData} />
        )}

        {activeTab === 'RISK_CENTER' && (
          <RiskCenterView
            rules={riskRules}
            killSwitch={killSwitch}
            recentDecisions={recentDecisions}
            onOpenKillSwitchModal={() => setIsKillSwitchModalOpen(true)}
            onDeactivateKillSwitch={handleDeactivateKillSwitch}
            onRefreshRules={fetchAllData}
          />
        )}

        {activeTab === 'BEHAVIOR' && (
          <BehaviorAnalyticsView behaviorData={behaviorData} />
        )}

        {activeTab === 'EXECUTION' && (
          <ExecutionAnalyticsView executionData={executionData} />
        )}

        {activeTab === 'MARKET' && (
          <MarketTerminalView
            quotes={quotes}
            selectedSymbol={selectedMarketSymbol}
            onSelectSymbol={(sym) => setSelectedMarketSymbol(sym)}
            onOpenOrderModal={() => setIsOrderModalOpen(true)}
          />
        )}

        {activeTab === 'AUDIT' && <AuditTrailView logs={auditLogs} />}

        {activeTab === 'DOCS' && <DocsView />}
      </main>

      {/* 5. Interactive Modals */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        activeAccount={activeAccount}
        quotes={quotes}
        strategies={strategies}
        onOrderSuccess={() => {
          setIsOrderModalOpen(false);
          fetchAllData();
        }}
      />

      <KillSwitchModal
        isOpen={isKillSwitchModalOpen}
        onClose={() => setIsKillSwitchModalOpen(false)}
        onConfirm={handleActivateKillSwitch}
      />

      <NewJournalEntryModal
        isOpen={isNewJournalModalOpen}
        onClose={() => setIsNewJournalModalOpen(false)}
        quotes={quotes}
        strategies={strategies}
        onSuccess={(entry) => {
          setJournalEntries((prev) => [entry, ...prev]);
          fetchAllData();
        }}
      />
    </div>
  );
}

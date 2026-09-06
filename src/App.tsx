import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppShell } from './components/layout/AppShell.tsx';
import { KillSwitchModal } from './components/common/KillSwitchModal.tsx';
import { TradeWizardModal } from './components/trading/TradeWizardModal.tsx';
import { TradeDetailModal } from './components/trading/TradeDetailModal.tsx';
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
import { AnalyticsView } from './components/views/AnalyticsView.tsx';
import { MarketTerminalView } from './components/views/MarketTerminalView.tsx';
import { AuditTrailView } from './components/views/AuditTrailView.tsx';
import { DocsView } from './components/views/DocsView.tsx';
import { SettingsView } from './components/views/SettingsView.tsx';

// Types & API & Lifecycle
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
  UnifiedTrade,
} from './types/client.ts';
import { api } from './lib/api.ts';
import { buildUnifiedTrades } from './lib/trade-lifecycle.ts';

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
  const [selectedTradeForDetail, setSelectedTradeForDetail] = useState<UnifiedTrade | null>(null);
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

  // Modals & Guided Workflows
  const [isTradeWizardOpen, setIsTradeWizardOpen] = useState(false);
  const [wizardDefaultSymbol, setWizardDefaultSymbol] = useState<string>('BTC/USDT');
  const [isKillSwitchModalOpen, setIsKillSwitchModalOpen] = useState(false);
  const [isNewJournalModalOpen, setIsNewJournalModalOpen] = useState(false);

  // Reconstruct unified trade lifecycle state
  const unifiedTrades = useMemo(() => {
    return buildUnifiedTrades({
      positions,
      orders,
      executions,
      journalEntries,
      riskDecisions: recentDecisions,
      auditLogs,
    });
  }, [positions, orders, executions, journalEntries, recentDecisions, auditLogs]);

  // Initial Load & Refresh
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
        setActiveAccount((current) => current || accountsRes.accounts[0]);
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

  const handleOpenTradeWizard = (symbol?: string) => {
    if (symbol) setWizardDefaultSymbol(symbol);
    setIsTradeWizardOpen(true);
  };

  return (
    <AppShell
      activeTab={activeTab}
      onSelectTab={(tab) => {
        setSelectedJournalEntry(null);
        setSelectedTradeForDetail(null);
        setActiveTab(tab);
      }}
      accounts={accounts}
      activeAccount={activeAccount}
      onSwitchAccount={handleSwitchAccount}
      killSwitch={killSwitch}
      onOpenKillSwitchModal={() => setIsKillSwitchModalOpen(true)}
      onOpenTradeModal={handleOpenTradeWizard}
      quotes={quotes}
      onSelectSymbol={(sym) => {
        setSelectedMarketSymbol(sym);
        setActiveTab('MARKET');
      }}
      openPositionsCount={positions.filter((p) => p.isOpen).length}
      activeBotsCount={bots.filter((b) => b.status === 'RUNNING').length}
      isConnected={isConnected}
    >
      {/* 1. DASHBOARD COMMAND CENTER */}
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
          killSwitch={killSwitch}
          behaviorData={behaviorData}
          unifiedTrades={unifiedTrades}
          onSelectSymbol={(sym) => {
            setSelectedMarketSymbol(sym);
            setActiveTab('MARKET');
          }}
          onClosePosition={handleClosePosition}
          onNavigateTab={(tab) => {
            if (tab === 'POSITIONS' || tab === 'positions') setActiveTab('POSITIONS');
            else if (tab === 'BOTS' || tab === 'bots') setActiveTab('BOTS');
            else if (tab === 'MARKET' || tab === 'market') setActiveTab('MARKET');
            else if (tab === 'ORDERS' || tab === 'orders') setActiveTab('ORDERS');
            else if (tab === 'RISK_CENTER' || tab === 'risk') setActiveTab('RISK_CENTER');
            else if (tab === 'ANALYTICS' || tab === 'analytics') setActiveTab('ANALYTICS');
            else if (tab === 'PORTFOLIO' || tab === 'portfolio') setActiveTab('PORTFOLIO');
            else if (tab === 'SETTINGS' || tab === 'settings') setActiveTab('SETTINGS');
          }}
          onOpenOrderModal={handleOpenTradeWizard}
          onSelectPosition={() => {
            setActiveTab('POSITIONS');
          }}
          onSelectTrade={(trade) => setSelectedTradeForDetail(trade)}
        />
      )}

      {/* 2. PORTFOLIO VIEW */}
      {activeTab === 'PORTFOLIO' && (
        <PortfolioView
          accounts={accounts}
          activeAccount={activeAccount}
          metrics={metrics}
          equityHistory={equityHistory}
          onSwitchAccount={handleSwitchAccount}
        />
      )}

      {/* 3. POSITIONS VIEW */}
      {activeTab === 'POSITIONS' && (
        <PositionsView
          positions={positions}
          unifiedTrades={unifiedTrades}
          onClosePosition={handleClosePosition}
          onOpenOrderModal={() => handleOpenTradeWizard()}
          onSelectTrade={(trade) => setSelectedTradeForDetail(trade)}
        />
      )}

      {/* 4. ORDERS & EXECUTION VIEW */}
      {activeTab === 'ORDERS' && (
        <OrdersView
          orders={orders}
          executions={executions}
          unifiedTrades={unifiedTrades}
          onCancelOrder={handleCancelOrder}
          onOpenOrderModal={() => handleOpenTradeWizard()}
          onSelectTrade={(trade) => setSelectedTradeForDetail(trade)}
        />
      )}

      {/* 5. STRUCTURED JOURNAL & COGNITIVE REVIEW */}
      {activeTab === 'JOURNAL' &&
        (selectedJournalEntry ? (
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
            unifiedTrades={unifiedTrades}
            onSelectEntry={(entry) => setSelectedJournalEntry(entry)}
            onOpenNewEntryModal={() => setIsNewJournalModalOpen(true)}
            onSelectTrade={(trade) => setSelectedTradeForDetail(trade)}
          />
        ))}

      {/* 6. UNIFIED ANALYTICS SUITE (Performance, Strategies, Execution, Behavior) */}
      {activeTab === 'ANALYTICS' && (
        <AnalyticsView
          metrics={metrics}
          equityHistory={equityHistory}
          strategies={strategies}
          behaviorData={behaviorData}
          executionData={executionData}
        />
      )}

      {/* Direct tabs routed into AnalyticsView sections for backward-compat */}
      {activeTab === 'STRATEGIES' && (
        <AnalyticsView
          metrics={metrics}
          equityHistory={equityHistory}
          strategies={strategies}
          behaviorData={behaviorData}
          executionData={executionData}
          initialTab="STRATEGIES"
        />
      )}
      {activeTab === 'EXECUTION' && (
        <AnalyticsView
          metrics={metrics}
          equityHistory={equityHistory}
          strategies={strategies}
          behaviorData={behaviorData}
          executionData={executionData}
          initialTab="EXECUTION"
        />
      )}
      {activeTab === 'BEHAVIOR' && (
        <AnalyticsView
          metrics={metrics}
          equityHistory={equityHistory}
          strategies={strategies}
          behaviorData={behaviorData}
          executionData={executionData}
          initialTab="BEHAVIOR"
        />
      )}

      {/* 7. BOT FLEET & ALGORITHMIC GATEWAY */}
      {activeTab === 'BOTS' && (
        <BotsView bots={bots} onRefreshBots={fetchAllData} />
      )}

      {/* 8. RISK CENTER & KILL SWITCH */}
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

      {/* 9. MARKET TERMINAL */}
      {activeTab === 'MARKET' && (
        <MarketTerminalView
          quotes={quotes}
          selectedSymbol={selectedMarketSymbol}
          onSelectSymbol={(sym) => setSelectedMarketSymbol(sym)}
          onOpenOrderModal={() => handleOpenTradeWizard(selectedMarketSymbol)}
        />
      )}

      {/* 10. AUDIT TRAIL */}
      {activeTab === 'AUDIT' && <AuditTrailView logs={auditLogs} />}

      {/* 11. SETTINGS & RISK GOVERNANCE */}
      {activeTab === 'SETTINGS' && (
        <SettingsView
          accounts={accounts}
          activeAccount={activeAccount}
          onSwitchAccount={handleSwitchAccount}
        />
      )}

      {/* 12. DOCUMENTATION & SYSTEM ARCHITECTURE */}
      {activeTab === 'DOCS' && <DocsView />}

      {/* Guided Workflows & Modals */}
      <TradeWizardModal
        isOpen={isTradeWizardOpen}
        onClose={() => setIsTradeWizardOpen(false)}
        quotes={quotes}
        strategies={strategies}
        activeAccount={activeAccount}
        killSwitch={killSwitch}
        defaultSymbol={wizardDefaultSymbol}
        onOrderSuccess={() => {
          setIsTradeWizardOpen(false);
          fetchAllData();
        }}
      />

      <TradeDetailModal
        isOpen={!!selectedTradeForDetail}
        trade={selectedTradeForDetail}
        onClose={() => setSelectedTradeForDetail(null)}
        onSaveReview={async (tradeId, review, lessons, mistakes) => {
          if (selectedTradeForDetail?.journalEntry?.id) {
            try {
              await api.updateJournalEntry(selectedTradeForDetail.journalEntry.id, {
                postTradeReview: review,
                lessonsLearned: lessons,
                mistakes: mistakes,
                status: 'POST_TRADE',
              });
              fetchAllData();
            } catch (err) {
              console.error('Failed to update journal review:', err);
            }
          }
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
    </AppShell>
  );
}

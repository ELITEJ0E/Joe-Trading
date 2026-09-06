/**
 * REST API Routes (/api/v1/*) & Real-Time SSE Stream
 */

import { Router, Request, Response } from 'express';
import { appStore } from './store.ts';
import { riskEngine } from './risk-engine.ts';
import { mockBroker } from './mock-broker.ts';
import { marketDataService } from './market-data.ts';
import { botGateway } from './bot-gateway.ts';
import { behaviorAnalytics } from './behavior-analytics.ts';
import { generateMarketPulse, analyzeTradeReview } from './gemini-service.ts';
import { eventBus } from './event-bus.ts';
import {
  Order,
  OrderSide,
  OrderType,
  TimeInForce,
  OrderStatus,
  TradeLifecycleStage,
  JournalEntry,
} from './types.ts';

export const apiRouter = Router();

// ==========================================
// OBSERVABILITY & HEALTH
// ==========================================
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      marketData: 'ONLINE',
      brokerAdapter: 'ONLINE_MOCK',
      riskEngine: riskEngine.getKillSwitchState().isActive ? 'HALTED_KILL_SWITCH' : 'ONLINE',
      eventBus: `ACTIVE (${eventBus.getEventCount()} events logged)`,
    },
  });
});

apiRouter.get('/readiness', (req: Request, res: Response) => {
  res.json({ ready: true });
});

apiRouter.get('/metrics', (req: Request, res: Response) => {
  res.json({
    totalAccounts: appStore.accounts.length,
    openPositions: appStore.positions.filter((p) => p.isOpen).length,
    activeOrders: appStore.orders.filter((o) => o.status === OrderStatus.SUBMITTED).length,
    activeBots: appStore.bots.filter((b) => b.status === 'RUNNING').length,
    totalEventsLogged: eventBus.getEventCount(),
  });
});

// ==========================================
// REAL-TIME SERVER-SENT EVENTS (SSE) STREAM
// ==========================================
apiRouter.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const unsubscribe = eventBus.subscribeAll((event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  // Heartbeat comment ping every 15s to keep connection alive
  const pingTimer = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(pingTimer);
    unsubscribe();
  });
});

// ==========================================
// ACCOUNTS & PORTFOLIO
// ==========================================
apiRouter.get('/accounts', (req: Request, res: Response) => {
  res.json({
    accounts: appStore.accounts,
    activeAccountId: appStore.activeAccountId,
  });
});

apiRouter.post('/accounts/switch', (req: Request, res: Response) => {
  const { accountId } = req.body;
  const success = appStore.setActiveAccount(accountId);
  if (!success) {
    return res.status(404).json({ error: 'Account not found' });
  }
  appStore.addAuditLog('USER_LOGIN', 'Active trading account switched', { accountId });
  res.json({ success: true, activeAccount: appStore.getActiveAccount() });
});

apiRouter.get('/portfolio', (req: Request, res: Response) => {
  const metrics = appStore.getPortfolioMetrics();
  res.json({
    account: appStore.getActiveAccount(),
    metrics,
    equityHistory: appStore.equityHistory,
  });
});

apiRouter.get('/overview', (req: Request, res: Response) => {
  const metrics = appStore.getPortfolioMetrics();
  res.json({
    account: appStore.getActiveAccount(),
    metrics,
    equityHistory: appStore.equityHistory,
    killSwitch: riskEngine.getKillSwitchState(),
  });
});

// ==========================================
// POSITIONS
// ==========================================
apiRouter.get('/positions', (req: Request, res: Response) => {
  const activeAcc = appStore.getActiveAccount();
  const positions = appStore.positions.filter((p) => p.isOpen && (!activeAcc || p.accountId === activeAcc.id));
  res.json({ positions });
});

apiRouter.post('/positions/:id/close', async (req: Request, res: Response) => {
  const { id } = req.params;
  const pos = appStore.positions.find((p) => p.id === id && p.isOpen);
  if (!pos) {
    return res.status(404).json({ error: 'Open position not found' });
  }

  // Create closing market order
  const orderId = 'ord_close_' + Math.random().toString(36).substring(2, 9);
  const closingOrder: Order = {
    id: orderId,
    accountId: pos.accountId,
    symbol: pos.symbol,
    side: pos.side === 'LONG' ? OrderSide.SELL : OrderSide.BUY,
    type: OrderType.MARKET,
    quantity: pos.quantity,
    filledQuantity: 0,
    status: OrderStatus.SUBMITTED,
    timeInForce: TimeInForce.IOC,
    strategyId: pos.strategyId,
    source: 'MANUAL',
    lifecycleStage: TradeLifecycleStage.ORDER_SUBMITTED,
    correlationId: 'corr_close_' + pos.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = await mockBroker.submitOrder(closingOrder);
  res.json({ success: true, order: result.order, execution: result.executions[0] });
});

// ==========================================
// ORDERS & EXECUTIONS
// ==========================================
apiRouter.get('/orders', (req: Request, res: Response) => {
  const activeAcc = appStore.getActiveAccount();
  const orders = appStore.orders.filter((o) => !activeAcc || o.accountId === activeAcc.id);
  res.json({ orders });
});

apiRouter.post('/orders', async (req: Request, res: Response) => {
  const { symbol, side, type, quantity, limitPrice, stopPrice, timeInForce = TimeInForce.GTC, strategyId } = req.body;

  if (!symbol || !side || !type || !quantity || quantity <= 0) {
    return res.status(400).json({
      code: 'INVALID_ORDER_PAYLOAD',
      message: 'Missing or invalid order parameters (symbol, side, type, positive quantity)',
      requestId: 'req_' + Math.random().toString(36).substring(2, 9),
    });
  }

  const account = appStore.getActiveAccount();
  if (!account) {
    return res.status(500).json({ error: 'No active account selected' });
  }

  const quote = marketDataService.getQuote(symbol);
  const estimatedPrice = limitPrice || (quote ? quote.price : 100);

  const orderId = 'ord_' + Math.random().toString(36).substring(2, 9);
  const correlationId = 'corr_' + Math.random().toString(36).substring(2, 9);

  const proposedOrder: Partial<Order> = {
    id: orderId,
    accountId: account.id,
    symbol,
    side: side as OrderSide,
    type: type as OrderType,
    quantity: Number(quantity),
    limitPrice: limitPrice ? Number(limitPrice) : undefined,
    stopPrice: stopPrice ? Number(stopPrice) : undefined,
    strategyId,
    source: 'MANUAL',
    correlationId,
  };

  // 1. Evaluate with Risk Engine
  const openPositions = appStore.positions.filter((p) => p.isOpen && p.accountId === account.id);
  const currentExposure = openPositions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);
  const existingPos = openPositions.find((p) => p.symbol === symbol);
  const existingVal = existingPos ? existingPos.currentPrice * existingPos.quantity : 0;

  const riskDecision = riskEngine.evaluateOrder(proposedOrder, {
    accountEquity: account.equity,
    currentExposure,
    existingPositionValue: existingVal,
    openPositionsCount: openPositions.length,
    todayRealizedLoss: -450,
    estimatedPrice,
  });

  if (riskDecision.decision === 'REJECTED') {
    appStore.addAuditLog('ORDER_REJECTED', 'Order blocked by risk engine', {
      orderId,
      reason: riskDecision.reason,
      rule: riskDecision.ruleName,
    });

    return res.status(422).json({
      code: 'RISK_LIMIT_EXCEEDED',
      message: riskDecision.reason,
      decision: riskDecision,
    });
  }

  // 2. Submit Order
  const fullOrder: Order = {
    id: orderId,
    accountId: account.id,
    symbol,
    side: side as OrderSide,
    type: type as OrderType,
    quantity: Number(quantity),
    filledQuantity: 0,
    limitPrice: limitPrice ? Number(limitPrice) : undefined,
    stopPrice: stopPrice ? Number(stopPrice) : undefined,
    status: OrderStatus.SUBMITTED,
    timeInForce: timeInForce as TimeInForce,
    strategyId,
    source: 'MANUAL',
    lifecycleStage: TradeLifecycleStage.ORDER_SUBMITTED,
    correlationId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  appStore.orders.unshift(fullOrder);
  appStore.addAuditLog('ORDER_CREATED', 'Order created and submitted', { orderId, symbol, quantity });

  // 3. Broker Execution (Immediate fill simulation for Market orders)
  if (type === OrderType.MARKET) {
    const executionResult = await mockBroker.submitOrder(fullOrder);
    return res.json({
      success: true,
      order: executionResult.order,
      executions: executionResult.executions,
      riskDecision,
    });
  }

  res.json({
    success: true,
    order: fullOrder,
    riskDecision,
  });
});

apiRouter.delete('/orders/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = appStore.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  await mockBroker.cancelOrder(id);
  res.json({ success: true, message: `Order ${id} cancelled` });
});

apiRouter.get('/executions', (req: Request, res: Response) => {
  res.json({ executions: appStore.executions });
});

// ==========================================
// TRADING JOURNAL
// ==========================================
apiRouter.get('/journal', (req: Request, res: Response) => {
  const activeAcc = appStore.getActiveAccount();
  const entries = appStore.journalEntries.filter((j) => !activeAcc || j.accountId === activeAcc.id);
  res.json({ entries });
});

apiRouter.post('/journal', (req: Request, res: Response) => {
  const body = req.body;
  const activeAcc = appStore.getActiveAccount();

  const newEntry: JournalEntry = {
    id: 'jnl_' + Math.random().toString(36).substring(2, 9),
    accountId: activeAcc?.id || 'acc_apex_01',
    symbol: body.symbol || 'BTC/USDT',
    direction: body.direction || 'LONG',
    plannedEntry: Number(body.plannedEntry) || 0,
    stopLoss: Number(body.stopLoss) || 0,
    takeProfit: Number(body.takeProfit) || 0,
    positionSize: Number(body.positionSize) || 1000,
    strategy: body.strategy || 'Discretionary',
    setup: body.setup || 'Market Observation',
    marketConditions: body.marketConditions || 'Normal',
    tradingThesis: body.tradingThesis || '',
    invalidationCriteria: body.invalidationCriteria || '',
    confidenceScore: Number(body.confidenceScore) || 5,
    riskRewardRatio: Number(body.riskRewardRatio) || 2.0,
    emotion: body.emotion || 'NEUTRAL',
    executionNotes: body.executionNotes || '',
    postTradeReview: body.postTradeReview || '',
    mistakes: body.mistakes || [],
    lessonsLearned: body.lessonsLearned || [],
    tags: body.tags || [],
    status: body.status || 'PRE_TRADE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  appStore.journalEntries.unshift(newEntry);
  appStore.addAuditLog('JOURNAL_CREATED', 'Journal entry recorded', {
    id: newEntry.id,
    symbol: newEntry.symbol,
  });

  eventBus.publish('journal.created', { entry: newEntry });
  res.json({ success: true, entry: newEntry });
});

apiRouter.put('/journal/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = appStore.journalEntries.findIndex((j) => j.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Journal entry not found' });
  }

  appStore.journalEntries[idx] = {
    ...appStore.journalEntries[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  eventBus.publish('journal.updated', { entry: appStore.journalEntries[idx] });
  res.json({ success: true, entry: appStore.journalEntries[idx] });
});

// ==========================================
// STRATEGIES & BOTS
// ==========================================
apiRouter.get('/strategies', (req: Request, res: Response) => {
  res.json({ strategies: appStore.strategies });
});

apiRouter.get('/bots', (req: Request, res: Response) => {
  res.json({ bots: botGateway.getBots() });
});

apiRouter.post('/bots/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const updatedBot = botGateway.updateBotStatus(id, status);
  if (!updatedBot) {
    return res.status(404).json({ error: 'Bot not found' });
  }
  res.json({ success: true, bot: updatedBot });
});

apiRouter.post('/bots/:id/events', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { eventType, payload = {} } = req.body;

  try {
    const result = await botGateway.receiveBotEvent(id, eventType, payload);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/bots/:id/events', (req: Request, res: Response) => {
  const { id } = req.params;
  const events = botGateway.getBotEvents(id);
  res.json({ events });
});

// ==========================================
// RISK ENGINE & EMERGENCY KILL SWITCH
// ==========================================
apiRouter.get('/risk/rules', (req: Request, res: Response) => {
  res.json({
    rules: riskEngine.getRules(),
    killSwitch: riskEngine.getKillSwitchState(),
  });
});

apiRouter.put('/risk/rules/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = riskEngine.updateRule(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Risk rule not found' });
  }
  appStore.addAuditLog('RISK_LIMIT_CHANGED', 'Risk rule threshold updated', { ruleId: id, updates: req.body });
  res.json({ success: true, rule: updated });
});

apiRouter.post('/risk/kill-switch', (req: Request, res: Response) => {
  const { activate, reason, cancelOrders } = req.body;

  if (activate) {
    const state = riskEngine.activateKillSwitch(reason || 'Manual emergency halt activated by operator');

    // Automatically pause/stop active bots
    appStore.bots.forEach((bot) => {
      if (bot.status === 'RUNNING') {
        botGateway.updateBotStatus(bot.id, 'PAUSED' as any);
      }
    });

    let cancelledCount = 0;
    if (cancelOrders) {
      appStore.orders.forEach((ord) => {
        if (ord.status === OrderStatus.SUBMITTED) {
          ord.status = OrderStatus.CANCELLED;
          cancelledCount++;
        }
      });
      state.cancelledOrdersCount = cancelledCount;
    }

    appStore.addAuditLog('KILL_SWITCH_ACTIVATED', 'Emergency Kill Switch Activated', { reason, cancelledCount });
    return res.json({ success: true, killSwitch: state });
  } else {
    const state = riskEngine.deactivateKillSwitch();
    appStore.addAuditLog('KILL_SWITCH_DEACTIVATED', 'Emergency Kill Switch Deactivated', {});
    return res.json({ success: true, killSwitch: state });
  }
});

apiRouter.get('/risk/decisions', (req: Request, res: Response) => {
  res.json({ decisions: riskEngine.getRecentDecisions() });
});

// ==========================================
// ANALYTICS (BEHAVIOR & EXECUTION)
// ==========================================
apiRouter.get('/analytics/behavior', (req: Request, res: Response) => {
  res.json({
    insights: behaviorAnalytics.getBehavioralInsights(),
    emotionalDistribution: behaviorAnalytics.getEmotionalDistribution(),
    confidenceCalibration: behaviorAnalytics.getConfidenceCalibration(),
  });
});

apiRouter.get('/analytics/execution', (req: Request, res: Response) => {
  res.json({
    executionQuality: behaviorAnalytics.getExecutionQualityMetrics(),
  });
});

// ==========================================
// MARKET DATA
// ==========================================
apiRouter.get('/market-data/quotes', (req: Request, res: Response) => {
  res.json({ quotes: marketDataService.getAllQuotes() });
});

apiRouter.get('/market-data/quotes/:symbol', (req: Request, res: Response) => {
  const { symbol } = req.params;
  const decoded = decodeURIComponent(symbol);
  const quote = marketDataService.getQuote(decoded);
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  res.json({ quote });
});

apiRouter.get('/market-data/bars/:symbol', (req: Request, res: Response) => {
  const { symbol } = req.params;
  const decoded = decodeURIComponent(symbol);
  const bars = marketDataService.getHistoricalBars(decoded);
  res.json({ symbol: decoded, bars });
});

// ==========================================
// AUDIT LOG
// ==========================================
apiRouter.get('/audit', (req: Request, res: Response) => {
  res.json({ logs: appStore.auditLogs });
});

// ==========================================
// AI FEATURES (SERVER-SIDE GEMINI + GOOGLE SEARCH GROUNDING)
// ==========================================
apiRouter.post('/ai/market-pulse', async (req: Request, res: Response) => {
  const { symbol } = req.body;
  if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

  try {
    const pulse = await generateMarketPulse(symbol);
    res.json(pulse);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/ai/trade-review', async (req: Request, res: Response) => {
  try {
    const review = await analyzeTradeReview(req.body);
    res.json(review);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

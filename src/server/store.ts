/**
 * Modular Monolith Store & CQRS Read Projections
 * Manages Accounts, Positions, Orders, Journal, Strategies, Bots, and Audit Logs
 */

import {
  TradingAccount,
  AccountType,
  Position,
  PositionSide,
  Order,
  OrderStatus,
  OrderSide,
  OrderType,
  TimeInForce,
  TradeLifecycleStage,
  Execution,
  JournalEntry,
  EmotionState,
  Strategy,
  TradingBot,
  BotStatus,
  AuditLogEntry,
  PortfolioMetrics,
  BehaviorInsight,
} from './types.ts';
import { eventBus } from './event-bus.ts';
import { marketDataService } from './market-data.ts';

export class AppStore {
  private static instance: AppStore;

  public accounts: TradingAccount[] = [];
  public activeAccountId: string = '';
  public positions: Position[] = [];
  public orders: Order[] = [];
  public executions: Execution[] = [];
  public journalEntries: JournalEntry[] = [];
  public strategies: Strategy[] = [];
  public bots: TradingBot[] = [];
  public auditLogs: AuditLogEntry[] = [];
  public equityHistory: { timestamp: string; equity: number; cash: number; drawdown: number }[] = [];

  private constructor() {
    this.seedInitialData();
    this.setupEventListeners();
  }

  public static getInstance(): AppStore {
    if (!AppStore.instance) {
      AppStore.instance = new AppStore();
    }
    return AppStore.instance;
  }

  private seedInitialData() {
    // 1. Seed Accounts
    this.accounts = [
      {
        id: 'acc_apex_01',
        name: 'Apex Alpha Prop $250k',
        broker: 'Apex Trader Funding (Rithmic)',
        type: AccountType.PROP_FIRM,
        currency: 'USD',
        initialBalance: 250000,
        cashBalance: 184500,
        equity: 268420,
        unrealizedPnL: 5240,
        realizedPnL: 18420,
        marginUsed: 78680,
        marginAvailable: 189740,
        leverage: 3.5,
        isActive: true,
        createdAt: '2026-06-01T09:00:00Z',
      },
      {
        id: 'acc_binance_vip',
        name: 'Binance Algo Spot/Perp',
        broker: 'Binance Institutional',
        type: AccountType.CRYPTO_EXCHANGE,
        currency: 'USDT',
        initialBalance: 100000,
        cashBalance: 42300,
        equity: 124850,
        unrealizedPnL: 3820,
        realizedPnL: 24850,
        marginUsed: 78730,
        marginAvailable: 46120,
        leverage: 2.0,
        isActive: true,
        createdAt: '2026-05-15T14:30:00Z',
      },
      {
        id: 'acc_ibkr_pro',
        name: 'IBKR Pro Margin Equities',
        broker: 'Interactive Brokers LLC',
        type: AccountType.MARGIN_BROKER,
        currency: 'USD',
        initialBalance: 150000,
        cashBalance: 98400,
        equity: 162900,
        unrealizedPnL: 1450,
        realizedPnL: 12900,
        marginUsed: 63050,
        marginAvailable: 99850,
        leverage: 1.8,
        isActive: false,
        createdAt: '2026-04-10T10:00:00Z',
      },
      {
        id: 'acc_sim_paper',
        name: 'Paper Alpha Sandbox',
        broker: 'Internal Simulation Engine',
        type: AccountType.PAPER_SIMULATION,
        currency: 'USD',
        initialBalance: 100000,
        cashBalance: 85200,
        equity: 104500,
        unrealizedPnL: 920,
        realizedPnL: 4500,
        marginUsed: 18380,
        marginAvailable: 86120,
        leverage: 1.0,
        isActive: false,
        createdAt: '2026-07-01T08:00:00Z',
      },
    ];

    this.activeAccountId = 'acc_apex_01';

    // 2. Seed Strategies
    this.strategies = [
      {
        id: 'strat_breakout',
        name: 'Liquidity Sweep Breakout',
        description: 'Enters on session high/low liquidity sweeps with volume surge and FVGs.',
        category: 'BREAKOUT',
        version: 'v2.4',
        isActive: true,
        totalTrades: 74,
        winRate: 63.5,
        profitFactor: 2.38,
        expectancy: 1.42,
        averageR: 2.15,
        maxDrawdown: 4.8,
        averageHoldMinutes: 94,
        bestTradePnL: 8450,
        worstTradePnL: -2100,
        netPnL: 34200,
        createdAt: '2026-05-10T00:00:00Z',
      },
      {
        id: 'strat_vwap_rev',
        name: 'Anchored VWAP Mean Reversion',
        description: 'Scalps 2.0+ standard deviation standard bands back to volume-weighted mean.',
        category: 'MEAN_REVERSION',
        version: 'v1.8',
        isActive: true,
        totalTrades: 112,
        winRate: 71.4,
        profitFactor: 2.12,
        expectancy: 0.98,
        averageR: 1.45,
        maxDrawdown: 3.9,
        averageHoldMinutes: 38,
        bestTradePnL: 4200,
        worstTradePnL: -1600,
        netPnL: 28900,
        createdAt: '2026-05-18T00:00:00Z',
      },
      {
        id: 'strat_trend_ema',
        name: 'Multi-Timeframe Trend Continuation',
        description: 'Rides dynamic 21/55 EMA pullbacks in strong secular trends.',
        category: 'TREND_FOLLOWING',
        version: 'v3.1',
        isActive: true,
        totalTrades: 48,
        winRate: 52.1,
        profitFactor: 2.76,
        expectancy: 1.84,
        averageR: 3.1,
        maxDrawdown: 6.2,
        averageHoldMinutes: 340,
        bestTradePnL: 12800,
        worstTradePnL: -3200,
        netPnL: 41500,
        createdAt: '2026-04-20T00:00:00Z',
      },
      {
        id: 'strat_scalp_delta',
        name: 'Orderbook Delta Momentum',
        description: 'High-frequency passive bid/ask queue placement exploiting CVD divergence.',
        category: 'SCALPING',
        version: 'v1.2',
        isActive: false,
        totalTrades: 186,
        winRate: 78.0,
        profitFactor: 1.95,
        expectancy: 0.65,
        averageR: 1.12,
        maxDrawdown: 2.8,
        averageHoldMinutes: 12,
        bestTradePnL: 1850,
        worstTradePnL: -850,
        netPnL: 18400,
        createdAt: '2026-06-12T00:00:00Z',
      },
    ];

    // 3. Seed Trading Bots
    this.bots = [
      {
        id: 'bot_grid_scalper',
        name: 'Grid-Scalper-V2',
        description: 'Algorithmic micro-delta liquidity provider on BTC & ETH perp futures.',
        strategyId: 'strat_vwap_rev',
        strategyName: 'Anchored VWAP Mean Reversion',
        version: '2.4.1',
        status: BotStatus.RUNNING,
        environment: 'LIVE',
        connectedAccountId: 'acc_apex_01',
        connectedAccountName: 'Apex Alpha Prop $250k',
        lastHeartbeat: new Date().toISOString(),
        lastSignal: 'MEAN_REV_LONG_TRIGGERED',
        lastExecution: 'BUY 0.5 BTC @ 68,390',
        uptimeSeconds: 842900,
        winRate: 72.8,
        totalPnL: 14820,
        tradesCount: 88,
        riskStatus: 'NORMAL',
        config: {
          maxDailyTrades: 25,
          maxPositionSize: 50000,
          pollIntervalMs: 1500,
          pairs: ['BTC/USDT', 'ETH/USDT'],
        },
      },
      {
        id: 'bot_breakout_alpha',
        name: 'Apex-Breakout-Pro',
        description: 'Automated London & NY session opening sweep execution bot.',
        strategyId: 'strat_breakout',
        strategyName: 'Liquidity Sweep Breakout',
        version: '3.0.0',
        status: BotStatus.RUNNING,
        environment: 'LIVE',
        connectedAccountId: 'acc_apex_01',
        connectedAccountName: 'Apex Alpha Prop $250k',
        lastHeartbeat: new Date().toISOString(),
        lastSignal: 'SWEEP_HIGH_CONFIRMED',
        lastExecution: 'BUY 150 NVDA @ 126.20',
        uptimeSeconds: 432000,
        winRate: 64.0,
        totalPnL: 11450,
        tradesCount: 42,
        riskStatus: 'NORMAL',
        config: {
          maxDailyTrades: 8,
          maxPositionSize: 45000,
          pollIntervalMs: 2500,
          pairs: ['NVDA', 'SPY', 'QQQ'],
        },
      },
      {
        id: 'bot_trend_harvester',
        name: 'Macro-Trend-Harvester',
        description: 'Multi-day momentum follower tracking 4H/Daily EMA structure.',
        strategyId: 'strat_trend_ema',
        strategyName: 'Multi-Timeframe Trend Continuation',
        version: '1.9.4',
        status: BotStatus.PAUSED,
        environment: 'LIVE',
        connectedAccountId: 'acc_binance_vip',
        connectedAccountName: 'Binance Algo Spot/Perp',
        lastHeartbeat: new Date(Date.now() - 3600000).toISOString(),
        lastSignal: 'WAITING_4H_CONFIRMATION',
        lastExecution: 'SELL 2.0 ETH @ 3,560',
        uptimeSeconds: 128000,
        winRate: 54.5,
        totalPnL: 6800,
        tradesCount: 16,
        riskStatus: 'WARNING',
        config: {
          maxDailyTrades: 4,
          maxPositionSize: 60000,
          pollIntervalMs: 5000,
          pairs: ['ETH/USDT', 'SOL/USDT'],
        },
      },
    ];

    // 4. Seed Positions
    this.positions = [
      {
        id: 'pos_btc_01',
        accountId: 'acc_apex_01',
        symbol: 'BTC/USDT',
        side: PositionSide.LONG,
        quantity: 0.75,
        entryPrice: 67120.0,
        currentPrice: 68420.5,
        liquidationPrice: 53200.0,
        unrealizedPnL: 975.38,
        unrealizedPnLPercent: 1.94,
        realizedPnL: 0,
        stopLoss: 66400.0,
        takeProfit: 70500.0,
        strategyId: 'strat_breakout',
        botId: 'bot_grid_scalper',
        leverage: 3,
        openedAt: '2026-09-04T14:22:00Z',
        updatedAt: '2026-09-05T19:45:00Z',
        isOpen: true,
      },
      {
        id: 'pos_eth_01',
        accountId: 'acc_apex_01',
        symbol: 'ETH/USDT',
        side: PositionSide.LONG,
        quantity: 5.0,
        entryPrice: 3480.0,
        currentPrice: 3548.8,
        liquidationPrice: 2890.0,
        unrealizedPnL: 344.0,
        unrealizedPnLPercent: 1.98,
        realizedPnL: 0,
        stopLoss: 3420.0,
        takeProfit: 3680.0,
        strategyId: 'strat_vwap_rev',
        leverage: 2,
        openedAt: '2026-09-05T08:15:00Z',
        updatedAt: '2026-09-05T20:00:00Z',
        isOpen: true,
      },
      {
        id: 'pos_nvda_01',
        accountId: 'acc_apex_01',
        symbol: 'NVDA',
        side: PositionSide.LONG,
        quantity: 180,
        entryPrice: 122.4,
        currentPrice: 126.85,
        unrealizedPnL: 801.0,
        unrealizedPnLPercent: 3.64,
        realizedPnL: 0,
        stopLoss: 121.0,
        takeProfit: 132.5,
        strategyId: 'strat_breakout',
        botId: 'bot_breakout_alpha',
        leverage: 1,
        openedAt: '2026-09-04T13:30:00Z',
        updatedAt: '2026-09-05T20:05:00Z',
        isOpen: true,
      },
      {
        id: 'pos_sol_01',
        accountId: 'acc_apex_01',
        symbol: 'SOL/USDT',
        side: PositionSide.SHORT,
        quantity: 50,
        entryPrice: 154.2,
        currentPrice: 152.4,
        liquidationPrice: 188.0,
        unrealizedPnL: 90.0,
        unrealizedPnLPercent: 1.17,
        realizedPnL: 0,
        stopLoss: 156.8,
        takeProfit: 144.0,
        strategyId: 'strat_vwap_rev',
        leverage: 2,
        openedAt: '2026-09-05T12:40:00Z',
        updatedAt: '2026-09-05T19:30:00Z',
        isOpen: true,
      },
    ];

    // 5. Seed Orders
    this.orders = [
      {
        id: 'ord_active_01',
        accountId: 'acc_apex_01',
        symbol: 'BTC/USDT',
        side: OrderSide.SELL,
        type: OrderType.LIMIT,
        quantity: 0.25,
        filledQuantity: 0,
        limitPrice: 70200.0,
        status: OrderStatus.SUBMITTED,
        timeInForce: TimeInForce.GTC,
        strategyId: 'strat_breakout',
        source: 'MANUAL',
        lifecycleStage: TradeLifecycleStage.ORDER_SUBMITTED,
        correlationId: 'corr_ord_active_01',
        createdAt: '2026-09-05T18:30:00Z',
        updatedAt: '2026-09-05T18:30:00Z',
      },
      {
        id: 'ord_active_02',
        accountId: 'acc_apex_01',
        symbol: 'SPY',
        side: OrderSide.BUY,
        type: OrderType.LIMIT,
        quantity: 50,
        filledQuantity: 0,
        limitPrice: 554.5,
        status: OrderStatus.SUBMITTED,
        timeInForce: TimeInForce.DAY,
        strategyId: 'strat_trend_ema',
        source: 'BOT',
        botId: 'bot_breakout_alpha',
        lifecycleStage: TradeLifecycleStage.ORDER_SUBMITTED,
        correlationId: 'corr_ord_active_02',
        createdAt: '2026-09-05T19:10:00Z',
        updatedAt: '2026-09-05T19:10:00Z',
      },
      {
        id: 'ord_filled_01',
        accountId: 'acc_apex_01',
        symbol: 'BTC/USDT',
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        quantity: 0.75,
        filledQuantity: 0.75,
        avgFillPrice: 67120.0,
        status: OrderStatus.FILLED,
        timeInForce: TimeInForce.IOC,
        strategyId: 'strat_breakout',
        botId: 'bot_grid_scalper',
        source: 'BOT',
        lifecycleStage: TradeLifecycleStage.FILLED,
        correlationId: 'corr_ord_filled_01',
        createdAt: '2026-09-04T14:22:00Z',
        updatedAt: '2026-09-04T14:22:01Z',
      },
      {
        id: 'ord_filled_02',
        accountId: 'acc_apex_01',
        symbol: 'NVDA',
        side: OrderSide.BUY,
        type: OrderType.LIMIT,
        quantity: 180,
        filledQuantity: 180,
        limitPrice: 122.5,
        avgFillPrice: 122.4,
        status: OrderStatus.FILLED,
        timeInForce: TimeInForce.GTC,
        strategyId: 'strat_breakout',
        source: 'MANUAL',
        lifecycleStage: TradeLifecycleStage.FILLED,
        correlationId: 'corr_ord_filled_02',
        createdAt: '2026-09-04T13:28:00Z',
        updatedAt: '2026-09-04T13:30:00Z',
      },
    ];

    // 6. Seed Executions
    this.executions = [
      {
        id: 'exec_seed_01',
        orderId: 'ord_filled_01',
        accountId: 'acc_apex_01',
        symbol: 'BTC/USDT',
        side: OrderSide.BUY,
        price: 67120.0,
        quantity: 0.75,
        fee: 20.14,
        feeCurrency: 'USD',
        slippage: 1.2,
        latencyMs: 34,
        timestamp: '2026-09-04T14:22:01Z',
        brokerExecutionId: 'SIM-849102',
      },
      {
        id: 'exec_seed_02',
        orderId: 'ord_filled_02',
        accountId: 'acc_apex_01',
        symbol: 'NVDA',
        side: OrderSide.BUY,
        price: 122.4,
        quantity: 180,
        fee: 8.81,
        feeCurrency: 'USD',
        slippage: -0.8,
        latencyMs: 22,
        timestamp: '2026-09-04T13:30:00Z',
        brokerExecutionId: 'SIM-930182',
      },
    ];

    // 7. Seed Structured Journal Entries
    this.journalEntries = [
      {
        id: 'jnl_01',
        accountId: 'acc_apex_01',
        symbol: 'BTC/USDT',
        direction: 'LONG',
        plannedEntry: 67100.0,
        stopLoss: 66400.0,
        takeProfit: 70500.0,
        positionSize: 50340,
        strategy: 'Liquidity Sweep Breakout',
        setup: 'Asia Session High Sweep + 15m Fair Value Gap',
        marketConditions: 'Strong bullish trend, ETF inflows accelerating, funding rates neutral',
        tradingThesis: 'BTC took out $66,800 Asian highs, tested back into 15m FVG with decreasing volume. Expecting continuation into $70k psychological resistance.',
        invalidationCriteria: 'Clean 15m candle close below $66,400 invalidates market structure.',
        confidenceScore: 8,
        riskRewardRatio: 4.86,
        emotion: EmotionState.DISCIPLINED,
        executionNotes: 'Entered via market order as volume confirmed. Fill slippage was minimal.',
        postTradeReview: 'Trade is tracking well. Raised trailing stop loss to break-even after +1.5R.',
        mistakes: [],
        lessonsLearned: ['Waiting for session sweep confirmed higher win rate than front-running.'],
        tags: ['BREAKOUT', 'FVG', 'CRYPTO', 'DISCIPLINED'],
        realizedPnL: 0,
        unrealizedPnL: 975.38,
        actualEntry: 67120.0,
        totalFees: 20.14,
        holdingPeriodMinutes: 1740,
        rMultiple: 1.86,
        slippageBps: 1.2,
        status: 'ACTIVE',
        createdAt: '2026-09-04T14:20:00Z',
        updatedAt: '2026-09-05T19:00:00Z',
      },
      {
        id: 'jnl_02',
        accountId: 'acc_apex_01',
        symbol: 'NVDA',
        direction: 'LONG',
        plannedEntry: 122.5,
        stopLoss: 121.0,
        takeProfit: 132.5,
        positionSize: 22032,
        strategy: 'Multi-Timeframe Trend Continuation',
        setup: 'Daily 21 EMA bounce + AI semiconductor catalyst',
        marketConditions: 'Broad tech rally in S&P 500, Jensen Huang keynote scheduled',
        tradingThesis: 'NVDA retested 1-hour order block at $122.40 with strong buyer absorption on the tape. Target $130+ pre-market gap fill.',
        invalidationCriteria: 'Loss of $121.00 swing low on heavy volume.',
        confidenceScore: 9,
        riskRewardRatio: 6.67,
        emotion: EmotionState.CONFIDENT,
        executionNotes: 'Limit order filled at benchmark cleanly.',
        tags: ['EQUITY', 'TECH', 'TREND', 'AI_CATALYST'],
        realizedPnL: 0,
        unrealizedPnL: 801.0,
        actualEntry: 122.4,
        totalFees: 8.81,
        holdingPeriodMinutes: 1820,
        rMultiple: 2.97,
        slippageBps: -0.8,
        status: 'ACTIVE',
        createdAt: '2026-09-04T13:25:00Z',
        updatedAt: '2026-09-05T18:15:00Z',
      },
      {
        id: 'jnl_03',
        accountId: 'acc_apex_01',
        symbol: 'SPY',
        direction: 'LONG',
        plannedEntry: 552.0,
        stopLoss: 550.2,
        takeProfit: 558.0,
        positionSize: 27600,
        strategy: 'Anchored VWAP Mean Reversion',
        setup: 'VWAP -2 STD Band Reversal at opening bell',
        marketConditions: 'Fed rate cut expectations fueling index push',
        tradingThesis: 'Morning dip tagged key anchor from FOMC day, aggressive delta imbalance printed.',
        invalidationCriteria: 'Break below VWAP band lower boundary ($550.00).',
        confidenceScore: 7,
        riskRewardRatio: 3.33,
        emotion: EmotionState.PATIENT,
        postTradeReview: 'Closed at take profit target $557.80. Clean execution, no emotional deviation.',
        mistakes: ['Could have scaled out half instead of 100% full exit.'],
        lessonsLearned: ['Trailing runner on index trends can capture additional 1R.'],
        tags: ['MACRO', 'VWAP', 'COMPLETED_WIN'],
        realizedPnL: 2890.0,
        unrealizedPnL: 0,
        actualEntry: 552.1,
        actualExit: 557.88,
        totalFees: 12.4,
        holdingPeriodMinutes: 215,
        rMultiple: 3.21,
        slippageBps: 0.9,
        status: 'POST_TRADE',
        createdAt: '2026-09-03T13:35:00Z',
        updatedAt: '2026-09-03T17:15:00Z',
      },
    ];

    // 8. Seed Audit Log Entries
    this.auditLogs = [
      {
        id: 'aud_01',
        action: 'USER_LOGIN',
        actor: 'benjoel.tan1@gmail.com',
        correlationId: 'corr_login_01',
        details: { method: 'SSO_OIDC', userAgent: 'Chrome/128 MacIntel', role: 'HEAD_TRADER' },
        ipAddress: '192.168.1.104',
        timestamp: '2026-09-05T18:00:00Z',
      },
      {
        id: 'aud_02',
        action: 'ORDER_APPROVED',
        actor: 'RISK_ENGINE',
        targetId: 'ord_filled_01',
        correlationId: 'corr_risk_01',
        details: { ruleCheck: 'ALL_PASSED', proposedNotional: 50340, exposurePost: 74.2 },
        ipAddress: 'INTERNAL_SVC',
        timestamp: '2026-09-04T14:22:00Z',
      },
      {
        id: 'aud_03',
        action: 'ORDER_FILLED',
        actor: 'MOCK_BROKER',
        targetId: 'ord_filled_01',
        correlationId: 'corr_fill_01',
        details: { fillPrice: 67120.0, qty: 0.75, venue: 'RITHMIC_SIM' },
        ipAddress: 'INTERNAL_BROKER',
        timestamp: '2026-09-04T14:22:01Z',
      },
      {
        id: 'aud_04',
        action: 'BOT_STARTED',
        actor: 'benjoel.tan1@gmail.com',
        targetId: 'bot_grid_scalper',
        correlationId: 'corr_bot_start',
        details: { botName: 'Grid-Scalper-V2', strategy: 'Anchored VWAP Mean Reversion' },
        ipAddress: '192.168.1.104',
        timestamp: '2026-09-04T14:25:00Z',
      },
    ];

    // 9. Seed 30-Day Equity Curve History
    this.generateEquityHistory();
  }

  private generateEquityHistory() {
    this.equityHistory = [];
    let equity = 242000;
    let cash = 195000;
    const peakEquity = 270000;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now - i * dayMs).toISOString().split('T')[0];
      const dailyDelta = (Math.random() * 2200 - 800) + (i < 10 ? 800 : 300);
      equity = Math.round(equity + dailyDelta);
      cash = Math.round(equity * (0.65 + Math.random() * 0.1));
      const drawdown = Number((((peakEquity - equity) / peakEquity) * 100).toFixed(2));

      this.equityHistory.push({
        timestamp: date,
        equity,
        cash,
        drawdown: Math.max(0, drawdown),
      });
    }

    // Anchor last day to active account
    const activeAcc = this.getActiveAccount();
    if (activeAcc && this.equityHistory.length > 0) {
      this.equityHistory[this.equityHistory.length - 1].equity = activeAcc.equity;
      this.equityHistory[this.equityHistory.length - 1].cash = activeAcc.cashBalance;
    }
  }

  private setupEventListeners() {
    // When market price ticks, update unrealized P&L on positions
    eventBus.subscribe('market.price_tick', (evt) => {
      const { symbol, price } = evt.payload;
      let pnlChanged = false;

      this.positions.forEach((pos) => {
        if (pos.isOpen && pos.symbol === symbol) {
          pos.currentPrice = price;
          const delta = pos.side === PositionSide.LONG ? price - pos.entryPrice : pos.entryPrice - price;
          pos.unrealizedPnL = Number((delta * pos.quantity).toFixed(2));
          pos.unrealizedPnLPercent = Number(((delta / pos.entryPrice) * 100).toFixed(2));
          pnlChanged = true;
        }
      });

      if (pnlChanged) {
        this.recalculateAccountEquity();
      }
    });

    // When order is filled, handle position updates
    eventBus.subscribe('order.filled', (evt) => {
      const { order, execution } = evt.payload;
      this.handleOrderExecution(order, execution);
    });

    // When order is cancelled
    eventBus.subscribe('order.cancelled', (evt) => {
      const { orderId } = evt.payload;
      const o = this.orders.find((ord) => ord.id === orderId);
      if (o) {
        o.status = OrderStatus.CANCELLED;
        o.updatedAt = new Date().toISOString();
        this.addAuditLog('ORDER_CANCELLED', 'Order cancelled', { orderId });
      }
    });
  }

  public getActiveAccount(): TradingAccount | undefined {
    return this.accounts.find((a) => a.id === this.activeAccountId) || this.accounts[0];
  }

  public setActiveAccount(accountId: string): boolean {
    const acc = this.accounts.find((a) => a.id === accountId);
    if (!acc) return false;
    this.activeAccountId = accountId;
    this.accounts.forEach((a) => (a.isActive = a.id === accountId));
    return true;
  }

  public recalculateAccountEquity() {
    const activeAcc = this.getActiveAccount();
    if (!activeAcc) return;

    let totalUnrealized = 0;
    let totalMarginUsed = 0;

    this.positions.forEach((pos) => {
      if (pos.isOpen && pos.accountId === activeAcc.id) {
        totalUnrealized += pos.unrealizedPnL;
        totalMarginUsed += (pos.currentPrice * pos.quantity) / (pos.leverage || 1);
      }
    });

    activeAcc.unrealizedPnL = Number(totalUnrealized.toFixed(2));
    activeAcc.equity = Number((activeAcc.cashBalance + activeAcc.unrealizedPnL).toFixed(2));
    activeAcc.marginUsed = Number(totalMarginUsed.toFixed(2));
    activeAcc.marginAvailable = Number(Math.max(0, activeAcc.equity - activeAcc.marginUsed).toFixed(2));
  }

  private handleOrderExecution(order: Order, execution: Execution) {
    // Add execution to store
    this.executions.unshift(execution);

    // Update order status
    const existingOrderIdx = this.orders.findIndex((o) => o.id === order.id);
    if (existingOrderIdx >= 0) {
      this.orders[existingOrderIdx] = order;
    } else {
      this.orders.unshift(order);
    }

    // Update or create Position
    const existingPos = this.positions.find(
      (p) => p.isOpen && p.accountId === order.accountId && p.symbol === order.symbol
    );

    const isLongOrder = order.side === OrderSide.BUY;

    if (existingPos) {
      // Modifying position
      if ((existingPos.side === PositionSide.LONG && isLongOrder) || (existingPos.side === PositionSide.SHORT && !isLongOrder)) {
        // Adding to position
        const totalCost = existingPos.entryPrice * existingPos.quantity + execution.price * execution.quantity;
        const newQty = existingPos.quantity + execution.quantity;
        existingPos.entryPrice = Number((totalCost / newQty).toFixed(2));
        existingPos.quantity = newQty;
        existingPos.updatedAt = new Date().toISOString();
      } else {
        // Reducing or closing position
        if (execution.quantity >= existingPos.quantity) {
          // Full close
          const realized = (existingPos.side === PositionSide.LONG
            ? execution.price - existingPos.entryPrice
            : existingPos.entryPrice - execution.price) * existingPos.quantity;

          existingPos.realizedPnL += Number(realized.toFixed(2));
          existingPos.isOpen = false;
          existingPos.closedAt = new Date().toISOString();
          existingPos.unrealizedPnL = 0;

          // Update active account realizedPnL & cash
          const acc = this.accounts.find((a) => a.id === existingPos.accountId);
          if (acc) {
            acc.cashBalance += realized;
            acc.realizedPnL += realized;
          }

          eventBus.publish('position.closed', { position: existingPos, realizedPnL: realized });
        } else {
          // Partial reduction
          existingPos.quantity -= execution.quantity;
          existingPos.updatedAt = new Date().toISOString();
        }
      }
    } else {
      // New position
      const quote = marketDataService.getQuote(order.symbol);
      const currentPrice = quote ? quote.price : execution.price;

      const newPos: Position = {
        id: 'pos_' + Math.random().toString(36).substring(2, 9),
        accountId: order.accountId,
        symbol: order.symbol,
        side: isLongOrder ? PositionSide.LONG : PositionSide.SHORT,
        quantity: execution.quantity,
        entryPrice: execution.price,
        currentPrice,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        realizedPnL: 0,
        stopLoss: order.stopPrice,
        takeProfit: undefined,
        strategyId: order.strategyId,
        botId: order.botId,
        leverage: 2,
        openedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOpen: true,
      };

      this.positions.unshift(newPos);
      eventBus.publish('position.opened', { position: newPos });
    }

    this.recalculateAccountEquity();
    this.addAuditLog('ORDER_FILLED', 'Order filled successfully', {
      orderId: order.id,
      symbol: order.symbol,
      price: execution.price,
      quantity: execution.quantity,
    });
  }

  public addAuditLog(action: any, actor: string, details: Record<string, any>, targetId?: string) {
    const entry: AuditLogEntry = {
      id: 'aud_' + Math.random().toString(36).substring(2, 9),
      action,
      actor,
      targetId,
      correlationId: 'corr_' + Math.random().toString(36).substring(2, 8),
      details,
      ipAddress: '127.0.0.1',
      timestamp: new Date().toISOString(),
    };

    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }

    eventBus.publish('audit.log_created', entry);
    return entry;
  }

  public getPortfolioMetrics(): PortfolioMetrics {
    const acc = this.getActiveAccount();
    const equity = acc ? acc.equity : 250000;
    const cash = acc ? acc.cashBalance : 180000;
    const unrealized = acc ? acc.unrealizedPnL : 5000;
    const realized = acc ? acc.realizedPnL : 18000;
    const invested = equity - cash;

    const openPos = this.positions.filter((p) => p.isOpen && (!acc || p.accountId === acc.id));
    const activeOrds = this.orders.filter((o) => o.status === OrderStatus.SUBMITTED);
    const activeBots = this.bots.filter((b) => b.status === BotStatus.RUNNING);

    const grossExposure = openPos.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);
    const exposurePct = Number(((grossExposure / (equity || 1)) * 100).toFixed(1));

    return {
      totalEquity: equity,
      cashBalance: cash,
      investedCapital: invested,
      unrealizedPnL: unrealized,
      realizedPnL: realized,
      todayPnL: 2840.5,
      todayPnLPercent: 1.07,
      totalReturnPercent: 7.37,
      drawdownPercent: 2.4,
      maxDrawdownPercent: 5.1,
      portfolioExposurePercent: exposurePct,
      sharpeRatio: 2.48,
      sortinoRatio: 3.15,
      winRate: 64.2,
      profitFactor: 2.34,
      expectancy: 1.35,
      averageR: 2.2,
      averageHoldingMinutes: 145,
      totalTrades: 126,
      winningTrades: 81,
      losingTrades: 45,
      openPositionsCount: openPos.length,
      activeOrdersCount: activeOrds.length,
      activeBotsCount: activeBots.length,
    };
  }
}

export const appStore = AppStore.getInstance();

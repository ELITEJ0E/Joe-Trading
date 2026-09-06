/**
 * Trading Intelligence - Domain Models & System Types
 */

export type UUID = string;

export enum AccountType {
  PROP_FIRM = 'PROP_FIRM',
  MARGIN_BROKER = 'MARGIN_BROKER',
  CRYPTO_EXCHANGE = 'CRYPTO_EXCHANGE',
  PAPER_SIMULATION = 'PAPER_SIMULATION',
}

export interface TradingAccount {
  id: UUID;
  name: string;
  broker: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
  cashBalance: number;
  equity: number;
  unrealizedPnL: number;
  realizedPnL: number;
  marginUsed: number;
  marginAvailable: number;
  leverage: number;
  isActive: boolean;
  createdAt: string;
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP_MARKET = 'STOP_MARKET',
  STOP_LIMIT = 'STOP_LIMIT',
}

export enum TimeInForce {
  GTC = 'GTC', // Good Till Cancelled
  IOC = 'IOC', // Immediate or Cancel
  FOK = 'FOK', // Fill or Kill
  DAY = 'DAY',
}

export enum OrderStatus {
  PENDING_RISK = 'PENDING_RISK',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUBMITTED = 'SUBMITTED',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum TradeLifecycleStage {
  IDEA = 'IDEA',
  THESIS = 'THESIS',
  PLANNED = 'PLANNED',
  ORDER_SUBMITTED = 'ORDER_SUBMITTED',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FILLED = 'FILLED',
  POSITION_OPEN = 'POSITION_OPEN',
  POSITION_CLOSED = 'POSITION_CLOSED',
  REVIEWED = 'REVIEWED',
}

export interface Order {
  id: UUID;
  accountId: UUID;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  filledQuantity: number;
  limitPrice?: number;
  stopPrice?: number;
  avgFillPrice?: number;
  status: OrderStatus;
  timeInForce: TimeInForce;
  strategyId?: UUID;
  botId?: UUID;
  source: 'MANUAL' | 'BOT' | 'API';
  rejectionReason?: string;
  lifecycleStage: TradeLifecycleStage;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Execution {
  id: UUID;
  orderId: UUID;
  accountId: UUID;
  symbol: string;
  side: OrderSide;
  price: number;
  quantity: number;
  fee: number;
  feeCurrency: string;
  slippage: number; // in basis points or nominal
  latencyMs: number;
  timestamp: string;
  brokerExecutionId: string;
}

export enum PositionSide {
  LONG = 'LONG',
  SHORT = 'SHORT',
}

export interface Position {
  id: UUID;
  accountId: UUID;
  symbol: string;
  side: PositionSide;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  liquidationPrice?: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  stopLoss?: number;
  takeProfit?: number;
  strategyId?: UUID;
  botId?: UUID;
  leverage: number;
  openedAt: string;
  updatedAt: string;
  closedAt?: string;
  isOpen: boolean;
}

export enum EmotionState {
  DISCIPLINED = 'DISCIPLINED',
  CONFIDENT = 'CONFIDENT',
  PATIENT = 'PATIENT',
  NEUTRAL = 'NEUTRAL',
  ANXIOUS = 'ANXIOUS',
  FOMO = 'FOMO',
  GREEDY = 'GREEDY',
  REVENGE = 'REVENGE',
  HESITANT = 'HESITANT',
}

export interface JournalEntry {
  id: UUID;
  tradeId?: UUID;
  orderId?: UUID;
  positionId?: UUID;
  accountId: UUID;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  plannedEntry: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  strategy: string;
  setup: string;
  marketConditions: string;
  tradingThesis: string;
  invalidationCriteria: string;
  confidenceScore: number; // 1 to 10
  riskRewardRatio: number;
  emotion: EmotionState;
  executionNotes?: string;
  postTradeReview?: string;
  mistakes?: string[];
  lessonsLearned?: string[];
  tags: string[];
  // Auto-enriched fields from execution engine
  realizedPnL?: number;
  unrealizedPnL?: number;
  actualEntry?: number;
  actualExit?: number;
  totalFees?: number;
  holdingPeriodMinutes?: number;
  rMultiple?: number;
  slippageBps?: number;
  status: 'PRE_TRADE' | 'ACTIVE' | 'POST_TRADE';
  createdAt: string;
  updatedAt: string;
}

export interface Strategy {
  id: UUID;
  name: string;
  description: string;
  category: 'MOMENTUM' | 'BREAKOUT' | 'MEAN_REVERSION' | 'TREND_FOLLOWING' | 'SCALPING' | 'STAT_ARB';
  version: string;
  isActive: boolean;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  expectancy: number;
  averageR: number;
  maxDrawdown: number;
  averageHoldMinutes: number;
  bestTradePnL: number;
  worstTradePnL: number;
  netPnL: number;
  createdAt: string;
}

export enum BotStatus {
  OFFLINE = 'OFFLINE',
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR',
  STOPPED = 'STOPPED',
}

export interface TradingBot {
  id: UUID;
  name: string;
  description: string;
  strategyId: UUID;
  strategyName: string;
  version: string;
  status: BotStatus;
  environment: 'SIMULATION' | 'PAPER' | 'LIVE';
  connectedAccountId: UUID;
  connectedAccountName: string;
  lastHeartbeat: string;
  lastSignal?: string;
  lastExecution?: string;
  uptimeSeconds: number;
  winRate: number;
  totalPnL: number;
  tradesCount: number;
  riskStatus: 'NORMAL' | 'WARNING' | 'BREACH';
  config: {
    maxDailyTrades: number;
    maxPositionSize: number;
    pollIntervalMs: number;
    pairs: string[];
  };
}

export enum BotEventType {
  BOT_STARTED = 'BOT_STARTED',
  BOT_STOPPED = 'BOT_STOPPED',
  BOT_PAUSED = 'BOT_PAUSED',
  BOT_HEARTBEAT = 'BOT_HEARTBEAT',
  SIGNAL_GENERATED = 'SIGNAL_GENERATED',
  ORDER_REQUESTED = 'ORDER_REQUESTED',
  ORDER_SUBMITTED = 'ORDER_SUBMITTED',
  ORDER_FILLED = 'ORDER_FILLED',
  ORDER_REJECTED = 'ORDER_REJECTED',
  ERROR = 'ERROR',
}

export interface BotEvent {
  id: UUID;
  botId: UUID;
  type: BotEventType;
  payload: Record<string, any>;
  timestamp: string;
}

export interface RiskRule {
  id: string;
  name: string;
  description: string;
  type: 
    | 'MAX_POSITION_SIZE'
    | 'MAX_ORDER_VALUE'
    | 'MAX_DAILY_LOSS'
    | 'MAX_PORTFOLIO_EXPOSURE'
    | 'MAX_LEVERAGE'
    | 'MAX_OPEN_POSITIONS'
    | 'MAX_STRATEGY_EXPOSURE';
  threshold: number;
  unit: 'USD' | 'PERCENT' | 'COUNT' | 'RATIO';
  isEnabled: boolean;
  severity: 'WARNING' | 'BLOCK';
}

export interface RiskDecision {
  id: UUID;
  orderId?: UUID;
  decision: 'APPROVED' | 'REJECTED' | 'WARNING';
  ruleId?: string;
  ruleName?: string;
  reason?: string;
  metricsAtDecision: {
    currentExposure: number;
    proposedOrderValue: number;
    openPositionsCount: number;
    dailyLoss: number;
  };
  timestamp: string;
}

export interface KillSwitchState {
  isActive: boolean;
  triggeredAt?: string;
  triggeredBy?: string;
  reason?: string;
  cancelledOrdersCount?: number;
  stoppedBotsCount?: number;
}

export interface DomainEvent<T = any> {
  eventId: UUID;
  eventType: string;
  timestamp: string;
  accountId?: UUID;
  source: string;
  correlationId: string;
  schemaVersion: string;
  payload: T;
}

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  bid: number;
  ask: number;
  spread: number;
  lastUpdated: string;
}

export interface CandlestickBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PortfolioMetrics {
  totalEquity: number;
  cashBalance: number;
  investedCapital: number;
  unrealizedPnL: number;
  realizedPnL: number;
  todayPnL: number;
  todayPnLPercent: number;
  totalReturnPercent: number;
  drawdownPercent: number;
  maxDrawdownPercent: number;
  portfolioExposurePercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  winRate: number;
  profitFactor: number;
  expectancy: number;
  averageR: number;
  averageHoldingMinutes: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  openPositionsCount: number;
  activeOrdersCount: number;
  activeBotsCount: number;
}

export interface ExecutionAnalytics {
  avgSlippageBps: number;
  totalFeesPaid: number;
  avgOrderLatencyMs: number;
  avgFillDurationMs: number;
  fillRatePercent: number;
  rejectionRatePercent: number;
  slippageByVenue: { venue: string; slippageBps: number; volume: number }[];
  latencyHistory: { timestamp: string; latencyMs: number }[];
}

export interface BehaviorInsight {
  id: string;
  category: 'SIZING_BIAS' | 'SETUP_DISCIPLINE' | 'PREMATURE_EXIT' | 'EMOTION_CORRELATION' | 'TIME_ANOMALY';
  title: string;
  description: string;
  type: 'STATISTICAL_INSIGHT' | 'AI_GENERATED_INTERPRETATION';
  confidenceScore: number;
  sampleSize: number;
  recommendation: string;
  metricImpact: string;
}

export interface AuditLogEntry {
  id: UUID;
  action: 
    | 'USER_LOGIN'
    | 'ORDER_CREATED'
    | 'ORDER_APPROVED'
    | 'ORDER_REJECTED'
    | 'ORDER_FILLED'
    | 'ORDER_CANCELLED'
    | 'POSITION_OPENED'
    | 'POSITION_CLOSED'
    | 'BOT_STARTED'
    | 'BOT_STOPPED'
    | 'BOT_PAUSED'
    | 'RISK_LIMIT_CHANGED'
    | 'KILL_SWITCH_ACTIVATED'
    | 'KILL_SWITCH_DEACTIVATED'
    | 'API_KEY_ROTATED'
    | 'JOURNAL_CREATED';
  actor: string;
  targetId?: string;
  correlationId: string;
  details: Record<string, any>;
  ipAddress: string;
  timestamp: string;
}

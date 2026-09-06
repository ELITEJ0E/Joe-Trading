/**
 * Client-Side Shared Types & Navigation Configuration
 */

import {
  AccountType,
  OrderSide,
  OrderType,
  TimeInForce,
  OrderStatus,
  TradeLifecycleStage,
  BotStatus,
  EmotionState,
} from '../server/types.ts';

export type {
  TradingAccount,
  Position,
  Order,
  Execution,
  JournalEntry,
  Strategy,
  TradingBot,
  RiskRule,
  RiskDecision,
  KillSwitchState,
  MarketQuote,
  CandlestickBar,
  PortfolioMetrics,
  BehaviorInsight,
  AuditLogEntry,
} from '../server/types.ts';

export {
  AccountType,
  OrderSide,
  OrderType,
  TimeInForce,
  OrderStatus,
  TradeLifecycleStage,
  BotStatus,
  EmotionState,
};

export type AppTab =
  | 'DASHBOARD'
  | 'PORTFOLIO'
  | 'POSITIONS'
  | 'ORDERS'
  | 'JOURNAL'
  | 'STRATEGIES'
  | 'BOTS'
  | 'RISK_CENTER'
  | 'BEHAVIOR'
  | 'EXECUTION'
  | 'MARKET'
  | 'AUDIT'
  | 'DOCS';

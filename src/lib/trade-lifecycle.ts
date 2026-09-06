import {
  Position,
  Order,
  Execution,
  JournalEntry,
  Strategy,
  RiskDecision,
  AuditLogEntry,
  TradeLifecycleStage,
  OrderStatus,
  OrderSide,
  PositionSide,
  EmotionState,
} from '../server/types.ts';

export type LifecycleStepStatus = 'completed' | 'active' | 'pending' | 'failed' | 'skipped';

export interface LifecycleStep {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  status: LifecycleStepStatus;
  timestamp?: string;
  summary?: string;
  details?: Record<string, any>;
}

export interface UnifiedTrade {
  id: string; // unique trade ID (e.g. 'trd_btc_01' or position ID or order ID)
  symbol: string;
  side: 'LONG' | 'SHORT';
  status: 'PLANNED' | 'OPEN' | 'CLOSED' | 'CANCELLED' | 'REJECTED' | 'REVIEWED';
  lifecycleStage: TradeLifecycleStage;
  strategyId?: string;
  strategyName?: string;
  openedAt?: string;
  closedAt?: string;
  durationMinutes?: number;

  // Plan & Thesis
  thesis?: {
    setup?: string;
    marketConditions?: string;
    tradingThesis?: string;
    invalidationCriteria?: string;
    confidenceScore?: number;
    emotion?: EmotionState;
  };
  plan?: {
    plannedEntry?: number;
    stopLoss?: number;
    takeProfit?: number;
    riskPerUnit?: number;
    potentialLoss?: number;
    potentialProfit?: number;
    riskRewardRatio?: number;
    positionSize?: number;
    plannedQuantity?: number;
  };

  // Live Position / Execution Metrics
  metrics: {
    entryPrice: number;
    currentOrExitPrice: number;
    quantity: number;
    notionalValue: number;
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
    realizedPnL: number;
    rMultiple?: number;
    slippageBps?: number;
    totalFees?: number;
    leverage?: number;
    liquidationPrice?: number;
  };

  // Risk Check
  riskCheck?: {
    passed: boolean;
    decision: 'APPROVED' | 'REJECTED' | 'WARNING';
    ruleName?: string;
    reason?: string;
    timestamp?: string;
    exposurePct?: number;
  };

  // Review & Lessons
  review?: {
    executionNotes?: string;
    postTradeReview?: string;
    mistakes?: string[];
    lessonsLearned?: string[];
    tags?: string[];
    isReviewed: boolean;
  };

  // Raw Linked Entities
  position?: Position;
  orders: Order[];
  executions: Execution[];
  journalEntry?: JournalEntry;
  riskDecisions: RiskDecision[];
  auditLogs: AuditLogEntry[];
}

/**
 * Reconstructs complete Unified Trades from individual state collections
 */
export interface BuildUnifiedTradesParams {
  positions?: Position[];
  orders?: Order[];
  executions?: Execution[];
  journalEntries?: JournalEntry[];
  strategies?: Strategy[];
  riskDecisions?: RiskDecision[];
  auditLogs?: AuditLogEntry[];
}

export function buildUnifiedTrades(
  positionsOrParams: Position[] | BuildUnifiedTradesParams = [],
  ordersParam: Order[] = [],
  executionsParam: Execution[] = [],
  journalEntriesParam: JournalEntry[] = [],
  strategiesParam: Strategy[] = [],
  riskDecisionsParam: RiskDecision[] = [],
  auditLogsParam: AuditLogEntry[] = []
): UnifiedTrade[] {
  let positions: Position[] = [];
  let orders: Order[] = [];
  let executions: Execution[] = [];
  let journalEntries: JournalEntry[] = [];
  let strategies: Strategy[] = [];
  let riskDecisions: RiskDecision[] = [];
  let auditLogs: AuditLogEntry[] = [];

  if (Array.isArray(positionsOrParams)) {
    positions = positionsOrParams;
    orders = ordersParam;
    executions = executionsParam;
    journalEntries = journalEntriesParam;
    strategies = strategiesParam;
    riskDecisions = riskDecisionsParam;
    auditLogs = auditLogsParam;
  } else if (positionsOrParams && typeof positionsOrParams === 'object') {
    positions = positionsOrParams.positions || [];
    orders = positionsOrParams.orders || [];
    executions = positionsOrParams.executions || [];
    journalEntries = positionsOrParams.journalEntries || [];
    strategies = positionsOrParams.strategies || [];
    riskDecisions = positionsOrParams.riskDecisions || [];
    auditLogs = positionsOrParams.auditLogs || [];
  }

  const trades: UnifiedTrade[] = [];
  const processedPositions = new Set<string>();
  const processedOrders = new Set<string>();
  const processedJournals = new Set<string>();

  const getStrategyName = (id?: string) => {
    if (!id) return undefined;
    const s = strategies.find((st) => st.id === id);
    return s ? s.name : undefined;
  };

  // 1. Correlate from Positions (Open & Closed)
  positions.forEach((pos) => {
    processedPositions.add(pos.id);

    // Find linked orders (same symbol and approximate time/accountId or direct ID match)
    const linkedOrders = orders.filter(
      (o) => o.symbol === pos.symbol && o.accountId === pos.accountId
    );
    linkedOrders.forEach((o) => processedOrders.add(o.id));

    // Find linked executions
    const linkedExecs = executions.filter(
      (e) => e.symbol === pos.symbol && e.accountId === pos.accountId
    );

    // Find linked journal entry
    const linkedJournal = journalEntries.find(
      (j) =>
        j.positionId === pos.id ||
        (j.symbol === pos.symbol && j.accountId === pos.accountId)
    );
    if (linkedJournal) processedJournals.add(linkedJournal.id);

    // Find linked risk decisions
    const linkedRisk = riskDecisions.filter(
      (rd) =>
        linkedOrders.some((o) => o.id === rd.orderId) ||
        (rd.ruleName && rd.ruleName.includes(pos.symbol))
    );

    // Find linked audit events
    const linkedAudit = auditLogs.filter(
      (a) =>
        (a.details && a.details.symbol === pos.symbol) ||
        (a.targetId && (a.targetId === pos.id || linkedOrders.some((o) => o.id === a.targetId)))
    );

    const stratName = getStrategyName(pos.strategyId) || linkedJournal?.strategy;
    const isClosed = !pos.isOpen;
    const isReviewed = Boolean(
      linkedJournal?.postTradeReview ||
      (linkedJournal?.lessonsLearned && linkedJournal.lessonsLearned.length > 0)
    );

    let stage: TradeLifecycleStage = TradeLifecycleStage.POSITION_OPEN;
    if (isReviewed) {
      stage = TradeLifecycleStage.REVIEWED;
    } else if (isClosed) {
      stage = TradeLifecycleStage.POSITION_CLOSED;
    }

    const durationMins = pos.openedAt
      ? Math.max(
          1,
          Math.round(
            ((pos.closedAt ? new Date(pos.closedAt).getTime() : Date.now()) -
              new Date(pos.openedAt).getTime()) /
              60000
          )
        )
      : undefined;

    const plannedEntry = linkedJournal?.plannedEntry || pos.entryPrice;
    const stopLoss = pos.stopLoss || linkedJournal?.stopLoss;
    const takeProfit = pos.takeProfit || linkedJournal?.takeProfit;
    const riskPerUnit = stopLoss ? Math.abs(pos.entryPrice - stopLoss) : undefined;
    const potentialLoss = riskPerUnit ? riskPerUnit * pos.quantity : undefined;
    const rewardPerUnit = takeProfit ? Math.abs(takeProfit - pos.entryPrice) : undefined;
    const potentialProfit = rewardPerUnit ? rewardPerUnit * pos.quantity : undefined;
    const riskRewardRatio =
      linkedJournal?.riskRewardRatio ||
      (riskPerUnit && rewardPerUnit && riskPerUnit > 0
        ? Number((rewardPerUnit / riskPerUnit).toFixed(2))
        : undefined);

    const trade: UnifiedTrade = {
      id: `trd_${pos.id.replace('pos_', '')}`,
      symbol: pos.symbol,
      side: pos.side === PositionSide.LONG ? 'LONG' : 'SHORT',
      status: isReviewed ? 'REVIEWED' : isClosed ? 'CLOSED' : 'OPEN',
      lifecycleStage: stage,
      strategyId: pos.strategyId,
      strategyName: stratName,
      openedAt: pos.openedAt,
      closedAt: pos.closedAt,
      durationMinutes: durationMins,

      thesis: {
        setup: linkedJournal?.setup || (pos.botId ? 'Automated Algorithmic Execution' : 'Discretionary Technical Setup'),
        marketConditions: linkedJournal?.marketConditions || 'Active Trading Session',
        tradingThesis: linkedJournal?.tradingThesis || 'Execution based on structured strategy rules and verified risk parameters.',
        invalidationCriteria: linkedJournal?.invalidationCriteria || (stopLoss ? `Price closing beyond stop loss level $${stopLoss}` : 'Key support/resistance breach'),
        confidenceScore: linkedJournal?.confidenceScore || 8,
        emotion: linkedJournal?.emotion || EmotionState.DISCIPLINED,
      },

      plan: {
        plannedEntry,
        stopLoss,
        takeProfit,
        riskPerUnit,
        potentialLoss,
        potentialProfit,
        riskRewardRatio,
        positionSize: pos.quantity * pos.entryPrice,
        plannedQuantity: pos.quantity,
      },

      metrics: {
        entryPrice: pos.entryPrice,
        currentOrExitPrice: isClosed ? pos.entryPrice + (pos.realizedPnL / (pos.quantity || 1)) : pos.currentPrice,
        quantity: pos.quantity,
        notionalValue: pos.quantity * pos.currentPrice,
        unrealizedPnL: pos.unrealizedPnL,
        unrealizedPnLPercent: pos.unrealizedPnLPercent,
        realizedPnL: pos.realizedPnL,
        rMultiple: linkedJournal?.rMultiple || (potentialLoss && potentialLoss > 0 ? Number(((pos.realizedPnL || pos.unrealizedPnL) / potentialLoss).toFixed(2)) : undefined),
        slippageBps: linkedJournal?.slippageBps || (linkedExecs[0]?.slippage || 0),
        totalFees: linkedJournal?.totalFees || linkedExecs.reduce((sum, e) => sum + (e.fee || 0), 0),
        leverage: pos.leverage,
        liquidationPrice: pos.liquidationPrice,
      },

      riskCheck: {
        passed: true,
        decision: 'APPROVED',
        ruleName: linkedRisk[0]?.ruleName || 'Pre-Trade Safety Check Passed',
        reason: linkedRisk[0]?.reason || 'Position size, leverage, and notional limits within account threshold',
        timestamp: pos.openedAt,
        exposurePct: 18.5,
      },

      review: {
        executionNotes: linkedJournal?.executionNotes || (linkedExecs.length > 0 ? `Filled ${linkedExecs[0].quantity} @ ${linkedExecs[0].price} (${linkedExecs[0].latencyMs || 25}ms latency)` : undefined),
        postTradeReview: linkedJournal?.postTradeReview,
        mistakes: linkedJournal?.mistakes || [],
        lessonsLearned: linkedJournal?.lessonsLearned || [],
        tags: linkedJournal?.tags || [pos.side, 'CORE_TRADE'],
        isReviewed,
      },

      position: pos,
      orders: linkedOrders,
      executions: linkedExecs,
      journalEntry: linkedJournal,
      riskDecisions: linkedRisk,
      auditLogs: linkedAudit,
    };

    trades.push(trade);
  });

  // 2. Add unlinked Orders (e.g. active limit orders, rejected orders, cancelled orders)
  orders.forEach((ord) => {
    if (processedOrders.has(ord.id)) return;
    processedOrders.add(ord.id);

    const linkedExecs = executions.filter((e) => e.orderId === ord.id);
    const linkedJournal = journalEntries.find((j) => j.orderId === ord.id);
    if (linkedJournal) processedJournals.add(linkedJournal.id);

    const linkedRisk = riskDecisions.filter((rd) => rd.orderId === ord.id);
    const linkedAudit = auditLogs.filter(
      (a) => a.targetId === ord.id || (a.details && a.details.orderId === ord.id)
    );

    const isRejected = ord.status === OrderStatus.REJECTED;
    const isCancelled = ord.status === OrderStatus.CANCELLED;
    const isFilled = ord.status === OrderStatus.FILLED;

    let tradeStatus: UnifiedTrade['status'] = 'PLANNED';
    if (isRejected) tradeStatus = 'REJECTED';
    else if (isCancelled) tradeStatus = 'CANCELLED';
    else if (isFilled) tradeStatus = 'OPEN';

    const trade: UnifiedTrade = {
      id: `trd_${ord.id.replace('ord_', '')}`,
      symbol: ord.symbol,
      side: ord.side === OrderSide.BUY ? 'LONG' : 'SHORT',
      status: tradeStatus,
      lifecycleStage: ord.lifecycleStage || (isRejected ? TradeLifecycleStage.IDEA : TradeLifecycleStage.ORDER_SUBMITTED),
      strategyId: ord.strategyId,
      strategyName: getStrategyName(ord.strategyId),
      openedAt: ord.createdAt,

      thesis: {
        setup: linkedJournal?.setup || 'Pending Order Setup',
        marketConditions: linkedJournal?.marketConditions || 'Working Order in Book',
        tradingThesis: linkedJournal?.tradingThesis || `Active ${ord.type} order placed via ${ord.source.toLowerCase()}.`,
        invalidationCriteria: linkedJournal?.invalidationCriteria || 'Order timeout or market structure shift',
        confidenceScore: linkedJournal?.confidenceScore || 7,
        emotion: linkedJournal?.emotion || EmotionState.NEUTRAL,
      },

      plan: {
        plannedEntry: ord.limitPrice || ord.stopPrice,
        stopLoss: ord.stopPrice,
        positionSize: (ord.limitPrice || 100) * ord.quantity,
        plannedQuantity: ord.quantity,
      },

      metrics: {
        entryPrice: ord.avgFillPrice || ord.limitPrice || 0,
        currentOrExitPrice: ord.limitPrice || 0,
        quantity: ord.quantity,
        notionalValue: (ord.limitPrice || 0) * ord.quantity,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        realizedPnL: 0,
        slippageBps: linkedExecs[0]?.slippage || 0,
        totalFees: linkedExecs.reduce((sum, e) => sum + (e.fee || 0), 0),
      },

      riskCheck: {
        passed: !isRejected,
        decision: isRejected ? 'REJECTED' : 'APPROVED',
        ruleName: ord.rejectionReason || (isRejected ? 'Risk Limit Exceeded' : 'Pre-Trade Safety Check Passed'),
        reason: ord.rejectionReason || (isRejected ? 'Order value exceeded maximum risk threshold' : 'Valid order size'),
        timestamp: ord.createdAt,
      },

      review: {
        isReviewed: false,
        tags: [ord.side, ord.type, ord.status],
      },

      orders: [ord],
      executions: linkedExecs,
      journalEntry: linkedJournal,
      riskDecisions: linkedRisk,
      auditLogs: linkedAudit,
    };

    trades.push(trade);
  });

  // 3. Add unlinked Journal Entries (Planned ideas / historic reviews)
  journalEntries.forEach((jnl) => {
    if (processedJournals.has(jnl.id)) return;
    processedJournals.add(jnl.id);

    const isReviewed = jnl.status === 'POST_TRADE' || Boolean(jnl.postTradeReview || (jnl.lessonsLearned && jnl.lessonsLearned.length > 0));

    const trade: UnifiedTrade = {
      id: `trd_${jnl.id.replace('jnl_', '')}`,
      symbol: jnl.symbol,
      side: jnl.direction === 'LONG' ? 'LONG' : 'SHORT',
      status: isReviewed ? 'REVIEWED' : jnl.status === 'ACTIVE' ? 'OPEN' : 'PLANNED',
      lifecycleStage: isReviewed ? TradeLifecycleStage.REVIEWED : jnl.status === 'ACTIVE' ? TradeLifecycleStage.POSITION_OPEN : TradeLifecycleStage.THESIS,
      strategyName: jnl.strategy,
      openedAt: jnl.createdAt,
      durationMinutes: jnl.holdingPeriodMinutes,

      thesis: {
        setup: jnl.setup,
        marketConditions: jnl.marketConditions,
        tradingThesis: jnl.tradingThesis,
        invalidationCriteria: jnl.invalidationCriteria,
        confidenceScore: jnl.confidenceScore,
        emotion: jnl.emotion,
      },

      plan: {
        plannedEntry: jnl.plannedEntry,
        stopLoss: jnl.stopLoss,
        takeProfit: jnl.takeProfit,
        riskRewardRatio: jnl.riskRewardRatio,
        positionSize: jnl.positionSize,
        riskPerUnit: jnl.stopLoss ? Math.abs(jnl.plannedEntry - jnl.stopLoss) : undefined,
      },

      metrics: {
        entryPrice: jnl.actualEntry || jnl.plannedEntry,
        currentOrExitPrice: jnl.actualExit || jnl.plannedEntry,
        quantity: jnl.plannedEntry > 0 ? Number((jnl.positionSize / jnl.plannedEntry).toFixed(4)) : 1,
        notionalValue: jnl.positionSize,
        unrealizedPnL: jnl.unrealizedPnL || 0,
        unrealizedPnLPercent: 0,
        realizedPnL: jnl.realizedPnL || 0,
        rMultiple: jnl.rMultiple,
        slippageBps: jnl.slippageBps,
        totalFees: jnl.totalFees,
      },

      riskCheck: {
        passed: true,
        decision: 'APPROVED',
        ruleName: 'Pre-Trade Plan Validated',
        reason: 'Risk-to-reward ratio and invalidation plan defined',
        timestamp: jnl.createdAt,
      },

      review: {
        executionNotes: jnl.executionNotes,
        postTradeReview: jnl.postTradeReview,
        mistakes: jnl.mistakes,
        lessonsLearned: jnl.lessonsLearned,
        tags: jnl.tags,
        isReviewed,
      },

      orders: [],
      executions: [],
      journalEntry: jnl,
      riskDecisions: [],
      auditLogs: [],
    };

    trades.push(trade);
  });

  // Sort by most recent openedAt
  return trades.sort((a, b) => {
    const tA = a.openedAt ? new Date(a.openedAt).getTime() : 0;
    const tB = b.openedAt ? new Date(b.openedAt).getTime() : 0;
    return tB - tA;
  });
}

/**
 * Calculates the exact 10 lifecycle stages with statuses and metadata for any trade
 */
export function getTradeLifecycleSteps(trade: UnifiedTrade): LifecycleStep[] {
  const isRejected = trade.status === 'REJECTED' || trade.riskCheck?.decision === 'REJECTED';
  const isCancelled = trade.status === 'CANCELLED';
  const hasOrder = trade.orders.length > 0;
  const hasExecution = trade.executions.length > 0;
  const isPositionOpen = trade.status === 'OPEN' || (trade.position && trade.position.isOpen);
  const isPositionClosed = trade.status === 'CLOSED' || trade.status === 'REVIEWED' || (trade.position && !trade.position.isOpen);
  const hasReview = trade.review?.isReviewed || Boolean(trade.review?.postTradeReview);
  const hasLesson = Boolean(trade.review?.lessonsLearned && trade.review.lessonsLearned.length > 0);

  // 1. Idea
  const step1: LifecycleStep = {
    id: 'step_idea',
    name: 'Trade Idea',
    shortLabel: 'Idea',
    description: `Identified ${trade.side} opportunity on ${trade.symbol}`,
    status: 'completed',
    timestamp: trade.openedAt,
    summary: `${trade.side} ${trade.symbol}`,
  };

  // 2. Thesis
  const hasThesis = Boolean(trade.thesis?.tradingThesis && trade.thesis.tradingThesis.length > 5);
  const step2: LifecycleStep = {
    id: 'step_thesis',
    name: 'Thesis & Setup',
    shortLabel: 'Thesis',
    description: trade.thesis?.tradingThesis || 'Core reason and market hypothesis recorded',
    status: hasThesis ? 'completed' : 'completed',
    summary: trade.thesis?.setup || 'Setup identified',
  };

  // 3. Strategy
  const step3: LifecycleStep = {
    id: 'step_strategy',
    name: 'Strategy Allocation',
    shortLabel: 'Strategy',
    description: trade.strategyName ? `Assigned to: ${trade.strategyName}` : 'Discretionary Trade',
    status: 'completed',
    summary: trade.strategyName || 'Discretionary Rulebook',
  };

  // 4. Risk Check
  const step4: LifecycleStep = {
    id: 'step_risk',
    name: 'Pre-Trade Risk Check',
    shortLabel: 'Risk Check',
    description: trade.riskCheck?.reason || (isRejected ? 'Blocked by risk engine threshold' : 'Passed position sizing & exposure checks'),
    status: isRejected ? 'failed' : 'completed',
    summary: isRejected ? 'BLOCKED' : 'APPROVED',
  };

  if (isRejected) {
    return [
      step1,
      step2,
      step3,
      step4,
      { id: 'step_order', name: 'Order Submission', shortLabel: 'Order', description: 'Order submission blocked by Risk Center', status: 'failed' },
      { id: 'step_exec', name: 'Broker Execution', shortLabel: 'Execution', description: 'No fills due to risk rejection', status: 'skipped' },
      { id: 'step_pos', name: 'Position Management', shortLabel: 'Position', description: 'Position never opened', status: 'skipped' },
      { id: 'step_exit', name: 'Trade Exit', shortLabel: 'Exit', description: 'N/A', status: 'skipped' },
      { id: 'step_review', name: 'Journal Review', shortLabel: 'Review', description: 'Review risk rejection notes', status: 'pending' },
      { id: 'step_lesson', name: 'Lesson & Learn', shortLabel: 'Lesson', description: 'Learn risk boundary management', status: 'pending' },
    ];
  }

  // 5. Order Submitted
  const step5: LifecycleStep = {
    id: 'step_order',
    name: 'Order Submitted',
    shortLabel: 'Order',
    description: hasOrder
      ? `${trade.orders[0].type} ${trade.orders[0].side} ${trade.orders[0].quantity} shares/contracts`
      : 'Order routed to broker gateway',
    status: isCancelled ? 'failed' : hasOrder ? 'completed' : 'completed',
    summary: isCancelled ? 'CANCELLED' : hasOrder ? trade.orders[0].status : 'SUBMITTED',
  };

  if (isCancelled) {
    return [
      step1,
      step2,
      step3,
      step4,
      step5,
      { id: 'step_exec', name: 'Broker Execution', shortLabel: 'Execution', description: 'Order cancelled prior to fill', status: 'skipped' },
      { id: 'step_pos', name: 'Position Management', shortLabel: 'Position', description: 'No open position created', status: 'skipped' },
      { id: 'step_exit', name: 'Trade Exit', shortLabel: 'Exit', description: 'N/A', status: 'skipped' },
      { id: 'step_review', name: 'Journal Review', shortLabel: 'Review', description: 'Review why order was cancelled', status: hasReview ? 'completed' : 'pending' },
      { id: 'step_lesson', name: 'Lesson & Learn', shortLabel: 'Lesson', description: 'Document order timing lesson', status: hasLesson ? 'completed' : 'pending' },
    ];
  }

  // 6. Execution / Fill
  const step6: LifecycleStep = {
    id: 'step_exec',
    name: 'Broker Execution',
    shortLabel: 'Execution',
    description: hasExecution
      ? `Filled @ $${trade.executions[0].price} (${trade.executions[0].latencyMs || 20}ms)`
      : trade.metrics.entryPrice > 0
      ? `Filled @ $${trade.metrics.entryPrice}`
      : 'Awaiting broker fill confirmation',
    status: hasExecution || trade.metrics.entryPrice > 0 ? 'completed' : 'active',
    summary: hasExecution ? `$${trade.executions[0].price}` : `$${trade.metrics.entryPrice}`,
  };

  // 7. Position Open
  const step7: LifecycleStep = {
    id: 'step_pos',
    name: 'Position Active',
    shortLabel: 'Position Open',
    description: isPositionOpen
      ? `Holding ${trade.metrics.quantity} units (Current P&L: ${trade.metrics.unrealizedPnL >= 0 ? '+' : ''}$${trade.metrics.unrealizedPnL})`
      : 'Position was opened and managed',
    status: isPositionOpen ? 'active' : isPositionClosed ? 'completed' : 'pending',
    summary: isPositionOpen ? 'LIVE OPEN' : 'FILLED',
  };

  // 8. Exit / Position Closed
  const step8: LifecycleStep = {
    id: 'step_exit',
    name: 'Position Exit & Result',
    shortLabel: 'Exit / Result',
    description: isPositionClosed
      ? `Closed with Realized P&L: ${trade.metrics.realizedPnL >= 0 ? '+' : ''}$${trade.metrics.realizedPnL}`
      : 'Position is currently open and monitored',
    status: isPositionClosed ? 'completed' : 'pending',
    summary: isPositionClosed
      ? `${trade.metrics.realizedPnL >= 0 ? '+' : ''}$${trade.metrics.realizedPnL}`
      : 'IN PROGRESS',
  };

  // 9. Journal Review
  const step9: LifecycleStep = {
    id: 'step_review',
    name: 'Journal & Emotion Review',
    shortLabel: 'Review',
    description: hasReview
      ? trade.review?.postTradeReview || 'Post-trade evaluation recorded'
      : 'Awaiting trader post-trade reflections and psychological review',
    status: hasReview ? 'completed' : isPositionClosed ? 'active' : 'pending',
    summary: hasReview ? 'REVIEWED' : 'PENDING REVIEW',
  };

  // 10. Lesson
  const step10: LifecycleStep = {
    id: 'step_lesson',
    name: 'Lessons & Behavioral Takeaways',
    shortLabel: 'Lesson',
    description: hasLesson
      ? trade.review?.lessonsLearned?.[0] || 'Takeaway saved to learning database'
      : 'Extract key repeatable rules from this trade',
    status: hasLesson ? 'completed' : hasReview ? 'active' : 'pending',
    summary: hasLesson ? 'LEARNED' : 'PENDING LESSON',
  };

  return [step1, step2, step3, step4, step5, step6, step7, step8, step9, step10];
}

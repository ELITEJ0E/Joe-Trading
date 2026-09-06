/**
 * Risk Management Engine & Emergency Kill Switch
 */

import { Order, RiskRule, RiskDecision, KillSwitchState, OrderSide, OrderType } from './types.ts';
import { eventBus } from './event-bus.ts';

export class RiskEngine {
  private static instance: RiskEngine;

  private killSwitch: KillSwitchState = {
    isActive: false,
  };

  private rules: RiskRule[] = [
    {
      id: 'rule_max_order_val',
      name: 'Max Single Order Value',
      description: 'Limits individual order notional value to prevent catastrophic fat-finger errors.',
      type: 'MAX_ORDER_VALUE',
      threshold: 50000,
      unit: 'USD',
      isEnabled: true,
      severity: 'BLOCK',
    },
    {
      id: 'rule_max_pos_size',
      name: 'Max Single Position Size',
      description: 'Prevents excessive concentration in a single asset position.',
      type: 'MAX_POSITION_SIZE',
      threshold: 100000,
      unit: 'USD',
      isEnabled: true,
      severity: 'BLOCK',
    },
    {
      id: 'rule_max_daily_loss',
      name: 'Daily Drawdown Circuit Breaker',
      description: 'Halts risk-seeking activity if daily loss exceeds risk budget.',
      type: 'MAX_DAILY_LOSS',
      threshold: 8000,
      unit: 'USD',
      isEnabled: true,
      severity: 'BLOCK',
    },
    {
      id: 'rule_max_portfolio_exp',
      name: 'Max Portfolio Gross Exposure',
      description: 'Cap on aggregate leverage and open position commitments.',
      type: 'MAX_PORTFOLIO_EXPOSURE',
      threshold: 85, // 85% of equity
      unit: 'PERCENT',
      isEnabled: true,
      severity: 'BLOCK',
    },
    {
      id: 'rule_max_open_positions',
      name: 'Max Open Positions Count',
      description: 'Controls cognitive and margin load across active symbols.',
      type: 'MAX_OPEN_POSITIONS',
      threshold: 8,
      unit: 'COUNT',
      isEnabled: true,
      severity: 'WARNING',
    },
    {
      id: 'rule_max_leverage',
      name: 'Max Account Leverage',
      description: 'Enforces hard ceiling on borrowed capital utilization.',
      type: 'MAX_LEVERAGE',
      threshold: 5,
      unit: 'RATIO',
      isEnabled: true,
      severity: 'BLOCK',
    },
  ];

  private decisionsLog: RiskDecision[] = [];

  private constructor() {}

  public static getInstance(): RiskEngine {
    if (!RiskEngine.instance) {
      RiskEngine.instance = new RiskEngine();
    }
    return RiskEngine.instance;
  }

  public getRules(): RiskRule[] {
    return [...this.rules];
  }

  public updateRule(ruleId: string, updates: Partial<RiskRule>): RiskRule | null {
    const idx = this.rules.findIndex((r) => r.id === ruleId);
    if (idx === -1) return null;
    this.rules[idx] = { ...this.rules[idx], ...updates };

    eventBus.publish('risk.rule_updated', {
      ruleId,
      rule: this.rules[idx],
    });

    return this.rules[idx];
  }

  public getKillSwitchState(): KillSwitchState {
    return { ...this.killSwitch };
  }

  public activateKillSwitch(reason: string, actor: string = 'RISK_OFFICER'): KillSwitchState {
    this.killSwitch = {
      isActive: true,
      triggeredAt: new Date().toISOString(),
      triggeredBy: actor,
      reason,
      cancelledOrdersCount: 0,
      stoppedBotsCount: 0,
    };

    eventBus.publish('risk.kill_switch_activated', {
      state: this.killSwitch,
    });

    return { ...this.killSwitch };
  }

  public deactivateKillSwitch(actor: string = 'RISK_OFFICER'): KillSwitchState {
    this.killSwitch = {
      isActive: false,
      triggeredAt: undefined,
      triggeredBy: undefined,
      reason: undefined,
    };

    eventBus.publish('risk.kill_switch_deactivated', {
      actor,
      timestamp: new Date().toISOString(),
    });

    return { ...this.killSwitch };
  }

  public evaluateOrder(
    order: Partial<Order>,
    context: {
      accountEquity: number;
      currentExposure: number;
      existingPositionValue: number;
      openPositionsCount: number;
      todayRealizedLoss: number;
      estimatedPrice: number;
    }
  ): RiskDecision {
    const orderQuantity = order.quantity || 0;
    const orderPrice = order.limitPrice || context.estimatedPrice;
    const proposedOrderValue = orderQuantity * orderPrice;

    const baseDecision: RiskDecision = {
      id: 'risk_' + Math.random().toString(36).substring(2, 9),
      orderId: order.id,
      decision: 'APPROVED',
      metricsAtDecision: {
        currentExposure: context.currentExposure,
        proposedOrderValue,
        openPositionsCount: context.openPositionsCount,
        dailyLoss: context.todayRealizedLoss,
      },
      timestamp: new Date().toISOString(),
    };

    // 1. Check Kill Switch
    if (this.killSwitch.isActive) {
      baseDecision.decision = 'REJECTED';
      baseDecision.ruleName = 'EMERGENCY_KILL_SWITCH';
      baseDecision.reason = `System Emergency Kill Switch is ACTIVE: ${this.killSwitch.reason || 'Trading halted'}`;
      this.recordDecision(baseDecision);
      return baseDecision;
    }

    // 2. Evaluate enabled risk rules
    for (const rule of this.rules) {
      if (!rule.isEnabled) continue;

      if (rule.type === 'MAX_ORDER_VALUE' && proposedOrderValue > rule.threshold) {
        baseDecision.decision = rule.severity === 'BLOCK' ? 'REJECTED' : 'WARNING';
        baseDecision.ruleId = rule.id;
        baseDecision.ruleName = rule.name;
        baseDecision.reason = `Order notional value ($${(proposedOrderValue ?? 0).toLocaleString()}) exceeds limit ($${(rule.threshold ?? 0).toLocaleString()})`;
        this.recordDecision(baseDecision);
        if (rule.severity === 'BLOCK') return baseDecision;
      }

      if (rule.type === 'MAX_POSITION_SIZE') {
        const resultingPositionValue = (context.existingPositionValue ?? 0) + proposedOrderValue;
        if (resultingPositionValue > rule.threshold) {
          baseDecision.decision = rule.severity === 'BLOCK' ? 'REJECTED' : 'WARNING';
          baseDecision.ruleId = rule.id;
          baseDecision.ruleName = rule.name;
          baseDecision.reason = `Resulting position size ($${(resultingPositionValue ?? 0).toLocaleString()}) exceeds maximum allowed ($${(rule.threshold ?? 0).toLocaleString()})`;
          this.recordDecision(baseDecision);
          if (rule.severity === 'BLOCK') return baseDecision;
        }
      }

      if (rule.type === 'MAX_DAILY_LOSS') {
        if (Math.abs(context.todayRealizedLoss ?? 0) >= rule.threshold && (context.todayRealizedLoss ?? 0) < 0) {
          baseDecision.decision = rule.severity === 'BLOCK' ? 'REJECTED' : 'WARNING';
          baseDecision.ruleId = rule.id;
          baseDecision.ruleName = rule.name;
          baseDecision.reason = `Daily cumulative loss ($${Math.abs(context.todayRealizedLoss ?? 0).toLocaleString()}) has breached maximum daily drawdown limit ($${(rule.threshold ?? 0).toLocaleString()})`;
          this.recordDecision(baseDecision);
          if (rule.severity === 'BLOCK') return baseDecision;
        }
      }

      if (rule.type === 'MAX_PORTFOLIO_EXPOSURE') {
        const newExposurePercent = ((context.currentExposure + proposedOrderValue) / (context.accountEquity || 1)) * 100;
        if (newExposurePercent > rule.threshold) {
          baseDecision.decision = rule.severity === 'BLOCK' ? 'REJECTED' : 'WARNING';
          baseDecision.ruleId = rule.id;
          baseDecision.ruleName = rule.name;
          baseDecision.reason = `Projected portfolio exposure (${newExposurePercent.toFixed(1)}%) exceeds limit (${rule.threshold}%)`;
          this.recordDecision(baseDecision);
          if (rule.severity === 'BLOCK') return baseDecision;
        }
      }

      if (rule.type === 'MAX_OPEN_POSITIONS') {
        if (context.existingPositionValue === 0 && context.openPositionsCount >= rule.threshold) {
          baseDecision.decision = rule.severity === 'BLOCK' ? 'REJECTED' : 'WARNING';
          baseDecision.ruleId = rule.id;
          baseDecision.ruleName = rule.name;
          baseDecision.reason = `Active open positions count (${context.openPositionsCount}) has reached ceiling (${rule.threshold})`;
          this.recordDecision(baseDecision);
          if (rule.severity === 'BLOCK') return baseDecision;
        }
      }
    }

    this.recordDecision(baseDecision);
    return baseDecision;
  }

  private recordDecision(decision: RiskDecision) {
    this.decisionsLog.unshift(decision);
    if (this.decisionsLog.length > 200) {
      this.decisionsLog.pop();
    }

    eventBus.publish(
      decision.decision === 'REJECTED' ? 'risk.rejected' : 'risk.approved',
      decision,
      { correlationId: decision.id }
    );
  }

  public getRecentDecisions(limit: number = 30): RiskDecision[] {
    return this.decisionsLog.slice(0, limit);
  }
}

export const riskEngine = RiskEngine.getInstance();

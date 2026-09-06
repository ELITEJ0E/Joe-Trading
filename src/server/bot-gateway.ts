/**
 * Bot Management & Standardized Bot Gateway
 */

import {
  TradingBot,
  BotStatus,
  BotEvent,
  BotEventType,
  Order,
  OrderSide,
  OrderType,
  TimeInForce,
  OrderStatus,
  TradeLifecycleStage,
} from './types.ts';
import { appStore } from './store.ts';
import { eventBus } from './event-bus.ts';
import { riskEngine } from './risk-engine.ts';
import { mockBroker } from './mock-broker.ts';
import { marketDataService } from './market-data.ts';

export class BotGatewayService {
  private static instance: BotGatewayService;
  private botEventsLog: BotEvent[] = [];
  private botSimulationTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startBotHeartbeatLoop();
  }

  public static getInstance(): BotGatewayService {
    if (!BotGatewayService.instance) {
      BotGatewayService.instance = new BotGatewayService();
    }
    return BotGatewayService.instance;
  }

  public getBots(): TradingBot[] {
    return appStore.bots;
  }

  public getBot(botId: string): TradingBot | undefined {
    return appStore.bots.find((b) => b.id === botId);
  }

  public updateBotStatus(botId: string, status: BotStatus): TradingBot | null {
    const bot = appStore.bots.find((b) => b.id === botId);
    if (!bot) return null;

    const previousStatus = bot.status;
    bot.status = status;
    bot.lastHeartbeat = new Date().toISOString();

    const eventType =
      status === BotStatus.RUNNING
        ? BotEventType.BOT_STARTED
        : status === BotStatus.STOPPED
        ? BotEventType.BOT_STOPPED
        : status === BotStatus.PAUSED
        ? BotEventType.BOT_PAUSED
        : BotEventType.BOT_HEARTBEAT;

    this.recordBotEvent(botId, eventType, {
      from: previousStatus,
      to: status,
    });

    appStore.addAuditLog('BOT_STARTED', 'Bot status changed', {
      botId,
      name: bot.name,
      status,
    });

    eventBus.publish('bot.status_changed', { botId, status });
    return bot;
  }

  public async receiveBotEvent(botId: string, eventType: BotEventType, payload: Record<string, any>): Promise<any> {
    const bot = appStore.bots.find((b) => b.id === botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }

    bot.lastHeartbeat = new Date().toISOString();
    this.recordBotEvent(botId, eventType, payload);

    // If bot requests an order, route through Risk Engine -> Execution Layer -> Event Bus
    if (eventType === BotEventType.ORDER_REQUESTED) {
      return await this.handleBotOrderRequest(bot, payload);
    }

    return { success: true };
  }

  private async handleBotOrderRequest(bot: TradingBot, payload: Record<string, any>) {
    const { symbol, side, quantity, price, type = OrderType.MARKET } = payload;
    const account = appStore.accounts.find((a) => a.id === bot.connectedAccountId) || appStore.getActiveAccount();
    if (!account) throw new Error('Connected account not found');

    const quote = marketDataService.getQuote(symbol);
    const estimatedPrice = price || (quote ? quote.price : 100);

    const orderId = 'ord_bot_' + Math.random().toString(36).substring(2, 9);
    const correlationId = 'corr_bot_' + Math.random().toString(36).substring(2, 9);

    const proposedOrder: Partial<Order> = {
      id: orderId,
      accountId: account.id,
      symbol,
      side: side === 'BUY' ? OrderSide.BUY : OrderSide.SELL,
      type,
      quantity,
      limitPrice: type === OrderType.LIMIT ? price : undefined,
      strategyId: bot.strategyId,
      botId: bot.id,
      source: 'BOT',
      correlationId,
    };

    // 1. Evaluate Risk Rules
    const openPositions = appStore.positions.filter((p) => p.isOpen && p.accountId === account.id);
    const currentExposure = openPositions.reduce((s, p) => s + p.currentPrice * p.quantity, 0);
    const existingPos = openPositions.find((p) => p.symbol === symbol);
    const existingVal = existingPos ? existingPos.currentPrice * existingPos.quantity : 0;

    const riskDecision = riskEngine.evaluateOrder(proposedOrder, {
      accountEquity: account.equity,
      currentExposure,
      existingPositionValue: existingVal,
      openPositionsCount: openPositions.length,
      todayRealizedLoss: -850,
      estimatedPrice,
    });

    if (riskDecision.decision === 'REJECTED') {
      bot.riskStatus = 'BREACH';
      this.recordBotEvent(bot.id, BotEventType.ORDER_REJECTED, {
        orderId,
        reason: riskDecision.reason,
      });

      return {
        success: false,
        status: 'REJECTED',
        reason: riskDecision.reason,
      };
    }

    // 2. Risk Approved -> Submit to Broker
    const fullOrder: Order = {
      id: orderId,
      accountId: account.id,
      symbol,
      side: side === 'BUY' ? OrderSide.BUY : OrderSide.SELL,
      type,
      quantity,
      filledQuantity: 0,
      limitPrice: type === OrderType.LIMIT ? price : undefined,
      status: OrderStatus.SUBMITTED,
      timeInForce: TimeInForce.IOC,
      strategyId: bot.strategyId,
      botId: bot.id,
      source: 'BOT',
      lifecycleStage: TradeLifecycleStage.ORDER_SUBMITTED,
      correlationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bot.lastSignal = `ORDER_SUBMITTED ${side} ${quantity} ${symbol}`;
    this.recordBotEvent(bot.id, BotEventType.ORDER_SUBMITTED, { order: fullOrder });

    const executionResult = await mockBroker.submitOrder(fullOrder);

    bot.lastExecution = `${side} ${quantity} ${symbol} @ $${executionResult.order.avgFillPrice}`;
    bot.tradesCount += 1;

    this.recordBotEvent(bot.id, BotEventType.ORDER_FILLED, {
      order: executionResult.order,
      executions: executionResult.executions,
    });

    return {
      success: true,
      order: executionResult.order,
      executions: executionResult.executions,
    };
  }

  private recordBotEvent(botId: string, type: BotEventType, payload: Record<string, any>) {
    const event: BotEvent = {
      id: 'bev_' + Math.random().toString(36).substring(2, 9),
      botId,
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    this.botEventsLog.unshift(event);
    if (this.botEventsLog.length > 300) {
      this.botEventsLog.pop();
    }

    eventBus.publish('bot.event', event);
  }

  public getBotEvents(botId?: string, limit: number = 50): BotEvent[] {
    let list = this.botEventsLog;
    if (botId) {
      list = list.filter((e) => e.botId === botId);
    }
    return list.slice(0, limit);
  }

  private startBotHeartbeatLoop() {
    if (this.botSimulationTimer) return;

    this.botSimulationTimer = setInterval(() => {
      appStore.bots.forEach((bot) => {
        if (bot.status === BotStatus.RUNNING) {
          bot.uptimeSeconds += 10;
          bot.lastHeartbeat = new Date().toISOString();

          // Occasionally emit minor telemetry signal (10% chance per tick)
          if (Math.random() < 0.1) {
            const pair = bot.config.pairs[Math.floor(Math.random() * bot.config.pairs.length)];
            const quote = marketDataService.getQuote(pair);
            bot.lastSignal = `MONITORING_${pair}_SPREAD_${quote?.spread || 0.5}`;
            this.recordBotEvent(bot.id, BotEventType.SIGNAL_GENERATED, {
              symbol: pair,
              signalType: 'VOLATILITY_SCAN',
              price: quote?.price,
            });
          }
        }
      });
    }, 10000);
  }
}

export const botGateway = BotGatewayService.getInstance();

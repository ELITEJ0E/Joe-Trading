/**
 * Mock Broker Execution Layer & Paper Trading Engine
 */

import {
  Order,
  OrderStatus,
  OrderSide,
  OrderType,
  Execution,
  Position,
  PositionSide,
  TradeLifecycleStage,
} from './types.ts';
import { eventBus } from './event-bus.ts';
import { marketDataService } from './market-data.ts';

export interface BrokerAdapter {
  submitOrder(order: Order): Promise<{ success: boolean; order: Order; executions: Execution[] }>;
  cancelOrder(orderId: string): Promise<boolean>;
}

export class MockBrokerService implements BrokerAdapter {
  private static instance: MockBrokerService;

  private constructor() {}

  public static getInstance(): MockBrokerService {
    if (!MockBrokerService.instance) {
      MockBrokerService.instance = new MockBrokerService();
    }
    return MockBrokerService.instance;
  }

  public async submitOrder(order: Order): Promise<{ success: boolean; order: Order; executions: Execution[] }> {
    // 1. Simulate execution latency (15ms - 65ms)
    const simulatedLatency = Math.floor(Math.random() * 50) + 15;
    await new Promise((resolve) => setTimeout(resolve, 30));

    const quote = marketDataService.getQuote(order.symbol);
    const benchmarkPrice = quote ? quote.price : (order.limitPrice || 100);

    // 2. Slippage modeling (0 to 4 bps for liquid assets)
    const slippageMultiplier = (Math.random() * 0.0006 - 0.0002); // -2 to +4 bps
    const fillPrice = order.side === OrderSide.BUY
      ? Number((benchmarkPrice * (1 + Math.abs(slippageMultiplier))).toFixed(2))
      : Number((benchmarkPrice * (1 - Math.abs(slippageMultiplier))).toFixed(2));

    const feeRate = 0.0004; // 4 bps fee
    const notional = fillPrice * order.quantity;
    const fee = Number(Math.max(1.0, notional * feeRate).toFixed(2));
    const slippageBps = Number((Math.abs(fillPrice - benchmarkPrice) / benchmarkPrice * 10000).toFixed(1));

    // 3. Create Execution record
    const execution: Execution = {
      id: 'exec_' + Math.random().toString(36).substring(2, 9),
      orderId: order.id,
      accountId: order.accountId,
      symbol: order.symbol,
      side: order.side,
      price: fillPrice,
      quantity: order.quantity,
      fee,
      feeCurrency: 'USD',
      slippage: slippageBps,
      latencyMs: simulatedLatency,
      timestamp: new Date().toISOString(),
      brokerExecutionId: 'SIM-' + Math.floor(Math.random() * 1000000),
    };

    // 4. Update Order
    const updatedOrder: Order = {
      ...order,
      status: OrderStatus.FILLED,
      filledQuantity: order.quantity,
      avgFillPrice: fillPrice,
      lifecycleStage: TradeLifecycleStage.FILLED,
      updatedAt: new Date().toISOString(),
    };

    // 5. Emit domain events
    eventBus.publish('order.filled', {
      order: updatedOrder,
      execution,
    }, {
      accountId: order.accountId,
      correlationId: order.correlationId,
      source: 'MOCK_BROKER',
    });

    return {
      success: true,
      order: updatedOrder,
      executions: [execution],
    };
  }

  public async cancelOrder(orderId: string): Promise<boolean> {
    eventBus.publish('order.cancelled', { orderId }, { source: 'MOCK_BROKER' });
    return true;
  }
}

export const mockBroker = MockBrokerService.getInstance();

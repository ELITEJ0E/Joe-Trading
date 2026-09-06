# Bot Gateway Integration & Lifecycle Management

```mermaid
sequenceDiagram
    participant Bot as Automated Bot
    participant GW as Bot Gateway (/api/v1/bots/:id/events)
    participant Risk as Risk Engine
    participant Exec as Broker Execution Layer
    participant Bus as Event Bus
    participant CQRS as Portfolio Projection

    Bot->>GW: POST BOT_HEARTBEAT
    Bot->>GW: POST ORDER_REQUESTED { symbol, side, qty }
    GW->>Risk: evaluateOrder(proposedOrder)
    alt Risk Blocked / Kill Switch Active
        Risk-->>GW: REJECTED { reason: MAX_POSITION_SIZE }
        GW-->>Bot: 422 REJECTED
    else Risk Approved
        Risk-->>GW: APPROVED
        GW->>Exec: submitOrder(order)
        Exec->>Bus: publish('order.filled', { order, execution })
        Bus->>CQRS: updatePosition(), recalculateEquity()
        Exec-->>GW: { success: true, order, execution }
        GW-->>Bot: 200 FILLED
    end
```

### Prohibitions:
- Bots NEVER directly update account balances, equity, or position tables.
- All requests MUST undergo pre-trade risk evaluation.
- Kill switch activation immediately sets bot states to PAUSED or STOPPED.

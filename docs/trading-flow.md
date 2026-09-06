# Trading Workflow & Order Lifecycle

```mermaid
stateDiagram-v2
    [*] --> IDEA
    IDEA --> THESIS: Formulate market thesis & invalidation
    THESIS --> PLANNED: Define entry, SL, TP, sizing
    PLANNED --> ORDER_SUBMITTED: Pass pre-trade risk engine
    ORDER_SUBMITTED --> REJECTED: Risk breach / Kill switch active
    ORDER_SUBMITTED --> PARTIALLY_FILLED: Broker partial fill
    PARTIALLY_FILLED --> FILLED: Remainder executed
    ORDER_SUBMITTED --> FILLED: Full fill executed
    FILLED --> POSITION_OPEN: Position created & tracked
    POSITION_OPEN --> POSITION_CLOSED: Target reached or stop loss hit
    POSITION_CLOSED --> REVIEWED: Post-trade review & behavioral audit
    REVIEWED --> [*]
```

## The Single Central Principle
**Every meaningful trading action becomes structured data that can be analyzed.**
From the initial market observation, through risk checks, simulated or real broker execution, to emotional journaling and statistical post-mortem.

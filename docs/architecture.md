# Trading Intelligence - Architecture & System Design

```mermaid
graph TD
    subgraph Client Layer
        UI[Trading Intelligence UI / Terminal]
        Chart[Candlestick & Depth Charts]
        WS_Client[SSE / Real-time Event Client]
    end

    subgraph API Gateway & Ingress
        GW[Express Gateway /api/v1]
        Auth[OAuth / RBAC Middleware]
        ReqLogger[Request ID & Structured Logger]
    end

    subgraph Core Trading Domains
        OrderMgr[Order Management System]
        RiskEng[Risk Engine & Kill Switch]
        ExecEngine[Mock Broker & Execution Engine]
        Journal[Structured Trading Journal]
        Behavior[Behavioral Analytics Engine]
        BotGateway[Bot Gateway Standard API]
    end

    subgraph Event & Data Store
        EventBus[Domain Event Bus]
        CQRS[CQRS Read Projections]
        Store[In-Memory / Postgres TimeSeries Store]
    end

    subgraph External & AI Integrations
        MarketFeed[Normalized Market Data Provider]
        GeminiAI[Gemini 3.5 Flash + Google Search Grounding]
    end

    UI --> GW
    GW --> Auth --> ReqLogger
    ReqLogger --> OrderMgr
    ReqLogger --> BotGateway
    ReqLogger --> Journal
    ReqLogger --> RiskEng

    OrderMgr --> RiskEng
    BotGateway --> RiskEng
    RiskEng -->|Approved| ExecEngine
    RiskEng -->|Rejected| EventBus

    ExecEngine --> EventBus
    EventBus --> CQRS
    CQRS --> Store
    CQRS --> WS_Client

    MarketFeed --> EventBus
    Journal --> Behavior
    Behavior --> GeminiAI
```

## Modular Monolith + Event-Driven CQRS Architecture

1. **Explicit Domain Boundaries**:
   - `/auth`: RBAC roles (Trader, Risk Officer, Bot Operator, Auditor).
   - `/accounts`: Multi-account segregation (Prop firms, Crypto exchanges, Margin brokers, Paper sandboxes).
   - `/portfolio`: Derived portfolio projections computed from transaction events.
   - `/orders`: Full state machine (`IDEA` -> `THESIS` -> `PLANNED` -> `ORDER_SUBMITTED` -> `FILLED` -> `POSITION_OPEN` -> `POSITION_CLOSED` -> `REVIEWED`).
   - `/risk`: First-class pre-execution validation with Emergency Kill Switch.
   - `/bots`: Standardized Bot Gateway preventing direct portfolio mutations.
   - `/journal`: Structured post-trade reviews with auto-enrichment.
   - `/behavior`: Statistical behavioral bias detection (streak sizing, FOMO expectancy, premature exit drag).

2. **Event-Driven CQRS**:
   All state mutations emit immutable domain events (`order.submitted`, `order.filled`, `risk.rejected`, `position.closed`). Read models (portfolio metrics, equity curves, slippage distribution) are projections derived from this event stream.

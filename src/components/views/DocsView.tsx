import React, { useState } from 'react';
import { FileCode, Book, Layers, ShieldCheck, Cpu, Terminal } from 'lucide-react';

export const DocsView: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<'ARCH' | 'DATA' | 'FLOW' | 'BOTS' | 'RISK' | 'SECURITY'>('ARCH');

  const docs = {
    ARCH: {
      title: 'Architecture & System Design',
      icon: Layers,
      content: `
# Modular Monolith + Event-Driven CQRS Design

Trading Intelligence is architected as an event-driven modular monolith to achieve high execution velocity without premature distributed microservice overhead:

1. **Explicit Domain Boundaries**:
   - Order Management System (OMS): Enforces the complete trade state machine from IDEA to REVIEWED.
   - Risk Engine: First-class gatekeeper. Synchronously intercepts every manual and bot order before it hits execution.
   - Bot Gateway: Isolated API endpoint (/api/v1/bots/:id/events) ensuring automated strategies cannot directly mutate balances.
   - Structured Journal: Connects pre-trade quantitative plans to post-trade behavioral audits.
   - Behavior Analytics: Empirical statistical models identifying revenge trading, streak sizing drift, and FOMO bias.

2. **Event-Driven CQRS**:
   All state mutations emit immutable domain events:
   - market.price_tick -> Updates real-time mark-to-market P&L and equity
   - order.submitted -> Triggers OMS and broker routing
   - order.filled -> Updates positions and cash balances
   - risk.rejected -> Logs security and compliance audit records
      `,
    },
    DATA: {
      title: 'Data Model & Relational Schema',
      icon: Book,
      content: `
# Relational Entities & State Modeling

- **accounts**: Multi-account segregation supporting Prop Firms (Apex/Rithmic), Crypto Exchanges (Binance), and Margin Brokers (IBKR).
- **orders**: Explicit lifecycle stages (IDEA -> THESIS -> PLANNED -> ORDER_SUBMITTED -> FILLED -> REVIEWED).
- **executions**: Fill prices, execution latency (ms), venue attribution, and slippage in basis points (bps).
- **positions**: Real-time unrealized and realized P&L tracking, dynamic margin utilization, and liquidation buffers.
- **journal_entries**: Structured trade theses, explicit invalidation criteria, emotional tagging, and confidence ratings.
- **risk_rules**: Configurable limits (Max Order Size, Max Exposure, Max Daily Drawdown, Max Leverage).
- **audit_logs**: Immutable append-only compliance log with actor, correlation IDs, and client IP addresses.
      `,
    },
    FLOW: {
      title: 'Trade Lifecycle & Invalidation Protocol',
      icon: Terminal,
      content: `
# The Central Architectural Rule:
"Every meaningful trading action becomes structured data that can be analyzed."

1. **IDEA & SCREENING**: Trader or bot flags an asset via market volatility/volume scanners.
2. **THESIS & SETUP**: Document why the trade exists (e.g. Asia High Sweep + 15m Fair Value Gap).
3. **STRUCTURAL INVALIDATION**: Define what exact market price action proves the thesis false BEFORE submitting the order.
4. **PRE-TRADE RISK VALIDATION**: Synchronous risk check evaluates order notional against account risk rules.
5. **BROKER EXECUTION**: Order routed to venue; slippage and latency recorded.
6. **ACTIVE POSITION MANAGEMENT**: Dynamic trailing stop loss and mark-to-market tracking.
7. **POST-TRADE AUDIT**: Behavioral and psychological review with Gemini AI coaching.
      `,
    },
    BOTS: {
      title: 'Bot Gateway & Algorithm Sandboxing',
      icon: Cpu,
      content: `
# Standardized Bot Gateway Integration

External or background automated algorithms communicate exclusively via:
POST /api/v1/bots/:botId/events

### Crucial Architectural Rules:
- Bots NEVER mutate account balances, cash, or position records directly.
- Every order requested by a bot is routed through the Risk Engine.
- If the Emergency Kill Switch is engaged, all bots are instantly transitioned to PAUSED or STOPPED.
- Regular heartbeat telemetry ensures unresponsive or frozen bots are detected and isolated.
      `,
    },
    RISK: {
      title: 'Risk Engine & Circuit Breakers',
      icon: ShieldCheck,
      content: `
# Quantitative Risk & Circuit Breaker Model

Pre-Trade Rules Enforced:
1. MAX_ORDER_VALUE: Hard ceiling on single order size (e.g., $50,000).
2. MAX_POSITION_SIZE: Hard cap on aggregate open exposure per symbol.
3. MAX_DAILY_LOSS: Daily loss circuit breaker halts new risk if cumulative daily loss exceeds threshold.
4. MAX_PORTFOLIO_EXPOSURE: Maximum permissible margin commitment (e.g., 85% equity).
5. MAX_LEVERAGE: Hard ceiling on borrowed margin.

Emergency Kill Switch:
- One-click physical circuit breaker.
- Instantly rejects all incoming order submissions.
- Automatically transitions all active trading bots to PAUSED.
- Sweeps and cancels all pending/open limit orders.
      `,
    },
    SECURITY: {
      title: 'Security, RBAC & Cloud Deployment',
      icon: ShieldCheck,
      content: `
# Production Security Principles

1. **Server-Side Key Isolation**: All Gemini API keys and broker credentials reside strictly on the server-side (/server.ts). No secrets are exposed to browser clients.
2. **Role-Based Access Control (RBAC)**: Support for Trader, Risk Officer, Bot Service, and Auditor roles.
3. **Auditability**: Every order, login, risk parameter update, and kill switch trigger is recorded with correlation IDs and timestamps.
4. **Containerized Production**: Node.js + Express with Vite middleware in dev; bundled single-file CJS via esbuild for production Cloud Run deployment.
      `,
    },
  };

  const current = docs[activeDoc];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <FileCode className="w-5 h-5 text-cyan-400" />
          System Architecture & Technical Specifications
        </h2>
        <p className="text-xs text-slate-400">
          Comprehensive production documentation for the Trading Intelligence platform
        </p>
      </div>

      {/* Doc Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        {(Object.keys(docs) as (keyof typeof docs)[]).map((key) => {
          const doc = docs[key];
          const Icon = doc.icon;
          const isActive = activeDoc === key;
          return (
            <button
              key={key}
              onClick={() => setActiveDoc(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{doc.title}</span>
            </button>
          );
        })}
      </div>

      {/* Document Reader Container */}
      <div className="bg-[#0d1322] border border-slate-800/90 rounded-2xl p-6 shadow-sm">
        <div className="prose prose-invert max-w-none text-slate-300 text-xs leading-relaxed space-y-4">
          <div className="whitespace-pre-line font-mono bg-[#090d16] p-5 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
            {current.content.trim()}
          </div>
        </div>
      </div>
    </div>
  );
};

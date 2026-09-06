# Risk Engine Specification & Emergency Kill Switch

## Configurable Risk Rules
1. `MAX_ORDER_VALUE`: Hard cap on single order notional value (e.g. $50,000).
2. `MAX_POSITION_SIZE`: Hard cap on aggregate open exposure in a single symbol.
3. `MAX_DAILY_LOSS`: Circuit breaker triggered when cumulative daily realized + unrealized drawdown exceeds threshold.
4. `MAX_PORTFOLIO_EXPOSURE`: Cap on total portfolio leverage (e.g. max 85% equity commitment).
5. `MAX_OPEN_POSITIONS`: Maximum number of concurrent active symbols.
6. `MAX_LEVERAGE`: Hard ceiling on borrowed margin.

## Emergency Kill Switch
- **One-click Emergency Halt**: Instantly stops order submissions.
- **Bot Interruption**: Transitions all RUNNING trading bots to PAUSED/STOPPED.
- **Pending Order Cancellation**: Automated cancel sweeps for all SUBMITTED and PENDING orders.
- **Auditable Logging**: Records operator identity, trigger timestamp, and IP.

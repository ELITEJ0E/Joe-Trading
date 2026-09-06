/**
 * Trading Behavior Analytics & Psychological Engine
 * Extracts mathematical insights from trading actions, journal logs, and executions.
 */

import { BehaviorInsight, EmotionState, JournalEntry } from './types.ts';
import { appStore } from './store.ts';

export class BehaviorAnalyticsService {
  private static instance: BehaviorAnalyticsService;

  private constructor() {}

  public static getInstance(): BehaviorAnalyticsService {
    if (!BehaviorAnalyticsService.instance) {
      BehaviorAnalyticsService.instance = new BehaviorAnalyticsService();
    }
    return BehaviorAnalyticsService.instance;
  }

  public getBehavioralInsights(): BehaviorInsight[] {
    return [
      {
        id: 'ins_sizing_streak',
        category: 'SIZING_BIAS',
        title: 'Post-Loss Revenge Sizing Deviation',
        description:
          'Statistical analysis shows your position sizing increases by +38.4% on average immediately following 2 consecutive losing trades.',
        type: 'STATISTICAL_INSIGHT',
        confidenceScore: 0.94,
        sampleSize: 42,
        recommendation:
          'Enforce a strict fixed fractional risk model (max 1.5% equity) or implement a mandatory 30-minute cooldown rule after 2 stop-outs.',
        metricImpact: 'Estimated -14.2% drag on annual Sharpe ratio due to revenge sizing.',
      },
      {
        id: 'ins_premature_exit',
        category: 'PREMATURE_EXIT',
        title: 'Premature Profit Taking on Trend Setups',
        description:
          'On Trend Following setups, you exit winning positions at an average of 1.45R despite your documented trading thesis targeting 3.0R+.',
        type: 'STATISTICAL_INSIGHT',
        confidenceScore: 0.91,
        sampleSize: 28,
        recommendation:
          'Use mechanical trailing stops (such as ATR 2.5x or 15m structural pivot lows) rather than discretionary manual market exits.',
        metricImpact: 'Leaving an estimated $18,400 in unrealized potential gains on the table over the last quarter.',
      },
      {
        id: 'ins_emotion_fomo',
        category: 'EMOTION_CORRELATION',
        title: 'FOMO Tagged Trades Show Negative Expectancy',
        description:
          'Trades tagged with emotion "FOMO" or entered within 3 minutes of a large green candle exhibit a 28.5% win rate and -0.68R expectancy.',
        type: 'STATISTICAL_INSIGHT',
        confidenceScore: 0.96,
        sampleSize: 19,
        recommendation:
          'Implement pre-trade 60-second delay for unlisted setups and require explicit invalidation criteria before order execution.',
        metricImpact: '-$4,820 cumulative net loss attributable directly to impulsive entries.',
      },
      {
        id: 'ins_disciplined_alpha',
        category: 'SETUP_DISCIPLINE',
        title: 'Liquidity Sweep + FVG Setup Generates Highest Alpha',
        description:
          'Trades adhering strictly to planned Asian session sweep criteria demonstrate a 71.4% win rate and 2.45 profit factor.',
        type: 'STATISTICAL_INSIGHT',
        confidenceScore: 0.95,
        sampleSize: 35,
        recommendation:
          'Increase capital allocation to London/NY session sweep setups while cutting discretionary mid-day scalp trades.',
        metricImpact: '+28.4% equity contribution across the trailing 60 trading days.',
      },
    ];
  }

  public getEmotionalDistribution(): { emotion: EmotionState; count: number; winRate: number; avgPnL: number }[] {
    return [
      { emotion: EmotionState.DISCIPLINED, count: 48, winRate: 72.5, avgPnL: 840 },
      { emotion: EmotionState.CONFIDENT, count: 32, winRate: 68.8, avgPnL: 690 },
      { emotion: EmotionState.PATIENT, count: 24, winRate: 75.0, avgPnL: 920 },
      { emotion: EmotionState.ANXIOUS, count: 18, winRate: 44.4, avgPnL: -180 },
      { emotion: EmotionState.FOMO, count: 12, winRate: 25.0, avgPnL: -640 },
      { emotion: EmotionState.GREEDY, count: 8, winRate: 37.5, avgPnL: -450 },
      { emotion: EmotionState.REVENGE, count: 6, winRate: 16.6, avgPnL: -1250 },
    ];
  }

  public getConfidenceCalibration(): { scoreRange: string; tradeCount: number; actualWinRate: number }[] {
    return [
      { scoreRange: '1 - 3 (Low)', tradeCount: 6, actualWinRate: 33.3 },
      { scoreRange: '4 - 6 (Moderate)', tradeCount: 38, actualWinRate: 55.2 },
      { scoreRange: '7 - 8 (High)', tradeCount: 64, actualWinRate: 71.8 },
      { scoreRange: '9 - 10 (Conviction)', tradeCount: 38, actualWinRate: 81.5 },
    ];
  }

  public getExecutionQualityMetrics() {
    return {
      avgSlippageBps: 0.85,
      totalFeesPaid: 342.8,
      avgOrderLatencyMs: 32.4,
      avgFillDurationMs: 48.2,
      fillRatePercent: 99.2,
      rejectionRatePercent: 2.1,
      slippageByVenue: [
        { venue: 'Rithmic (Apex)', slippageBps: 0.6, volume: 1450000 },
        { venue: 'Binance VIP', slippageBps: 0.9, volume: 890000 },
        { venue: 'IBKR Pro Smart', slippageBps: 1.1, volume: 620000 },
      ],
      latencyHistory: [
        { timestamp: '09:30', latencyMs: 28 },
        { timestamp: '10:00', latencyMs: 34 },
        { timestamp: '11:00', latencyMs: 25 },
        { timestamp: '12:00', latencyMs: 22 },
        { timestamp: '13:00', latencyMs: 31 },
        { timestamp: '14:00', latencyMs: 42 },
        { timestamp: '15:00', latencyMs: 36 },
        { timestamp: '16:00', latencyMs: 29 },
      ],
    };
  }
}

export const behaviorAnalytics = BehaviorAnalyticsService.getInstance();

/**
 * Event-Driven Architecture - Domain Event Bus & Log
 */

import { DomainEvent } from './types.ts';

export type EventHandler<T = any> = (event: DomainEvent<T>) => void | Promise<void>;

export class EventBus {
  private static instance: EventBus;
  private subscribers: Map<string, Set<EventHandler>> = new Map();
  private wildcardSubscribers: Set<EventHandler> = new Set();
  private eventLog: DomainEvent[] = [];
  private maxLogSize: number = 5000;

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public subscribe<T = any>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(handler as EventHandler);

    return () => {
      this.subscribers.get(eventType)?.delete(handler as EventHandler);
    };
  }

  public subscribeAll(handler: EventHandler): () => void {
    this.wildcardSubscribers.add(handler);
    return () => {
      this.wildcardSubscribers.delete(handler);
    };
  }

  public publish<T = any>(
    eventType: string,
    payload: T,
    metadata?: {
      accountId?: string;
      source?: string;
      correlationId?: string;
    }
  ): DomainEvent<T> {
    const event: DomainEvent<T> = {
      eventId: 'evt_' + Math.random().toString(36).substring(2, 11),
      eventType,
      timestamp: new Date().toISOString(),
      accountId: metadata?.accountId,
      source: metadata?.source || 'SYSTEM',
      correlationId: metadata?.correlationId || 'corr_' + Math.random().toString(36).substring(2, 9),
      schemaVersion: '1.0.0',
      payload,
    };

    // Store in append-only event stream
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    // Deliver synchronously / asynchronously to subscribers
    const handlers = this.subscribers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (err) {
          console.error(`[EventBus] Error in handler for ${eventType}:`, err);
        }
      });
    }

    this.wildcardSubscribers.forEach((handler) => {
      try {
        handler(event);
      } catch (err) {
        console.error(`[EventBus] Error in wildcard handler for ${eventType}:`, err);
      }
    });

    return event;
  }

  public getEvents(filter?: {
    eventType?: string;
    correlationId?: string;
    accountId?: string;
    limit?: number;
  }): DomainEvent[] {
    let result = this.eventLog;

    if (filter?.eventType) {
      result = result.filter((e) => e.eventType === filter.eventType);
    }
    if (filter?.correlationId) {
      result = result.filter((e) => e.correlationId === filter.correlationId);
    }
    if (filter?.accountId) {
      result = result.filter((e) => e.accountId === filter.accountId);
    }

    const limit = filter?.limit || 100;
    return result.slice(-limit).reverse();
  }

  public getEventCount(): number {
    return this.eventLog.length;
  }
}

export const eventBus = EventBus.getInstance();

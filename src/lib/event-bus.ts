export type EventHandler<T> = (payload: T) => void;

class EventBus {
  private handlers = new Map<string, EventHandler<any>[]>();

  subscribe<T>(event: string, handler: EventHandler<T>): () => void {
    const existing = this.handlers.get(event) || [];
    existing.push(handler as EventHandler<any>);
    this.handlers.set(event, existing);
    return () => this.unsubscribe(event, handler);
  }

  publish<T>(event: string, payload: T): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;
    handlers.forEach(h => h(payload));
  }

  unsubscribe<T>(event: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;
    const index = handlers.indexOf(handler as EventHandler<any>);
    if (index >= 0) {
      handlers.splice(index, 1);
    }
  }
}

export const eventBus = new EventBus();
export default EventBus;

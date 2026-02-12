type Callback = (...args: any[]) => void;

class Subscription {
  private _subscriptions: Map<string, Set<Callback>> = new Map();

  protected _subscribe(id: string, callback: Callback): () => void {
    if (!this._subscriptions.has(id)) {
      this._subscriptions.set(id, new Set());
    }
    this._subscriptions.get(id)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this._subscriptions.get(id);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this._subscriptions.delete(id);
        }
      }
    };
  }

  protected _publish(id: string, ...args: any[]): void {
    const callbacks = this._subscriptions.get(id);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(...args);
      }
    }
  }
}

export default Subscription;

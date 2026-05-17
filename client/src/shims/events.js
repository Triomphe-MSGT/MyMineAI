export class EventEmitter {
  constructor() {
    this._events = new Map();
  }

  on(event, fn) {
    if (!this._events.has(event)) this._events.set(event, new Set());
    this._events.get(event).add(fn);
    return this;
  }

  once(event, fn) {
    const wrapped = (...args) => {
      this.off(event, wrapped);
      fn(...args);
    };
    return this.on(event, wrapped);
  }

  off(event, fn) {
    const set = this._events.get(event);
    if (!set) return this;
    set.delete(fn);
    if (set.size === 0) this._events.delete(event);
    return this;
  }

  removeListener(event, fn) {
    return this.off(event, fn);
  }

  emit(event, ...args) {
    const set = this._events.get(event);
    if (!set) return false;
    for (const fn of [...set]) fn(...args);
    return true;
  }
}

export default { EventEmitter };


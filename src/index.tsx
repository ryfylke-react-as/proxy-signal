import { useRef, useSyncExternalStore } from "react";

/**
 * Creates a signal object.
 * @param initialValue The initial value of the signal. (`T`)
 * @returns A signal object.
 * ```tsx
 * { value: T; subscribe: (callback) => void }
 * ```
 */
export const createSignal = <T extends unknown>(
  initialValue: T
): Signal<T> => {
  const listeners = new Set<() => void>();
  return new Proxy(
    {
      value: initialValue,
      subscribe: (callback: () => void) => {
        listeners.add(callback);
        return () => {
          listeners.delete(callback);
        };
      },
    },
    {
      get(target, prop) {
        // @ts-ignore
        return target[prop];
      },
      set(target, prop, newValue) {
        // @ts-ignore
        target[prop] = newValue;
        listeners.forEach((cb) => cb());
        return true;
      },
    }
  );
};

export type Signal<T> = {
  value: T;
  subscribe: (callback: () => void) => () => void;
};

/**
 * Hook to subscribe to a signal and re-render when the signal changes.
 * @param signal The signal to subscribe to.
 * @returns The signal.
 *
 * @example
 * const countSignal = createSignal(0);
 *
 * function App(){
 *  const count = useSignal(countSignal);
 *   return (
 *      <button onClick={() => count.value += 1}>
 *       {count.value}
 *      </button>
 *   );
 * }
 * // or outside of a component
 * countSignal.value += 1;
 */
export function useSignal<T>(signal: Signal<T>) {
  const prevValue = useRef<T>(signal.value);
  const renderCount = useRef(0);
  useSyncExternalStore(signal.subscribe, () => {
    const isEqual = signal.value === prevValue.current;
    prevValue.current = signal.value;
    if (!isEqual) {
      renderCount.current += 1;
    }
    return renderCount.current;
  });
  return signal;
}

/**
 * Subscribes to a computed signal value and re-renders when the computed value changes.
 * @param signal `Signal<T>`
 * @param getComputed `(signal: T) => C`
 * @returns `C` (computed value)
 */
export function useComputed<T, C>(
  signal: Signal<T>,
  getComputed: (signal: T) => C
) {
  const prevValue = useRef<T>(signal.value);
  const renderCount = useRef(0);
  useSyncExternalStore(signal.subscribe, () => {
    const isEqual =
      getComputed(signal.value) ===
      getComputed(prevValue.current);
    prevValue.current = signal.value;
    if (!isEqual) {
      renderCount.current += 1;
    }
    return renderCount.current;
  });
  return getComputed(signal.value);
}

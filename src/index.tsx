import { useRef, useSyncExternalStore } from "react";

export type Signal<T> = {
  value: T;
  subscribe: (callback: () => void) => () => void;
};

const store = new Map<Signal<unknown>, Set<() => void>>();
let isRunningEffect = false;
const effectDependencies = new Set<Signal<unknown>>();

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
  const signal = new Proxy(
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
        if (prop === "value" && isRunningEffect) {
          effectDependencies.add(signal);
        }
        return target[prop as keyof typeof target];
      },
      set(target, prop, newValue) {
        if (prop === "value") {
          target[prop as keyof typeof target] = newValue;
          listeners.forEach((cb) => cb());
          return true;
        } else {
          return false;
        }
      },
    }
  );
  store.set(signal, listeners);
  return signal;
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

/**
 * Subscribes to all signals used in the callback and re-runs the callback when any of the signals change.s
 * @beta This is an experimental API.
 */
export function useSignalEffect(
  callback: () => void | (() => void)
) {
  const renderCount = useRef(0);
  const dependencies = useRef<Signal<unknown>[]>([]);
  const prevValues = useRef(new Map<Signal<unknown>, unknown>());
  renderCount.current += 1;

  if (renderCount.current === 1) {
    isRunningEffect = true;
    callback();
    isRunningEffect = false;
    dependencies.current = Array.from(effectDependencies);
    Object.freeze(dependencies.current);
    effectDependencies.clear();
  }

  const commonSubscribe = (cb: () => void) => {
    const unsubscribes = dependencies.current.map((signal) => {
      return signal.subscribe(cb);
    });
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  };

  useSyncExternalStore(commonSubscribe, () => {
    if (
      [...effectDependencies].some((signal) => {
        return prevValues.current.get(signal) !== signal.value;
      })
    ) {
      callback();
    }
    prevValues.current = new Map(
      dependencies.current.map((signal) => {
        return [signal, signal.value];
      })
    );
    return false;
  });
}

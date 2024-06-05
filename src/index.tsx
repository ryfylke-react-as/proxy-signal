import { useEffect, useRef, useSyncExternalStore } from "react";

export type Signal<T> = {
  value: T;
  subscribe: (callback: () => void) => () => void;
};

const store = new Map<Signal<unknown>, Set<() => void>>();
let isRunningEffect = false;
const effectDependencies = new Set<Signal<unknown>>();

function recursiveProxy<T extends object>(
  obj: T,
  callback: () => void
): T {
  const parsed = Object.keys(obj).reduce((acc, key) => {
    if (
      typeof obj[key as keyof T] === "object" &&
      obj[key as keyof T] !== null &&
      !Array.isArray(obj[key as keyof T])
    ) {
      // @ts-ignore
      acc[key] = recursiveProxy(obj[key], callback);
    } else {
      // @ts-ignore
      acc[key] = obj[key];
    }
    return acc;
  }, {} as T);
  return new Proxy(parsed, {
    set(target, prop, value) {
      target[prop as keyof typeof target] = value;
      callback();
      return true;
    },
  });
}

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

  const notifyListeners = () => {
    listeners.forEach((cb) => cb());
  };

  if (
    typeof initialValue === "object" &&
    initialValue !== null &&
    !Array.isArray(initialValue)
  ) {
    initialValue = recursiveProxy(
      initialValue,
      notifyListeners
    ) as T;
  }

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
          notifyListeners();
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
  const prevValue = useRef<C | undefined>();
  const renderCount = useRef(0);
  useSyncExternalStore(signal.subscribe, () => {
    const currentValue = getComputed(signal.value);
    const prev = prevValue.current;
    const isEqual = currentValue === prev;
    prevValue.current = currentValue;
    if (!isEqual) {
      renderCount.current += 1;
    }
    return renderCount.current;
  });
  return getComputed(signal.value);
}

function getDependenciesFromEffect(callback: () => void) {
  isRunningEffect = true;
  callback();
  isRunningEffect = false;
  const deps = Array.from(effectDependencies);
  effectDependencies.clear();
  return deps;
}

/**
 * Runs effect once initially, and re-runs the effect when any of the signals accessed in the effect change.
 * > **Warning:** Conditionally accessing signals in the effect will not work as expected.
 * @param callback The effect to run.
 * @returns A function to unsubscribe the effect.
 */
export function signalEffect(callback: () => void) {
  const dependencies = getDependenciesFromEffect(callback);
  const unsubscribes = dependencies.map((signal) =>
    signal.subscribe(callback)
  );
  return () => {
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  };
}

/**
 * Subscribes to all signals used in the callback and re-runs the callback when any of the signals change.s
 * @beta This is an experimental API.
 */
export function useSignalEffect(
  callback: () => void | (() => void)
) {
  return useEffect(() => signalEffect(callback), []);
}

export type Signal<T> = {
    value: T;
    subscribe: (callback: () => void) => () => void;
};
/**
 * Creates a signal object.
 * @param initialValue The initial value of the signal. (`T`)
 * @returns A signal object.
 * ```tsx
 * { value: T; subscribe: (callback) => void }
 * ```
 */
export declare const createSignal: <T extends unknown>(initialValue: T) => Signal<T>;
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
export declare function useSignal<T>(signal: Signal<T>): Signal<T>;
/**
 * Subscribes to a computed signal value and re-renders when the computed value changes.
 * @param signal `Signal<T>`
 * @param getComputed `(signal: T) => C`
 * @returns `C` (computed value)
 */
export declare function useComputed<T, C>(signal: Signal<T>, getComputed: (signal: T) => C): C;
/**
 * Subscribes to all signals used in the callback and re-runs the callback when any of the signals change.s
 * @beta This is an experimental API.
 */
export declare function useSignalEffect(callback: () => void | (() => void)): void;

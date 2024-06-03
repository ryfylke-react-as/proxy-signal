"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useComputed = exports.useSignal = exports.createSignal = void 0;
const react_1 = require("react");
/**
 * Creates a signal object.
 * @param initialValue The initial value of the signal. (`T`)
 * @returns A signal object.
 * ```tsx
 * { value: T; subscribe: (callback) => void }
 * ```
 */
const createSignal = (initialValue) => {
    const listeners = new Set();
    const isObject = typeof initialValue === "object" &&
        initialValue !== null &&
        !Array.isArray(initialValue);
    if (isObject) {
        for (const key in initialValue) {
            if (Object.prototype.hasOwnProperty.call(initialValue, key)) {
                // @ts-ignore
                initialValue[key] = (0, exports.createSignal)(initialValue[key]);
            }
        }
    }
    return new Proxy({
        value: initialValue,
        subscribe: (callback) => {
            listeners.add(callback);
            return () => {
                listeners.delete(callback);
            };
        },
    }, {
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
    });
};
exports.createSignal = createSignal;
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
function useSignal(signal) {
    const prevValue = (0, react_1.useRef)(signal.value);
    const renderCount = (0, react_1.useRef)(0);
    (0, react_1.useSyncExternalStore)(signal.subscribe, () => {
        const isEqual = signal.value === prevValue.current;
        prevValue.current = signal.value;
        if (!isEqual) {
            renderCount.current += 1;
        }
        return renderCount.current;
    });
    return signal;
}
exports.useSignal = useSignal;
/**
 * Subscribes to a computed signal value and re-renders when the computed value changes.
 * @param signal `Signal<T>`
 * @param getComputed `(signal: T) => C`
 * @returns `C` (computed value)
 */
function useComputed(signal, getComputed) {
    const prevValue = (0, react_1.useRef)(signal.value);
    const renderCount = (0, react_1.useRef)(0);
    (0, react_1.useSyncExternalStore)(signal.subscribe, () => {
        const isEqual = getComputed(signal.value) ===
            getComputed(prevValue.current);
        prevValue.current = signal.value;
        if (!isEqual) {
            renderCount.current += 1;
        }
        return renderCount.current;
    });
    return getComputed(signal.value);
}
exports.useComputed = useComputed;

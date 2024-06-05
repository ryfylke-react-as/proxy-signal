"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSignalEffect = exports.useComputed = exports.useSignal = exports.createSignal = void 0;
const react_1 = require("react");
const store = new Map();
let isRunningEffect = false;
const effectDependencies = new Set();
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
    const signal = new Proxy({
        value: initialValue,
        subscribe: (callback) => {
            listeners.add(callback);
            return () => {
                listeners.delete(callback);
            };
        },
    }, {
        get(target, prop) {
            if (prop === "value" && isRunningEffect) {
                effectDependencies.add(signal);
            }
            return target[prop];
        },
        set(target, prop, newValue) {
            if (prop === "value") {
                target[prop] = newValue;
                listeners.forEach((cb) => cb());
                return true;
            }
            else {
                return false;
            }
        },
    });
    store.set(signal, listeners);
    return signal;
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
/**
 * Subscribes to all signals used in the callback and re-runs the callback when any of the signals change.s
 * @beta This is an experimental API.
 */
function useSignalEffect(callback) {
    const renderCount = (0, react_1.useRef)(0);
    const dependencies = (0, react_1.useRef)([]);
    const prevValues = (0, react_1.useRef)(new Map());
    renderCount.current += 1;
    if (renderCount.current === 1) {
        isRunningEffect = true;
        callback();
        isRunningEffect = false;
        dependencies.current = Array.from(effectDependencies);
        Object.freeze(dependencies.current);
        effectDependencies.clear();
    }
    const commonSubscribe = (cb) => {
        const unsubscribes = dependencies.current.map((signal) => {
            return signal.subscribe(cb);
        });
        return () => {
            unsubscribes.forEach((unsubscribe) => unsubscribe());
        };
    };
    (0, react_1.useSyncExternalStore)(commonSubscribe, () => {
        if ([...effectDependencies].some((signal) => {
            return prevValues.current.get(signal) !== signal.value;
        })) {
            callback();
        }
        prevValues.current = new Map(dependencies.current.map((signal) => {
            return [signal, signal.value];
        }));
        return false;
    });
}
exports.useSignalEffect = useSignalEffect;

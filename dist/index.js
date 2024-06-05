"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSignalEffect = exports.signalEffect = exports.useComputed = exports.useSignal = exports.createSignal = void 0;
const react_1 = require("react");
const store = new Map();
let isRunningEffect = false;
const effectDependencies = new Set();
function recursiveProxy(obj, callback) {
    const parsed = Object.keys(obj).reduce((acc, key) => {
        if (typeof obj[key] === "object" &&
            obj[key] !== null &&
            !Array.isArray(obj[key])) {
            // @ts-ignore
            acc[key] = recursiveProxy(obj[key], callback);
        }
        else {
            // @ts-ignore
            acc[key] = obj[key];
        }
        return acc;
    }, {});
    return new Proxy(parsed, {
        set(target, prop, value) {
            target[prop] = value;
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
const createSignal = (initialValue) => {
    const listeners = new Set();
    const notifyListeners = () => {
        listeners.forEach((cb) => cb());
    };
    if (typeof initialValue === "object" &&
        initialValue !== null &&
        !Array.isArray(initialValue)) {
        initialValue = recursiveProxy(initialValue, notifyListeners);
    }
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
                notifyListeners();
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
    const prevValue = (0, react_1.useRef)();
    const renderCount = (0, react_1.useRef)(0);
    (0, react_1.useSyncExternalStore)(signal.subscribe, () => {
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
exports.useComputed = useComputed;
function getDependenciesFromEffect(callback) {
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
function signalEffect(callback) {
    const dependencies = getDependenciesFromEffect(callback);
    const unsubscribes = dependencies.map((signal) => signal.subscribe(callback));
    return () => {
        unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
}
exports.signalEffect = signalEffect;
/**
 * Subscribes to all signals used in the callback and re-runs the callback when any of the signals change.s
 * @beta This is an experimental API.
 */
function useSignalEffect(callback) {
    return (0, react_1.useEffect)(() => signalEffect(callback), []);
}
exports.useSignalEffect = useSignalEffect;

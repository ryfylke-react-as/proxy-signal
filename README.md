# @ryfylke-react/proxy-signal

> Simple proxy signals for React

## Example

```tsx
import {
  createSignal,
  useSignal,
} from "@ryfylke-react/proxy-signal";

const counterSignal = createSignal(0);

export function App() {
  const count = useSignal(counterSignal);

  return (
    <button onClick={() => (count.value += 1)}>
      {count.value}
    </button>
  );
}
```

## Computed values

Subscribe to a computed signal value.

```tsx
const state = createSignal({
  search: "",
  count: 0,
});

export function CounterButton() {
  // Will only rerender if `prevState.count !== newState.count`
  const count = useComputed(state, ({ count }) => count);

  return (
    <button
      onClick={() => {
        // Should be a new reference when signal is an object
        state.value = {
          ...state.value,
          count: count + 1,
        };
      }}
    >
      {count}
    </button>
  );
}
```

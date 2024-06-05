# @ryfylke-react/proxy-signal

> Simple proxy signals for React

**This is not intended for real use**.
This was just a fun experiment for javascript proxies and creating a super simple (& naive) state library.
Use at your own risk.

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
        state.value.count += 1;
      }}
    >
      {count}
    </button>
  );
}
```

## Automatic effects

Create effects with automatic dependency detection.

```tsx
signalEffect(() => {
  console.log(
    "This will log anytime search changes: ",
    searchSignal.value
  );
});

// or tied to a component
function Counter() {
  useSignalEffect(() => {
    console.log(
      "This will log anytime search changes, while component is mounted: ",
      searchSignal.value
    );
  });
}
```

The effect will run once initially (twice in StrictMode) to catch dependencies.
If a dependency is conditionally accessed, it might not be picked up. To fix this,
just access any conditional dependencies at the top of the effect:

```tsx
signalEffect(() => {
  searchSignal.value;
  if (someCondition) {
    console.log(searchSignal.value);
  }
});
```

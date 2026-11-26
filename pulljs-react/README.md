# pulljs-react

Modern React + TypeScript port of [pulljs](https://github.com/stephenkingsley/pulljs) — a lightweight
pull-to-refresh library, rebuilt as a single container component with full API and behavior parity.

## Install & use

```tsx
import { PullToRefresh } from 'pulljs-react';

function Screen() {
  return (
    <PullToRefresh
      onRefresh={() => fetchLatest()}   // may return a Promise; resolves => indicator hides
      instructionsPullToRefresh="Pull to Refresh"
      instructionsReleaseToRefresh="Release to Refresh"
      instructionsRefreshing="Refreshing"
    >
      <YourScrollableContent />
    </PullToRefresh>
  );
}
```

Pull down at scroll top to trigger the refresh flow; the indicator resists, crosses the
threshold, pins at `distReload` while refreshing, then collapses.

## Props (1:1 mapping from pulljs options)

| pulljs option | React prop | Type | Default | Notes |
|---|---|---|---|---|
| distThreshold | `distThreshold` | number | 60 | minimum resisted distance to trigger refresh |
| distMax | `distMax` | number | 80 | max indicator distance |
| distReload | `distReload` | number | 50 | height while refreshing |
| mainElement | — (children) | ReactNode | — | content is wrapped by the component itself |
| triggerElement | — (container) | — | container | gesture must start inside the container |
| ptrElement | — (auto) | — | — | indicator DOM is rendered by the component |
| classPrefix | `classPrefix` | string | 'ptr--' | class prefix for generated classes |
| cssProp | — (internal) | — | min-height | indicator sized via inline `minHeight` |
| containerClassName | `containerClassName` | string | '' | |
| boxClassName | `boxClassName` | string | '' | |
| contentClassName | `contentClassName` | string | '' | |
| textClassName | `textClassName` | string | '' | |
| instructionsPullToRefresh | `instructionsPullToRefresh` | ReactNode | 'Pull down to refresh' | |
| instructionsReleaseToRefresh | `instructionsReleaseToRefresh` | ReactNode | 'Release to refresh' | |
| instructionsRefreshing | `instructionsRefreshing` | ReactNode | 'Refreshing' | |
| refreshTimeout | `refreshTimeout` | number | 500 | delay before onRefresh fires |
| onRefresh | `onRefresh` | (reset?) => void \| Promise | window.location.reload() | same callback/promise/arity rules |
| resistanceFunction | `resistanceFunction` | (t: number) => number | t => Math.min(1, t / 2.5) | |
| ptrOnDesktop | `ptrOnDesktop` | boolean | false | mouse support |
| onInit | `onInit` | () => void | noop | |
| — | `disabled` | boolean | false | new prop: turns the behavior off |
| — | `renderIndicator` | (props) => ReactNode | default indicator | custom indicator renderer |
| — | `className` / `style` | string / CSSProperties | — | outer wrapper styling |

## Ref handle

```tsx
const ref = useRef<PullToRefreshHandle>(null);
<PullToRefresh ref={ref}>...</PullToRefresh>
// ref.current.state, ref.current.distance, ref.current.reset()
```

## Hook

The underlying logic is exported for advanced composition:

```tsx
import { usePullToRefresh } from 'pulljs-react';
const ref = useRef<HTMLDivElement>(null);
const { state, distance, isReleasing, isRefreshing, reset } = usePullToRefresh(ref, { onRefresh });
```

## Develop

```bash
npm install
npm run dev        # demo app
npm run typecheck  # tsc --noEmit
npm run build      # demo build (tsc + vite) -> dist/
npm run build:lib  # library build -> dist-lib/
```

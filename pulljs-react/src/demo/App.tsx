import { useCallback, useState } from 'react';
import { PullToRefresh } from '../index';
import './demo.css';

const items = Array.from({ length: 30 }, (_, i) => `Row ${i + 1}`);

/**
 * Demo mirroring the original pulljs example: a top bar, some content, and
 * onRefresh that simulates an async refresh (original demo used alert()).
 * ptrOnDesktop is enabled so the behavior can be exercised with a mouse.
 */
export function App() {
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  const onRefresh = useCallback(() => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setLastRefreshedAt(new Date().toLocaleTimeString());
        resolve();
      }, 800);
    });
  }, []);

  return (
    <PullToRefresh
      onRefresh={onRefresh}
      instructionsPullToRefresh="Pull to Refresh"
      instructionsReleaseToRefresh="Release to Refresh"
      instructionsRefreshing="Refreshing"
      ptrOnDesktop
    >
      <div className="topbar">Pull.js</div>
      <div className="content">
        this is simple demo. try to pull the screen, and watch how awesome show.
      </div>
      <div className="content">
        how to use?
      </div>
      <pre className="content code">
{`import { PullToRefresh } from 'pulljs-react';

<PullToRefresh
  instructionsPullToRefresh="Pull to Refresh"
  instructionsReleaseToRefresh="Release to Refresh"
  instructionsRefreshing="Refreshing"
  onRefresh={() => alert('hello pulljs')}
  ptrOnDesktop
>
  {children}
</PullToRefresh>`}
      </pre>
      <div className="content status" data-testid="refresh-status">
        {lastRefreshedAt ? `Last refreshed at ${lastRefreshedAt}` : 'Not refreshed yet'}
      </div>
      {items.map((item) => (
        <div key={item} className="content row">
          {item}
        </div>
      ))}
    </PullToRefresh>
  );
}

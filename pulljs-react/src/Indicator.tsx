import type { CSSProperties, ReactNode } from 'react';
import type { PullState } from './usePullToRefresh';

export interface PullIndicatorProps {
  /** Current state machine state. */
  state: PullState;
  /** Current resisted distance in px (same value that sizes the indicator box). */
  distance: number;
  /** True once the release threshold has been crossed. */
  isReleasing: boolean;
  /** True while onRefresh is running. */
  isRefreshing: boolean;
}

export interface DefaultIndicatorProps extends PullIndicatorProps {
  classPrefix: string;
  instructionsPullToRefresh: ReactNode;
  instructionsReleaseToRefresh: ReactNode;
  instructionsRefreshing: ReactNode;
  boxClassName?: string;
  contentClassName?: string;
  textClassName?: string;
}

const transitionStyle: CSSProperties = {
  transition: 'height 0.3s, min-height 0.3s',
};

/**
 * Default indicator, mirroring the original pulljs DOM structure:
 *   .ptr--ptr > .ptr--box > .ptr--content > .ptr--text
 * with the same base styles (grey background, bold small text, flex
 * bottom-aligned, hidden overflow, 0.3s height transition).
 */
export function DefaultIndicator(props: DefaultIndicatorProps) {
  const {
    state,
    classPrefix,
    instructionsPullToRefresh,
    instructionsReleaseToRefresh,
    instructionsRefreshing,
    boxClassName,
    contentClassName,
    textClassName,
  } = props;

  let text: ReactNode = instructionsPullToRefresh;
  if (state === 'releasing') {
    text = instructionsReleaseToRefresh;
  } else if (state === 'refreshing') {
    text = instructionsRefreshing;
  }

  const boxClass = `${classPrefix}box${boxClassName ? ` ${boxClassName}` : ''}`;
  const contentClass = `${classPrefix}content${contentClassName ? ` ${contentClassName}` : ''}`;
  const textClass = `${classPrefix}text${textClassName ? ` ${textClassName}` : ''}`;

  return (
    <div
      className={boxClass}
      style={{
        padding: 10,
        flexBasis: '100%',
      }}
    >
      <div className={contentClass}>
        <div
          className={textClass}
          style={{
            // Original rotates the icon 180° in the release state via
            // `.ptr--release .ptr--icon { transform: rotate(180deg) }`.
            // The text itself is unchanged, so we keep it identical.
            display: 'inline-block',
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

export function indicatorContainerStyle(state: PullState): CSSProperties {
  return {
    background: '#E0E0E0',
    pointerEvents: 'none',
    fontSize: '0.85em',
    fontWeight: 'bold',
    top: 0,
    height: 0,
    ...transitionStyle,
    // Original `.ptr--pull { transition: none }` — while dragging, the
    // indicator tracks the finger with no transition lag.
    ...(state === 'pulling' || state === 'releasing' ? { transition: 'none' } : {}),
    textAlign: 'center',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'flex-end',
    alignContent: 'stretch',
  };
}

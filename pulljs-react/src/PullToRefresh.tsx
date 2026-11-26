import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { CSSProperties, ReactNode, Ref } from 'react';
import { usePullToRefresh } from './usePullToRefresh';
import type { PullState, UsePullToRefreshOptions } from './usePullToRefresh';
import { DefaultIndicator, indicatorContainerStyle } from './Indicator';
import type { PullIndicatorProps } from './Indicator';

export interface PullToRefreshProps extends UsePullToRefreshOptions {
  /** Scrollable content the pull-to-refresh behavior is attached to. */
  children?: ReactNode;
  /**
   * Custom indicator renderer. Receives the live state and distance.
   * Original equivalent: overriding the generated .ptr HTML.
   */
  renderIndicator?: (props: PullIndicatorProps) => ReactNode;
  /** The three instruction strings — original: instructionsPullToRefresh / instructionsReleaseToRefresh / instructionsRefreshing. */
  instructionsPullToRefresh?: ReactNode;
  instructionsReleaseToRefresh?: ReactNode;
  instructionsRefreshing?: ReactNode;
  /** Extra class for the indicator container. Original: containerClassName. */
  containerClassName?: string;
  /** Extra class for the indicator box. Original: boxClassName. */
  boxClassName?: string;
  /** Extra class for the indicator content wrapper. Original: contentClassName. */
  contentClassName?: string;
  /** Extra class for the indicator text node. Original: textClassName. */
  textClassName?: string;
  /** Class prefix used for generated indicator class names. Original: classPrefix. Default 'ptr--'. */
  classPrefix?: string;
  /** Extra className/style for the outer wrapper (the element children scroll inside). */
  className?: string;
  style?: CSSProperties;
}

export interface PullToRefreshHandle {
  /** Current state machine state. */
  state: PullState;
  /** Current resisted distance in px. */
  distance: number;
  /** Force the machine back to pending and collapse the indicator. */
  reset: () => void;
}

/**
 * Modern React port of pulljs: a container component providing pull-to-refresh
 * to its children. Wrap a scrollable view and pull down at scroll top to refresh.
 *
 * API parity with the original `Pull.init(options)` is 1:1 — see README's
 * mapping table. The original global CSS injection is replaced by scoped
 * inline styles so multiple instances cannot leak styles into each other.
 */
export const PullToRefresh = forwardRef<PullToRefreshHandle, PullToRefreshProps>(
  function PullToRefresh(props, ref: Ref<PullToRefreshHandle>) {
    const {
      children,
      renderIndicator,
      instructionsPullToRefresh = 'Pull down to refresh',
      instructionsReleaseToRefresh = 'Release to refresh',
      instructionsRefreshing = 'Refreshing',
      containerClassName,
      boxClassName,
      contentClassName,
      textClassName,
      classPrefix = 'ptr--',
      className,
      style,
      // hook options
      distThreshold,
      distMax,
      distReload,
      refreshTimeout,
      onRefresh,
      onInit,
      resistanceFunction,
      ptrOnDesktop,
      disabled,
    } = props;

    const containerRef = useRef<HTMLDivElement | null>(null);

    const { state, distance, isReleasing, isRefreshing, reset } = usePullToRefresh(containerRef, {
      distThreshold,
      distMax,
      distReload,
      refreshTimeout,
      onRefresh,
      onInit,
      resistanceFunction,
      ptrOnDesktop,
      disabled,
    });

    useImperativeHandle(
      ref,
      () => ({ state, distance, reset }),
      [state, distance, reset],
    );

    const indicatorProps: PullIndicatorProps = { state, distance, isReleasing, isRefreshing };

    const containerClass = [`${classPrefix}ptr`, containerClassName].filter(Boolean).join(' ');
    const stateClass =
      state === 'pulling'
        ? `${classPrefix}pull`
        : state === 'releasing'
          ? `${classPrefix}release`
          : state === 'refreshing'
            ? `${classPrefix}refresh`
            : '';

    return (
      <div className={className} ref={containerRef} style={style}>
        <div
          className={`${containerClass}${stateClass ? ` ${stateClass}` : ''}`}
          style={{ ...indicatorContainerStyle(state), minHeight: `${distance}px` }}
        >
          {renderIndicator ? (
            renderIndicator(indicatorProps)
          ) : (
            <DefaultIndicator
              {...indicatorProps}
              classPrefix={classPrefix}
              instructionsPullToRefresh={instructionsPullToRefresh}
              instructionsReleaseToRefresh={instructionsReleaseToRefresh}
              instructionsRefreshing={instructionsRefreshing}
              boxClassName={boxClassName}
              contentClassName={contentClassName}
              textClassName={textClassName}
            />
          )}
        </div>
        {children}
      </div>
    );
  },
);

export default PullToRefresh;

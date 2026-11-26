import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * State machine states, identical to the original pulljs `_state` values.
 * `pending`   — idle, no pull in progress (initial state)
 * `pulling`   — finger moved down past 0px at scroll top, below threshold
 * `releasing` — resisted distance exceeded distThreshold; releasing now refreshes
 * `refreshing`— onRefresh lifecycle is running; indicator pinned at distReload
 */
export type PullState = 'pending' | 'pulling' | 'releasing' | 'refreshing';

export interface UsePullToRefreshOptions {
  /** Minimum resisted distance (px) to trigger a refresh. Original: distThreshold. Default 60. */
  distThreshold?: number;
  /** Maximum distance (px) the indicator is allowed to reach. Original: distMax. Default 80. */
  distMax?: number;
  /**
   * Height (px) the indicator holds while refreshing after the threshold was reached
   * and the pointer was released. Original: distReload. Default 50.
   */
  distReload?: number;
  /**
   * Delay (ms) before onRefresh is invoked after release.
   * Original: refreshTimeout. Default 500.
   */
  refreshTimeout?: number;
  /**
   * Refresh callback. Parity rules with the original onRefresh:
   *  - may accept a `reset` callback parameter; calling it ends refreshing
   *  - may return a Promise; refreshing ends when it settles-resolves
   *  - if it takes no parameters and returns nothing, refresh resets immediately
   *  - if omitted entirely, the page reloads (window.location.reload())
   */
  onRefresh?: (reset?: () => void) => void | Promise<unknown>;
  /** Called once when the pull-to-refresh wiring is attached. Original: onInit. */
  onInit?: () => void;
  /**
   * Damping function applied to the raw pull ratio (dist / distThreshold).
   * Must return a number capped at 1. Original: resistanceFunction.
   * Default: (t) => Math.min(1, t / 2.5)
   */
  resistanceFunction?: (t: number) => number;
  /** Also respond to mouse events (mousedown/mousemove/mouseup). Original: ptrOnDesktop. Default false. */
  ptrOnDesktop?: boolean;
  /** Disable the pull-to-refresh behavior entirely (no state changes, no refresh). */
  disabled?: boolean;
}

export interface UsePullToRefreshResult {
  /** Current state machine state. */
  state: PullState;
  /** Current resisted indicator height in px (0 when idle). */
  distance: number;
  /** True while the `releasing` threshold has been crossed. */
  isReleasing: boolean;
  /** True while a refresh is in flight. */
  isRefreshing: boolean;
  /** Imperative escape hatch: force the machine back to pending and hide the indicator. */
  reset: () => void;
}

const noop = () => {};
// Default resistance must be a stable module-level reference: it is part of the
// effect dependency list, and an inline default would re-run the effect (and its
// listener/cleanup cycle) on every state update, cancelling the pending refresh timer.
const defaultResistanceFunction = (t: number) => Math.min(1, t / 2.5);

/**
 * Faithful React port of the pulljs touch state machine
 * (see pulljs src/index.js `_onTouchStart` / `_onTouchMove` / `_onTouchEnd`).
 *
 * Semantics preserved exactly:
 *  - a pull can only start when window.scrollY === 0 (scroll top)
 *  - pulls only count when the gesture started inside `triggerRef`
 *  - raw distance is damped: distResisted = resistanceFunction(dist / distThreshold) * Math.min(distMax, dist)
 *  - `releasing` is entered when distResisted > distThreshold and left when it drops back below
 *  - releasing the pointer in `releasing` state pins the indicator at distReload,
 *    waits refreshTimeout, then runs onRefresh with the original callback/promise/arity rules
 */
export function usePullToRefresh(
  containerRef: RefObject<HTMLElement | null>,
  options: UsePullToRefreshOptions = {},
): UsePullToRefreshResult {
  const {
    distThreshold = 60,
    distMax = 80,
    distReload = 50,
    refreshTimeout = 500,
    onRefresh,
    onInit = noop,
    resistanceFunction = defaultResistanceFunction,
    ptrOnDesktop = false,
    disabled = false,
  } = options;

  const [state, setState] = useState<PullState>('pending');
  const [distance, setDistance] = useState(0);

  // Mirrors of the mutable module-level variables in the original pulljs.
  const stateRef = useRef<PullState>('pending');
  const pullStartYRef = useRef<number | null>(null);
  const pullMoveYRef = useRef<number | null>(null);
  const distRef = useRef(0);
  const distResistedRef = useRef(0);
  const enableRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const setMachineState = useCallback((next: PullState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const setIndicator = useCallback((px: number) => {
    distResistedRef.current = px;
    setDistance(px);
  }, []);

  const reset = useCallback(() => {
    // Original onReset: remove refresh class, cssProp -> 0px, state -> pending.
    setIndicator(0);
    setMachineState('pending');
  }, [setIndicator, setMachineState]);

  useEffect(() => {
    // SSR-safe: nothing below runs during render, only after mount in the browser.
    if (typeof window === 'undefined') {
      return undefined;
    }
    if (disabled) {
      reset();
      return undefined;
    }

    const triggerEl = containerRef.current;

    const onTouchStart = (e: TouchEvent | MouseEvent) => {
      const screenY =
        'touches' in e && e.touches.length > 0 ? e.touches[0].screenY : (e as MouseEvent).screenY;

      if (ptrOnDesktop) {
        window.addEventListener('mousemove', onTouchMove, { passive: false });
      }

      if (!window.scrollY) {
        pullStartYRef.current = screenY;
      }

      if (stateRef.current !== 'pending') {
        return;
      }

      clearTimeout(timeoutRef.current);

      enableRef.current = !!triggerEl && triggerEl.contains(e.target as Node);
      stateRef.current = 'pending';
    };

    const onTouchMove = (e: TouchEvent | MouseEvent) => {
      const screenY =
        'touches' in e && e.touches.length > 0 ? e.touches[0].screenY : (e as MouseEvent).screenY;

      if (!pullStartYRef.current) {
        if (!window.scrollY) {
          pullStartYRef.current = screenY;
        }
      } else {
        pullMoveYRef.current = screenY;
      }

      if (!enableRef.current || stateRef.current === 'refreshing') {
        if (!window.scrollY && (pullStartYRef.current ?? 0) < (pullMoveYRef.current ?? 0)) {
          e.preventDefault();
        }
        return;
      }

      if (stateRef.current === 'pending') {
        setMachineState('pulling');
      }

      if (pullStartYRef.current && pullMoveYRef.current) {
        distRef.current = pullMoveYRef.current - pullStartYRef.current;
      }

      if (distRef.current > 0) {
        e.preventDefault();

        setIndicator(
          resistanceFunction(distRef.current / distThreshold) * Math.min(distMax, distRef.current),
        );

        if (stateRef.current === 'pulling' && distResistedRef.current > distThreshold) {
          setMachineState('releasing');
        }

        if (stateRef.current === 'releasing' && distResistedRef.current < distThreshold) {
          setMachineState('pulling');
        }
      }
    };

    const onTouchEnd = () => {
      if (stateRef.current === 'releasing' && distResistedRef.current > distThreshold) {
        setMachineState('refreshing');
        setIndicator(distReload);

        timeoutRef.current = setTimeout(() => {
          const retval = onRefresh ? onRefresh(reset) : window.location.reload();

          if (retval && typeof (retval as Promise<unknown>).then === 'function') {
            (retval as Promise<unknown>).then(() => reset());
          }

          if (!retval && onRefresh && onRefresh.length === 0) {
            reset();
          }
        }, refreshTimeout);
      } else {
        if (stateRef.current === 'refreshing') {
          return;
        }
        setIndicator(0);
        setMachineState('pending');
      }

      pullStartYRef.current = null;
      pullMoveYRef.current = null;
      distRef.current = 0;
      distResistedRef.current = 0;

      if (ptrOnDesktop) {
        window.removeEventListener('mousemove', onTouchMove);
      }
    };

    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    if (ptrOnDesktop) {
      window.addEventListener('mouseup', onTouchEnd);
      window.addEventListener('mousedown', onTouchStart);
      window.addEventListener('mousemove', onTouchMove, { passive: false });
    }

    onInit();

    return () => {
      // Original destroy(): remove all listeners, clear pending refresh timer,
      // reset state to pending so a remount starts clean.
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchmove', onTouchMove);

      if (ptrOnDesktop) {
        window.removeEventListener('mouseup', onTouchEnd);
        window.removeEventListener('mousedown', onTouchStart);
        window.removeEventListener('mousemove', onTouchMove);
      }

      clearTimeout(timeoutRef.current);
      stateRef.current = 'pending';
    };
  }, [
    containerRef,
    disabled,
    distMax,
    distReload,
    distThreshold,
    onInit,
    onRefresh,
    ptrOnDesktop,
    refreshTimeout,
    reset,
    resistanceFunction,
    setIndicator,
    setMachineState,
  ]);

  return {
    state,
    distance,
    isReleasing: state === 'releasing',
    isRefreshing: state === 'refreshing',
    reset,
  };
}

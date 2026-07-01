import { useState, useLayoutEffect, useRef, useCallback } from 'react';

const DEFAULT_GAP = 24;
const UPLOAD_BUTTON_WIDTH = 160;
const PROFILE_BUTTON_WIDTH = 48;

function measureTitleSingleLineWidth(titleEl) {
  const style = window.getComputedStyle(titleEl);
  const probe = document.createElement('span');
  probe.textContent = titleEl.textContent ?? '';
  probe.setAttribute('aria-hidden', 'true');
  Object.assign(probe.style, {
    position: 'absolute',
    visibility: 'hidden',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    height: '0',
    overflow: 'hidden',
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
  });
  document.body.appendChild(probe);
  const width = probe.getBoundingClientRect().width;
  document.body.removeChild(probe);
  return width;
}

// Move the search bar to its own row only when a single-line title would
// reach the action buttons — i.e. there is no horizontal gap left for search.
export function useHeaderSearchWrap({ headerRef, titleRef, gap = DEFAULT_GAP }) {
  const [searchOnOwnRow, setSearchOnOwnRow] = useState(false);
  const rafRef = useRef(0);

  const check = useCallback(() => {
    const header = headerRef.current;
    const title = titleRef.current;
    if (!header || !title) return;

    const headerWidth = header.clientWidth;
    const titleOneLineWidth = measureTitleSingleLineWidth(title);
    const actionsWidth = UPLOAD_BUTTON_WIDTH + gap + PROFILE_BUTTON_WIDTH;
    const titleReachesActions = titleOneLineWidth + gap + actionsWidth > headerWidth;

    setSearchOnOwnRow((prev) => (prev === titleReachesActions ? prev : titleReachesActions));
  }, [headerRef, titleRef, gap]);

  const scheduleCheck = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      check();
      // Re-measure once more after React applies the layout change.
      rafRef.current = requestAnimationFrame(check);
    });
  }, [check]);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const ro = new ResizeObserver(scheduleCheck);
    ro.observe(header);
    if (titleRef.current) ro.observe(titleRef.current);

    window.addEventListener('resize', scheduleCheck);
    window.visualViewport?.addEventListener('resize', scheduleCheck);

    if (document.fonts?.ready) {
      document.fonts.ready.then(scheduleCheck);
    }
    scheduleCheck();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener('resize', scheduleCheck);
      window.visualViewport?.removeEventListener('resize', scheduleCheck);
    };
  }, [headerRef, titleRef, scheduleCheck]);

  // Re-check after the stacked/inline layout switches.
  useLayoutEffect(() => {
    scheduleCheck();
  }, [searchOnOwnRow, scheduleCheck]);

  return searchOnOwnRow;
}

import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const VIEWPORT_MARGIN = 8;
const ANCHOR_GAP = 6;

/**
 * Renders a popover in a portal with fixed positioning so it is not clipped
 * by scroll containers (overflow: auto) in ancestor panels.
 */
export default function FloatingPopover({
  anchorRef,
  open,
  children,
  minWidth = 230,
  zIndex = 1100,
  onMouseDown,
  style: styleOverrides,
}) {
  const popoverRef = useRef(null);
  const [coords, setCoords] = useState(null);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return undefined;
    }

    const updatePosition = () => {
      const anchor = anchorRef?.current;
      if (!anchor) return;

      const anchorRect = anchor.getBoundingClientRect();
      const popRect = popoverRef.current?.getBoundingClientRect();
      const popWidth = Math.max(popRect?.width || minWidth, minWidth);
      const popHeight = popRect?.height || 0;

      let top = anchorRect.bottom + ANCHOR_GAP;
      let left = anchorRect.left;

      if (popHeight > 0 && top + popHeight > window.innerHeight - VIEWPORT_MARGIN) {
        const aboveTop = anchorRect.top - popHeight - ANCHOR_GAP;
        if (aboveTop >= VIEWPORT_MARGIN) top = aboveTop;
      }

      if (left + popWidth > window.innerWidth - VIEWPORT_MARGIN) {
        left = window.innerWidth - popWidth - VIEWPORT_MARGIN;
      }
      left = Math.max(VIEWPORT_MARGIN, left);
      top = Math.max(VIEWPORT_MARGIN, top);

      setCoords({ top, left });
    };

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, anchorRef, minWidth, children]);

  if (!open) return null;

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      onMouseDown={onMouseDown}
      style={{
        position: 'fixed',
        top: coords?.top ?? 0,
        left: coords?.left ?? 0,
        minWidth,
        zIndex,
        visibility: coords ? 'visible' : 'hidden',
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '10px',
        boxShadow: '0 6px 24px rgba(0,0,0,0.14)',
        padding: '12px',
        textAlign: 'left',
        cursor: 'default',
        fontWeight: 400,
        color: '#333',
        ...styleOverrides,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

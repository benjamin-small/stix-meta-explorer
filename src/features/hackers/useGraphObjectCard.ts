import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { GraphClient } from '@poietic-tech/graphing-library';

interface Preview { id: string; x: number; y: number; ids: string[] }
const LEAVE_GRACE_MS = 700;

export function useGraphObjectCard(client: GraphClient | null, host: RefObject<HTMLDivElement | null>, ids: string[]) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const active = useRef<string | null>(null);
  const shown = useRef<string | null>(null);
  const pointerInCard = useRef(false);
  const dismissed = useRef<string | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const focusTarget = useRef<HTMLDivElement | null>(null);
  const keepOpen = () => {
    clearTimeout(closeTimer.current);
    clearTimeout(openTimer.current);
    active.current = shown.current;
  };
  const dismiss = useCallback(() => {
    clearTimeout(openTimer.current); clearTimeout(closeTimer.current);
    dismissed.current = active.current;
    shown.current = null;
    pointerInCard.current = false;
    setPreview(null);
    if (document.activeElement?.closest('.graph-object-card')) focusTarget.current?.focus({ preventScroll: true });
  }, []);
  const leave = () => {
    // A portal can appear under the cursor. Its enter event may precede the
    // canvas leave event, so that later leave must not close a hovered card.
    if (pointerInCard.current || document.activeElement?.closest('.graph-object-card')) return;
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
    active.current = shown.current;
    dismissed.current = null;
    closeTimer.current = setTimeout(() => {
      active.current = null; shown.current = null; pointerInCard.current = false; setPreview(null);
    }, LEAVE_GRACE_MS);
  };

  useEffect(() => {
    const element = host.current;
    if (!client || !element) return;
    focusTarget.current = element;
    active.current = null; shown.current = null; dismissed.current = null;
    pointerInCard.current = false;
    const clear = () => {
      clearTimeout(openTimer.current); clearTimeout(closeTimer.current);
      active.current = null; shown.current = null; dismissed.current = null; pointerInCard.current = false; setPreview(null);
    };
    const show = (id: string, x: number, y: number, delay = 160) => {
      clearTimeout(closeTimer.current);
      if (active.current === id) return;
      clearTimeout(openTimer.current);
      active.current = id;
      if (dismissed.current === id) return;
      dismissed.current = null;
      openTimer.current = setTimeout(() => {
        shown.current = id;
        setPreview({ id, x, y, ids });
      }, delay);
    };
    const move = (event: PointerEvent) => {
      if (event.buttons || event.pointerType === 'touch') return;
      const canvas = element.querySelector('canvas');
      if (!canvas || event.target !== canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const hit = client.nodeAt((event.clientX - rect.left) * canvas.width / rect.width,
        (event.clientY - rect.top) * canvas.height / rect.height);
      if (hit?.kind === 'node' && ids.includes(hit.id)) show(hit.id, event.clientX, event.clientY);
      // Empty canvas is a safe bridge from a small/moving node to its card.
      // Cancel a pending replacement, but keep the displayed object readable.
      else { dismissed.current = null; keepOpen(); }
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { dismiss(); return; }
      if (event.target !== element || !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
      event.preventDefault();
      const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
      const index = ids.indexOf(active.current ?? '');
      const next = index < 0 ? (direction > 0 ? 0 : ids.length - 1) : (index + direction + ids.length) % ids.length;
      const id = ids[next];
      const rect = element.getBoundingClientRect();
      if (id) show(id, rect.left + rect.width / 2, Math.max(12, rect.top + 32), 0);
    };
    const scroll = (event: Event) => {
      if (!(event.target instanceof Element) || !event.target.closest('.graph-object-card')) clear();
    };
    const outside = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('.graph-object-card')) clear();
    };
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerenter', keepOpen);
    element.addEventListener('pointerleave', leave);
    document.addEventListener('pointerdown', outside);
    element.addEventListener('wheel', clear, { passive: true });
    document.addEventListener('keydown', key);
    document.addEventListener('scroll', scroll, true);
    window.addEventListener('resize', clear);
    return () => {
      focusTarget.current = null;
      clearTimeout(openTimer.current); clearTimeout(closeTimer.current);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerenter', keepOpen);
      element.removeEventListener('pointerleave', leave);
      document.removeEventListener('pointerdown', outside);
      element.removeEventListener('wheel', clear);
      document.removeEventListener('keydown', key);
      document.removeEventListener('scroll', scroll, true);
      window.removeEventListener('resize', clear);
    };
    // The node set scopes a preview to this scene/view. Event handlers use refs
    // so a popup render never tears down the canvas listeners.
  }, [client, host, ids, dismiss]);

  return {
    preview: preview?.ids === ids ? preview : null,
    keepOpen: () => { pointerInCard.current = true; keepOpen(); },
    leave: () => { pointerInCard.current = false; leave(); },
    dismiss,
  };
}


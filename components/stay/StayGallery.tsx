'use client';

import * as React from 'react';
import Image from 'next/image';

import { cn } from '@/lib/cn';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeImages(images: string[]) {
  const cleaned = (images ?? []).filter((src) => typeof src === 'string' && src.trim());
  return cleaned.length ? cleaned : ['/images/bg_1.jpg'];
}

type StayGalleryProps = {
  images: string[];
  alt: string;
};

export function StayGallery({ images, alt }: StayGalleryProps) {
  const allImages = React.useMemo(() => normalizeImages(images), [images]);

  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const pointers = React.useRef(new Map<number, { x: number; y: number }>());
  const dragStart = React.useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const pinchStart = React.useRef<{ distance: number; zoom: number } | null>(null);

  const resetView = React.useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    dragStart.current = null;
    pinchStart.current = null;
    pointers.current.clear();
  }, []);

  const close = React.useCallback(() => {
    setOpen(false);
    resetView();
  }, [resetView]);

  const openAt = React.useCallback(
    (idx: number) => {
      setIndex(clamp(idx, 0, allImages.length - 1));
      setOpen(true);
      resetView();
    },
    [allImages.length, resetView],
  );

  const go = React.useCallback(
    (dir: -1 | 1) => {
      setIndex((current) => {
        const next = (current + dir + allImages.length) % allImages.length;
        return next;
      });
      resetView();
    },
    [allImages.length, resetView],
  );

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close, go, open]);

  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const clampOffset = React.useCallback(
    (next: { x: number; y: number }, nextZoom: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return next;
      const maxX = ((nextZoom - 1) * rect.width) / 2;
      const maxY = ((nextZoom - 1) * rect.height) / 2;
      return { x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
    },
    [],
  );

  const setZoomSafe = React.useCallback(
    (nextZoom: number) => {
      const z = clamp(nextZoom, 1, 4);
      setZoom(z);
      setOffset((current) => (z === 1 ? { x: 0, y: 0 } : clampOffset(current, z)));
    },
    [clampOffset],
  );

  const onWheel = (e: React.WheelEvent) => {
    if (!open) return;
    e.preventDefault();
    const delta = e.deltaY;
    const step = delta > 0 ? -0.15 : 0.15;
    setZoomSafe(zoom + step);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!open) return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1 && zoom > 1) {
      dragStart.current = { x: e.clientX, y: e.clientY, offsetX: offset.x, offsetY: offset.y };
    }

    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      pinchStart.current = { distance: Math.hypot(dx, dy), zoom };
      dragStart.current = null;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!open) return;
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = Array.from(pointers.current.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const distance = Math.hypot(dx, dy);
      const ratio = pinchStart.current.distance ? distance / pinchStart.current.distance : 1;
      setZoomSafe(pinchStart.current.zoom * ratio);
      return;
    }

    if (pointers.current.size === 1 && dragStart.current && zoom > 1) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const next = clampOffset({ x: dragStart.current.offsetX + dx, y: dragStart.current.offsetY + dy }, zoom);
      setOffset(next);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!open) return;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) dragStart.current = null;
  };

  const onDoubleClick = () => {
    if (!open) return;
    if (zoom > 1) {
      resetView();
      return;
    }
    setZoomSafe(2);
  };

  return (
    <>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={() => openAt(0)}
          className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 md:col-span-2 md:aspect-[16/10]"
          aria-label={`Open image 1 of ${allImages.length}`}
        >
          <Image
            src={allImages[0]!}
            alt={alt}
            fill
            sizes="(min-width: 768px) 66vw, 100vw"
            className="object-cover transition group-hover:scale-[1.02]"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        </button>

        <div className="grid gap-4">
          {(allImages.slice(1, 3) ?? []).map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => openAt(i + 1)}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100"
              aria-label={`Open image ${i + 2} of ${allImages.length}`}
            >
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover transition group-hover:scale-[1.02]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6" role="dialog" aria-modal="true">
          <button
            type="button"
            onClick={close}
            className="absolute right-3 top-3 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/15 hover:bg-white/15 sm:right-6 sm:top-6"
          >
            Close
          </button>

          <div className="w-full max-w-5xl">
            <div className="mb-3 flex items-center justify-between gap-3 text-xs text-white/80">
              <div className="font-semibold">
                {index + 1} / {allImages.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomSafe(zoom - 0.25)}
                  disabled={zoom <= 1}
                  className="rounded-lg bg-white/10 px-2 py-1 font-semibold ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-60"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={resetView}
                  className="rounded-lg bg-white/10 px-2 py-1 font-semibold ring-1 ring-white/15 hover:bg-white/15"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setZoomSafe(zoom + 0.25)}
                  className="rounded-lg bg-white/10 px-2 py-1 font-semibold ring-1 ring-white/15 hover:bg-white/15"
                >
                  +
                </button>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-black">
              <div
                ref={containerRef}
                className="relative h-[70vh] w-full touch-none select-none"
                onWheel={onWheel}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onDoubleClick={onDoubleClick}
              >
                <Image
                  src={allImages[index]!}
                  alt={alt}
                  fill
                  sizes="100vw"
                  className={cn(
                    'object-contain transition-transform duration-75',
                    zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in',
                  )}
                  style={{
                    transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
                  }}
                />
              </div>

              {allImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/15"
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/15"
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              ) : null}
            </div>

            <div className="mt-3 text-center text-xs text-white/70">
              Tip: Scroll or pinch to zoom. Drag to pan when zoomed in.
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}


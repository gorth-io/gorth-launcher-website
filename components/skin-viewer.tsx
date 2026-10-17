import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@gorth/primitive/custom/button";
import { RotateCcw, ZoomIn, ZoomOut } from "@gorth/primitive/cores/lucide";
import { Spinner } from "@gorth/primitive/pattern/spinner";
import { skinParts, skinFaces } from "@/utils/skin-model";

export function SkinViewer({
  src,
  model = "classic",
  name = "Minecraft skin",
}: {
  src: string;
  model?: "classic" | "slim";
  name?: string;
}) {
  const [texture, setTexture] = useState<{
    src: string;
    height: number;
  } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [rotation, setRotation] = useState({ x: -12, y: 25 });
  const [zoom, setZoom] = useState(7);
  const pointer = useRef<{
    id: number;
    x: number;
    y: number;
    rx: number;
    ry: number;
  } | null>(null);
  const help = useId();
  useEffect(() => {
    let active = true;
    const image = new window.Image();
    image.onload = () => {
      if (!active) return;
      if (
        image.naturalWidth !== 64 ||
        ![32, 64].includes(image.naturalHeight)
      ) {
        setFailed(src);
        return;
      }
      setTexture({ src, height: image.naturalHeight });
      setFailed(null);
    };
    image.onerror = () => {
      if (active) setFailed(src);
    };
    image.src = src;
    return () => {
      active = false;
      image.onload = null;
      image.onerror = null;
    };
  }, [src]);
  const ready = texture?.src === src && failed !== src;
  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-roledescription="interactive 3D skin preview"
        aria-label={name}
        aria-describedby={help}
        tabIndex={0}
        className="relative flex h-80 touch-none select-none items-center justify-center overflow-hidden rounded-lg border bg-muted/20 outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-grab active:cursor-grabbing"
        style={{ perspective: 800 }}
        onPointerDown={(event) => {
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          pointer.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            rx: rotation.x,
            ry: rotation.y,
          };
        }}
        onPointerMove={(event) => {
          const start = pointer.current;
          if (start?.id === event.pointerId)
            setRotation({
              x: Math.max(
                -80,
                Math.min(80, start.rx - (event.clientY - start.y) * 0.5),
              ),
              y: start.ry + (event.clientX - start.x) * 0.6,
            });
        }}
        onPointerUp={(event) => {
          if (pointer.current?.id === event.pointerId) pointer.current = null;
        }}
        onPointerCancel={() => {
          pointer.current = null;
        }}
        onDoubleClick={() => setRotation({ x: -12, y: 25 })}
        onKeyDown={(event) => {
          if (
            [
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "Home",
            ].includes(event.key)
          ) {
            event.preventDefault();
            setRotation((current) =>
              event.key === "Home"
                ? { x: -12, y: 25 }
                : {
                    x: Math.max(
                      -80,
                      Math.min(
                        80,
                        current.x +
                          (event.key === "ArrowUp"
                            ? -10
                            : event.key === "ArrowDown"
                              ? 10
                              : 0),
                      ),
                    ),
                    y:
                      current.y +
                      (event.key === "ArrowLeft"
                        ? -15
                        : event.key === "ArrowRight"
                          ? 15
                          : 0),
                  },
            );
          }
        }}
      >
        {ready ? (
          <div
            aria-hidden
            className="relative"
            style={{
              transformStyle: "preserve-3d",
              transform:
                "rotateX(" +
                rotation.x +
                "deg) rotateY(" +
                rotation.y +
                "deg) scale3d(" +
                [zoom, zoom, zoom].join(",") +
                ")",
            }}
          >
            {skinParts(model === "slim", texture.height === 32).map((part) => (
              <div
                key={part.name}
                data-part={part.name}
                className="absolute"
                style={{
                  transformStyle: "preserve-3d",
                  transform:
                    "translate3d(" +
                    part.x +
                    "px," +
                    part.y +
                    "px,0) scale3d(" +
                    Array(3)
                      .fill(part.overlay ? 1.045 : 1)
                      .join(",") +
                    ")" +
                    (part.mirror ? " scaleX(-1)" : ""),
                }}
              >
                {skinFaces(part).map((face) => (
                  <div
                    key={face.name}
                    className="absolute"
                    style={{
                      width: face.w,
                      height: face.h,
                      left: -face.w / 2,
                      top: -face.h / 2,
                      backfaceVisibility: "hidden",
                      imageRendering: "pixelated",
                      backgroundImage: "url(" + JSON.stringify(src) + ")",
                      backgroundSize: "64px " + texture.height + "px",
                      backgroundPosition: "-" + face.u + "px -" + face.v + "px",
                      transform: face.transform,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : failed === src ? (
          <p
            role="alert"
            className="px-6 text-center text-sm text-muted-foreground"
          >
            Unable to load this skin preview. Retry or download its PNG.
          </p>
        ) : (
          <Spinner variant="infinite" className="size-8" />
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p id={help} className="text-xs text-muted-foreground">
          Drag to rotate · Arrow keys to turn · Home to reset
        </p>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zoom out"
            disabled={zoom <= 4}
            onClick={() => setZoom((value) => Math.max(4, value - 1))}
          >
            <ZoomOut />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Zoom in"
            disabled={zoom >= 9}
            onClick={() => setZoom((value) => Math.min(9, value + 1))}
          >
            <ZoomIn />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Reset skin rotation"
            onClick={() => {
              setRotation({ x: -12, y: 25 });
              setZoom(7);
            }}
          >
            <RotateCcw />
          </Button>
        </div>
      </div>
    </div>
  );
}

export interface SkinPart {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  d: number;
  u: number;
  v: number;
  overlay?: boolean;
  mirror?: boolean;
}
export function skinParts(slim: boolean, legacy: boolean): SkinPart[] {
  const arm = slim ? 3 : 4;
  const parts: SkinPart[] = [
    { name: "head", x: 0, y: -12, w: 8, h: 8, d: 8, u: 0, v: 0 },
    { name: "hat", x: 0, y: -12, w: 8, h: 8, d: 8, u: 32, v: 0, overlay: true },
    { name: "body", x: 0, y: -2, w: 8, h: 12, d: 4, u: 16, v: 16 },
    {
      name: "right-arm",
      x: -(4 + arm / 2),
      y: -2,
      w: arm,
      h: 12,
      d: 4,
      u: 40,
      v: 16,
    },
    {
      name: "left-arm",
      x: 4 + arm / 2,
      y: -2,
      w: arm,
      h: 12,
      d: 4,
      u: legacy ? 40 : 32,
      v: legacy ? 16 : 48,
      mirror: legacy,
    },
    { name: "right-leg", x: -2, y: 10, w: 4, h: 12, d: 4, u: 0, v: 16 },
    {
      name: "left-leg",
      x: 2,
      y: 10,
      w: 4,
      h: 12,
      d: 4,
      u: legacy ? 0 : 16,
      v: legacy ? 16 : 48,
      mirror: legacy,
    },
  ];
  if (!legacy)
    parts.push(
      {
        name: "jacket",
        x: 0,
        y: -2,
        w: 8,
        h: 12,
        d: 4,
        u: 16,
        v: 32,
        overlay: true,
      },
      {
        name: "right-sleeve",
        x: -(4 + arm / 2),
        y: -2,
        w: arm,
        h: 12,
        d: 4,
        u: 40,
        v: 32,
        overlay: true,
      },
      {
        name: "left-sleeve",
        x: 4 + arm / 2,
        y: -2,
        w: arm,
        h: 12,
        d: 4,
        u: 48,
        v: 48,
        overlay: true,
      },
      {
        name: "right-trouser",
        x: -2,
        y: 10,
        w: 4,
        h: 12,
        d: 4,
        u: 0,
        v: 32,
        overlay: true,
      },
      {
        name: "left-trouser",
        x: 2,
        y: 10,
        w: 4,
        h: 12,
        d: 4,
        u: 0,
        v: 48,
        overlay: true,
      },
    );
  return parts;
}
export function skinFaces({ w, h, d, u, v }: SkinPart) {
  return [
    {
      name: "front",
      w,
      h,
      u: u + d,
      v: v + d,
      transform: "translateZ(" + d / 2 + "px)",
    },
    {
      name: "back",
      w,
      h,
      u: u + d + w + d,
      v: v + d,
      transform: "rotateY(180deg) translateZ(" + d / 2 + "px)",
    },
    {
      name: "right",
      w: d,
      h,
      u,
      v: v + d,
      transform: "rotateY(-90deg) translateZ(" + w / 2 + "px)",
    },
    {
      name: "left",
      w: d,
      h,
      u: u + d + w,
      v: v + d,
      transform: "rotateY(90deg) translateZ(" + w / 2 + "px)",
    },
    {
      name: "top",
      w,
      h: d,
      u: u + d,
      v,
      transform: "rotateX(90deg) translateZ(" + h / 2 + "px)",
    },
    {
      name: "bottom",
      w,
      h: d,
      u: u + d + w,
      v,
      transform: "rotateX(-90deg) translateZ(" + h / 2 + "px)",
    },
  ];
}

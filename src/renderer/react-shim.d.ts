// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

/**
 * The approved Phase 1 package set intentionally excludes external React type
 * packages. This narrow declaration covers only the bundled React APIs used by
 * the two local renderers; it grants no runtime capability.
 */
declare namespace React {
  namespace JSX {
    interface Element {}
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: Record<string, unknown>;
  }
}

declare module "react" {
  export interface MutableRefObject<T> {
    current: T;
  }

  export function useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  export function useRef<T>(initialValue: T | null): MutableRefObject<T | null>;
  export function useState<T>(initialValue?: T): [T, (value: T) => void];
}

declare module "react/jsx-runtime" {
  export function jsx(type: unknown, props: unknown, key?: unknown): React.JSX.Element;
  export function jsxs(type: unknown, props: unknown, key?: unknown): React.JSX.Element;
  export const Fragment: unknown;
}

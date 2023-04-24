import { CSSProperties } from 'react';

export type PropsWithClassName<P = unknown> = P & { className?: string };

export type PropsWithCSSStyle<P = unknown> = P & { style?: CSSProperties };

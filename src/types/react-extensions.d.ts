import 'react';

declare module 'react' {
  export type FC<P = {}> = React.FunctionComponent<P>;
  export type ReactNode = React.ReactNode;
  export type HTMLAttributes<T> = React.HTMLAttributes<T>;
  export type ButtonHTMLAttributes<T> = React.ButtonHTMLAttributes<T>;
  export type DetailedHTMLProps<E extends React.HTMLAttributes<T>, T> = React.DetailedHTMLProps<E, T>;
  export type CSSProperties = React.CSSProperties;
  export type RefObject<T> = React.RefObject<T>;
  export type Ref<T> = React.Ref<T>;
  export type PropsWithChildren<P> = P & { children?: ReactNode };
}

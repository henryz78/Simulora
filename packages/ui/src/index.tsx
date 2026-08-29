import type { ButtonHTMLAttributes, PropsWithChildren, ReactElement } from "react";

export function FoundationButton({
  children,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>): ReactElement {
  return (
    <button type="button" {...props}>
      {children}
    </button>
  );
}

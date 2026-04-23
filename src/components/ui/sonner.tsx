import { Toaster as SonnerToaster } from "sonner";
import type { ComponentProps } from "react";

type SonnerProps = ComponentProps<typeof SonnerToaster>;

export function Toaster(props: SonnerProps) {
  return <SonnerToaster {...props} />;
}

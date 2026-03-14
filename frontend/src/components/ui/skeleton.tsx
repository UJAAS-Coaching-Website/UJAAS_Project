import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("ujaas-skeleton rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };

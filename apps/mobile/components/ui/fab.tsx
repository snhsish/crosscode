import { THEME } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { Platform, Pressable } from "react-native";

const fabVariants = cva(
  cn(
    "shrink-0 flex-row items-center justify-center rounded-full shadow-lg shadow-black/30",
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none",
    })
  ),
  {
    variants: {
      variant: {
        default: cn(
          "bg-primary active:bg-primary/90",
          Platform.select({ web: "hover:bg-primary/90" })
        ),
        secondary: cn(
          "bg-secondary active:bg-secondary/80",
          Platform.select({ web: "hover:bg-secondary/80" })
        ),
      },
      size: {
        default: "h-20 w-20",
        sm: "h-12 w-12",
        lg: "h-16 w-16",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type FabProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof fabVariants> & {
    icon: LucideIcon;
  };

function Fab({ className, variant, size, icon: Icon, ...props }: FabProps) {
  const { colorScheme } = useColorScheme()
  const theme = colorScheme ?? "dark"
  const iconColor = variant === "secondary"
    ? THEME[theme].secondaryForeground
    : THEME[theme].primaryForeground

  return (
    <Pressable
      className={cn(
        fabVariants({ variant, size }),
        props.disabled && "opacity-50",
        className
      )}
      role="button"
      {...props}
    >
      <Icon size={30} color={iconColor} />
    </Pressable>
  );
}

export { Fab, fabVariants };

"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ theme: propsTheme, ...props }: ToasterProps) => {
  // Detect dark mode from the DOM — works with the existing .dark class + theme-* system
  const theme = propsTheme || (typeof document !== "undefined" && document.documentElement.classList.contains("dark")
    ? "dark"
    : "light")

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast glass-overlay-panel group-[.toaster]:text-[var(--text-main)] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

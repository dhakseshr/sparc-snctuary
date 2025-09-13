import { cn } from "@/lib/utils";

export function TurtlemintLogo({ className }: { className?: string }) {
  // Stylized turtle mark (clean, minimalist). Uses currentColor for fill.
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-label="Turtlemint logo"
    >
      <g fill="currentColor">
        <path d="M32 14c-9.389 0-17 6.716-17 15 0 8.284 7.611 15 17 15s17-6.716 17-15c0-8.284-7.611-15-17-15zm0 6c6.627 0 12 4.477 12 9s-5.373 9-12 9-12-4.477-12-9 5.373-9 12-9z"/>
        <path d="M19 30c-2.8-1.2-6.5-1.2-9.5 1.5-.8.7-1.9.7-2.7-.1-.8-.8-.8-2.1.1-2.9C10.2 24 15.2 24 19 25.7V30z"/>
        <path d="M45 30c2.8-1.2 6.5-1.2 9.5 1.5.8.7 1.9.7 2.7-.1.8-.8.8-2.1-.1-2.9-3.3-3.6-8.3-3.6-12.1-1.9V30z"/>
        <path d="M26 42.5c-1.1 2.7-3.4 5.3-6.7 6.7-1 .4-2.1-.1-2.5-1.1-.4-1 .1-2.1 1.1-2.5 2.2-.9 3.8-2.6 4.6-4.4h3.5z"/>
        <path d="M38 42.5c1.1 2.7 3.4 5.3 6.7 6.7 1 .4 2.1-.1 2.5-1.1.4-1-.1-2.1-1.1-2.5-2.2-.9-3.8-2.6-4.6-4.4H38z"/>
      </g>
    </svg>
  );
}

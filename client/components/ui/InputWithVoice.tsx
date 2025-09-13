import * as React from "react";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface InputWithVoiceProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onVoiceClick?: () => void;
}

const InputWithVoice = React.forwardRef<HTMLInputElement, InputWithVoiceProps>(
  ({ className, type, onVoiceClick, ...props }, ref) => {
    
    const handleVoiceClick = () => {
      if (onVoiceClick) {
        onVoiceClick();
      } else {
        toast.info("Voice input for this field is coming soon!");
      }
    };

    return (
      <div className="relative flex w-full items-center">
        <Input
          type={type}
          className={cn("pr-10", className)} // Add padding to the right for the icon
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleVoiceClick}
        >
          <Mic className="h-4 w-4" />
          <span className="sr-only">Use Voice</span>
        </Button>
      </div>
    );
  },
);
InputWithVoice.displayName = "InputWithVoice";

export { InputWithVoice };
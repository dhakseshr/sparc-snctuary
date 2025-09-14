import * as React from "react";
import { cn } from "@/lib/utils";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { Mic } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  voiceEnabled?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, voiceEnabled, ...props }, ref) => {
    const handleTranscript = (transcript: string) => {
      if (props.onChange) {
        const event = {
          target: { value: transcript },
        } as React.ChangeEvent<HTMLInputElement>;
        props.onChange(event);
      }
    };

    const { isListening, toggleListening } = useVoiceRecognition(handleTranscript);
    
    return (
      <div className="relative w-full">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            voiceEnabled && "pr-10",
            className,
          )}
          ref={ref}
          {...props}
        />
        {voiceEnabled && (
          <button
            type="button"
            onClick={toggleListening}
            className={cn(
              "absolute inset-y-0 right-0 flex items-center pr-3",
              isListening ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Mic className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
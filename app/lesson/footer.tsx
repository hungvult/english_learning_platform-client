import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useKey, useMedia } from "react-use";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FooterProps = {
  onCheck: () => void;
  status: "correct" | "wrong" | "none" | "completed" | "skipped";
  disabled?: boolean;
  lessonId?: number;
  correctAnswerText?: string;
  onIgnore?: () => void;
  ignoreLabel?: string;
  skippedMessage?: string;
};

export const Footer = ({
  onCheck,
  status,
  disabled,
  lessonId,
  correctAnswerText,
  onIgnore,
  ignoreLabel,
  skippedMessage,
}: FooterProps) => {
  useKey("Enter", onCheck, {}, [onCheck]);
  const isMobile = useMedia("(max-width: 1024px)", false); // Provide a default for SSR
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const buttonSize = mounted && isMobile ? "sm" : "lg";

  return (
    <footer
      className={cn(
        "h-[100px] border-t-2 lg:h-[140px]",
        status === "correct" && "border-transparent bg-green-100",
        status === "wrong" && "border-transparent bg-rose-100",
        status === "skipped" && "border-transparent bg-yellow-100"
      )}
    >
      <div className="mx-auto flex h-full max-w-[1140px] items-center justify-between px-6 lg:px-10">
        
        {/* Left section for correct/wrong/completed status */}
        <div className="flex flex-col">
          {status === "correct" && (
            <div className="flex items-center text-base font-bold text-green-500 lg:text-2xl">
              <CheckCircle className="mr-4 h-6 w-6 lg:h-10 lg:w-10" />
              Nicely done!
            </div>
          )}

          {status === "skipped" && (
            <div className="flex items-center text-base font-bold text-yellow-600 lg:text-2xl">
              <AlertTriangle className="mr-4 h-6 w-6 lg:h-10 lg:w-10" />
              {skippedMessage || "Exercise skipped for 15 minutes."}
            </div>
          )}

          {status === "wrong" && (
            <div className="flex flex-col text-base font-bold text-rose-500 lg:text-2xl">
              <div className="flex items-center">
                <XCircle className="mr-4 h-6 w-6 lg:h-10 lg:w-10" />
                Try again.
              </div>
              {correctAnswerText && (
                <div className="mt-2 text-sm font-medium text-rose-500/80 lg:text-base lg:ml-14">
                  Correct solution: <span className="font-bold text-rose-500">{correctAnswerText}</span>
                </div>
              )}
            </div>
          )}

          {status === "completed" && (
            <Button
              variant="default"
              size={buttonSize}
              onClick={() => (window.location.href = `/lesson/${lessonId}`)}
            >
              Practice again
            </Button>
          )}

          {/* Render Ignore Button if status is none (user is deciding) and the prop is passed */}
          {status === "none" && onIgnore && ignoreLabel && (
            <Button
              variant="ghost"
              size={buttonSize}
              onClick={onIgnore}
              className="font-bold text-slate-500 hover:text-slate-400"
            >
              {ignoreLabel}
            </Button>
          )}
        </div>

        <Button
          disabled={disabled}
          aria-disabled={disabled}
          className="ml-auto"
          onClick={onCheck}
          size={buttonSize}
          variant={status === "wrong" ? "danger" : "secondary"}
        >
          {status === "none" && "Check"}
          {(status === "correct" || status === "skipped") && "Next"}
          {status === "wrong" && "Retry"}
          {status === "completed" && "Continue"}
        </Button>
      </div>
    </footer>
  );
};

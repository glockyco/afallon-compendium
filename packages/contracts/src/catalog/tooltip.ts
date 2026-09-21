export type TooltipTone = "positive" | "info" | "effect" | "muted" | "damage" | "negative" | "control" | "description";

export interface TooltipSpan {
  text: string;
  tone: TooltipTone | null;
  italic: boolean;
}

export interface TooltipLine {
  spans: TooltipSpan[];
}

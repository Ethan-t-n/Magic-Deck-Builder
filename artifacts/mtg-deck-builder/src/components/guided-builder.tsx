import { useState } from "react";
import { ArrowLeft, ChevronRight, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GuidedBuilderProps {
  onBuild: (prompt: string) => void;
  disabled?: boolean;
}

type StepId = "numColors" | "oneColor" | "twoColors" | "threeColors" | "moreColors" | "format" | "strategy" | "theme" | "confirm";

interface Step {
  id: StepId;
  question: string;
  subtitle?: string;
  options: { label: string; value: string; emoji?: string; next: StepId | null }[];
}

const COLOR_EMOJIS: Record<string, string> = {
  White: "☀️", Blue: "💧", Black: "💀", Red: "🔥", Green: "🌿",
};

const STEPS: Record<StepId, Step> = {
  numColors: {
    id: "numColors",
    question: "How many colors?",
    subtitle: "Choose the color identity for your deck",
    options: [
      { label: "One color", value: "one", next: "oneColor" },
      { label: "Two colors", value: "two", next: "twoColors" },
      { label: "Three colors", value: "three", next: "threeColors" },
      { label: "Four or five colors", value: "more", next: "moreColors" },
      { label: "Colorless", value: "Colorless", next: "format" },
    ],
  },
  oneColor: {
    id: "oneColor",
    question: "Which color?",
    subtitle: "Pick a single color for a focused mono-colored deck",
    options: [
      { label: "White", value: "White", emoji: "☀️", next: "format" },
      { label: "Blue", value: "Blue", emoji: "💧", next: "format" },
      { label: "Black", value: "Black", emoji: "💀", next: "format" },
      { label: "Red", value: "Red", emoji: "🔥", next: "format" },
      { label: "Green", value: "Green", emoji: "🌿", next: "format" },
    ],
  },
  twoColors: {
    id: "twoColors",
    question: "Which two colors?",
    subtitle: "Each pair has a classic MTG guild name",
    options: [
      { label: "Azorius — White/Blue", value: "White/Blue (Azorius)", next: "format" },
      { label: "Dimir — Blue/Black", value: "Blue/Black (Dimir)", next: "format" },
      { label: "Rakdos — Black/Red", value: "Black/Red (Rakdos)", next: "format" },
      { label: "Gruul — Red/Green", value: "Red/Green (Gruul)", next: "format" },
      { label: "Selesnya — Green/White", value: "Green/White (Selesnya)", next: "format" },
      { label: "Orzhov — White/Black", value: "White/Black (Orzhov)", next: "format" },
      { label: "Izzet — Blue/Red", value: "Blue/Red (Izzet)", next: "format" },
      { label: "Golgari — Black/Green", value: "Black/Green (Golgari)", next: "format" },
      { label: "Boros — Red/White", value: "Red/White (Boros)", next: "format" },
      { label: "Simic — Green/Blue", value: "Green/Blue (Simic)", next: "format" },
    ],
  },
  threeColors: {
    id: "threeColors",
    question: "Which three colors?",
    subtitle: "Choose a shard or wedge combination",
    options: [
      { label: "Bant — Green/White/Blue", value: "Green/White/Blue (Bant)", next: "format" },
      { label: "Esper — White/Blue/Black", value: "White/Blue/Black (Esper)", next: "format" },
      { label: "Grixis — Blue/Black/Red", value: "Blue/Black/Red (Grixis)", next: "format" },
      { label: "Jund — Black/Red/Green", value: "Black/Red/Green (Jund)", next: "format" },
      { label: "Naya — Red/Green/White", value: "Red/Green/White (Naya)", next: "format" },
      { label: "Mardu — Red/White/Black", value: "Red/White/Black (Mardu)", next: "format" },
      { label: "Temur — Green/Blue/Red", value: "Green/Blue/Red (Temur)", next: "format" },
      { label: "Abzan — White/Black/Green", value: "White/Black/Green (Abzan)", next: "format" },
      { label: "Jeskai — Blue/Red/White", value: "Blue/Red/White (Jeskai)", next: "format" },
      { label: "Sultai — Black/Green/Blue", value: "Black/Green/Blue (Sultai)", next: "format" },
    ],
  },
  moreColors: {
    id: "moreColors",
    question: "Which colors?",
    options: [
      { label: "Yore-Tiller — WUBR (no Green)", value: "White/Blue/Black/Red", next: "format" },
      { label: "Glint-Eye — UBRG (no White)", value: "Blue/Black/Red/Green", next: "format" },
      { label: "Dune-Brood — BRGW (no Blue)", value: "Black/Red/Green/White", next: "format" },
      { label: "Ink-Treader — RGWU (no Black)", value: "Red/Green/White/Blue", next: "format" },
      { label: "Witch-Maw — GWUB (no Red)", value: "Green/White/Blue/Black", next: "format" },
      { label: "Five Colors — WUBRG", value: "Five Color (WUBRG)", next: "format" },
    ],
  },
  format: {
    id: "format",
    question: "What format?",
    subtitle: "Determines which cards are legal to use",
    options: [
      { label: "Standard", value: "Standard", next: "strategy" },
      { label: "Modern", value: "Modern", next: "strategy" },
      { label: "Pioneer", value: "Pioneer", next: "strategy" },
      { label: "Commander (EDH)", value: "Commander", next: "strategy" },
      { label: "Legacy", value: "Legacy", next: "strategy" },
      { label: "Casual / No restrictions", value: "Casual", next: "strategy" },
    ],
  },
  strategy: {
    id: "strategy",
    question: "What's your strategy?",
    subtitle: "How do you want to win?",
    options: [
      { label: "Aggressive — Go fast, deal damage early", value: "Aggressive (Aggro)", next: "theme" },
      { label: "Midrange — Powerful threats at every curve", value: "Midrange", next: "theme" },
      { label: "Control — Counter, remove, dominate late game", value: "Control", next: "theme" },
      { label: "Combo — Execute a game-winning combo", value: "Combo", next: "theme" },
      { label: "Ramp — Big mana, cast huge threats", value: "Ramp", next: "theme" },
      { label: "Tribal — Build around a creature type", value: "Tribal", next: "theme" },
      { label: "Tokens — Swarm with many small creatures", value: "Tokens", next: "theme" },
      { label: "Reanimator — Cheat big creatures from the graveyard", value: "Reanimator", next: "theme" },
    ],
  },
  theme: {
    id: "theme",
    question: "Any specific theme or tribe?",
    subtitle: "Optional — adds flavor and focus to your deck",
    options: [
      { label: "Dragons 🐉", value: "Dragons", next: "confirm" },
      { label: "Goblins", value: "Goblins", next: "confirm" },
      { label: "Elves", value: "Elves", next: "confirm" },
      { label: "Zombies", value: "Zombies", next: "confirm" },
      { label: "Angels", value: "Angels", next: "confirm" },
      { label: "Humans", value: "Humans", next: "confirm" },
      { label: "Vampires", value: "Vampires", next: "confirm" },
      { label: "Merfolk", value: "Merfolk", next: "confirm" },
      { label: "Artifacts", value: "Artifacts", next: "confirm" },
      { label: "No theme — keep it flexible", value: null as unknown as string, next: "confirm" },
    ],
  },
  confirm: {
    id: "confirm",
    question: "",
    options: [],
  },
};

interface Selections {
  colors?: string;
  format?: string;
  strategy?: string;
  theme?: string | null;
}

function OptionButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary/60 hover:border-primary/40 transition-all duration-150 text-sm text-foreground group flex items-center justify-between",
        className
      )}
    >
      <span>{label}</span>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
    </button>
  );
}

export function GuidedBuilder({ onBuild, disabled }: GuidedBuilderProps) {
  const [currentStep, setCurrentStep] = useState<StepId>("numColors");
  const [selections, setSelections] = useState<Selections>({});
  const [history, setHistory] = useState<StepId[]>([]);

  const step = STEPS[currentStep];

  const handleOption = (value: string | null, next: StepId | null) => {
    const newSelections = { ...selections };

    if (currentStep === "numColors") {
      // numColors just routes to sub-step
    } else if (currentStep === "oneColor" || currentStep === "twoColors" || currentStep === "threeColors" || currentStep === "moreColors") {
      if (value) newSelections.colors = value;
    } else if (currentStep === "format") {
      if (value) newSelections.format = value;
    } else if (currentStep === "strategy") {
      if (value) newSelections.strategy = value;
    } else if (currentStep === "theme") {
      newSelections.theme = value ?? null;
    }

    setSelections(newSelections);

    if (next === "confirm") {
      setHistory((h) => [...h, currentStep]);
      setCurrentStep("confirm");
    } else if (next) {
      setHistory((h) => [...h, currentStep]);
      setCurrentStep(next);
    }
  };

  const handleBack = () => {
    const prev = history[history.length - 1];
    if (prev) {
      setHistory((h) => h.slice(0, -1));
      setCurrentStep(prev);
    }
  };

  const buildPrompt = () => {
    const parts: string[] = [];
    if (selections.colors) parts.push(selections.colors);
    if (selections.strategy) parts.push(selections.strategy);
    if (selections.theme) parts.push(`${selections.theme} tribal/themed`);
    parts.push("deck");
    if (selections.format) parts.push(`for ${selections.format}`);
    onBuild(`Build me a ${parts.join(" ")}`);
  };

  const selectionSummary = [
    selections.colors,
    selections.format,
    selections.strategy,
    selections.theme,
  ]
    .filter(Boolean)
    .join(" · ");

  if (currentStep === "confirm") {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
          <Wand2 className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground text-lg mb-1">Ready to build!</h3>
        <p className="text-sm text-muted-foreground mb-1 max-w-xs">{selectionSummary}</p>
        <div className="flex flex-col gap-3 w-full max-w-xs mt-6">
          <Button onClick={buildPrompt} disabled={disabled} className="w-full gap-2">
            <Wand2 className="w-4 h-4" />
            Generate My Deck
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentStep("numColors");
              setSelections({});
              setHistory([]);
            }}
            className="w-full text-muted-foreground"
          >
            Start over
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 px-1">
        {history.length > 0 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          {(["numColors", "format", "strategy", "theme"] as StepId[]).map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1 rounded-full transition-all",
                history.includes(s) || currentStep === s
                  ? "bg-primary w-6"
                  : "bg-border w-3"
              )}
            />
          ))}
        </div>
      </div>

      {/* Current selection summary */}
      {selectionSummary && (
        <div className="flex flex-wrap gap-1.5 mb-4 px-1">
          {[selections.colors, selections.format, selections.strategy, selections.theme]
            .filter(Boolean)
            .map((sel) => (
              <span key={sel} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                {sel}
              </span>
            ))}
        </div>
      )}

      {/* Question */}
      <div className="mb-4 px-1">
        <h3 className="font-semibold text-foreground text-base">{step.question}</h3>
        {step.subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{step.subtitle}</p>
        )}
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto space-y-2 px-1 pb-2">
        {step.options.map((opt) => (
          <OptionButton
            key={opt.label}
            label={`${opt.emoji ? opt.emoji + " " : ""}${opt.label}`}
            onClick={() => handleOption(opt.value, opt.next)}
          />
        ))}
      </div>
    </div>
  );
}

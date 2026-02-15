import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Circle } from 'lucide-react';

interface YesNoQuestionProps {
  question: string;
  explanation?: string;
  onAnswer: (answer: string) => void;
}

interface CheckboxQuestionProps {
  question: string;
  options: string[];
  explanation?: string;
  onAnswer: (selectedOptions: string[]) => void;
}

interface MultiSelectQuestionProps {
  question: string;
  options: string[];
  explanation?: string;
  onAnswer: (selectedOptions: string[]) => void;
}

interface OpenQuestionProps {
  question: string;
  explanation?: string;
  onAnswer: (answer: string) => void;
}

export function YesNoQuestion({ question, explanation, onAnswer }: YesNoQuestionProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{question}</p>
      {explanation && (
        <p className="text-xs text-muted-foreground">{explanation}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-16 text-base font-medium hover:bg-success/10 hover:border-success hover:text-success transition-colors"
          onClick={() => onAnswer('Yes')}
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Yes
        </Button>
        <Button
          variant="outline"
          className="h-16 text-base font-medium hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-colors"
          onClick={() => onAnswer('No')}
        >
          <Circle className="mr-2 h-5 w-5" />
          No
        </Button>
      </div>
    </div>
  );
}

export function CheckboxQuestion({ question, options, explanation, onAnswer }: CheckboxQuestionProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (option: string) => {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{question}</p>
      {explanation && (
        <p className="text-xs text-muted-foreground">{explanation}</p>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <Label
            key={option}
            className="flex items-center gap-3 rounded-lg border border-input bg-background p-3 cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <Checkbox
              checked={selected.includes(option)}
              onCheckedChange={() => toggle(option)}
            />
            <span className="text-sm text-foreground">{option}</span>
          </Label>
        ))}
      </div>
      <Button
        className="w-full"
        disabled={selected.length === 0}
        onClick={() => onAnswer(selected)}
      >
        Continue ({selected.length} selected)
      </Button>
    </div>
  );
}

export function MultiSelectQuestion({ question, options, explanation, onAnswer }: MultiSelectQuestionProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (option: string) => {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{question}</p>
      {explanation && (
        <p className="text-xs text-muted-foreground">{explanation}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <Button
              key={option}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggle(option)}
              className="transition-colors"
            >
              {isSelected && <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
              {option}
            </Button>
          );
        })}
      </div>
      <Button
        className="w-full"
        disabled={selected.length === 0}
        onClick={() => onAnswer(selected)}
      >
        Continue ({selected.length} selected)
      </Button>
    </div>
  );
}

export function OpenQuestion({ question, explanation, onAnswer }: OpenQuestionProps) {
  const [value, setValue] = useState('');

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{question}</p>
      {explanation && (
        <p className="text-xs text-muted-foreground">{explanation}</p>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type your answer…"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) onAnswer(value.trim());
        }}
      />
      <Button className="w-full" disabled={!value.trim()} onClick={() => onAnswer(value.trim())}>
        Submit
      </Button>
    </div>
  );
}

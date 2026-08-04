import { useEffect, useState } from "react";

import { format, startOfDay, subDays } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";

const TIME_RANGES = [
  { value: "24h", label: "Last 24 hours", shortcut: "D" },
  { value: "7d", label: "Last 7 days", shortcut: "W" },
  { value: "30d", label: "Last 30 days", shortcut: "M" },
  { value: "custom", label: "Custom Date", shortcut: "C" },
] as const;

export type TimeRange = (typeof TIME_RANGES)[number]["value"];
interface CustomRange {
  start: Date;
  end: Date;
}
interface TimeRangeSelectProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  customRange: CustomRange;
  setCustomRange: (range: CustomRange) => void;
  onCustomRangeComplete?: (range: CustomRange) => void;
  slug: React.MutableRefObject<boolean>;
}

export function TimeRangeSelect({
  value,
  onChange,
  customRange,
  setCustomRange,
  onCustomRangeComplete,
  slug,
}: TimeRangeSelectProps) {
  const selectedRange = TIME_RANGES.find((range) => range.value === value);
  const [date, setDate] = useState<DateRange | undefined>({
    from: customRange.start,
    to: customRange.end,
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setDate({ from: customRange.start, to: customRange.end });
  }, [customRange]);

  const handleSelectOption = (value: TimeRange) => {
    onChange(value);

    // Update date range based on selected preset
    const now = new Date();
    const end = startOfDay(now);
    let start = startOfDay(now);

    switch (value) {
      case "24h":
        start = subDays(end, 1);
        break;
      case "7d":
        start = subDays(end, 7);
        break;
      case "30d":
        start = subDays(end, 30);
        break;
      case "custom":
        // Reset the date range when switching to custom
        setDate(undefined);
        return;
      default:
        return;
    }

    setCustomRange({ start, end });
    setDate({ from: start, to: end });
    slug.current = false;
    setOpen(false);
  };

  const handleRangeChange = (range: DateRange | undefined) => {
    setDate(range);
    if (range?.from && range?.to) {
      const newRange = { start: range.from, end: range.to };
      setCustomRange(newRange);
      onChange("custom");
      slug.current = false;
      setOpen(false);
      onCustomRangeComplete?.(newRange);
    } else if (range?.from) {
      setCustomRange({ start: range.from, end: range.from });
      onChange("custom");
      slug.current = false;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[300px] justify-between text-left font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span>
              {value === "custom" && date?.from ? (
                <>
                  {format(date.from, "MMM d")} -{" "}
                  {format(date.to || date.from, "MMM d, yyyy")}
                </>
              ) : (
                selectedRange?.label
              )}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="end">
        <div className="flex gap-2">
          <div className="rounded-md border">
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleRangeChange}
              numberOfMonths={2}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="grid gap-1">
              {TIME_RANGES.map((range) => (
                <Button
                  key={range.value}
                  variant={range.value === value ? "secondary" : "ghost"}
                  className="justify-between"
                  onClick={() => handleSelectOption(range.value)}
                >
                  <span>{range.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

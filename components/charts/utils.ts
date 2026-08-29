export type Data = {
  pageNumber: string;
  data: {
    versionNumber: number;
    avg_duration: number;
  }[];
};

export type SumData = {
  pageNumber: string;
  sum_duration: number;
};

export type TransformedData = {
  pageNumber: string;
  [key: string]: number | string; // Adjusted type to accommodate version keys
};

export type CustomTooltipTypeBar = {
  payload: any;
  active: boolean | undefined;
  label: any;
};

export type Color =
  | "neutral"
  | "emerald"
  | "gray"
  | "slate"
  | "zinc"
  | "stone"
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose"
  | "gray-300";

export const getColors = (versionNumbers: string[]): Color[] => {
  const colorArray = [
    "emerald",
    "teal",
    "gray",
    "orange",
    "zinc",
    "neutral",
    "stone",
    "red",
    "amber",
    "yellow",
    "lime",
    "green",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
  ];
  return versionNumbers.map((versionNumber: string) => {
    const versionIndex = parseInt(versionNumber.split(" ")[1]) - 1;
    return colorArray[versionIndex % colorArray.length] as Color;
  });
};

export const getColorForVersion = (versionNumber: string): Color => {
  const versionIndex = parseInt(versionNumber.split(" ")[1]) - 1;
  const colorArray = [
    "emerald",
    "teal",
    "gray",
    "orange",
    "zinc",
    "neutral",
    "stone",
    "red",
    "amber",
    "yellow",
    "lime",
    "green",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
  ];
  return colorArray[versionIndex % colorArray.length] as Color;
};

export const timeFormatter = (number: number) => {
  const totalSeconds = Math.floor(number / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);

  // Adding zero padding if seconds less than 10
  const secondsFormatted = seconds < 10 ? `0${seconds}` : `${seconds}`;

  return `${minutes}:${secondsFormatted}`;
};

/** Palette-name → hex, for SVG chart fills (tremor is gone). */
export const COLOR_HEX: Record<Color, string> = {
  neutral: "#737373",
  emerald: "#10b981",
  gray: "#6b7280",
  slate: "#64748b",
  zinc: "#71717a",
  stone: "#78716c",
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  lime: "#84cc16",
  green: "#22c55e",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  sky: "#0ea5e9",
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  pink: "#ec4899",
  rose: "#f43f5e",
  "gray-300": "#d1d5db",
};

export const colorToHex = (color: Color | string): string =>
  COLOR_HEX[color as Color] ?? color;

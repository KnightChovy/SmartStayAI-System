const numberFmt = new Intl.NumberFormat('en-US');
export const formatCount = (n: number) => numberFmt.format(n);

/** Kiểu props tối giản cho custom Tooltip của recharts v3. */
export interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string | number;
    payload?: Record<string, unknown>;
  }>;
}

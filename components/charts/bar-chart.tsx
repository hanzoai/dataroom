import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import CustomTooltip from "./bar-chart-tooltip";
import {
  type Data,
  type SumData,
  type TransformedData,
  colorToHex,
  getColors,
  timeFormatter,
} from "./utils";

const renameDummyDurationKey = (data: Data[]): TransformedData[] => {
  return data.reduce((acc, { pageNumber, data }) => {
    const transformedItem: Partial<TransformedData> = { pageNumber };

    data.forEach(({ versionNumber, avg_duration }) => {
      transformedItem[`Example time spent per page`] = avg_duration;
    });

    acc.push(transformedItem as TransformedData);
    return acc;
  }, [] as TransformedData[]);
};

const renameSumDurationKey = (
  data: SumData[],
  versionNumber?: number,
  documentId?: string,
) => {
  return data.map((item) => {
    return {
      ...item,
      "Time spent per page": item.sum_duration,
      sum_duration: undefined,
      versionNumber: versionNumber ?? 1,
      documentId: documentId,
    };
  });
};

// Transform data
const transformData = (data: Data[]): TransformedData[] => {
  return data.reduce((acc, { pageNumber, data }) => {
    const transformedItem: Partial<TransformedData> = { pageNumber };

    data.forEach(({ versionNumber, avg_duration }) => {
      transformedItem[`Version ${versionNumber}`] = avg_duration;
    });

    acc.push(transformedItem as TransformedData);
    return acc;
  }, [] as TransformedData[]);
};

const getVersionNumbers = (data: TransformedData[]) => {
  return [
    ...new Set(
      data.flatMap((item) =>
        Object.keys(item).filter((key) => key !== "pageNumber"),
      ),
    ),
  ];
};

function DurationBarChart({
  data,
  categories,
  colors,
  customTooltip,
}: {
  data: any[];
  categories: string[];
  colors: string[];
  customTooltip?: boolean;
}) {
  return (
    <div className="mt-6" style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="pageNumber" tickLine={false} axisLine={false} />
          <YAxis
            width={50}
            tickFormatter={timeFormatter}
            tickLine={false}
            axisLine={false}
          />
          {customTooltip ? (
            <Tooltip
              content={({ active, payload }) => (
                <CustomTooltip active={active} payload={payload} />
              )}
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            />
          ) : (
            <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
          )}
          {categories.map((category, i) => (
            <Bar
              key={category}
              dataKey={category}
              fill={colorToHex(colors[i % colors.length])}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function BarChartComponent({
  data,
  isSum = false,
  isDummy = false,
  versionNumber,
  documentId,
}: {
  data: any;
  isSum?: boolean;
  isDummy?: boolean;
  versionNumber?: number;
  documentId?: string;
}) {
  if (isSum) {
    const renamedData = renameSumDurationKey(data, versionNumber, documentId);

    return (
      <DurationBarChart
        data={renamedData}
        categories={["Time spent per page"]}
        colors={["emerald"]}
        customTooltip={!isDummy}
      />
    );
  }

  let renamedData = transformData(data);
  let versionNumbers = getVersionNumbers(renamedData);
  let colors: string[] = getColors(versionNumbers);

  if (isDummy) {
    colors = ["gray-300"];
    renamedData = renameDummyDurationKey(data);
    versionNumbers = getVersionNumbers(renamedData);
  }

  return (
    <DurationBarChart
      data={renamedData}
      categories={versionNumbers}
      colors={colors}
      customTooltip={!isDummy}
    />
  );
}

export type StatisticsRange = "7d" | "30d" | "90d";

export type StatisticMetrics = {
  completed: number;
  updated: number;
  created: number;
  dueSoon: number;
  completedTrend: number;
  updatedTrend: number;
  createdTrend: number;
  dueSoonTrend: number;
};

export type StatisticActivity = {
  user: string;
  action: string;
  target: string;
  time: string;
  team: string;
  status: string;
};

export type StatisticPriority = {
  label: string;
  value: number;
  color: string;
};

export type StatisticWorkload = {
  name: string;
  capacity: number;
  state: string;
};

export type StatisticsResponse = {
  range: StatisticsRange;
  metrics: StatisticMetrics;
  activities: StatisticActivity[];
  priorities: StatisticPriority[];
  workloads: StatisticWorkload[];
};


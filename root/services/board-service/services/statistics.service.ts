import { db } from "../config/database";
import {
  fetchMetrics,
  fetchPriorityBreakdown,
  fetchRecentActivities,
  fetchWorkloads,
  type StatisticsFilter,
} from "../repositories/statistics.repository";

export async function getMetrics(filter: StatisticsFilter) {
  return fetchMetrics(db, filter);
}

export async function getActivities(filter: StatisticsFilter, limit = 6) {
  return fetchRecentActivities(db, filter, limit);
}

export async function getPriorities(filter: StatisticsFilter, limit = 3) {
  return fetchPriorityBreakdown(db, filter, limit);
}

export async function getWorkloads(filter: StatisticsFilter, limit = 6) {
  return fetchWorkloads(db, filter, limit);
}


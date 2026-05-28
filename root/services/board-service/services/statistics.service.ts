import { db } from "../config/database";
import {
  fetchMetrics,
  fetchPriorityBreakdown,
  fetchRecentActivities,
  fetchWorkloads,
  fetchMemberCompletedTotal,
  fetchMemberOverdueTasks,
  fetchMemberOverdueTotal,
  fetchMemberAssignedTotal,
  fetchTeamCompletedTotal,
  type StatisticsFilter,
} from "../repositories/statistics.repository";

export async function getMetrics(filter: StatisticsFilter) {
  return fetchMetrics(db, filter);
}

export async function getActivities(filter: StatisticsFilter, limit = 6) {
  return fetchRecentActivities(db, filter, limit);
}

export async function getPriorities(filter: StatisticsFilter, limit?: number) {
  return fetchPriorityBreakdown(db, filter, limit);
}


export async function getWorkloads(filter: StatisticsFilter, limit = 6) {
  return fetchWorkloads(db, filter, limit);
}

export async function getSelfPerformance(
  filter: StatisticsFilter & { memberId: string },
  limit = 2,
) {
  const [completedTotal, overdueTotal, assignedTotal, teamCompletedTotal, overdueTasks] = await Promise.all([
    fetchMemberCompletedTotal(db, filter),
    fetchMemberOverdueTotal(db, filter),
    fetchMemberAssignedTotal(db, filter),
    fetchTeamCompletedTotal(db, filter),
    fetchMemberOverdueTasks(db, filter, limit),
  ]);

  return {
    completedTotal,
    overdueTotal,
    assignedTotal,
    teamCompletedTotal,
    overdueTasks,
  };
}

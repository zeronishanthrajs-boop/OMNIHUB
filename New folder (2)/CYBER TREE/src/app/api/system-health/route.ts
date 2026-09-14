import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/db';
import { checkAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

// Known workflows and their expected max-hours between runs
const WORKFLOW_WINDOWS: Record<string, { schedule: string; maxHours: number }> = {
  collect:              { schedule: 'Every 6h',      maxHours: 8   },
  process:              { schedule: 'Every 12h',     maxHours: 14  },
  relate:               { schedule: 'Every 24h',     maxHours: 26  },
  maintain:             { schedule: 'Weekly Sun',    maxHours: 180 },
  embed:                { schedule: 'Weekly Sun',    maxHours: 180 },
  cluster_nodes:        { schedule: 'Weekly Mon',    maxHours: 180 },
  trend_detector:       { schedule: 'Weekly Mon',    maxHours: 180 },
  hypothesis_engine:    { schedule: 'Weekly Wed',    maxHours: 180 },
  evidence_linker:      { schedule: 'Daily 07:00',   maxHours: 26  },
  learning_engine:      { schedule: 'Weekly Fri',    maxHours: 180 },
  model_updater:        { schedule: 'Monthly 1st',   maxHours: 800 },
  source_discoverer:    { schedule: 'Weekly Thu',    maxHours: 180 },
  dead_source_detector: { schedule: 'Daily 08:00',   maxHours: 26  },
  knowledge_healer:     { schedule: 'Weekly Sun',    maxHours: 180 },
  backup:               { schedule: 'Monthly 1st',   maxHours: 800 },
  monitor:              { schedule: 'Every 6h',      maxHours: 8   },
};

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const isAuthed = await checkAuth(req);
    if (!isAuthed) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }
    const stats = await getDashboardStats();

    const now = Date.now();
    const past24h = now - 24 * 60 * 60 * 1000;
    const past7d  = now - 7  * 24 * 60 * 60 * 1000;
    const past30d = now - 30 * 24 * 60 * 60 * 1000;

    // Build per-workflow status from recentJobs
    // recentJobs only has last 5 — fetch full set via getDashboardStats which already has last jobs
    const jobMap: Record<string, any> = {};
    for (const job of (stats.recentJobs || [])) {
      const name = job.job_name;
      if (!jobMap[name] || new Date(job.started_at) > new Date(jobMap[name].started_at)) {
        jobMap[name] = job;
      }
    }

    const workflowStatuses: Record<string, any> = {};
    let degradedCount = 0;
    let criticalCount = 0;

    for (const [name, meta] of Object.entries(WORKFLOW_WINDOWS)) {
      const job = jobMap[name];
      if (!job) {
        workflowStatuses[name] = {
          status: 'never_run',
          last_run: null,
          schedule: meta.schedule,
          ok: false,
        };
        // Only flag core frequent jobs as degraded
        if (meta.maxHours <= 26) degradedCount++;
        continue;
      }

      const lastRunMs = new Date(job.started_at).getTime();
      const hoursSince = (now - lastRunMs) / 3600000;
      const overdue = hoursSince > meta.maxHours;
      const failed  = job.status === 'failed';

      workflowStatuses[name] = {
        status:    failed ? 'failed' : overdue ? 'overdue' : job.status,
        last_run:  job.started_at,
        schedule:  meta.schedule,
        ok:        !failed && !overdue,
        hours_since_run: Math.round(hoursSince * 10) / 10,
      };

      if (failed)  criticalCount++;
      else if (overdue) degradedCount++;
    }

    const overallStatus =
      criticalCount > 0 ? 'critical' :
      degradedCount > 0 ? 'degraded' :
      'healthy';

    return NextResponse.json({
      overall_status: overallStatus,
      critical_count: criticalCount,
      degraded_count: degradedCount,
      checked_at: new Date().toISOString(),
      workflows: workflowStatuses,
      node_growth: {
        total: stats.nodeCount,
        last_24h: stats.newNodesCount,
        last_7d:  null, // available via getDashboardStats extension
        last_30d: null,
      },
    });
  } catch (err: any) {
    return handleApiError(err, 'GET /api/system-health');
  }
}

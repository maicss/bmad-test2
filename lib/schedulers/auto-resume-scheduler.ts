/**
 * Auto-Resume Scheduler
 *
 * Story 2.5: Parent Pauses/Resumes/Deletes Task Plan
 * Story 2.5 Task 7.6: Send notifications when auto-resuming
 *
 * Automatically resumes task plans when their pause duration expires.
 * Runs as a background interval job checking every hour.
 *
 * Functions:
 * - checkAndResume(): Finds and resumes expired paused plans
 * - start(): Starts the scheduler (call during app initialization)
 */

import db from '@/lib/db';
import { taskPlans } from '@/lib/db/schema';
import { eq, and, lt, isNull } from 'drizzle-orm';
import { sendTaskPlanResumedNotification } from '@/lib/db/queries/notifications';

export class AutoResumeScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * Check and auto-resume paused task plans
   *
   * Story 2.5 Task 7.6: Sends notifications to parents when resuming
   *
   * Finds all paused plans where paused_until has passed
   * and resumes them by setting status to 'published'
   *
   * @returns Number of plans resumed
   */
  async checkAndResume(): Promise<number> {
    const now = new Date();

    try {
      // Find all paused plans where paused_until has passed
      const expiredPausedPlans = await db
        .select({
          id: taskPlans.id,
          title: taskPlans.title,
          pausedUntil: taskPlans.paused_until,
          family_id: taskPlans.family_id,
        })
        .from(taskPlans)
        .where(
          and(
            eq(taskPlans.status, 'paused'),
            lt(taskPlans.paused_until, now),
            isNull(taskPlans.deleted_at)
          )
        );

      if (expiredPausedPlans.length === 0) {
        return 0;
      }

      console.log(`[AutoResume] Found ${expiredPausedPlans.length} paused plans to auto-resume`);

      let resumedCount = 0;
      for (const plan of expiredPausedPlans) {
        try {
          await db
            .update(taskPlans)
            .set({
              status: 'published',
              paused_until: null,
              updated_at: now,
            })
            .where(eq(taskPlans.id, plan.id));

          // Story 2.5 Task 7.6: Send notification to parents
          await sendTaskPlanResumedNotification(
            plan.family_id,
            plan.id,
            plan.title
          );

          resumedCount++;
          console.log(`[AutoResume] Resumed task plan: ${plan.title} (${plan.id})`);
        } catch (error) {
          console.error(`[AutoResume] Failed to resume task plan ${plan.id}:`, error);
        }
      }

      return resumedCount;
    } catch (error) {
      console.error('[AutoResume] Error checking for expired paused plans:', error);
      return 0;
    }
  }

  /**
   * Start auto-resume scheduler
   *
   * Checks every hour for expired paused plans.
   * Runs immediately on startup, then every hour.
   *
   * Call this during app initialization (e.g., in layout.tsx or a startup script)
   */
  start() {
    console.log('[AutoResume] Starting auto-resume scheduler');

    // Run immediately on startup
    this.checkAndResume();

    // Run every hour (3600000 ms)
    this.intervalId = setInterval(async () => {
      await this.checkAndResume();
    }, 60 * 60 * 1000);

    console.log('[AutoResume] Scheduler started (checks every hour)');
  }

  /**
   * Stop the scheduler
   *
   * Call this during app shutdown or for testing
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[AutoResume] Scheduler stopped');
    }
  }

  /**
   * Get scheduler status
   *
   * @returns true if scheduler is running
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

// Export singleton instance
export const autoResumeScheduler = new AutoResumeScheduler();

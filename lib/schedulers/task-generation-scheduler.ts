/**
 * Task Generation Scheduler
 *
 * Story 2.4: System Auto-Generates Task Instances
 *
 * This scheduler runs daily at midnight (Beijing time UTC+8) to generate
 * task instances from published task plans.
 *
 * Features:
 * - Runs daily at 00:00 Beijing time (16:00 UTC)
 * - Automatic retry on failure
 * - Health monitoring
 * - Graceful shutdown
 *
 * Source: Story 2.4 AC #2 - System clock reaches daily 0:00
 */

import { taskGenerator, GenerationResult } from '@/lib/services/task-engine/task-generator';

/**
 * Task Generation Scheduler Class
 *
 * Manages the daily task generation process
 */
export class TaskGenerationScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;
  private lastGenerationTime: Date | null = null;
  private lastGenerationResult: GenerationResult | null = null;
  private consecutiveFailures: number = 0;
  private maxRetries: number = 3;

  /**
   * Start the scheduler
   *
   * Runs immediately on startup (to catch any missed tasks),
   * then schedules daily execution at 00:00 Beijing time (UTC+8).
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[TaskScheduler] Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('[TaskScheduler] Starting task generation scheduler');

    // Run immediately on startup to catch any missed tasks
    this.runGeneration().catch(error => {
      console.error('[TaskScheduler] Initial generation failed:', error);
    });

    // Schedule daily execution
    // Beijing time 00:00 = UTC 16:00
    // Check every minute if it's time to run
    this.intervalId = setInterval(() => {
      this.checkAndRun();
    }, 60 * 1000); // Check every minute
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('[TaskScheduler] Stopping task generation scheduler');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
  }

  /**
   * Check if it's time to run and execute if needed
   */
  private checkAndRun(): void {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();

    // Check if it's 16:00 UTC (00:00 Beijing time)
    if (utcHour === 16 && utcMinute === 0) {
      console.log('[TaskScheduler] Triggered scheduled task generation');
      this.runGeneration().catch(error => {
        console.error('[TaskScheduler] Scheduled generation failed:', error);
      });
    }
  }

  /**
   * Run task generation with retry logic
   */
  private async runGeneration(): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    console.log(`[TaskScheduler] Starting task generation for ${today}`);

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.maxRetries) {
      try {
        const result = await taskGenerator.generateForDate(today);

        this.lastGenerationTime = new Date();
        this.lastGenerationResult = result;
        this.consecutiveFailures = 0;

        if (result.errorCount > 0) {
          console.warn(`[TaskScheduler] Generation completed with errors: ${result.successCount} success, ${result.errorCount} errors`);
          if (result.errors.length > 0) {
            console.error('[TaskScheduler] Error details:', result.errors);
          }
        } else {
          console.log(`[TaskScheduler] Generation completed successfully: ${result.successCount} tasks created`);
        }

        return; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;
        console.error(`[TaskScheduler] Generation attempt ${attempt} failed:`, lastError.message);

        if (attempt < this.maxRetries) {
          // Wait before retry (exponential backoff)
          const delayMs = Math.min(1000 * Math.pow(2, attempt), 30000);
          console.log(`[TaskScheduler] Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // All retries failed
    this.consecutiveFailures++;
    console.error(`[TaskScheduler] Generation failed after ${this.maxRetries} attempts:`, lastError?.message);

    // TODO: Send alert to admin if consecutive failures exceed threshold
    if (this.consecutiveFailures >= 5) {
      console.error('[TaskScheduler] CRITICAL: Multiple consecutive failures detected');
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    lastGenerationTime: Date | null;
    lastGenerationResult: GenerationResult | null;
    consecutiveFailures: number;
  } {
    return {
      isRunning: this.isRunning,
      lastGenerationTime: this.lastGenerationTime,
      lastGenerationResult: this.lastGenerationResult,
      consecutiveFailures: this.consecutiveFailures,
    };
  }

  /**
   * Health check for monitoring
   */
  healthCheck(): {
    healthy: boolean;
    lastGenerationTime: Date | null;
    consecutiveFailures: number;
  } {
    const healthy = this.consecutiveFailures < 5;
    return {
      healthy,
      lastGenerationTime: this.lastGenerationTime,
      consecutiveFailures: this.consecutiveFailures,
    };
  }

  /**
   * Manually trigger task generation (for testing or admin use)
   */
  async triggerManualGeneration(dateStr?: string): Promise<GenerationResult> {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    console.log(`[TaskScheduler] Manual task generation triggered for ${targetDate}`);

    const result = await taskGenerator.generateForDate(targetDate);

    this.lastGenerationTime = new Date();
    this.lastGenerationResult = result;

    return result;
  }
}

// Export singleton instance
export const taskScheduler = new TaskGenerationScheduler();

// Auto-start scheduler when module loads (in production)
if (Bun.env.NODE_ENV === 'production') {
  taskScheduler.start();
}

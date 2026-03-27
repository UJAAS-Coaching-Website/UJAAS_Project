import { syncScheduledTestStatuses } from "./testService.js";
import { createMultiBatchNotification, cleanupExpiredReviewNotifications } from "./notificationService.js";
import { flushPattern } from "../utils/cacheInvalidator.js";

const DEFAULT_INTERVAL_MS = 30_000;

export function startTestStatusScheduler(intervalMs = DEFAULT_INTERVAL_MS) {
    let isRunning = false;

    const runSync = async () => {
        if (isRunning) {
            return;
        }

        isRunning = true;
        try {
            const result = await syncScheduledTestStatuses();
            if (result.liveCount > 0) {
                console.log(`Test status sync updated ${result.liveCount} tests to live`);

                // Invalidate cached test lists/details so all roles see live status immediately.
                await flushPattern("tests:list:*");
                for (const test of result.liveTests) {
                    await flushPattern(`test:${test.id}:*`);
                }
                
                // Trigger Notifications for each live test
                for (const test of result.liveTests) {
                    const batchIds = (test.batches || []).map(b => b.id);
                    if (batchIds.length > 0) {
                        createMultiBatchNotification(batchIds, {
                            senderId: null, // System notification
                            type: 'test',
                            title: 'Test is now LIVE',
                            message: `The test "${test.title}" is now live. Good luck!`,
                            metadata: { testId: test.id }
                        }).catch(err => console.error(`Auto-notification for test ${test.id} failed:`, err));
                    }
                }
            }

            // Clean up any expired faculty review notifications in DB
            try {
                await cleanupExpiredReviewNotifications();
            } catch (err) {
                console.error("Cleanup Review Notifications failed:", err.message);
            }
        } catch (error) {
            console.error("Test status sync failed:", error.message);
        } finally {
            isRunning = false;
        }
    };

    void runSync();
    const timer = setInterval(() => {
        void runSync();
    }, intervalMs);

    return () => clearInterval(timer);
}

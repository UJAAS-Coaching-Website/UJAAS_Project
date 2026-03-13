import { syncScheduledTestStatuses } from "./testService.js";

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

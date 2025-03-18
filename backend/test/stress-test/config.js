export const BASE_URL = "http://localhost:4000/starknet";

// Configure load stages for stress and spike testing.
export let defaultConfigOptions = {
    stages: [
        { duration: "30s", target: 50 }, // Ramp-up to 50 VUs in 30 seconds.
        // { duration: "1m", target: 50 }, // Steady load for 1 minute.
        // { duration: "30s", target: 100 }, // Spike up to 100 VUs for 30 seconds.
        // { duration: "1m", target: 100 }, // Hold the spike for 1 minute.
        // { duration: "30s", target: 0 }, // Ramp-down to 0 VUs.
    ],
};

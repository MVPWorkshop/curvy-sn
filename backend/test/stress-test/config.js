export const BASE_URL = "http://localhost:4000/starknet";

// Configure load stages for stress and spike testing.
export let miniConfigOptions = {
    stages: [
        { duration: "10s", target: 5 },
        { duration: "10s", target: 5 },
    ],
};

// Configure load stages for stress and spike testing.
export let defaultConfigOptions = {
    stages: [
        { duration: "30s", target: 20 }, // Ramp-up to 15 VUs in 30 seconds.
        { duration: "1m", target: 20 }, // Steady load for 1 minute.
        // { duration: "30s", target: 30 }, // Spike up to 30 VUs for 30 seconds.
        // { duration: "1m", target: 30 }, // Hold the spike for 1 minute.
        // { duration: "30s", target: 0 }, // Ramp-down to 0 VUs.
    ],
};

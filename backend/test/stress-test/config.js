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
        { duration: "20s", target: 15 },
        { duration: "1m", target: 15 },
        { duration: "30s", target: 50 },
        { duration: "20s", target: 50 },
        { duration: "30s", target: 0 },
    ],
};

import http from "k6/http";
import { check, sleep } from "k6";

// Configure load stages for stress and spike testing.
export let options = {
  stages: [
    { duration: "30s", target: 50 },  // Ramp-up to 50 VUs in 30 seconds.
    { duration: "1m", target: 50 },   // Steady load for 1 minute.
    { duration: "30s", target: 100 }, // Spike up to 100 VUs for 30 seconds.
    { duration: "1m", target: 100 },  // Hold the spike for 1 minute.
    { duration: "30s", target: 0 },   // Ramp-down to 0 VUs.
  ],
};

// Base URL for your endpoints.
const BASE_URL = "http://localhost:4000/starknet";

export default function () {
  // 1. Test /checkmeta/:metaId endpoint
  let res = http.get(`${BASE_URL}/checkmeta/marija.curvy`);
  check(res, {
    "checkmeta: status is 200/400/404": (r) =>
      r.status === 200 || r.status === 400 || r.status === 404,
  });

  // 2. Test /resolve/:address endpoint with a sample address.
  res = http.get(`${BASE_URL}/resolve/0x077df6483eba948413d367c9fb318c2aa444a8d6f0b47bd8650eba2e06970f06`);
  check(res, {
    "resolve: status is 200 or 400": (r) => r.status === 200 || r.status === 400,
  });

  // 3. Test /recordstealthinfo endpoint with a sample payload.
  const recordPayload = JSON.stringify({
    ephemeralPublicKey: "0xabc123def456",
    viewTag: "0x789abc",
    stealthAccountPublicKey: "0xdef456abc123",
    stealthAccountAddress: "0x1234567890abcdef",
  });
  const jsonHeaders = { headers: { "Content-Type": "application/json" } };
  res = http.post(`${BASE_URL}/recordstealthinfo`, recordPayload, jsonHeaders);
  check(res, {
    "recordstealthinfo: status is 200/400": (r) =>
      r.status === 200 || r.status === 400,
  });

  // 4. Test /history endpoint with query parameters for pagination.
  res = http.get(`${BASE_URL}/history?offset=0&size=10`);
  check(res, {
    "history: status is 200": (r) => r.status === 200,
  });

  // 5. Test /transfers endpoint with a sample payload containing addresses.
  const transfersPayload = JSON.stringify({
    addresses: ["0x077df6483eba948413d367c9fb318c2aa444a8d6f0b47bd8650eba2e06970f06"],
  });
  res = http.post(`${BASE_URL}/transfers`, transfersPayload, jsonHeaders);
  check(res, {
    "transfers: status is 200/400": (r) =>
      r.status === 200 || r.status === 400,
  });

  // Wait 1 second between iterations to simulate user think time.
  sleep(1);
}

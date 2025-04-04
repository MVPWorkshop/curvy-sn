import http from "k6/http";
import { check, sleep } from "k6";

import { BASE_URL, defaultConfigOptions } from "./config.js";
import {
  randomBN254Point,
  randomMetaId,
  randomSECP256k1Point,
  randomStarknetAddress,
  randomViewTag,
} from "./utils.js";

export const options = defaultConfigOptions;

const jwtToken = __ENV.JWT_TOKEN || "";

const jsonHeaders = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwtToken}`,
  },
};

export default function () {
  // 3. Test /recordstealthinfo endpoint with a sample payload.
  const recordPayload = JSON.stringify({
    ephemeralPublicKey: randomBN254Point(),
    viewTag: randomViewTag(),
    stealthAccountPublicKey: randomSECP256k1Point(),
    stealthAccountAddress: randomStarknetAddress(),
  });
  let res = http.post(
    `${BASE_URL}/recordstealthinfo`,
    recordPayload,
    jsonHeaders,
  );
  check(res, {
    "recordstealthinfo: status is 200": (r) => r.status === 200,
  });

  // 4. Test /info endpoint with query parameters for pagination.
  res = http.get(`${BASE_URL}/info?offset=0&size=10`, {
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  check(res, {
    "info: status is 200": (r) => r.status === 200,
  });

  // 5. Test /transfers endpoint with a sample payload containing addresses.
  const transfersPayload = JSON.stringify({
    addresses: [randomStarknetAddress()],
  });
  res = http.post(`${BASE_URL}/transfers`, transfersPayload, jsonHeaders);
  check(res, {
    "transfers: status is 200": (r) => r.status === 200,
  });

  // Wait 1 second between iterations to simulate user think time.
  sleep(1);
}

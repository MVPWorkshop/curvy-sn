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

const jwtToken = "invalid_token";

const jsonHeaders = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwtToken}`,
  },
};

export default function () {
  // 1. Test /checkmeta/:metaId endpoint
  const metaId = randomMetaId();
  let res = http.get(`${BASE_URL}/checkmeta/${metaId}`, {
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  check(res, {
    "checkmeta: status is 403": (r) => r.status === 403,
  });

  // 2. Test /resolve/:address endpoint with a sample address.
  const starknetAddress = randomStarknetAddress();
  res = http.get(`${BASE_URL}/resolve/${starknetAddress}`, {
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  check(res, {
    "resolve: status is 403": (r) => r.status === 403,
  });

  // 3. Test /recordstealthinfo endpoint with a sample payload.
  const invalidPayload = invalidRecordPayload();
  res = http.post(`${BASE_URL}/recordstealthinfo`, invalidPayload, jsonHeaders);
  check(res, {
    "recordstealthinfo: status is 403": (r) => r.status === 403,
  });

  // 5. Test /transfers endpoint with a sample payload containing addresses.
  let transfersPayload = JSON.stringify({
    addresses: [randomStarknetAddress(), `invalid.${Math.random()}`],
  });
  res = http.post(`${BASE_URL}/transfers`, transfersPayload, jsonHeaders);
  check(res, {
    "transfers: status is 403": (r) => r.status === 403,
  });

  // Wait 1 second between iterations to simulate user think time.
  sleep(1);
}

const invalidRecordPayload = () => {
  const payload = {
    ephemeralPublicKey: randomBN254Point(),
    viewTag: randomViewTag(),
    stealthAccountPublicKey: randomSECP256k1Point(),
    stealthAccountAddress: randomStarknetAddress(),
  };

  const invalidParamIdx = Math.floor(Math.random() * 4);
  if (invalidParamIdx === 0)
    payload.ephemeralPublicKey = `${Math.random() * 10000}`;
  if (invalidParamIdx === 1) payload.viewTag = `${Math.random() * 10000}`;
  if (invalidParamIdx === 2)
    payload.stealthAccountPublicKey = `${Math.random() * 10000}`;
  if (invalidParamIdx === 3)
    payload.stealthAccountAddress = `${Math.random() * 10000}.invalid`;

  return JSON.stringify(payload);
};

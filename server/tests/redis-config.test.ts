import assert from "node:assert/strict";
import { test } from "node:test";
import { getRedisConfig } from "../src/config/env.js";

test("Redis host, port and password map directly to connection options", () => {
  assert.deepEqual(getRedisConfig({ REDIS_HOST: "redis.example.invalid", REDIS_PORT: "16432", REDIS_PASSWORD: "fixture-password" }), {
    host: "redis.example.invalid", port: 16432, password: "fixture-password", username: undefined,
  });
});

test("Redis config supports password-free local instances and default port", () => {
  assert.deepEqual(getRedisConfig({ REDIS_HOST: "127.0.0.1" }), {
    host: "127.0.0.1", port: 6379, password: undefined, username: undefined,
  });
});

test("Redis config preserves password characters and supports ACL username/TLS", () => {
  const config = getRedisConfig({ REDIS_HOST: "redis.example.invalid", REDIS_PORT: "6380",
    REDIS_USERNAME: " default ", REDIS_PASSWORD: " pass:@/word ", REDIS_TLS: "true" });
  assert.equal(config.password, " pass:@/word ");
  assert.equal(config.username, "default");
  assert.deepEqual(config.tls, { servername: "redis.example.invalid" });
  assert.deepEqual(getRedisConfig({ REDIS_HOST: "127.0.0.1", REDIS_TLS: "true" }).tls, {});
});

test("Redis config rejects missing hosts, URL-shaped hosts and invalid ports", () => {
  assert.throws(() => getRedisConfig({}), /REDIS_HOST/);
  assert.throws(() => getRedisConfig({ REDIS_HOST: "redis:\/\/localhost:6379" }), /REDIS_HOST/);
  for (const port of ["0", "65536", "1.5", "abc", "1e3"]) {
    assert.throws(() => getRedisConfig({ REDIS_HOST: "localhost", REDIS_PORT: port }), /REDIS_PORT/);
  }
  assert.throws(() => getRedisConfig({ REDIS_HOST: "localhost", REDIS_TLS: "maybe" }), /REDIS_TLS/);
});

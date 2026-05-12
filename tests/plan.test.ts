import test from "node:test";
import assert from "node:assert/strict";
import { buildPciBaselinePlan } from "../src/plan.ts";

test("baseline plan includes multiple pci control domains", () => {
  const plan = buildPciBaselinePlan();

  assert.equal(plan.controls.length >= 5, true);
  assert.equal(plan.subnets.length, 4);
  assert.equal(plan.config.offlineMode, true);
});

test("plan includes public and private subnet tiers", () => {
  const plan = buildPciBaselinePlan();
  const tiers = new Set(plan.subnets.map((subnet) => subnet.tier));

  assert.equal(tiers.has("public"), true);
  assert.equal(tiers.has("private"), true);
});

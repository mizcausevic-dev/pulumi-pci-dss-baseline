import { buildPciBaselinePlan } from "./src/plan.ts";
import { buildPulumiBaseline } from "./src/stack.ts";

const baseline = buildPciBaselinePlan();

export const outputs = buildPulumiBaseline(baseline);

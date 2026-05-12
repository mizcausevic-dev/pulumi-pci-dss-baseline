import * as pulumi from "@pulumi/pulumi";
import type { BaselineConfig } from "./types.ts";

const stackConfig = new pulumi.Config();

export function readBaselineConfig(): BaselineConfig {
  return {
    projectName: pulumi.getProject(),
    region: stackConfig.get("region") ?? "us-east-1",
    organizationName: stackConfig.get("organizationName") ?? "northstar-payments",
    environmentName: stackConfig.get("environmentName") ?? pulumi.getStack(),
    offlineMode: stackConfig.getBoolean("offlineMode") ?? true,
    approvedIngressCidrs: stackConfig.getObject<string[]>("approvedIngressCidrs") ?? ["203.0.113.0/24"],
    alertEmail: stackConfig.get("alertEmail") ?? "security-ops@northstar-payments.example",
    vpcCidr: stackConfig.get("vpcCidr") ?? "10.34.0.0/16"
  };
}

import { readBaselineConfig } from "./config.ts";
import type { PciBaselinePlan } from "./types.ts";

export function buildPciBaselinePlan(): PciBaselinePlan {
  const config = readBaselineConfig();

  return {
    config,
    tags: {
      Project: config.projectName,
      Environment: config.environmentName,
      Owner: config.organizationName,
      ComplianceProfile: "pci-dss-level-1",
      CostCenter: "fintech-platform"
    },
    subnets: [
      {
        name: `${config.environmentName}-edge-a`,
        cidr: "10.34.0.0/20",
        availabilityZone: `${config.region}a`,
        tier: "public"
      },
      {
        name: `${config.environmentName}-edge-b`,
        cidr: "10.34.16.0/20",
        availabilityZone: `${config.region}b`,
        tier: "public"
      },
      {
        name: `${config.environmentName}-cardholder-a`,
        cidr: "10.34.64.0/20",
        availabilityZone: `${config.region}a`,
        tier: "private"
      },
      {
        name: `${config.environmentName}-cardholder-b`,
        cidr: "10.34.80.0/20",
        availabilityZone: `${config.region}b`,
        tier: "private"
      }
    ],
    controls: [
      {
        control: "1.2 Network segmentation",
        implementation: "Dedicated VPC lanes with public ingress only through the WAF and private cardholder subnets.",
        value: `${config.vpcCidr} split into edge and cardholder tiers`
      },
      {
        control: "3.6 Cryptographic key management",
        implementation: "Customer-managed KMS key with rotation enabled for audit, storage, and trail encryption.",
        value: "365-day CMK rotation"
      },
      {
        control: "10.2 Audit logging",
        implementation: "Multi-region CloudTrail with validation and immutable S3 storage.",
        value: "Versioned log bucket + CloudTrail digest validation"
      },
      {
        control: "11.4 Intrusion detection",
        implementation: "GuardDuty + Security Hub enabled by default with SNS alert fan-out.",
        value: "Always-on managed detection"
      },
      {
        control: "6.4 Application security",
        implementation: "WAFv2 managed rule groups protect the public entry lane before workloads scale.",
        value: "AWS managed baseline rules"
      }
    ]
  };
}

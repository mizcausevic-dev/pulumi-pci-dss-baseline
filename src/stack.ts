import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { ComplianceControl, PciBaselinePlan, SubnetPlan } from "./types.ts";

export function buildPulumiBaseline(plan: PciBaselinePlan) {
  const provider = new aws.Provider("pci", {
    region: plan.config.region,
    skipCredentialsValidation: plan.config.offlineMode,
    skipMetadataApiCheck: plan.config.offlineMode,
    skipRequestingAccountId: plan.config.offlineMode,
    accessKey: plan.config.offlineMode ? "offline" : undefined,
    secretKey: plan.config.offlineMode ? "offline" : undefined,
    token: plan.config.offlineMode ? "offline" : undefined,
    defaultTags: {
      tags: plan.tags
    }
  });

  const vpc = new aws.ec2.Vpc("pciVpc", {
    cidrBlock: plan.config.vpcCidr,
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      Name: `${plan.config.environmentName}-pci-vpc`
    }
  }, { provider });

  const internetGateway = new aws.ec2.InternetGateway("pciInternetGateway", {
    vpcId: vpc.id,
    tags: {
      Name: `${plan.config.environmentName}-igw`
    }
  }, { provider });

  const publicRouteTable = new aws.ec2.RouteTable("pciPublicRoutes", {
    vpcId: vpc.id,
    routes: [{ cidrBlock: "0.0.0.0/0", gatewayId: internetGateway.id }]
  }, { provider });

  const privateRouteTable = new aws.ec2.RouteTable("pciPrivateRoutes", {
    vpcId: vpc.id
  }, { provider });

  const subnets = plan.subnets.map((subnet: SubnetPlan) => new aws.ec2.Subnet(subnet.name, {
    vpcId: vpc.id,
    cidrBlock: subnet.cidr,
    availabilityZone: subnet.availabilityZone,
    mapPublicIpOnLaunch: subnet.tier === "public",
    tags: {
      Name: subnet.name,
      Tier: subnet.tier
    }
  }, { provider }));

  subnets.forEach((subnet, index: number) => {
    new aws.ec2.RouteTableAssociation(`${plan.subnets[index].name}-assoc`, {
      subnetId: subnet.id,
      routeTableId: plan.subnets[index].tier === "public" ? publicRouteTable.id : privateRouteTable.id
    }, { provider });
  });

  const paymentIngressSecurityGroup = new aws.ec2.SecurityGroup("paymentIngressSecurityGroup", {
    vpcId: vpc.id,
    description: "Public entry lane restricted to approved CIDRs and TLS traffic.",
    ingress: plan.config.approvedIngressCidrs.map((cidr: string) => ({
      protocol: "tcp",
      fromPort: 443,
      toPort: 443,
      cidrBlocks: [cidr],
      description: `Approved ingress from ${cidr}`
    })),
    egress: [{
      protocol: "-1",
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ["0.0.0.0/0"],
      description: "Outbound egress for controlled application dependencies."
    }]
  }, { provider });

  const cardholderSecurityGroup = new aws.ec2.SecurityGroup("cardholderSecurityGroup", {
    vpcId: vpc.id,
    description: "Private data plane accessible only from the edge application lane.",
    ingress: [{
      protocol: "tcp",
      fromPort: 5432,
      toPort: 5432,
      securityGroups: [paymentIngressSecurityGroup.id],
      description: "Database access only from payment application tier."
    }],
    egress: [{
      protocol: "-1",
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ["0.0.0.0/0"]
    }]
  }, { provider });

  const kmsKey = new aws.kms.Key("pciKmsKey", {
    description: "Customer-managed key for PCI-DSS baseline encryption domains.",
    deletionWindowInDays: 30,
    enableKeyRotation: true
  }, { provider });

  const kmsAlias = new aws.kms.Alias("pciKmsAlias", {
    name: `alias/${plan.config.environmentName}-pci-baseline`,
    targetKeyId: kmsKey.keyId
  }, { provider });

  const trailBucket = new aws.s3.Bucket("trailBucket", {
    bucketPrefix: `${plan.config.environmentName}-pci-trail-`
  }, { provider });

  new aws.s3.BucketVersioning("trailBucketVersioning", {
    bucket: trailBucket.id,
    versioningConfiguration: { status: "Enabled" }
  }, { provider });

  new aws.s3.BucketServerSideEncryptionConfiguration("trailBucketEncryption", {
    bucket: trailBucket.id,
    rules: [{
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: "aws:kms",
        kmsMasterKeyId: kmsKey.arn
      }
    }]
  }, { provider });

  new aws.s3.BucketPublicAccessBlock("trailBucketPublicAccess", {
    bucket: trailBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true
  }, { provider });

  const trailLogGroup = new aws.cloudwatch.LogGroup("trailLogGroup", {
    retentionInDays: 365
  }, { provider });

  const cloudTrail = new aws.cloudtrail.Trail("pciCloudTrail", {
    s3BucketName: trailBucket.bucket,
    includeGlobalServiceEvents: true,
    isMultiRegionTrail: true,
    enableLogFileValidation: true,
    kmsKeyId: kmsKey.arn,
    cloudWatchLogsGroupArn: pulumi.interpolate`${trailLogGroup.arn}:*`
  }, { provider });

  const guardDutyDetector = new aws.guardduty.Detector("guardDutyDetector", {
    enable: true
  }, { provider });

  const securityHubAccount = new aws.securityhub.Account("securityHubAccount", {}, { provider });

  const complianceAlerts = new aws.sns.Topic("complianceAlerts", {
    kmsMasterKeyId: kmsKey.arn
  }, { provider });

  new aws.sns.TopicSubscription("complianceAlertsEmail", {
    topic: complianceAlerts.arn,
    protocol: "email",
    endpoint: plan.config.alertEmail
  }, { provider });

  const waf = new aws.wafv2.WebAcl("pciWebAcl", {
    scope: "REGIONAL",
    defaultAction: { allow: {} },
    description: "Managed-rule WAF baseline for public payment entry lanes.",
    visibilityConfig: {
      cloudwatchMetricsEnabled: true,
      metricName: `${plan.config.environmentName}PciWaf`,
      sampledRequestsEnabled: true
    },
    rules: [
      {
        name: "AWSManagedCommonRuleSet",
        priority: 1,
        overrideAction: { none: {} },
        statement: {
          managedRuleGroupStatement: {
            name: "AWSManagedRulesCommonRuleSet",
            vendorName: "AWS"
          }
        },
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: `${plan.config.environmentName}CommonRules`,
          sampledRequestsEnabled: true
        }
      },
      {
        name: "AWSManagedKnownBadInputs",
        priority: 2,
        overrideAction: { none: {} },
        statement: {
          managedRuleGroupStatement: {
            name: "AWSManagedRulesKnownBadInputsRuleSet",
            vendorName: "AWS"
          }
        },
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: `${plan.config.environmentName}KnownBadInputs`,
          sampledRequestsEnabled: true
        }
      }
    ]
  }, { provider });

  const outputs = {
    vpcId: vpc.id,
    kmsKeyArn: kmsKey.arn,
    kmsAliasName: kmsAlias.name,
    trailBucketName: trailBucket.bucket,
    cloudTrailArn: cloudTrail.arn,
    guardDutyDetectorId: guardDutyDetector.id,
    securityHubEnabled: securityHubAccount.id,
    alertTopicArn: complianceAlerts.arn,
    wafArn: waf.arn,
    edgeSecurityGroupId: paymentIngressSecurityGroup.id,
    cardholderSecurityGroupId: cardholderSecurityGroup.id,
    complianceControls: plan.controls.map((control: ComplianceControl) => `${control.control}: ${control.value}`),
    approvedIngressCidrs: plan.config.approvedIngressCidrs
  };

  return outputs;
}

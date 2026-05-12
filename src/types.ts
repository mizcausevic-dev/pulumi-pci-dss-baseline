export type BaselineConfig = {
  readonly projectName: string;
  readonly region: string;
  readonly organizationName: string;
  readonly environmentName: string;
  readonly offlineMode: boolean;
  readonly approvedIngressCidrs: string[];
  readonly alertEmail: string;
  readonly vpcCidr: string;
};

export type SubnetPlan = {
  readonly name: string;
  readonly cidr: string;
  readonly availabilityZone: string;
  readonly tier: "public" | "private";
};

export type ComplianceControl = {
  readonly control: string;
  readonly implementation: string;
  readonly value: string;
};

export type PciBaselinePlan = {
  readonly config: BaselineConfig;
  readonly tags: Record<string, string>;
  readonly subnets: SubnetPlan[];
  readonly controls: ComplianceControl[];
};

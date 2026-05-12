# Architecture

## Intent

This repo is not a generic Pulumi starter. It is an opinionated AWS baseline aimed at PCI-DSS-oriented payment platforms that need:

- clear network segmentation
- customer-managed encryption
- immutable audit visibility
- managed threat detection
- public-edge protection before cardholder workloads scale

## Local-first preview mode

The stack is configured to be preview-friendly:

- `offlineMode=true` by default
- the AWS provider skips credential validation and metadata lookups
- no `get*` data sources or live account discovery are required for planning

That means the repo can be explored with a local Pulumi backend before real credentials are introduced.

## Resource lanes

### Network segmentation

- one VPC
- two public edge subnets
- two private cardholder subnets
- dedicated route tables
- separate security groups for ingress and cardholder data access

### Cryptography

- one KMS CMK
- key rotation enabled
- alias attached for stable downstream references

### Audit trail

- versioned S3 bucket for trail storage
- KMS-backed bucket encryption
- CloudTrail with log file validation and multi-region coverage
- CloudWatch log group for immediate operator visibility

### Detection and response

- GuardDuty enabled
- Security Hub enabled
- SNS topic for compliance or security notification fan-out

### Edge protection

- WAFv2 regional ACL
- AWS managed common rules
- AWS managed known-bad-inputs rules

## Why this repo is strong

It closes a broad-appeal gap in the portfolio:

- mainstream IaC
- production cloud controls
- compliance framing
- AWS platform engineering signal

And it pairs well with:

- `payment-event-ledger-eos`
- `tenant-access-control-plane`
- `compliance-event-ledger`
- `otel-fraud-signal-tracer` later

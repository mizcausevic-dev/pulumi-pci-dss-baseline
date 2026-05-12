# Changelog

All notable changes to this project are documented here.

## [1.0.0] - 2026-05-12

### Released
- Published **pulumi-pci-dss-baseline** as the fintech infrastructure-and-controls companion to the event and observability repos.
- Packaged AWS segmentation, KMS rotation, WAF posture, audit logging, and offline-friendly preview flow into one operator-readable IaC story.
- Positioned the repo around compliance-grade platform intent, not just cloud resource assembly.

### Why this mattered
- Many infrastructure examples can provision AWS resources. Far fewer explain why those resources matter for PCI-DSS-style control review.
- Security and platform teams often need credible previews before they can justify live credentials or deployment access.
- This release made the repo useful as a platform-engineering narrative rather than a Pulumi syntax sample.

## [0.1.0] - 2026-02-10

### Shipped
- Standardized the first internal stack plan for segmented networking, key-management posture, and immutable audit paths.
- Added an offline preview mode so the repo could be evaluated without cloud access.

## [Prototype] - 2025-05-03

### Built
- Built the first stack model around PCI-DSS-like control goals rather than around generic AWS primitives.
- Used the prototype to test whether compliance intent could stay visible in code and docs.

## [Design Phase] - 2024-01-29

### Designed
- Chose an infrastructure-governance framing over a raw provisioning tutorial.
- Treated previewability and reviewability as first-class features.
- Kept the stack legible for security stakeholders, not just IaC practitioners.

## [Idea Origin] - 2023-04-15

### Observed
- The idea emerged from repeated cases where cloud controls were technically present but operationally hard to inspect quickly.
- The missing artifact was a baseline that explained security posture in the same place it declared it.
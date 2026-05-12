# Why We Built This

**pulumi-pci-dss-baseline** started from a recurring infrastructure problem: teams could often stand up cloud environments quickly, but the control story around those environments was much harder to review. Security posture might exist across tickets, architecture diagrams, cloud consoles, and internal runbooks, while the infrastructure code itself mostly answered a different question: what got provisioned, not why the control model should be trusted.

That disconnect shows up sharply in payment-adjacent environments. The technical challenge is not just creating networks, keys, logging, and edge controls. It is making segmentation intent, auditability, key-management posture, and review boundaries understandable to the people who sign off on risk. Too many examples stop at "here is the stack." They do not help an operator, security lead, or reviewer inspect whether the stack expresses the right control logic.

We built **pulumi-pci-dss-baseline** to close that gap. The repo is meant to feel like a compliance-legible platform baseline, not a raw IaC demo. That is why the documentation, stack structure, and offline preview workflow all matter. The project tries to show what responsible platform code looks like when the audience is not only a developer applying a change, but also a security stakeholder trying to understand the blast radius and control posture of that change.

Existing tools helped, but they were fragmented. AWS gives strong primitives. Pulumi gives strong composition. Security services provide strong individual features. What was still missing was a concise, inspectable baseline that connected those pieces into a narrative about network segmentation, KMS key rotation, WAF posture, and immutable audit logging. Without that narrative, even a good stack can be hard to evaluate quickly.

That shaped the design philosophy:

- **control-intent first** so the repo explains the why behind the resources
- **review-friendly** so security teams can assess the design without reverse-engineering it
- **offline-capable** so the stack can be evaluated before cloud credentials are involved
- **platform-native** so the code still feels like something an internal platform team could extend

The repo also avoids pretending that compliance is solved by resource counts alone. The point is not "more AWS." The point is a baseline whose architecture, preview flow, and documentation all reinforce the same security story.

Next on the roadmap is deeper control mapping, stronger drift-review workflows, and clearer extension patterns for broader AWS environments. The long-term value of **pulumi-pci-dss-baseline** is that it makes infrastructure controls readable enough to discuss before they become incidents or audit findings.
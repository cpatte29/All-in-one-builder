# Dental Vertical — Executive Directive Packet

**Directive:** FABLE begins serving dentists. New industry for the agency.
**Success criteria:** a repeatable onboarding process, a standard proposal,
a website template, and an automation package.

This folder is the complete response to the directive:

| File | Purpose |
|------|---------|
| `00-analysis.md` | Market analysis: what dental practices buy, why, and from whom |
| `01-what-atlas-must-learn.md` | Gap assessment: what the Atlas platform must learn to serve this vertical |
| `02-operational-plan.md` | The repeatable lead-to-delivery operating plan for dental clients |
| `packets/packet-01-dental-knowledge.md` | Sonnet build packet: dental classification + package catalog |
| `packets/packet-02-dental-onboarding.md` | Sonnet build packet: dental onboarding preset + task templates |
| `packets/packet-03-dental-website-template.md` | Sonnet build packet: the dental website template |
| `packets/packet-04-dental-automation.md` | Sonnet build packet: the dental automation package |
| `packets/packet-05-dental-proposal.md` | Sonnet build packet: dental-specific proposal generation |

Each packet is self-contained: a Sonnet instance can execute it with no
other context beyond the repository itself. Packets declare their
dependencies; 01 unblocks everything else.

**Division of labor:** the Overseer (this analysis) observes, evaluates,
and specifies. Sonnet builds. No packet is implemented in this commit — that
is deliberate. Implementation happens packet-by-packet, each as its own
reviewable change.

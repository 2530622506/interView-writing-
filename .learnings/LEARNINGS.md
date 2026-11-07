# Learnings

Corrections, insights, and knowledge gaps captured during development.

**Categories**: correction | insight | knowledge_gap | best_practice

---

- **Category: correction** — Do not infer a Java service version from existing interview docs or an old project baseline. Inspect each Maven module compiler configuration: this workspace reference service compiles as Java 21 while its contract compiles as Java 8.

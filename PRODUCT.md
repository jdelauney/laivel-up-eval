# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — the developer being evaluated.** Solo, at their own machine, voluntarily. They want to know where they actually stand on AI-Driven Development, and what the next level would take. They arrive curious and slightly defensive: the tool is about to tell them something about their own competence.

**Secondary — the hackathon jury.** They run fictional profiles whose level is already estimated, and check whether the tool lands on the same answer. They need a minimal surface: drop a profile JSON, watch the pipeline run, read the computed level and its justification. Not a second product, one screen — it also carries the methodology page and the submission video.

## Product Purpose

Situate a developer on the AIDD scale and show them how to reach the next level.

Success is two things at once: the level is right on profiles the tool has never seen, and the verdict explains itself well enough that the person reads it and recognises themselves.

## Positioning

The player never declares a practice, they demonstrate it. A classic grid answered as a self-assessment questionnaire is gameable — anyone types "yes, I review my code" as easily as a rigorous senior. Here the level comes from performance inside simulated situations: each game turns what the player actually did into YES/NO criteria, applied mechanically.

Two consequences a neighbouring product could not copy without rebuilding its engine:

- **The score is deterministic and replayable.** Same answers, same level, every time. An AI writes the explanation, it never computes the verdict.
- **Two gradings, one authority.** The organisers' referential decides the level and measures adoption only. A second grading — the signature — reads the same criteria on rigour and decides nothing. Two developers can share a level and read as opposite practitioners, which is the intensity × rigour crossing the referential deliberately leaves out.

## Operating Context

- Entirely client-side. No account, no server, no database. The player enters their own LLM API key at onboarding, and it is theirs to revoke afterwards.
- A run is **resumable**: close the tab, come back, pick up where you left off. It is also **replayable**: start a fresh run and keep a history of past ones.
- A full course is 6 groups of at most 3 games each — 12 to 18 games. Long enough that losing progress means abandoning for good.
- The grid, the course and the replay profiles are JSON files a maintainer or an organiser edits without touching code.
- Built solo in a 72-hour hackathon. The deliverables are a public repository, a methodology page explaining how to test it, and a short video.

## Capabilities and Constraints

- Onboarding captures a player profile and their API key. The declarative part personalises the AI summary and never touches the score.
- The course runs group → game → game → next group, with progress visible throughout.
- Scoring: criteria feed weighted dimension contributions, normalised to [0,1]; the level is the highest one whose conditions all hold.
- Full results export as JSON, as an audit trail.
- Replay mode injects pre-recorded answers into the same pipeline as interactive play.
- The organisers' grid was published on 19 August 2026 and is transposed into `config/grid.json`: seven levels, White to Gold, measuring **adoption of AI in the workflow** — feature size, harness, human rework, parallel workstreams — with code quality and seniority explicitly out of scope.
- **Explicitly undecided:** the shape of the fictional profiles is unknown — they may be narrative bios. Converting them into replay profiles is an accepted manual step, not a solved one. Nothing downstream may assume their format.

## Brand Commitments

- Name: **laivel-eval**.
- Product language: French. Every player-facing string, including the AI-written verdict.
- The product is anchored to the [AI-Driven Development Manifesto](https://ai-driven-development.org) — 4 values, 12 principles. Every group of games maps to part of it, and the product must never contradict it. Ownership over Delegation and Understanding over Acceptance are the two it is most directly about.

## Evidence on Hand

Real and available:

- `aidd_docs/BRIEF.md` — the vision, the 6 groups, each game's mechanic and its example criteria.
- `aidd_docs/TECHNICAL.md` — architecture, conventions, the three JSON formats with worked examples.
- `aidd_docs/GUIDE-AVANCEMENT.md` — the phased build plan and its dates.
- The AIDD Manifesto, public.

Absent, and not to be fabricated by any future work:

- The organisers' grid, and the fictional profiles. Both arrive later.
- Any accuracy figure, benchmark, testimonial, user quote, or claim that the tool has been validated against real developers. None of that exists.
- Any product UI. `src/` currently holds the untouched Vite starter and the generated shadcn primitives.

## Product Principles

1. **Measure behaviour, never self-report.** Anything a player can simply claim is not evidence.
2. **The verdict is computed; the AI only tells it.** Reproducibility is the product's credibility.
3. **What is measured is data.** Changing a threshold, a weight or a whole grid must never mean changing code.
4. **A run survives an interruption.** Fifteen games is a commitment; the product honours it.
5. **The explanation is the deliverable, not an appendix.** A level handed over without a justification a person recognises has failed.

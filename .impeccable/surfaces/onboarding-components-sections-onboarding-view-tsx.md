---
version: 1
slug: "onboarding-components-sections-onboarding-view-tsx"
primary_target: "src/features/onboarding/components/sections/onboarding-view.tsx"
related_targets: []
---

# Onboarding — surface brief

## Scope and mode

One adaptive surface, mode **Operate**. First visit renders onboarding; a return renders resume-at-the-top plus run history. Same route, different content by state — not two screens.

## Audience and job

A developer alone at their desk, voluntarily, slightly defensive: the tool is about to tell them something about their own competence. Their job here is to understand in one glance that nothing is declarative, then commit.

Success: they enter the first game without having typed anything sensitive, knowing they will be measured on what they do.

## Action and proof

Primary action is a commitment, not a friendly button. Proof available: the six groups, the duration, the format. Proof forbidden: any accuracy figure, any testimonial — none exists.

## Constraints binding this surface

- **No API key field here.** It is deferred to the verdict screen, so the whole course must stay playable without a key.
- **The contract states the frame, never the criteria.** Duration, format, and the fact that nothing is declarative. Never which behaviours are scored — a forewarned player performs a character.
- Malformed `grid.json` or `course.json` surfaces here first: it must read as a rejection naming the faulty field, never a crash.
- `src/components/ui/` stays CLI-generated, not hand-edited.

## Chosen direction

**Le Carnet de Vol owns the page.** A pilot is judged on what they did in the cockpit, against objective criteria, in the one trade where lying to yourself kills. The debriefing narrates the flight without ever changing what happened — the product's "the AI narrates, it never computes", as an object.

**Le Manuel à Onglets donates two things**: the tab rail whose height encodes each group's extent, and the full-strength section board. That repairs the flight world's one named risk, monotony across eighteen games.

**Two physical planes, two colour channels that never cross.** The coloured board is the group's world; the checklist card is a constant bone/ink plane floating above it. State colour is therefore always read against the same neutral, never against six different grounds.

Palette extends to six full-strength group hues — oxide orange, chrome yellow, grass, teal, ultramarine, violet. **Vermilion is held out**: never a section, always the error. The state triad lives on the neutral plane alone — green nominal, amber caution, vermilion missed. One colour, one meaning, product-wide.

Light ground. The scene that forces it: a developer at their desk in the evening, room light on, a tab opened deliberately, about to learn something about themselves. A lit workspace, and a world made of print under working light.

Four raises inherited from the challengers that lost, each named for its donor:

- **cracktro** — state is a continuous physical quantity: weight, size and rule thickness move together. Never a colour swap alone.
- **nixie** — the figure is the interface at physical scale; the level and each dimension score are the largest objects on their screen, and a score changing is a visible event, never a silent re-render.
- **deep dive** — one vertical axis, the flight profile, rules the whole surface and replaces the progress bar. Every criterion pins to its exact point on it.
- **streetwear** — an unavailable or missed state takes a structural mark, never reduced opacity.

## Memorable moment

The tab rail at rest: six tabs, every one still pending, heights unequal because the groups are unequal. Before a single question is asked, the whole shape of what is about to be measured is already on the edge of the card.

## Anti-goals

No gamification, no confetti, no progress bar, no centred card on a soft gradient. No easing curves — this world steps, it does not fade.

## Unresolved, not to be invented by the builder

- The declarative fields beyond the pseudonym. Each must earn its place by improving the final narration; one that does not, goes.
- Which hue is assigned to which group. That depends on the organisers' grid, published 19/08.

## Provenance

Direction round, seed key `4e549641`, re-roll round 1, assigned card kept and raised. Le Manuel à Onglets and La Console Sombre were the competitive alternates; La File Cracktro, Le Compteur Nixie, La Plongée Mésophotique and La Grammaire Industrielle were declined and donated the four raises above.

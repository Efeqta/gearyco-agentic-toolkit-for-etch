# Building from a design handoff

Read this before writing any CSS for a site that comes from a mockup (XD, Figma,
PDF or PNG exports). It exists because Retech took roughly twice as long as a
harder project, and every hour of that went into spacing, size and colour
corrections that the handoff had already answered. See
`projects/retech/RETRO.md` for the measurements.

## 1. Find the authoritative source first

Rank the sources you were given and work from the top one:

1. **Design spec mode** — XD `<view-url>/specs/`, Figma dev mode, a style guide
   page. Gives exact hex, font family, weight, size, letter-spacing and element
   geometry. Always check whether the share link has it; on a set of links, some
   may and some may not.
2. **An exported token file** — ACSS export, a JSON/SCSS variables file.
3. **A measured export** — PNG or PDF comps, measured in code.
4. **A screenshot** — of the comp or of the built page.

A value from a lower rank never overrides a value from a higher one. PNG exports
carry compression artefacts and antialiasing: a near-white sampled from a PNG is
routinely one to four levels off, and black text antialiased over a tinted panel
samples as navy. If you must sample a PNG, sample the darkest ~0.5 % of pixels in
the region, never a mean.

## 2. Write TOKENS.md before the first stylesheet

`projects/<name>/TOKENS.md`, with provenance on every value — `spec`, `measured`
or `assumed`:

- Palette: brand, ink, body, muted, every surface tint, every hairline.
- **The surface map**: which design tint becomes `--bg-ultra-light`, which becomes
  `--bg-light`, which becomes `--shade-*`, and which tints are being dropped. A
  design with five near-whites and a framework with two slots needs this decision
  made once and confirmed, or it gets re-decided per section.
- Type scale: family, weight, size, line-height, letter-spacing, colour per level,
  at the comp's width; plus the intended mobile end of each ramp.
- Spacing: section padding block, container width, card padding, grid gaps, stack
  gaps, radii, icon sizes, button padding and line-height.

Confirm the table with the user, then build only from it. **If a screenshot later
disagrees with a confirmed token, report the mismatch — don't restyle to the
screenshot.** Re-deriving a value you already have is how drift starts.

## 3. One width in, every width out

A comp gives you one viewport. Build the rest with ACSS fluid tokens and
`clamp()`, not with breakpoints. A hand-written `@media` needs a one-line comment
saying why the fluid value couldn't do it. More than about five on a page means
the layout is wrong — reach for the content grid, `minmax()`, `auto-fit` or
`aspect-ratio` instead of another breakpoint.

Check mobile and tablet **when the section is built**, not in a sweep at the end.

## 4. Shared patterns get a shared stylesheet

Sections are patterns copied between pages (see AGENTS.md → Markup rules), so the
same BEM classes appear on several pages. Their styles live in **one** stylesheet
for the pattern, not a copy per page. Otherwise every spacing correction has to be
made in N files, and a missed one reads as "you didn't fix it".

## 5. One page per build turn, reviewed before the next one starts

A whole page in one turn is the right size. Two pages in one turn is not, and
building the rest of the site before the first page has been looked at is the
expensive mistake: the first page fixes the spacing, the tints and the class names
that every later page copies, so a wrong decision in it ships once per page.

Build the page, deploy, show it, stop. Say plainly that the next page is waiting on
a look at this one — especially the first page, which gets reviewed hardest.

Don't substitute a whole-site mockup sweep for that review. It fixes a dozen things
at once, so the user ends up checking a page that has moved under them rather than
checking the change, and the same item comes back two or three times. Small turns
are cheaper than one long one, even counting the extra round trips.

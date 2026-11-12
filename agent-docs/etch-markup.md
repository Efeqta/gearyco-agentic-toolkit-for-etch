# Etch markup reference

Detailed rules and examples for sections, containers, cards, lists, components, images and conditions. The short versions of these rules are in `AGENTS.md`.

## Sections (data-etch-element="section")

Section elements have the following CSS by default. Don't duplicate this CSS. Only override it when necessary.

```css
inline-size: 100%;
display: flex;
flex-direction: column;
align-items: center;
```

## Containers (data-etch-element="container")

Grouping content inside a section should be done with a "container" (a div with the attribute data-etch-element="container"). This ensures that the content width of the website stays consistent without having to put a max-width on every individual element.

- Containers have `inline-size: 100%;` and `max-inline-size: var(--content-width);` set on them by default. There's no need to write CSS for this.
- Containers have `margin-inline: auto;` by default. Don't duplicate this CSS.
- Containers have `display: flex;` and `flex-direction: column`; by default. Don't duplicate this CSS.

The standard pattern is section > container > content. There can be multiple sibling containers for multiple content groups.

## Cards

A card is its own BEM **block** — not an element of the parent section. The wrapper class uses a single hyphen: `.section-card`, never `.section__card`. Children inside the card are elements of the card block: `.section-card__title`, `.section-card__text`.

Choose a **semantically accurate HTML tag** for the card wrapper based on context:

- `<article>` for self-contained, independently meaningful content
- `<li>` when the card is a list item inside a `ul` or `ol`
- Other tags when the surrounding structure calls for them

Do not default cards to `<div>`. Do not reference `flex-div` or `data-etch-element="flex-div"` — it is deprecated.

Bad example:

```html
<article class="fx-spotlight__card">
  <h3 class="fx-spotlight__card-title">Title</h3>
</article>
```

Good example — cards in a collection (see Grids and Lists below):

```html
<ul class="posts-list" role="list">
  {#loop posts as post}
  <li class="post-card">
    <article class="post-card__inner">
      <h3 class="post-card__title">{post.title}</h3>
    </article>
  </li>
  {/loop}
</ul>
```

## Grids and Lists

Visually these are often laid out as a grid, but semantically they are usually a **list or collection of items** — not a child element of the parent section. The wrapper is its own BEM **block**: `.section-list`, `.posts-list`, never `.section__grid` or `.section__list`.

Choose a **semantically accurate HTML tag** for the collection wrapper:

- `<ul>` or `<ol>` for a collection of similar items — loop the `<li>`, not the card or item block inside it. When the item is a component, loop the component itself with its `tag` prop set to `li` (see Components)
- `<div>` only when the content is not actually a list (e.g. unrelated panels that merely share a grid layout)

The class name can describe layout (`-grid`) or content (`-list`) — either way it is a block, not a `__` element. CSS Grid handles the visual arrangement; the HTML tag carries the meaning.

Bad example:

```html
<div class="fx-spotlight__grid">
  <article class="fx-spotlight-card">…</article>
</div>
```

Good example — collection of items:

```html
<ul class="fx-spotlight-list" role="list">
  {#loop items as item}
  <li class="fx-spotlight-card">
    <h3 class="fx-spotlight-card__title">{item.title}</h3>
    <p class="fx-spotlight-card__text">{item.text}</p>
  </li>
  {/loop}
</ul>
```

Good example — non-list panels sharing a grid layout:

```html
<div class="fx-spotlight-grid">
  <article class="fx-spotlight-card">…</article>
  <article class="fx-spotlight-card">…</article>
</div>
```

## Components

A component is for an **element that repeats**, on one page or across the site: cards, buttons, badges, list rows, gallery photos, accordion items, timeline steps. The same component can look different (styles, themes) through a prop. Repeated elements **must be built as Etch components with editable props**, never as hand-built, repeated markup.

### When not to build a component

- **A whole section is rarely a component.** Default to plain markup on the page (section > container > content), with the repeating parts inside it as components. Before making a section a component, it has to pass this test: the same structure will appear at least twice, and only the content differs. "It might be reused" doesn't pass.
- Legitimate section components are the exceptions: CTA, contact, a full-bleed section that is just an image, header, footer.
- **Hero, media and content side by side, gallery, feature grid and similar sections are patterns, not components.** A pattern is a section with a common HTML layout and a shared BEM structure (`hero`, `hero__title`, …), so its CSS is defined once. The next page gets the same section by copying it from an earlier page and editing the content, instead of flipping props on a component. If a pattern needs a button, badge, card or photo, those are components placed inside it.
- **Reuse the pattern before building a new one.** If the site already has the section on another page (hero, media + content, gallery), copy it with the blocks copy/paste API (see `etch-copy-paste.md`; verify the method names on the live tab) and adapt the content. Reuse its existing classes; don't create near-duplicates (`hero-2`, `page-hero`). If the section doesn't exist yet, build it once as plain markup with a generic block name (`hero`, `media-content`, `gallery`).
- Keep patterns consistent: the same section keeps the same markup structure and class names across pages. Page-specific differences go in content and in modifiers (`hero--compact`), not in a different structure.
- Etch's own pattern library (the Insert command) is not readable by scripts and isn't part of these rules. Don't depend on it.
- A component that is too specific is a smell: fixed number of photos, fixed number of buttons, staggered layouts tied to one design. That's a page section.

### Subcomponents and slots

- **Optional or independently reusable parts are their own components**, not a boolean prop on the parent. A review badge, rating, button or label is built once and inserted where needed. Don't add `showBadge` / `hasReviews` props. The parent offers a slot, the page puts the badge instance in it, and the parent's CSS positions it.
- **Variable content goes in a slot.** Props are for simple values (a label, an image, a variant). If the content is a paragraph, a list, or other blocks, use a slot.
- **Lists of parts are parent plus item components.** An accordion is an `Accordion` component whose slot takes `Accordion Item` instances, each with a title prop and a slot for its body. Likewise a gallery with `Gallery Photo` items. Use the kit's `slot()` and `instance()`.

### Props

- **Group related props.** A component never has 10+ flat props. Put props that belong together in one `group` prop named for what they describe: `Primary Button` (label, url, target), `Secondary Button`, `Image` (image, alt, ratio), `Heading` (text, level). A component whose props don't group into a handful of groups is probably two components.
- **URLs are plain text props.** Don't use the `url` prop type: it isn't editable. A link is a text prop for the URL, plus a text prop for the target if needed.
- Every piece of content is a prop (text, image, `select` for variants) or a slot.

### Building them

- Create the component with `etch.components.createAsync(name)`, then define it with `etch.components.updateAsync(id, { name, key, description, properties, blocks })`. Place it with an `etch/component` block (`componentId`, prop values in `attributes`). The shared kit's `upsertComponent()` and `instance()` do both (see `etch-shared-helpers.md`).
- Reference props in the component's blocks as `{props.key}`.
- Heading levels inside a component are a `select` prop (e.g. `h2`, `h3`) applied through a dynamic element, not a hardcoded tag.
- Items that repeat across the site come from a loop over a data source (or content type) passing values into the component's props. Items that appear on one page only are instances with their props set directly (see Data sources).
- The component's classes follow BEM and its CSS lives on its own Etch selectors, like any other block.
- Don't build class names from props (`card--{props.variant}`): Etch only creates and links selectors for literal classes, so the modifier's CSS may never be output. Put the variant in a data attribute (`data-variant="{props.variant}"`) and style it nested in the base selector (`&[data-variant="featured"] { … }`), or let the parent set a scoped custom property.

**List items:** if a component is rendered as a list item but could also be used outside a list, its root must be the Etch dynamic element with the tag supplied by a component prop — never a hardcoded `li`. Use a `select` prop (e.g. key `tag`, options `li`, `article`, `div`, default the most common) and set the root to `<etch:element tag={props.tag}>` (block type `etch/dynamic-element`, with the tag in its attributes: `attributes: { tag: '{props.tag}', class: '…' }`). In a list, instances set `tag` to `li` directly inside the `ul`/`ol`; don't wrap the component in an extra `li`.

```javascript
const tagProp = {
  name: "Tag",
  key: "tag",
  type: { primitive: "string", specialized: "select" },
  selectOptionsString: ["li", "article", "div"].join("\n"),
};
```

## Data sources

A data source is for content that **repeats across the website**: the same items shown on several pages, or generated into pages. If content appears in one place, put it directly in the page's props, slots and markup.

- Feature cards, steps, FAQs and similar content that appears on one page are instances with their props set directly. Not a data source plus loop.
- A gallery needs no source per page. Build a single `Gallery Photo` component with an `image` prop and place instances on each page.
- Use **one global `company` source** for business data shared across the site: name, contact person, phone and email, address, opening hours, rating. Don't create separate sources for contacts, opening hours and reviews. Keep it a single object that header, footer, contact section and review badge all read from.
- Before creating a data source, state where its content is used. If the answer is one page, don't create it.

## Images

Images below the fold are lazy loaded: `loading="lazy"` and `decoding="async"` by default, including images inside components. The hero image (the largest above-the-fold image) is the exception: `fetchpriority="high"` and no lazy loading. If a component can appear in a hero, the loading behavior comes from the instance, not hardcoded.

When asked for images, favor the `<etch:img />` element instead of using a plain `<img />` element:

Bad example:

```html
<img src="{item.featuredImage}" /> // Don't do this
```

Good example for a static use (e.g. no loop), with the URL — use loop key `.featuredImage`:

```html
<etch:img src="{item.featuredImage}" />
```

Good example for a dynamic use (e.g. inside a loop), with the ID — use loop key `.image.id`:

```html
<etch:img mediaId="{item.image.id}" />
```

Important:

- The key for the URL is loop key `.featuredImage`
- The key for the ID is loop key `.image.id`
- Keys loop key `.featuredImage.id` and loop key `.featuredImage.url` do not exist

## Conditions

Do not use conditions in defensive programming techniques by default. Act from the assumption that content is available.

Only use conditions when the user requests it, or when it really makes sense.

Conditions and dynamic data in Etch do not support inline fallbacks. Consult the Etch docs (`docs.etchbuilder.io`, or the connected tab's guide via `etch.skills.get()`) whenever you need to know how to use conditions or comparisons.

Bad example:

```html
{#if featuredImage }
<!-- content -->
{#else}
<!-- other content -->
{/if}
```

Good example:

```html
{#if featuredImage }
<!-- content -->
{/if} {#if !featuredImage }
<!-- other content -->
{/if}
```

Bad example:

```html
<etch:img src={item.featuredImage ?? "url-to-fallback-image.jpeg"} />
```

Good example:

```html
{#if featuredImage }
<etch:img src="{item.featuredImage}" />
{/if} {#if !featuredImage }
<etch:img src="url-to-fallback-image.jpeg" />
{/if}
```

## Full pages

If you are asked to build a full page, do not wrap sections in a main tag. Just provide the page section by section.

Bad example:

```html
<main>
  <section></section>
  <section></section>
</main>
```

Good example:

```html
<section></section>
<section></section>
```

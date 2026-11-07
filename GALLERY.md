# Design gallery format — `design-repo@1`

A **design gallery** is a git repository holding one directory per page design. The Stoily Codespace
kit clones your org's gallery (the Feature option `galleryRepo`, default `<org>/gallery`) into
`<workbench>/gallery`, Codex reads designs from it, and `save --design <name>` writes one back.
This file is the format; the kit's validator checks it (`save --design` runs it).

```
 <org>/gallery
 ├─ README.md            optional, ignored by readers
 ├─ .gitattributes       recommended: "* -text" (bytes stay exact)
 └─ <id>/                one directory per design
    ├─ design.json       required  the design's card (7 keys + optional browse)
    ├─ content.html      required  the design as a page
    ├─ kit.json          required  the design kit: CSS + slot-marked sections
    ├─ cover.jpg         optional  preview image
    └─ README.md         optional  human notes
```

## The repository

- The kit reads and writes the gallery's **`main`** branch.
- Readers take every **non-dot directory directly under the root** as a design and ignore root files
  and dot entries (`.git`, `.github`, …).
- Nothing else is allowed inside a design directory: **no other file, no subdirectory, no symlink**,
  and no tool or agent configuration (for Codex: `.codex/`, `AGENTS.override.md`). A design that breaks
  any rule here is invalid: `save --design` never publishes one, the kit's `sync` names each invalid
  design it pulls, and Codex is told to skip any design that breaks these rules.
- Every file is UTF-8 (except `cover.jpg`). JSON files are written canonically: keys sorted by code
  unit, 2-space indent, one trailing newline. Readers parse them, so formatting is not load-bearing.

## `<id>` — the directory name

The design id: `^[a-z0-9-]{1,40}$` (lowercase letters, digits, `-`; no dot, slash or uppercase). It
must equal `design.json`'s `id`. A name you choose for a design saved from a page (`save --design`)
follows the same rule.

## `design.json` — these 7 keys, plus an optional `browse`

| Key | Type | Meaning |
|---|---|---|
| `schema` | `"design-repo@1"` | this format |
| `id` | string | = the directory name |
| `title` | non-empty string | the design's display name |
| `kind` | string | what it builds; `"page"` |
| `tags` | array of strings | free-form style / industry tags |
| `cover` | `"cover.jpg"` or `null` | `null` when there is no `cover.jpg` |
| `slots` | object | a summary of `kit.json`: `{ total, byKind: {button, heading, image, text}, sections: [{key, label, items, slots}] }` — descriptive only |
| `browse` | object, **optional** | facts for browsing the gallery (below); a design without it is valid |

No other key. A design never carries the prompt or brief that made it, an account, store or owner
id, a source URL of private material, customer data or a credential.

### `browse` — optional browsing facts

Every key is optional and no other key is allowed. Lengths count characters (Unicode code points).
The vocabulary is open: any value within the bounds is valid. A list is always an array: `null` is
refused for a list key (omit the key instead). The storeXstore gallery exporter writes all 10 keys (an
unknown string as `null`, an unknown list as `[]`); `save design` in the kit writes no `browse` at all.

| Key | Type | Bound |
|---|---|---|
| `description` | string or `null` | ≤ 1000 characters |
| `category` | string or `null` | ≤ 60 |
| `pageType` | string or `null` | ≤ 60 |
| `style` | string or `null` | ≤ 60 |
| `market` | array of strings | ≤ 8 items, each ≤ 40 |
| `locale` | array of strings | ≤ 4 items, each ≤ 40 |
| `industry` | array of strings | ≤ 6 items, each ≤ 40 |
| `aesthetic` | array of strings | ≤ 4 items, each ≤ 40 |
| `density` | string or `null` | ≤ 40 |
| `palette` | string or `null` | ≤ 40 |

## `kit.json` — the design kit (StoredPack v1)

```
{ "v": 1,
  "css": "<the design's stylesheet, verbatim>",
  "sections": [
    { "key": "s0", "label": "<the section's CSS classes>", "items": 0,
      "row": { "type": "row", "props": {…}, "style": {"cssClasses": "…"}, "children": [ … ] },
      "slots": [ { "id": "s0.0", "kind": "heading", "sample": "…", "level": 1 } ] } ],
  "icons": { "<hash>": "https://…" } }
```

- `v` = 1; `css` a string (may be `""`, see "Saved from a page"); `sections` a non-empty array.
- Each section's `row` is a canvas node tree (`type`, `props`, `style`, `children`; node types such as
  `row`, `column`, `text`, `heading`, `buttons`, `button-item`). Editable leaves carry slot markers:
  `slot` (a slot id), `template` (markup with `{{s1.0}}` placeholders) and `item` (the repeating column
  a slot belongs to). `items` counts a section's repeating columns (0 = none).
- Each slot: `id` (`s<section>.<n>`), `kind` (`heading` · `text` · `button` · `image`), `sample` (demo
  copy, never shipped as a client's words), optional `level` (headings) and `item`.
- `icons` (optional) maps icon hashes to https URLs. Unknown top-level keys (e.g. a later
  `sectionKit` extension) are tolerated and kept.

## `content.html` — the design as a page

Starts with the design's canvas document in a JSON script element, optionally followed by the same
page rendered as static HTML:

```
<script type="application/json" data-soc-canvas>{"schema":"…/canvas@1","body":[ … ],"meta":{"title":"…"}}</script>
<section>…</section>
```

Readers treat it as opaque text: non-empty, well-formed UTF-8. It may contain an `html` node with the
design's `<style>`; that is for the platform the design came from. **Codex never sends an `html` node
or page CSS to Stoily** (Stoily refuses both); it builds with Stoily's own tools (below).

## `cover.jpg` and `README.md`

- `cover.jpg`: a JPEG (`FF D8 FF`), at most 2 MB; 720×450 is the usual size.
- `README.md`: free markdown for people (title, id, tags, a licence line). No provenance line.

## Saved from a page (`save --design`)

Codex can write the page it is working on back as a design, **with the client taken out**: every word
of the page becomes neutral placeholder copy (the slots' `sample`), and image sources and links to the
client's domains are removed — a gallery is shared by every client of the org. `content.html` holds the
page's document as Stoily's `read_page` returns it (after that replacement), `kit.json` has one section per top-level section of
the page (its node tree, editable leaves marked as slots) and **`css: ""`** — Stoily's tools do not
expose a page's design stylesheet, so a design saved from a page carries its layout and classes,
not its style. Codex writes it to `stoily/designs/<name>/` in the client folder (its sandbox allows
no other place); `save --design <name>` (run by you) validates it, copies it to
`<workbench>/gallery/<name>/` and pushes only that directory to the gallery repo.

## How Codex uses a design with Stoily

The Stoily MCP never reads GitHub: Codex reads the local files and drives Stoily's tools.

- **list designs** — the directories of `gallery/` with each `design.json` title and tags.
- **use design `<name>`** — Codex rebuilds the layout with `create_page` + `apply_page_changes` from
  Stoily primitives (`pagebuilder-*` classes, theme tokens), following the kit's section order and slot kinds,
  every slot filled with the client's own copy (the kit's `sample` text is a guide, never copied), and
  says the design's own style could not be applied: Stoily's design catalogue is empty, so
  `build_page_from_design` is used only when you ask for a catalogue design by name.
- **No CC BY-SA image in a gallery entry.** A gallery is copied into other orgs' stores; a ShareAlike
  photo (fine on one store, credited from its `sources.json`) carries its licence along. A design's
  images are placeholders or CC0 / public domain only.
- **Not possible today:** building a page from a design that exists only as local files *with its
  style*. Stoily's connector builds styled pages only from catalogue designs; an inline design build
  would need a new Stoily API tool.

## Mirroring a private master gallery

Keeping several org galleries in step with one private master gallery is the master owner's own
GitHub Action in their own repository (for example: on push, copy the opted-in design directories into
each org's gallery repo with a token scoped to those repos). It is not part of this kit.

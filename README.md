# Stoily Codespace

Build and manage [Stoily](https://stoily.com) stores with **Codex** and the **Stoily MCP**, from a
GitHub Codespace. One Codespace serves many stores: each store is its own private repo,
`<org>/store-<storeId>`, cloned into `clients/<storeId>/`, and Codex started in that folder works on
that store only. The store id never changes; the store's name and domain can, and the kit picks them
up by itself. Every design change lands as a DRAFT the merchant publishes. The few LIVE changes
(catalog, logo, images, store settings) always ask you first, auto mode too. Every change is recorded
in the store's repo as the person who made it, so "what changed", "who changed the phone number" and
"undo that" are questions you ask Codex. There are no commands to remember: you type what you want,
and Codex guides you (see [Auto mode](#auto-mode-on-by-default)).

This repo is **the starter**: a GitHub template repository. **Use this template** gives your org its
own `<org>/codespace` repo (`.devcontainer/stoily.json` with your org's values, the `devcontainer.json`
rendered from it, the updater workflow, `.gitignore`, `prompts/`).

Everything that runs inside the Codespace — Codex, its locked config, the rules and the programs
below — comes from **the kit**, the [Dev Container Feature](https://containers.dev/implementors/features/)
`ghcr.io/stoilyhq/codespace/stoily`, which that devcontainer.json pulls on every Codespace creation
and every **Rebuild container**. The Feature is published by Stoily; its source is not public. The
org's updater re-renders its `devcontainer.json` from the latest tested template, so every org stays
current with nothing to copy (except, rarely, a new updater).

```
 stoilyhq/codespace (this repo, public, Template repository)
 ├─ .devcontainer/  prompts/   the STARTER → "Use this template"
 │   devcontainer.json  the TEMPLATE (Feature :<major>, YOUR-ORG)
 │   stoily.json        your org's values (org, owner, …)
 ├─ .github/stoily-render.js + workflows/stoily-update.yml
 │                  the UPDATER (runs only in an org's copy)
 └─ .github/workflows/test.yml release.yml + test/
                  the template's tests — run ONLY here

 ghcr.io/stoilyhq/codespace/stoily:<major>   the KIT (Feature)
   Codex + its locked settings, the rules, go work save
   sync check …   (published by Stoily)
        │
        ▼
 <org>/codespace (yours, private)    <org>/store-<storeId> (one per store)
 ├─ .devcontainer/stoily.json         ├─ AGENTS.md  STORE_ID+NAME+HOST
 │    YOU edit                        ├─ stoily/    snapshots, and
 ├─ .devcontainer/devcontainer.json   │   log/ state/  every change:
 │    GENERATED: Feature + <org>/*    │   who, when, before → after
 ├─ prompts/     your own briefs      └─ source/    fetched pages,
 └─ clients/<storeId>/                              never committed
      ← every store repo, cloned by sync
```

Older client repos, `<org>/client-<name>` (the `clientPrefix` option), keep working as they are: they
are cloned into `clients/<name>/` and open, save and upload as before. To give one its store's own
repo, say **"move `<store>`"** in Codex (see [A new client store](#a-new-client-store)).

**Codex is the only AI tool here, and it is locked down** (the kit's Codex config, re-applied on every
start): its sandbox lets it WRITE files only inside the folder it was started in, its shell has no
network (so on its own it cannot push, download or install), its web search reads only OpenAI's
cached index (`web_search = "cached"`, never a live fetch from the Codespace), and only the Stoily
tools for design, catalog, store settings and creating a store are enabled — every LIVE change
(creating a store, catalog, images, settings, publishing) asks you first, auto mode too; no domains,
DNS or members. The only MCP server is the kit's own `stoily` program: it passes Codex's calls on to
`https://api.stoily.com/mcp`, refuses any call that names another store than the folder's own (its
answer starts `stoily-kit refused`; the call never reaches Stoily), and records every change in the
store's repo. Pushing to GitHub is `save` (commits only `stoily/` and `AGENTS.md` to the store's repo;
the record of each change is committed and pushed by the kit itself); downloading a page is `fetch-site`; photos, uploads and the
storefront check are `photos`, `upload-images` and `site-check`: programs YOU run (or approve when
Codex asks): `photos` and `upload-images` reach only their fixed hosts (`upload-images` only this
folder's committed store), `site-check` only the host its
command line names (and this store's own folder on Stoily's media CDN, where its images live). `check` proves the lock.

### The locked settings (`/etc/codex/requirements.toml`)

Codex's own settings (`~/.codex/config.toml`) are only defaults a person could change. The ones that
matter are also pinned by **`/etc/codex/requirements.toml`**, a file owned by root that the kit's Codex
reads on every start and runs under, whatever `~/.codex/config.toml`, a `-c` flag or `CODEX_HOME` says.
Codex does not refuse another value: it runs with the allowed one instead and says so at start
(`codex doctor` lists it as a startup warning). The kit installs it, the same for every org (no option changes it), and it holds
exactly these 7 settings (the file also has a few `#` comment lines and blank lines, 14 lines in all;
`check` proves it is byte-equal to the kit's own copy):

```toml
allowed_approval_policies = ["on-request"]
allowed_sandbox_modes = ["read-only", "workspace-write"]
allowed_web_search_modes = ["cached"]
[mcp_servers.stoily]
identity = { command = "/usr/local/share/stoily-codespace/libexec/stoily" }
[permissions.filesystem]
deny_read = ["/workspaces/.stoily-kit/**", "~/.stoily-kit/**"]
```

That is: Codex always asks before leaving its sandbox, never runs without one, searches only the cached
web index, has the kit's `stoily` program as its ONLY MCP server (any other server is switched off), and
its sandbox cannot read the kit's Stoily sign-in. Nothing in it concerns the ChatGPT sign-in: sign in
to ChatGPT as before.

The honest limits — this is a lock on Codex, not on the person at the keyboard:

- **`sudo`.** The default Codespace image gives its user passwordless `sudo`, and with it anyone can
  edit or delete the file.
- **A Rebuild with an edited `devcontainer.json`.** A person who can rebuild their Codespace from a
  changed `devcontainer.json` (one without the Feature) gets a Codespace without the kit and its file.
- **The Codex version.** Codex older than 0.76 ignores the file; the kit installs 0.167.0 by default (the
  `codexVersion` option), and a `codexVersion` below 0.167.0 fails the Codespace's build.
- **`CODEX_HOME`.** Starting Codex with `CODEX_HOME` pointing elsewhere drops the kit's `config.toml`
  (its rules, its asks and its tool list), but not the locked settings: Codex reads
  `/etc/codex/requirements.toml` at that fixed path whatever `CODEX_HOME` says
  ([TESTING.md](TESTING.md) K8 checks it).
- **Another Codex, or `codex sandbox --permissions-profile`.** The locked settings bind the kit's
  Codex, not the person at the terminal: anyone with a shell here can run another Codex (one below
  0.76, installed with npm into their home, ignores them) or call `codex sandbox --permissions-profile …`,
  which skips them by design. What holds against that is Stoily's own check of every call (the
  person's role on the store, and what the sign-in was granted); the kit's check on every call (this
  folder's store only) holds for the kit's Codex, not for someone who reads the kit's sign-in from
  their own terminal.
- **The rules are a strong default, not a wall.** "Stoily store work only" (anything else is declined
  in one line: `I only work on Stoily stores here.`), the store card's yes and the yes before every
  live change are Codex's rules, and Codex's own approval prompt on a live call is set in the kit's
  `config.toml`: a person can talk Codex out of the first and edit the second. The walls are the kit's check on
  every call (this folder's store only), each person's own Stoily role on each store, and GitHub's repo
  permissions.

**What the lock does NOT do — read this before you put two clients or two agencies in one Codespace:**

- **Codex can READ** everything the Codespace user can (other store folders, the ChatGPT sign-in in
  `~/.codex/`) except the kit's Stoily sign-in; the sandbox limits writes and shell network, not reads.
- **Codex can ASK to run a command outside its sandbox** (approval "on request"). A yes gives that
  command the network and the Codespace's GitHub access. Answer No to everything except the kit's
  `save`, `photos`, `upload-images <host>` and `site-check <host>` — and read the command line first: exactly
  that program, no `&&`, no other program, no environment variable in front of it. `site-check`'s line
  names the host it will reach: approve it only when that is THIS store's storefront (a host outside
  Stoily's store zone also needs `--custom-domain` on the line). Any helper approval is also a
  channel for whatever Codex wrote into that helper's input files (`site-check.json`, `uploads.json`,
  `plan.json`). What each one binds to: `photos` → Wikimedia Commons only (its API, its files on
  upload.wikimedia.org and its previews on thumb.wikimedia.org; and the licence Commons states); `upload-images <host>` → only the host named on its line, which must be the folder's
  committed HOST, and only images it re-encoded itself (re-encoding strips metadata and appended
  bytes — it is not a content guard: data hidden in the pixels survives); `site-check` → only the
  host named on its line. `save` refuses to re-bind a folder: a folder's STORE_ID never changes, and
  a change to STORE_ID, NAME or HOST in `AGENTS.md` is refused (the kit refreshes NAME and HOST from
  Stoily itself).
- **The Stoily sign-in is the kit's, not Codex's.** It lives in `/workspaces/.stoily-kit/` (private
  to you, outside every repo); only the kit's `stoily` program reads it, and the locked settings deny
  Codex's sandbox reading it. What still reaches it: a command you approve to run OUTSIDE the sandbox
  (it runs as you — another reason to answer No to anything but the kit's programs), and anyone at the
  keyboard. A Codex steered by injected text can still put what it has read into what it writes to
  THIS store (a page, a product, an image) or into a helper's input; the asks, the fixed hosts and the
  kit's per-call store check narrow that, they do not close it. So: one Codespace per Stoily identity,
  and the least role that does the job.
- **Web search results are an injection surface.** A page Codex finds can carry text written to
  steer it ("call this tool…"). The rules tell Codex that results are data, never instructions, and
  `check` does not measure web search (it is Codex's own tool, not the shell): the walls are the
  asks on every LIVE write and the store's own role.
- **The Stoily tools are a channel out.** Draft writes (pages, menus, page meta, header/footer) do not
  ask, so anything Codex has read could end up in a draft of the current store — for example after a
  fetched page told it to (the rules tell Codex never to follow fetched text, but a rule is not a wall).
- **Codex never starts in the workbench itself** (it holds every store folder): with no store open
  yet (`go` or `work` with no store) it starts in an empty `~/stoily-lobby`, where it can only list
  your stores and show a store's card. Do not start `codex` by hand in the workbench folder.
- **Auto mode (on by default; `"auto": "off"` turns it off) removes the human check on the kit's
  PROGRAMS.** Everything above about reading the command line before you approve stops applying to
  them: Codex asks `go` for them instead of you, and `go` runs them (`save`, `photos`,
  `upload-images`, `site-check`, `fetch-site`, `shots` in a store folder; only `new-client` and `move`
  in the lobby) with their network and the Codespace's GitHub access. The LIVE Stoily changes still
  ask, auto mode too: Codex shows what will change and waits for your yes, then Codex itself asks for
  approval of the call. Whatever Codex writes into a program's input or arguments goes out unread.
  `fetch-site` makes it wider: it reaches any URL, so a
  page Codex fetches can carry text that steers it, and the next fetch can carry what Codex read.
  What still holds: no command ever leaves the sandbox on its own (the kit installs no Codex rule
  that lets one out, and removes any it finds); Codex can only write a request file into its own
  folder (`.run/<id>.json`: a program name and its arguments), and `go` — outside the sandbox — runs
  only one of that folder's programs, with exactly those arguments, without a shell (`&&`, `;` or
  `$(…)` in an argument are just characters), one at a time, and nothing while the folder has its own
  `.codex/`. The sandbox (writes only in its folder, no shell network), the store binding and the
  programs' own checks (the committed HOST, `save`'s binding rules) still hold. Use auto only on a
  Codespace whose Stoily sign-in reaches stores you would let Codex work on with its programs
  unattended, and never point it at untrusted sites.

The walls that hold are server-side and per person: **one Codespace per Stoily identity** (and per
agency), each person's own Stoily role on each store, and GitHub's repo permissions.

| Program | Does |
|---|---|
| `go` | the whole first run in order (pull → setup → store → check → logins → check → Codex); stops at the first ❌. Runs by itself in a new Codespace's first terminal; with no store open yet it opens the lobby, where you say "open a store" |
| `check` | prove the lock (no AI, no sign-in) |
| `work [<folder>]` | one tmux session `stoily`: a window per store folder (or just that one) |
| `sync` | clone / pull every store: each `<org>/store-<storeId>` repo, and each older `<org>/<clientPrefix>*` repo, this Codespace can see |
| `save "<what>"` | commit `stoily/` + `AGENTS.md`, push the store's repo (as you); after a conflict, `save --take-remote` takes GitHub's version ("keep theirs" in Codex, with your yes) and `save --restore <file> --from <branch>` then brings your version of a file back from the `conflict/…` branch the conflict line named ("keep mine") |
| `save --design <name>` | publish the design Codex wrote to `stoily/designs/<name>/` into the org's gallery repo (validated, only that directory) |
| `new-client <storeId> <host>` | open a store here: create `<org>/store-<storeId>` (or re-open the folder this Codespace already has for it). With auto mode on, Codex asks `go` to run it after the store card's yes when you say "open a store"; type it yourself only with `"auto": "off"` (`<host>` = the store's main domain) |
| `new-client --pending` | the same, with no store yet: Codex creates the store (`create_store`, asked first) and the kit links the folder to it |
| `move <storeId>` | give an older `<org>/client-<name>` repo its store's own name, `<org>/store-<storeId>`. Say "move `<store>`" in the lobby Codex |
| `fetch-site <url> [--images]` | download a page for Codex to rebuild → `source/` |
| `photos fetch <plan.json>` / `photos finish <picks.json>` | licence-safe photos from Wikimedia Commons: previews + contact sheets in `source/photos/`, then crops in `stoily/assets/` + credits in `stoily/assets/sources.json` |
| `upload-images sizes` / `upload-images <host>` | `sizes` (offline, Codex runs it): the re-encoded size of each `stoily/assets/` image, for `create_image_upload`. `<host>`: send each image, RE-ENCODED (never the file as read; metadata stripped, not a content guard), to the one-shot upload URLs in `stoily/assets/uploads.json` — only `…/uploads/<host>/<token>` URLs, `<host>` = this folder's COMMITTED HOST (no sign-in read) |
| `site-check <host> [--custom-domain]` | read the live storefront against `stoily/site-check.json`: `<host>` must be this folder's HOST (and on Stoily's store zone, else `--custom-domain`); a table, exit 1 on a ❌ |
| `logo <in.svg> <out.png>` | render an SVG wordmark (Chinese via Noto CJK HK) to a PNG, offline — Codex runs it in its sandbox |
| `setup` | re-apply the lock (the Feature runs it on create and on every start) |

## Set up an org (all on github.com)

You need a GitHub org for the store repos (one org per team, company or client group — whatever
separation you want: there is one Codespace setup per org, no groups inside it). The org gets its own
private repo **`<org>/codespace`**, made once from this repo with **Use this template**; every
Codespace of the org is created from THAT repo, never from `stoilyhq/codespace` (a Codespace can only
be given write access to repos of its own repo's owner). Inside a Codespace that repo's clone is
called the **workbench** (`/workspaces/codespace`). Every `<org>/store-<storeId>` repo (and every
older `<org>/client-<name>` repo) the Codespace can see is a store: there is no list to keep. Keep
them in a GitHub **organization**: for a personal account GitHub lists only its PUBLIC repos, so a
private store repo there is found only once cloned (opened in that Codespace), and `check` says so.

```
 stoilyhq/codespace ── Use this template (once) ──▶ <org>/codespace (private)
   .devcontainer/devcontainer.json (template) ──updater, daily──▶ devcontainer.json
                                   <org>'s stoily.json ──┘        (generated)
   ghcr.io/…/stoily:<major> (the kit) ──pulled on every create/Rebuild──┘
                              Codespace ─ clients/<storeId> ← <org>/store-<storeId>
```

0. Once per org: **a new org has Codespaces switched off.** Org Settings → Codespaces → General →
   **Codespaces access → Enable for all members** (or selected members) → Save. Leave Ownership on
   "User ownership" for "member pays" (see Billing).
1. github.com/stoilyhq/codespace → **Use this template → Create a new repository**: owner **`<org>`**,
   name **`codespace`**, **Private**.
2. In the new repo open **`.devcontainer/stoily.json`** → ✏️ edit: set `"org"` to your org (replace
   `YOUR-ORG`). That is the only edit a new org needs; the other values (below) are optional and can
   stay as they are. **Commit changes.**
3. The commit starts the **updater** (Actions → `stoily-update`, ~30 s): it renders
   `.devcontainer/devcontainer.json` from the stoilyhq template and your `stoily.json` (the `<org>/*`
   Codespaces grant and the Feature's options) and commits it. Wait for that commit. If it did not
   run: Actions → stoily-update → **Run workflow** (and, if the org disables Actions, allow them for
   this repo).
4. **Code → Codespaces → Create codespace**. Approve the repository access it asks for (write access to
   `<org>/*`, so it can push the store repos).
5. Nothing to type in the terminal. The first terminal signs you in to ChatGPT as before (it shows a
   code to enter on a web page) and to Stoily as **Stoily Codespace** (open the link it prints, sign
   in, tick **"All my stores, including future ones"**, approve, then paste the address your browser
   ends on back into the terminal — see [Sign-ins](#sign-ins-chatgpt-and-stoily)), checks
   that everything is locked down, then opens Codex. This works the same for any GitHub account, the
   `owner` or not.
   - No store open yet? Type **"open a store"** (or "set up a client") in Codex. It lists your Stoily
     stores by number; answer with the number, the name or the domain. Codex shows that store's card
     — its name, every domain, your role, the end of its id — and asks **"Is this the store? Say yes
     to open it."** Only a yes opens it (a number or a name just shows a card). Codex then creates the
     store's private repo `<org>/store-<storeId>`. If GitHub does not let the Codespace create it,
     Codex gives you a GitHub link: open it, click **Create repository**, then type "done".
   - Codex then opens that store, and its first line is **"You are working on `<name>` — `<domain>`"**.
     Say what you want built, in your own words: Codex writes a plan (the intake), shows it to you,
     and builds once you approve it.
   - Every Codespace of the org picks the new store up at its next `sync`. Later, type "continue
     `<store>`" (its name or domain) to go back to it.

   After a **Rebuild container** the first terminal runs `go` again and signs you in again only where
   a sign-in is missing. You can always run `go` yourself.

Your copy also carries this repo's `test/` and docs: unused in your Codespace, and the test + release
workflows are switched off outside `stoilyhq/codespace`.
Delete them if you like; keep `.devcontainer/stoily.json`, `.github/stoily-render.js` and
`.github/workflows/stoily-update.yml` (the updater).

The Codespace is the lock on Codex, not on people; who may do what is GitHub's (org membership and repo
permissions) and Stoily's (each person's role on each store).

### Feature options

They live in your **`.devcontainer/stoily.json`**; the updater copies them into the Feature's
options in `devcontainer.json` (never edit that file: the next render replaces it):

```json
{
  "org": "your-org",
  "owner": "",
  "maxHours": "6",
  "clientPrefix": "client-",
  "galleryRepo": "",
  "auto": ""
}
```

| Option | Default | Meaning |
|---|---|---|
| `org` | (required) | GitHub org of the store repos; the updater also writes the `<org>/*` Codespaces grant from it (`check` fails if the two ever differ). `YOUR-ORG` is refused. |
| `clientPrefix` | `client-` | Only for OLDER repos: before kit 3.10 a client repo was `<org>/<clientPrefix><name>`, and `sync` still clones every such repo it can see. A new store is always `<org>/store-<storeId>`, whatever this says. Never empty. |
| `owner` | `""` | GitHub login whose terminals keep a shell (Codex opens there too; closing it leaves a shell or the `work?` prompt). Every other account's terminal is Codex only (`go --loop`): saved and reopened when it closes. Empty = everyone keeps a shell. Optional: nothing needs it set. |
| `maxHours` | `""` | Soft daily cap (whole hours of Codex, UTC day) for `go --loop` terminals. Empty = none. |
| `galleryRepo` | `""` | The org's design gallery ([GALLERY.md](GALLERY.md)), cloned into `<workbench>/gallery` by `sync` when it exists and this Codespace can read it (otherwise skipped without a word). Empty = `<org>/gallery`; a repo name in the org, or `owner/name`. |
| `auto` | `""` | **Auto mode is on by default.** `""` (the default) or `"on"` = auto mode: you type one sentence and Codex does the rest — `go` runs the kit's programs it asks for, Codex asks no clarifying questions besides which store (and its card's yes), which waiting store and the intake's plan (otherwise it picks a default and writes each choice under "Choices" in `stoily/progress.md`), and `go` keeps the Codespace awake while Codex works. Every LIVE change still asks for your yes, auto mode too, and so do an undo ("undo that") and "keep mine" / "keep theirs" after a conflict (its `save --take-remote` / `save --restore`). `"off"` = Codex also asks before every program, and a store is opened in the terminal (needs kit 3.9 or later AND this repo's current `.github/stoily-render.js` in your copy: an older one refuses `"off"`). Nothing else is accepted. Read [Auto mode](#auto-mode-on-by-default) and the auto paragraph in "What the lock does NOT do". |
| `codexVersion` | `0.167.0` | The `@openai/codex` npm version installed into the image (the Feature's option; not in `stoily.json`). The default is the version this kit release was tested with; `latest` takes the newest. A version below `0.167.0` fails the build: an older Codex does not enforce the locked settings. |

An invalid value fails the updater's run (nothing is committed; the run's log names the value); an
invalid option that reaches the Codespace fails its build with the option's name. Fix it and rebuild.

### Auto mode (on by default)

Auto mode needs nothing in `stoily.json`: `"auto": ""` (or no `auto` line) means on. The whole job is
said in Codex — no terminal:

```
 lobby Codex — you: "open a store"
   │ list_stores → your stores, numbered:
   │   1. Acme Clocks — clocks.example.com …
   │ you: "1"
   │ Codex shows the store card and waits:
   │   Acme Clocks
   │   Domains: clocks.example.com (main)
   │   Your role: Owner
   │   Store id ends …4f2a9c
   │   Is this the store? Say yes to open it.
   │ you: "yes"
   │ asks go: new-client <storeId> -b intake
   ▼
 go ends the lobby Codex and starts Codex in
   clients/<storeId> (repo <org>/store-<storeId>):
   "You are working on Acme Clocks — clocks.example.com"
   then the intake: it asks what you want, writes a
   plan, shows it, and builds after you approve (it asks
   go to run photos, upload-images, site-check, save;
   each LIVE change asks for your yes first)
```

- Say it in the lobby (the Codex a terminal opens when no store is open yet): **"open a store"**
  ("set up a client", "add a client" and "set up a store" mean the same). Codex lists your Stoily
  stores by number; answer with the number, the name or the domain. Codex shows that store's card and
  asks "Is this the store? Say yes to open it." Only a yes opens it — yes, y, yeah, yep, correct,
  that's it, 是, 對, 对; a number or a name only shows a card. Codex takes the store's id from Stoily:
  you never type it, and you never name the store (Stoily does). Then Codex opens the store: describe
  the site in your own words and approve the plan. You can also say it all at once ("open
  `<store>`: a shop for handmade clocks") or name a brief ("open `<store>`, build demo-store", a
  prompt in `prompts/`).
- **"set up a new store"** (optionally "…: `<what you want>`"): no list and no card; Codex opens a new
  folder, and its first live change is creating the store, after your yes (see
  [A new client store](#a-new-client-store)).
- If GitHub does not let the Codespace create the repo (any account, an org or a personal one), Codex
  shows you a GitHub link: open it, click **Create repository**, then type "done" and Codex carries on.
- A store with no domain cannot be picked yet: one still being set up → Codex says to try again in a
  minute; one Stoily could not finish creating, or a ready one with no domain yet → pick another.
- A store already opened in this org: "continue `<store>`" (its name or domain). It shows the card
  too; after your yes the store opens as it is: say what you want built (or "build `<brief>`") there.
- **Every LIVE change asks, auto mode too.** Before each one (a price, a product, a category, the
  logo, an image, a store setting, creating a store, publishing) Codex says in plain words what will
  change on `<name>` — `<domain>` (before → after), ending "— yes to go ahead?", and waits for your
  yes; one yes covers the one list it showed you. Codex then shows its own approval prompt for the
  call. Creating a store and publishing always get a yes of their own.
- Besides those (which store and its card's yes, which waiting store, the intake's plan, each live
  change's yes), Codex never asks: where something is not said, it picks the default and records each
  choice under "Choices" in `stoily/progress.md`. Read it afterwards.
- Codex works on Stoily stores only: anything else gets one line, "I only work on Stoily stores
  here.", and what it can do. Type "help" for a short list.
- What auto does NOT change: the sandbox (writes only in its folder, no shell network), no domains,
  DNS or members, other stores stay out of reach, page changes stay drafts, and publishing a store
  Codex did not create stays a click in Stoily admin.
- **Idle timeout: create the Codespace with a 240-minute one.** GitHub cannot change the timeout of
  an existing Codespace: set GitHub → Settings → Codespaces → **Default idle timeout** to 240 before
  you create it (or `gh codespace create --idle-timeout 4h`). Auto keeps the Codespace awake only
  while Codex is working (a session active in the last 30 minutes); after that it stops at its
  timeout as usual.
- **Turning it off:** set `"auto": "off"` in `stoily.json`. Codex then also asks before every
  program, and a store is opened in the terminal (`new-client`, see
  [A new client store](#a-new-client-store)). Only this needs your org's copy of
  `.github/stoily-render.js` to be this version (the updater does not update it; an older one refuses
  `"off"`): copy it from this repo first.

### Updates and versions

The template pins the Feature's major version (`stoily:<major>`, the one in
`.devcontainer/devcontainer.json`): every Codespace creation and every **Rebuild container** pulls the
newest release of that major, so fixes reach every org with no change on your side.
A Stop/Start (restart) keeps the old container and its kit: after a kit release, **Rebuild container**,
then `check | grep "kit v"`; if it still shows the old version, Command Palette (Ctrl/Cmd+Shift+P) →
**Codespaces: Full Rebuild Container** (slower: it builds without the image cache).
A change that needs a new major or a new setting comes with a new **template**, and the
**updater** brings it to your org by itself:

- `.github/workflows/stoily-update.yml` runs **daily**, on **Run workflow**, and on every commit that
  changes `.devcontainer/stoily.json`. It asks GitHub for the latest **successful release run of
  stoilyhq/codespace triggered by a push to main** and fetches `.devcontainer/devcontainer.json` AT that
  run's commit (tests passed, Feature version published). No successful run yet = a notice and a green
  skip; a GitHub API answer it cannot read = a red run (nothing committed). It renders it with your `stoily.json` (`.github/stoily-render.js`: the
  comments go, the ONE grant `<org>/*` and the Feature's options are set, everything else is the
  template's) and commits `devcontainer.json` only when it changed — and only when the Feature version
  it names is on GHCR (otherwise a notice, and the next run retries).
- It never goes BACK: the first line of the rendered file names the stoilyhq commit it came from, and a
  run skips (a notice) a template from an OLDER commit, or one whose Feature major is LOWER than the
  committed file's. That last guard also holds back a NEWER upstream commit that lowers the major, and
  it does not heal by itself: fix the template upstream and Run workflow, or edit devcontainer.json by
  hand. If stoilyhq ever rewrote its history, the compare may fail (a red run): delete the `@<sha>` from
  line 1 of `.devcontainer/devcontainer.json`, commit it (an edit left in a Codespace is not seen: the
  run reads the branch), and Run workflow.
- It commits **`devcontainer.json` only** (it `git add`s nothing else), so the updater itself and the
  renderer never change by themselves: copy a new one from stoilyhq/codespace by hand when its release
  notes say so.
- It pushes to the branch it ran on with the workflow's token: a **branch protection** rule that
  blocks direct pushes to your default branch makes it fail (allow GitHub Actions, or render by hand).
- In a PUBLIC repo GitHub pauses scheduled workflows after 60 days without activity (an org's copy is
  private, so this rarely applies). If GitHub disabled the workflow: Actions → stoily-update →
  **Enable workflow**, then **Run workflow**.
- A rendered change reaches a running Codespace after `git pull` in the workbench (or `go`, which
  pulls first) and THEN **Rebuild container** (the rebuild reads the workbench's devcontainer.json).
  `check` prints the installed kit version.

### Billing: who pays for a Codespace

GitHub bills a Codespace either to the person who creates it or to the org that owns the repo. This
repo changes nothing about it; each org's owner chooses in the org's settings.

- **Member pays** (GitHub's default): the Codespace bills the GitHub account that creates it, against
  that account's own monthly Codespaces allowance and its own spending limit. Nothing to set up for
  billing — but the org must enable **Codespaces access** once (Set up an org, step 0); each person
  manages their own usage, and a person out of allowance cannot start a Codespace.
- **Org pays**: org Settings → Codespaces → **Ownership: Organization ownership** (choose who may create
  org-billed Codespaces: all members or selected ones), and org Settings → Billing → set a Codespaces
  **budget / spending limit above $0** (orgs get no free hours; with a $0 limit members cannot create
  org-billed Codespaces). Optionally set policies (machine types, idle timeout, retention) — those
  need a paid GitHub plan.

Either way the template asks for at least the smallest machine (2 cores / 8 GB; `hostRequirements` is
a minimum, so a person can still choose a bigger one); idle Codespaces stop at the idle timeout and
stopped ones still bill storage until deleted.

## Sign-ins: ChatGPT and Stoily

Each Codespace has two sign-ins, kept apart. Codex has ONE home, `~/.codex`, outside every git repo (a
`.codex/` inside a repo would layer over the lock, and `scrub` deletes it); it holds the ChatGPT
sign-in. The Stoily sign-in is the kit's, in its own folder that Codex's sandbox may not read:

```
 ~/.codex/
 ├─ config.toml       the kit's Codex config (re-applied
 │                    on every start; Codex's own folder-
 │                    trust and UI notes [tui] [notice] kept)
 ├─ AGENTS.md         the kit's rules
 └─ auth.json         ChatGPT: codex login once, or
                      the CODEX_AUTH_JSON secret
 /workspaces/.stoily-kit/     (private to you)
 └─ stoily-token.json Stoily: signed in as "Stoily
                      Codespace", once; only the kit's
                      stoily program reads it, never Codex
 /etc/codex/requirements.toml the locked settings (root)
```

- **One ChatGPT login and one Stoily identity per Codespace.** Separate Stoily identities (another
  agency, another person) are separate Codespaces — and usually separate orgs.
- Both sign-ins are files, never the OS keyring; `check` reports whether each one is there and never
  prints them. The Stoily one sits under `/workspaces`, so it is kept across a Rebuild; deleting the
  Codespace deletes it.
- **A shared ChatGPT login (optional): the Codespaces secret `CODEX_AUTH_JSON`** (base64 of a
  `~/.codex/auth.json`). Set it on the org's `codespace` repo (repository level) and every Codespace
  of that repo starts signed in to that ChatGPT account. Each start, `setup` decides:

  ```
   no login here            → install the secret
   installed from the SAME  → keep (Codex refreshes the
     secret                   token inside the file)
   installed from an OLDER  → replace: a Stop + Start is
     secret                   enough to switch accounts
   signed in here yourself  → never touched
   no secret                → nothing touched
  ```

  `setup` records only a hash of the secret and the account id it installed, never the login.
  `check` says which you have: `shared: the CODEX_AUTH_JSON secret` or `signed in here`.
- **An org that signs in itself:** give its `codespace` repo no `CODEX_AUTH_JSON` (and no org- or
  user-level one that reaches it). `go` then asks for a device-code sign-in with the account that org
  uses. Taking a shared secret away later leaves running logins alone: `codex logout`, then
  `codex login --device-auth` (or a Rebuild, then `go`) in each Codespace that had it.
- If Codex says **please sign in again**, the shared login was refreshed somewhere else: share a fresh
  login as the secret, then Stop + Start the Codespace.
- A repository-level secret reaches **everyone** who can create a Codespace from that repo: share it
  only with repos whose members may all use that ChatGPT account.

**Sign-in runbook** (`go` does all of it): sign in to ChatGPT as before (`codex login --device-auth`
once, or the shared secret), then to Stoily — once; later starts reuse it:

1. `go` prints a link to Stoily's sign-in page. Open it and sign in with this Codespace's Stoily
   account.
2. The consent page names the app **Stoily Codespace** and lists your stores: tick **"All my
   stores, including future ones"** (or only the stores this Codespace may reach, up to 50) and
   approve.
3. Your browser then lands on an address starting `http://127.0.0.1:` that does not load. That is
   expected: copy that whole address from the address bar and paste it into the terminal at
   `address:`, right away: it works once.

`go` asks for every scope the kit's tools need in that one sign-in, records them, and signs in again
only when there is no sign-in, when it can no longer be refreshed, or when a new kit needs other
scopes. **After updating to kit 3.10 everyone signs in to Stoily once more**: until 3.10 Codex held
the Stoily sign-in itself (`~/.codex/.credentials.json`, which `go` now deletes); from 3.10 the kit
holds it. A Stoily server that does not offer `stores:create`, `structure:write` or `content:publish`
yet refuses the sign-in with `invalid_scope`: `go` says which and signs in without it (retried a day
later). **A new sign-in is a new connection:** a store Codex created can be published by
`publish_all_drafts` only from the sign-in that created it, so run a whole-store brief from create to
publish without a new sign-in in between (a kit update that needs other scopes, or the next day's
retry of a refused scope, signs in again). **A pre-launch store Codex created before kit 3.10** was
created on the old sign-in, so Codex can no longer publish it: press **Publish all** in Stoily admin
for it. To sign in again by hand (another account, other ticked
stores): `/usr/local/share/stoily-codespace/libexec/stoily mcp-proxy --sign-out`, then `go`.

## Who changed what, and undo

Every change Codex makes to a store through Stoily — a page draft, a product, a price, a setting —
is recorded by the kit, not by Codex: one record in the store repo's `stoily/log/` (who, when, what,
the value before and after, and how to undo it), the store's latest values in `stoily/state/`,
committed **as the person who made it** (their GitHub name) and pushed to GitHub at once. `save`
commits as that person too. Ask Codex in plain words:

- **"what changed"** (today, this week, on the About page) — when, who and what, one line each.
- **"who changed the phone number"** (a price, a page) — the person and when.
- **"undo that"** (or "undo the price change") — Codex shows what goes back (before → after) and
  waits for your yes. A setting, price or product gets its old value back; a product or category
  that was new is switched off or hidden, never deleted; a page or block goes back as a DRAFT the
  merchant publishes; where there is no undo, Codex says so and why. A change whose old value the
  kit could not read first has no automatic undo: Codex answers: "I can't undo that change automatically — I didn't get its old value. Tell me what it should be and I'll set it (with your yes)." The undo
  is a new change, recorded like any other: the history is never rewritten.

When two people change the same thing from two Codespaces, nothing is lost, and the kit never merges
a file: it settles its own records and store values by itself (re-reading the values from Stoily).
For a file of your own that someone else changed on GitHub too, the kit pushes your version to a
branch `conflict/<your login>-<UTC time>` on GitHub and changes nothing in your folder, and `save`
stops with one line: "Someone else changed `<file1>`, `<file2>` at the same time — your version is
kept on GitHub branch `<branch>`. Say 'keep mine' or 'keep theirs' for each." Codex passes the line
on and stops: it never settles a clash by itself, auto mode too. Answer for each file, then say yes
to what Codex shows: "keep theirs" = `save --take-remote` (your folder takes GitHub's version; yours
stays on the branch); "keep mine" for a file = `save --take-remote`, then
`save --restore <file> --from <branch>` with the branch the line named, which brings your version
back, committed as you, and pushes it. Codex runs them (auto mode), or asks you to run them
(`"auto": "off"`); they say `✅ took GitHub's version: …` and `✅ restored <file> from <branch>`. If
the folder's store differs from GitHub's (its `STORE_ID` line), `save --take-remote` refuses ("this
folder's store differs from GitHub's — ask an admin …") and Codex does not settle it: ask an admin.

## Designs: the org's gallery

An org can keep its page designs in a gallery repo ([GALLERY.md](GALLERY.md) is the format: one
directory per design). `sync` clones it into `<workbench>/gallery`; Codex reads it and drives Stoily's
tools, because Stoily itself never reads GitHub. Ask Codex:

- **"list designs"** — the gallery's designs (title, tags).
- **"use design `<name>`"** — a new page from that design, rebuilt from Stoily primitives (layout only;
  Stoily's design catalogue is empty, so the design's own style is not applied — Codex says so).
- **"save design `<name>`"** — writes the current page in the gallery format to `stoily/designs/<name>/`;
  then YOU run `save --design <name>` to validate it and push it to the gallery repo.

Keeping several orgs' galleries in step with one private master gallery is the master owner's own
GitHub Action in their own repo, not part of this kit.

## A new client store

With "All my stores, including future ones" ticked at sign-in, a store you are added to later is
on your connection at once — no new sign-in. A store whose owner removes you drops off at once.

**A store Codex creates** (a demo, or a new shop you build from one ask): say it in the lobby Codex —
"set up a new store: `<what you want>`". The new folder has no store yet (`STORE_ID: pending`, a
folder `clients/new-…` that stays in this Codespace); Codex's first live change is ONE `create_store`
(it asks first, with the name, currency, locale and timezone). Once the store is made the kit links
the folder to it by itself — writes its id, name and domain into the folder's `AGENTS.md`, creates
`<org>/store-<storeId>` (or Codex gives you the GitHub link to create it) — and Codex builds it; the
next `go` renames the folder to `clients/<storeId>`. If Codex closes before the new store is finished (a restart, a closed terminal), say "done" (or "continue `<name>`") in the lobby Codex: it reopens that `clients/new-…` folder and carries on from `stoily/progress.md`. If the store was already made, Codex reads it (`get_store`) and never creates a second one. With `"auto": "off"`, in a terminal:
`new-client --pending`, then `go -b <brief> <the folder it printed>` (`go` never picks a pending
folder by itself: name it).

**A store that exists:**

1. The client invites your Stoily account as Editor in Stoily admin (Admin if you will manage its
   catalog) and you accept from the email — or you create the store in Stoily admin. Never ask a
   client for their password; there are no member tools.
2. In the lobby Codex: **"open a store"** — it lists your stores by number (the new one included),
   you pick one, it shows that store's card, and after your yes it creates `<org>/store-<storeId>`;
   every Codespace of the org clones it at its next `sync`. (Codex reads every page of `list_stores`
   by itself, 100 stores a page.) A store that already has a repo is opened as it is, never a second
   repo. With `"auto": "off"`, in a terminal: `codex exec "call list_stores"` → the store id and its
   main domain → `new-client <storeId> <host>`.

**A store folder is bound to ONE store, forever** (its `STORE_ID`). The store's name and main domain
can change: the kit reads them from Stoily at the start of every session and records the new values
in `AGENTS.md` by itself (the repo's GitHub description shows them too, where GitHub lets the
Codespace set it). Never edit those lines: `save` refuses a change to `STORE_ID`, `NAME` or `HOST`,
and `upload-images` / `site-check` refuse a folder whose history ever bound it to another store, or
whose `AGENTS.md` they cannot read the one strict way.

**Older client repos** (`<org>/client-<name>`, before kit 3.10) keep working as they are. To give one
its store's own repo, say **"move `<store>`"** in the lobby Codex: after the store card's yes, the kit
renames the repo to `<org>/store-<storeId>` (GitHub forwards the old address) and the folder to
`clients/<storeId>`; every other Codespace of the org follows at its next `sync`. If GitHub does not
let the Codespace rename it, Codex gives you the link to the repository's Settings page: change
**Repository name** to the name it gives, click **Rename**, then type "done". A folder with unsaved
work is not moved: say "continue `<store>`" and let Codex save it there, then "move `<store>`" in the
lobby again.

If you signed in with ticked stores instead (up to 50), a new store needs a new Stoily sign-in with
ALL its stores ticked — or sign in once more and tick "All my stores" (see the runbook above).

## Create, clone, manage (what to ask Codex)

| You want | Ask Codex | It uses |
|---|---|---|
| a new page | "build a FAQ page with 6 questions" | `create_page` + `apply_page_changes` (primitives) |
| a whole store from one ask | in the lobby: "open a store" (or "set up a new store: `<what you want>`"), then describe the site — the intake writes a plan and builds after you approve; or name a brief ("build demo-store", or your org's own). Auto off: `new-client --pending`, then `go -b intake <the folder it printed>` | research (web search) → `create_store` → catalog → `photos` → `logo` → `create_image_upload` + `upload-images` → theme → settings → pages → menus → `publish_all_drafts` (asks first; a pre-launch store only) → `site-check <host>` |
| a page cloned from a website | run `fetch-site <url>` first, then "rebuild source/… as a draft page" | `list_verified_domains`, then `create_page` + `apply_page_changes` |
| change what exists | "make the hero headline shorter", "brand colour #0a7", "add FAQ to the footer menu", "footer copyright line" | `read_page` → `apply_page_changes`, `set_theme_tokens`, `set_menu`, `set_chrome`, `set_page_meta`; the browser title is `set_store_config` `design/head/default_title` |
| undo before publish | "discard the draft of the About page" | `discard_draft` |
| what changed, and undo | "what changed today", "who changed the phone number", "undo that" | the kit's records in `stoily/log/` and `git log`; the undo is shown first and waits for your yes ([Who changed what](#who-changed-what-and-undo)) |
| categories and products (LIVE, Admin/Owner) | "add a Clocks category and these 4 products" | `list_categories` → `create_category` → `upsert_product` (by SKU) → `set_product_image` |
| the store logo (LIVE) | "draw a logo and set it" | `logo` (SVG → PNG) → `create_image_upload` + `upload-images <host>` → `set_logo` |

**Cloning and copyright:** Codex copies words and images only from a domain the store has proven it
owns (`list_verified_domains`: its own storefront and DNS-verified domains). From any other site it
takes layout and style only and writes fresh copy. **Images** go through `create_image_upload` (one-shot
upload URLs, up to 30 at a time) and `upload-images <host>` (you run it), then `upload_image` /
`set_product_image` / `set_logo` with the upload id — never as base64 inside the AI's message. Photos
from the web come only through `photos` (Wikimedia Commons, CC0 / public domain / CC BY / CC BY-SA,
credited from `stoily/assets/sources.json`).

## Every day

- New terminal → Codex opens (auto mode; "continue `<store>`" picks a store, after its card's yes).
  Where terminals keep a shell (the owner's, or everyone's when `owner` is empty), closing Codex leaves
  a plain shell: type `work` (every store) or `work <folder>` for one tmux window per store folder.
  The `work?` prompt (`*`, a folder's name, or Enter for a plain shell) appears instead when Codex is
  already open in another terminal, or with auto off.
  `Ctrl-b <n>` switches window, `Ctrl-b d` detaches.
- In a store window: `codex` and ask. Its first line names the store ("You are working on `<name>` —
  `<domain>`"). It snapshots before and after into `stoily/` and writes
  drafts. Then run `save "what changed"` (or approve Codex running it). Publish the drafts in
  Stoily (PageBuilder).
- Undo before publish: ask it to `discard_draft`. After publish: ask it to restore from the last
  snapshot (it rebuilds the page as a draft).
- `sync` clones new store repos and pulls every store (another person or desktop may have pushed).
  When GitHub's list of the org's repos cannot be read it says so in one line and pulls the stores
  already cloned.
- A brief: in a store's Codex say "build demo-store" (the kit's example) or "build `<brief>`" (yours, in
  `prompts/`). In a terminal: `go -b demo-store <folder>` or `go -b prompts/<brief>.md <folder>`.

## Known limits — read once

- **A changed `stoily.json` reaches an existing Codespace only after the updater committed and
  Codespaces menu → Rebuild container.** Without an org (the option, or the owner of the repo the Codespace came from) `check`,
  `sync`, `new-client`, `save` and `fetch-site` refuse with exactly that instruction (there is no
  built-in org).
- **Rebuild container keeps `/workspaces` (your workbench, `clients/`, the kit's Stoily sign-in) and
  recreates the home folder**: the first terminal runs `go` again by itself and signs in again only
  where a sign-in is missing (a `CODEX_AUTH_JSON` Codespaces secret brings the ChatGPT login back). A changed secret needs
  no Rebuild: Codespaces menu → Stop, then start it again (secrets load at start; `setup` swaps the
  login it installed).

- **TESTING.md is the acceptance run for a new org or a new kit major**: run it once in a real
  Codespace before your stores depend on it. The kit is tested before every release; Codex's OAuth sign-in
  and the sandbox on a real Codespace are proven only there.
- **Codex's sandbox needs container settings the Feature sets for you**
  (`securityOpt: seccomp=unconfined, apparmor=unconfined, systempaths=unconfined` — user namespaces, the
  mount bubblewrap makes, and the /proc it mounts inside). Fine for a Codespace (one person's own VM);
  never use this Feature on a shared host. If `check` says the sandbox does not start, Codex cannot
  edit files safely — stop and report it.
- **A store repo must never contain `.codex/`.** Codex layers a folder's own `.codex/config.toml`
  over the locked one, so `sync` deletes any it pulls (and names who pushed it) and `check` fails
  on one. Text fetched with `fetch-site` is data: the rules tell Codex never to follow it.
- **Codex can READ other store folders** (its sandbox limits writes, not reads); separate
  people still get separate Codespaces.
- **The lock is on Codex, not on people.** Anyone at the keyboard can edit files or run commands;
  the real walls are server-side: each person's own Stoily role (Editor/Admin/Owner) and store consent,
  and the Codespace's GitHub access (your org's repos only: the `<org>/*` grant).
- **The Stoily sign-in ends on a page that does not load** (`http://127.0.0.1:<port>/…`): that is
  expected, in a browser Codespace and in VS Code desktop alike. Copy that full address from the
  address bar and paste it into the terminal at `address:`, right away — it works once.
- **The LIVE changes always ask you first, auto mode too** — Codex's plain summary ending "— yes to
  go ahead?", then Codex's own approval prompt (`set_store_config`, `set_store_language`,
  `create_category`, `update_category`, `move_category`, `upsert_product`, `set_product_image`,
  `set_logo`, `create_image_upload`, `upload_image`, `create_store`, `publish_all_drafts`), so under
  `codex exec` (nobody to answer) they never run; use interactive `codex` for them. `upsert_product`
  overwrites an existing SKU's price and description (Codex shows what changes first).
- **Catalog needs Admin or Owner** of the store, and the first catalog call on a connection asks
  you to approve product access in a browser (once).
- **Not available:** translations (Stoily does not serve those tools yet), members (the client
  invites you in Stoily admin) and publishing a store that is live (`publish_all_drafts` works only
  on a pre-launch store this connection created: no orders, no custom domain, at most 30 days old;
  otherwise the merchant publishes in Stoily).
- **Snapshots are best-effort.** The AI writes what the tools return. A page over 200 KB comes back
  truncated; its snapshot is marked `"_incomplete": true` and is never used to restore.
- **The Codespace stops at its idle timeout even with tmux running**, and a running Codex task stops
  with it. Create the Codespace with a 240-minute idle timeout (GitHub settings → Codespaces →
  Default idle timeout, up to 4 hours, BEFORE you create it: GitHub cannot change an existing
  Codespace's timeout). With auto mode on (the default), `go` keeps the Codespace awake only while
  Codex is working; with `"auto": "off"`, nothing does. An org-wide idle policy needs a paid plan.
- **Every store of the org is in every Codespace of the org** (each `<org>/store-*` and older
  `<org>/client-*` repo it can see). To keep clients apart, use separate orgs; a member's own GitHub
  permissions decide which store repos their Codespace can see and push.
- **Coming from kit 1 (`groups.txt`, `work <code>`, `go -g`)**: groups are gone. To move an org to
  kit 2, copy three files from stoilyhq/codespace into your `<org>/codespace` — `.devcontainer/stoily.json`,
  `.github/stoily-render.js` and `.github/workflows/stoily-update.yml` — set `"org"` (and your old
  Feature options) in `stoily.json`, commit, then Actions → stoily-update → **Run workflow**. Then in
  each Codespace: `git -C /workspaces/codespace checkout -- groups.txt` first (kit 1's `go` edited it
  without committing, and that local edit would stop the `git pull`), then `git pull` + Rebuild
  container. Delete `groups.txt` from the repo only after EVERY Codespace of the org has been rebuilt
  (a kit-1 Codespace still reads it); until then `check` shows a ⚠ for it. Old `tmux -L <group>`
  servers die with the Rebuild; `work` opens the one session `stoily`.

## Several people, several Codespaces

- Each Codespace signs into ChatGPT and Stoily itself (`go`): a Stoily sign-in refreshes with
  ROTATION, so one copy in two live Codespaces logs one of them out at the first refresh.
- Write access is GitHub's: org members read the workbench and write only their own store repos
  (org → People → the member → repository access). The Codespace grant in `.devcontainer/` never
  exceeds the member's own permission.
- `go` opens Codex without a brief; say "build `<brief>`" in a store's Codex to start one (in a
  terminal: `go -b prompts/<brief>.md <folder>`).
- Several people can work on the same store: every change is committed as the person who made it,
  and two changes to the same file are never merged: your version is kept on a `conflict/…` branch,
  your folder is left as it was, and you say "keep mine" or "keep theirs", then yes
  ([Who changed what](#who-changed-what-and-undo)).
- The template's `hostRequirements` asks for at least 2 cores / 8 GB: the smallest machine is offered
  first, but a member can still pick a bigger (dearer) one; only a paid-plan org policy on machine
  types restricts it.

## Staff terminals are Codex

When the Feature's `owner` option names a GitHub login, in a Codespace created by any other account
every new terminal runs `go --loop`: pull, setup, check, the logins, then Codex. With no store open yet it
signs in and opens the lobby just like the owner's terminal — no stop: say "open a store" or
"continue `<store>`", then yes to its card. From then on Codex works in that store, and every time Codex exits (Ctrl+C, a
crash) the store folder is saved to GitHub (`save`) and Codex opens again in the same store; a ❌
waits for Enter and retries. For another store, close the terminal and open a new one. Only one `go` runs per Codespace: a
second terminal is refused with a pointer to the running one (a kernel file lock, released when that
Codex ends, crash included). VS Code can still open another
terminal, so this is the default experience, not a wall: the locks that hold are the Codex sandbox and
the GitHub permissions (read on the workbench, write on the store repos only). The `maxHours`
option is a soft daily cap: past it the loop does not restart Codex until the next
UTC day, and the Codespace stops at its idle timeout. The hard cap is the billing one (see Billing);
org policies (idle timeout, retention, machine types) need a paid GitHub plan.

## Developing this repo

- `bash test/run` — the offline suite for what lives here: every workflow job's guard, the template,
  the renderer and the updater's own steps (run as GitHub runs them, against a stub `curl` and local
  git origins; no network). `bash test/public-tree` — this repo is public: no credential, store id,
  internal host or client org may be committed.
- CI (`.github/workflows/test.yml`) runs both and shellcheck on every push and PR, on GitHub-hosted
  runners. `.github/workflows/release.yml` runs the same tests on every push to `main`; it publishes
  nothing, but its green push-to-main runs ARE the releases of the template (below).
- This repo stays public and a **Template repository**: it is where orgs start (Use this template) and
  read the docs. The Feature package `ghcr.io/stoilyhq/codespace/stoily` must stay **public** on GHCR,
  or Codespaces of other accounts cannot pull it.
- Every workflow job is guarded (Use this template copies `.github/` too): test + release by
  `if: github.repository == 'stoilyhq/codespace'` (never in an org's copy), the updater by
  `if: github.repository != 'stoilyhq/codespace'` (only in an org's copy: here `devcontainer.json` IS
  the template). `test/run` pins both.
- A change to `.devcontainer/devcontainer.json` here is a change to EVERY org's next render: keep its
  comments (the renderer strips them), one stoily Feature by tag, the `YOUR-ORG/*` placeholder grant.
  A new major is that tag plus `MAJOR` in `test/run`, in one commit, once that major is on GHCR (an
  updater that finds it missing skips with a notice and retries daily).
- Orgs render the template at the commit of the latest **successful push-to-main run** of
  `release.yml` (its `head_sha`), never `main` itself: a template change reaches them only once that
  push's run is green, and their updater still commits it only when the `stoily:N` it names is on
  GHCR. A run started by hand (Run workflow) is never picked (the updater asks for
  `branch=main&event=push`).

## License

MIT — see [LICENSE](LICENSE).

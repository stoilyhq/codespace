# Stoily Codespace

Build and manage [Stoily](https://stoily.com) stores with **Codex** and the **Stoily MCP**, from a
GitHub Codespace. One Codespace serves many client stores: each client is its own repo, cloned into
`clients/<name>/`, and Codex started in that folder works on that client's store only. Every design
change lands as a DRAFT the merchant publishes. The few LIVE writes (catalog, logo, store settings)
ask you before every call only with auto mode off: auto mode is on by default (see
[Auto mode](#auto-mode-on-by-default)).

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
   Codex + its locked config, the rules, go work save sync
   new-client check …   (published by Stoily)
        │
        ▼
 <org>/codespace (yours, private)         <org>/client-<name> (one per store)
 ├─ .devcontainer/stoily.json  YOU edit   ├─ AGENTS.md   STORE_ID + HOST
 ├─ .devcontainer/devcontainer.json       ├─ stoily/     snapshots
 │    GENERATED: Feature + <org>/*        └─ source/     fetched pages,
 ├─ prompts/     your own briefs                          never committed
 └─ clients/<name>/  ← every <org>/client-* repo, cloned by sync
```

**Codex is the only AI tool here, and it is locked down** (the kit's Codex config, re-applied on every
start): its sandbox lets it WRITE files only inside the folder it was started in, its shell has no
network (so on its own it cannot push, download or install), its web search reads only OpenAI's
cached index (`web_search = "cached"`, never a live fetch from the Codespace), and only the Stoily
tools for design, catalog, store settings and creating a store are enabled — creating a store
always asks you first; every catalog/settings write and publishing ask too when auto mode is off
(`"auto": "off"`); no domains, DNS or members. The only MCP
server is `https://api.stoily.com/mcp`. Pushing to GitHub is `save` (commits only `stoily/` and
`AGENTS.md` to the client's repo); downloading a page is `fetch-site`; photos, uploads and the
storefront check are `photos`, `upload-images` and `site-check`: programs YOU run (or approve when
Codex asks): `photos` and `upload-images` reach only their fixed hosts (`upload-images` only this
folder's committed store), `site-check` only the host its
command line names (and this store's own folder on Stoily's media CDN, where its images live). `check` proves the lock.

**What the lock does NOT do — read this before you put two clients or two agencies in one Codespace:**

- **Codex can READ** everything the Codespace user can (other client folders, the sign-ins in
  `~/.codex/`); the sandbox limits writes and shell network, not reads.
- **Codex can ASK to run a command outside its sandbox** (approval "on request"). A yes gives that
  command the network and the Codespace's GitHub access. Answer No to everything except the kit's
  `save`, `photos`, `upload-images <host>` and `site-check <host>` — and read the command line first: exactly
  that program, no `&&`, no other program, no environment variable in front of it. `site-check`'s line
  names the host it will reach: approve it only when that is THIS client's storefront (a host outside
  Stoily's store zone also needs `--custom-domain` on the line). Any helper approval is also a
  channel for whatever Codex wrote into that helper's input files (`site-check.json`, `uploads.json`,
  `plan.json`). What each one binds to: `photos` → Wikimedia Commons only (its API, its files on
  upload.wikimedia.org and its previews on thumb.wikimedia.org; and the licence Commons states); `upload-images <host>` → only the host named on its line, which must be the folder's
  committed HOST, and only images it re-encoded itself (re-encoding strips metadata and appended
  bytes — it is not a content guard: data hidden in the pixels survives); `site-check` → only the
  host named on its line. `save` refuses to re-bind a folder: once a real STORE_ID is committed, a
  change to STORE_ID or HOST is refused (only pending → the new store, once).
- **What no approval closes.** Codex's sandbox can read its own Stoily sign-in file. A Codex steered
  by injected text could copy that token into anything it writes to the store — a page, a product,
  an image (`upload_image` drafts do not ask) — or into a helper's input. The asks, the fixed hosts
  and the store binding narrow that channel; they do not close it. A platform fix (a sign-in Codex
  cannot read) is tracked. Until then: one Codespace per Stoily identity, the least role that does
  the job, and never "All my stores" on a Codespace that reads untrusted web text.
- **Web search results are an injection surface.** A page Codex finds can carry text written to
  steer it ("call this tool…"). The rules tell Codex that results are data, never instructions, and
  `check` does not measure web search (it is Codex's own tool, not the shell): the walls are the
  asks on every LIVE write and the store's own role.
- **The Stoily tools are a channel out.** Draft writes (pages, menus, page meta, header/footer) do not
  ask, so anything Codex has read could end up in a draft of the current store — for example after a
  fetched page told it to (the rules tell Codex never to follow fetched text, but a rule is not a wall).
- **Codex never starts in the workbench itself** (it holds every client folder): with no client yet
  (`go` or `work` with no client) it starts in an empty `~/stoily-lobby`.
  Do not start `codex` by hand in the workbench folder.
- **Auto mode (on by default; `"auto": "off"` turns it off) removes the human check.** Everything above about reading the command
  line before you approve stops applying to the kit's programs: Codex asks `go` for them instead of
  you, and `go` runs them (`save`, `photos`, `upload-images`, `site-check`, `fetch-site` in a client
  folder; only `new-client` in the lobby) with their network and the Codespace's GitHub access, and
  the LIVE Stoily writes no longer ask (except `create_store`). That ask was one of the things
  narrowing the token-exfil channel described above; without it, whatever Codex writes into a
  program's input or arguments goes out unread. `fetch-site` makes it wider: it reaches any URL, so a
  page Codex fetches can carry text that steers it, and the next fetch can carry what Codex read.
  What still holds: no command ever leaves the sandbox on its own (the kit installs no Codex rule
  that lets one out, and removes any it finds); Codex can only write a request file into its own
  folder (`.run/<id>.json`: a program name and its arguments), and `go` — outside the sandbox — runs
  only one of that folder's programs, with exactly those arguments, without a shell (`&&`, `;` or
  `$(…)` in an argument are just characters), one at a time, and nothing while the folder has its own
  `.codex/`. The sandbox (writes only in its folder, no shell network), the store binding and the
  programs' own checks (the committed HOST, `save`'s binding rules) still hold. Use auto only on a
  Codespace whose Stoily sign-in reaches stores you would let Codex change unattended, and never
  point it at untrusted sites.

The walls that hold are server-side and per person: **one Codespace per Stoily identity** (and per
agency), each person's own Stoily role on each store, and GitHub's repo permissions.

| Program | Does |
|---|---|
| `go` | the whole first run in order (pull → setup → client → check → logins → check → Codex); stops at the first ❌. Runs by itself in a new Codespace's first terminal; with no client yet it opens the lobby, where you say "set up a client" |
| `check` | prove the lock (no AI, no sign-in) |
| `work [<client>]` | one tmux session `stoily`: a window per client (or just that one) |
| `sync` | clone / pull every client: each `<org>/<clientPrefix>*` repo this Codespace can see |
| `save "<what>"` | commit `stoily/` + `AGENTS.md`, push the client's repo |
| `save --design <name>` | publish the design Codex wrote to `stoily/designs/<name>/` into the org's gallery repo (validated, only that directory) |
| `new-client <name> <storeId> <host>` | create `<org>/client-<name>` (the `clientPrefix` option), bound to one store. With auto mode on, Codex asks `go` to run it when you say "set up a client"; type it yourself only with `"auto": "off"` |
| `new-client <name> --pending` | the same, with no store yet: Codex creates it (`create_store`, asked first) and writes its id into `AGENTS.md` |
| `fetch-site <url> [--images]` | download a page for Codex to rebuild → `source/` |
| `photos fetch <plan.json>` / `photos finish <picks.json>` | licence-safe photos from Wikimedia Commons: previews + contact sheets in `source/photos/`, then crops in `stoily/assets/` + credits in `stoily/assets/sources.json` |
| `upload-images sizes` / `upload-images <host>` | `sizes` (offline, Codex runs it): the re-encoded size of each `stoily/assets/` image, for `create_image_upload`. `<host>`: send each image, RE-ENCODED (never the file as read; metadata stripped, not a content guard), to the one-shot upload URLs in `stoily/assets/uploads.json` — only `…/uploads/<host>/<token>` URLs, `<host>` = this folder's COMMITTED HOST (no sign-in read) |
| `site-check <host> [--custom-domain]` | read the live storefront against `stoily/site-check.json`: `<host>` must be this folder's HOST (and on Stoily's store zone, else `--custom-domain`); a table, exit 1 on a ❌ |
| `logo <in.svg> <out.png>` | render an SVG wordmark (Chinese via Noto CJK HK) to a PNG, offline — Codex runs it in its sandbox |
| `setup` | re-apply the lock (the Feature runs it on create and on every start) |

## Set up an org (all on github.com)

You need a GitHub org for the client repos (one org per team, company or client group — whatever
separation you want: there is one Codespace setup per org, no groups inside it). The org gets its own
private repo **`<org>/codespace`**, made once from this repo with **Use this template**; every
Codespace of the org is created from THAT repo, never from `stoilyhq/codespace` (a Codespace can only
be given write access to repos of its own repo's owner). Inside a Codespace that repo's clone is
called the **workbench** (`/workspaces/codespace`). Every `<org>/client-<name>` repo the Codespace
can see is a client: there is no list to keep. Keep them in a GitHub **organization**: for a personal
account GitHub lists only its PUBLIC repos, so a private client repo there is found only once cloned
(`new-client` in that Codespace), and `check` says so.

```
 stoilyhq/codespace ── Use this template (once) ──▶ <org>/codespace (private)
   .devcontainer/devcontainer.json (template) ──updater, daily──▶ devcontainer.json
                                   <org>'s stoily.json ──┘        (generated)
   ghcr.io/…/stoily:<major> (the kit) ──pulled on every create/Rebuild──┘
                                       Codespace ─ clients/<name> ← <org>/client-<name>
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
   `<org>/*`, so it can push client repos).
5. Nothing to type in the terminal. The first terminal signs you in to ChatGPT (it shows a code to
   enter on a web page) and to Stoily (tick **"All my stores, including future ones"**), checks that
   everything is locked down, then opens Codex. This works the same for any GitHub account, the
   `owner` or not.
   - No client yet? Type **"set up a client"** in Codex. It lists your Stoily stores by number and, in
     the same message, suggests a name for the client: answer with the store's number or name (that keeps the
     suggested name), or add another name ("2, call it shop"). Codex creates the client's
     private repo `<org>/client-<name>`. If GitHub does not let the Codespace create it, Codex
     gives you a GitHub link: open it, click **Create repository**, then type "done".
   - Codex then opens that client. Say what you want built, in your own words: Codex writes a plan
     (the intake), shows it to you, and builds once you approve it.
   - Every Codespace of the org picks the new client up at its next `sync`. Later, type "continue
     `<name>`" to go back to a client.

   After a **Rebuild container** (which resets the home folder and its sign-ins) the first terminal
   signs you in again. You can always run `go` yourself.

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
| `org` | (required) | GitHub org of the client repos; the updater also writes the `<org>/*` Codespaces grant from it (`check` fails if the two ever differ). `YOUR-ORG` is refused. |
| `clientPrefix` | `client-` | Client repos are `<org>/<clientPrefix><name>`: `sync` clones every such repo it can see; `save` and `fetch-site` work only in one. Never empty. |
| `owner` | `""` | GitHub login whose terminals keep a shell (Codex opens there too; closing it leaves a shell or the `work?` prompt). Every other account's terminal is Codex only (`go --loop`): saved and reopened when it closes. Empty = everyone keeps a shell. Optional: nothing needs it set. |
| `maxHours` | `""` | Soft daily cap (whole hours of Codex, UTC day) for `go --loop` terminals. Empty = none. |
| `galleryRepo` | `""` | The org's design gallery ([GALLERY.md](GALLERY.md)), cloned into `<workbench>/gallery` by `sync` when it exists and this Codespace can read it (otherwise skipped without a word). Empty = `<org>/gallery`; a repo name in the org, or `owner/name`. |
| `auto` | `""` | **Auto mode is on by default.** `""` (the default) or `"on"` = auto mode: you type one sentence and Codex does the rest — no approval prompts (except `create_store`, which still asks; and only in the Codex `go` starts, staff terminals included: a bare `codex` or a `work` window keep asking), no clarifying questions besides which store, the client's name, which waiting client and the intake's plan (otherwise it picks a default and writes each choice under "Choices" in `stoily/progress.md`), `go` runs the kit's programs it asks for, and `go` keeps the Codespace awake while Codex works. `"off"` = Codex asks before every LIVE write and every program (needs kit 3.9 or later AND this repo's current `.github/stoily-render.js` in your copy: an older one refuses `"off"`). Nothing else is accepted. Read [Auto mode](#auto-mode-on-by-default) and the auto paragraph in "What the lock does NOT do". |
| `codexVersion` | `latest` | The `@openai/codex` npm version installed into the image (the Feature's default; not in `stoily.json`). |

An invalid value fails the updater's run (nothing is committed; the run's log names the value); an
invalid option that reaches the Codespace fails its build with the option's name. Fix it and rebuild.

### Auto mode (on by default)

Auto mode needs nothing in `stoily.json`: `"auto": ""` (or no `auto` line) means on. The whole job is
said in Codex — no terminal:

```
 lobby Codex: "set up a client"
   │ list_stores → your stores, numbered, and a name
   │   for the client: "acme"
   │ you: "2" (or "2, call it shop")
   │ Codex: "Setting up acme for <store>"
   │ asks go: new-client acme <storeId> <host> -b intake
   ▼
 go ends the lobby Codex and starts Codex in clients/acme
   with the intake: it asks what you want, writes a plan,
   shows it, and builds after you approve (it asks go to
   run photos, upload-images, site-check and save)
```

- Say it in the lobby (the Codex a terminal opens when no client is open yet): **"set up a client"**.
  Codex lists your Stoily stores by number and suggests the client's name in the same message;
  answer with the store's number or name (add another name for the client if you like), and Codex creates and binds
  `<org>/client-<name>`. Codex takes the store's id and address from that list: you never
  type them. Then Codex opens the client: describe the site in your own words and approve the plan.
  You can also say it all at once ("set up acme for `<store>`: a shop for handmade clocks") or name
  a brief ("…, build demo-store", a prompt in `prompts/`).
- If GitHub does not let the Codespace create the repo (any account, an org or a personal one), Codex
  shows you a GitHub link: open it, click **Create repository**, then type "done" and Codex carries on.
- A store with no domain cannot be picked yet: one still being set up → Codex says to try again in a
  minute; one Stoily could not finish creating, or a ready one with no domain yet → pick another.
- A client already set up: "continue `<name>`".
- Besides those questions (which store, the client's name, which waiting client, the intake's plan)
  and `create_store`, Codex never asks: where something is not said, it picks the default and records each choice under
  "Choices" in `stoily/progress.md`. Read it afterwards.
- What auto does NOT change: the sandbox (writes only in its folder, no shell network), no domains,
  DNS or members, other stores stay out of reach, page changes stay drafts, and publishing a store
  Codex did not create stays a click in Stoily admin.
- **Idle timeout: create the Codespace with a 240-minute one.** GitHub cannot change the timeout of
  an existing Codespace: set GitHub → Settings → Codespaces → **Default idle timeout** to 240 before
  you create it (or `gh codespace create --idle-timeout 4h`). Auto keeps the Codespace awake only
  while Codex is working (a session active in the last 30 minutes); after that it stops at its
  timeout as usual.
- **Turning it off:** set `"auto": "off"` in `stoily.json`. Codex then asks before every LIVE write
  and every program, and a new client is made in the terminal (`new-client`, see
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

## Sign-ins: one Codex home per Codespace

Codex has ONE home, `~/.codex`, outside every git repo (a `.codex/` inside a repo would layer over the
lock, and `scrub` deletes it):

```
 ~/.codex/
 ├─ config.toml        the kit's locked config (re-applied
 │                     on every start; Codex's own folder-trust
 │                     and UI notes [tui] [notice] kept)
 ├─ AGENTS.md          the kit's rules
 ├─ auth.json          ChatGPT: codex login once, or
 │                     the CODEX_AUTH_JSON secret
 └─ .credentials.json  Stoily: the Stoily login, once
```

- **One ChatGPT login and one Stoily identity per Codespace.** Separate Stoily identities (another
  agency, another person) are separate Codespaces — and usually separate orgs.
- The kit's locked config pins both sign-ins to files, never the OS keyring; `check` reports
  whether each file is there and never prints them.
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

**Sign-in runbook** (`go` does all of it): `codex login --device-auth` once, then **the Stoily login line**
with this Codespace's Stoily account — once; later starts reuse it:

```
codex mcp login stoily --scopes content:read,content:write,stores:read,design:write,config:read,config:write,products:read,products:write,offline_access,stores:create,structure:write,content:publish
```

Codex asks for a fixed default scope set and never steps up, so a bare `codex mcp login stoily`
leaves catalog and store-settings calls failing with `insufficient_scope`: always use the line above.
`go` records the scopes it signed in with and signs in again when a new kit needs more. A Stoily
server that does not offer `stores:create`, `structure:write` or `content:publish` yet refuses the
sign-in with `invalid_scope`: `go` says which and signs in without it (retried a day later).
**A new sign-in is a new connection:** a store Codex created can be published by `publish_all_drafts`
only from the sign-in that created it, so run a whole-store brief from create to publish without a
new `go` sign-in in between (a kit update that needs other scopes, or the next day's retry of a
refused scope, signs in again).

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
"set up `<name>` as a new store: `<what you want>`". The folder says `STORE_ID: pending`; Codex's
first live write is ONE `create_store` (it asks first, with the name, currency, locale and timezone),
then it writes the new store's id and host into the folder's `AGENTS.md` and builds it. With
`"auto": "off"`, in a terminal: `new-client <name> --pending`, then `go -b <brief> <name>` (`go` never
picks a pending client by itself: name it).

**A store that exists:**

1. The client invites your Stoily account as Editor in Stoily admin (Admin if you will manage its
   catalog) and you accept from the email — or you create the store in Stoily admin. Never ask a
   client for their password; there are no member tools.
2. In the lobby Codex: **"set up a client"** — it lists your stores by number (the new one included),
   you pick it and name the client, and it creates `<org>/client-<name>`; every Codespace of the org
   clones it at its next `sync`. (Codex reads every page of `list_stores` by itself, 100 stores a
   page.) With `"auto": "off"`, in a terminal: `codex exec "call list_stores"` → the new
   store id → `new-client <name> <storeId> <host>`.

**A client folder is bound to ONE store and host, forever.** `save` refuses a change to `STORE_ID`
or `HOST` once a real store is committed (only `pending` → the new store, once), and `upload-images`
/ `site-check` refuse a folder whose history (all of it) re-bound either, or whose working copy differs
from the committed one. Stoily binds an upload to the store's
CURRENT primary host, so when a client makes another domain primary, uploads from the old folder
answer "not found": make a fresh folder for the new host — `new-client <name>-2 <storeId> <new host>`
(the same store, a new `<org>/client-<name>-2` repo) — and work there; never edit `HOST` by hand.
The old folder keeps its history; archive its repo when you no longer need it. The same is the way out of any binding refusal (`save`, `upload-images` and `site-check` refuse an
AGENTS.md they cannot read the one strict way, or whose history ever re-bound the folder): **the way
out: a fresh folder bound once — `new-client <name>-2 <storeId> <host>`.**

If you signed in with ticked stores instead (up to 50), a new store needs the Stoily login line
again, with ALL its stores ticked — or sign in once more and tick "All my stores".

## Create, clone, manage (what to ask Codex)

| You want | Ask Codex | It uses |
|---|---|---|
| a new page | "build a FAQ page with 6 questions" | `create_page` + `apply_page_changes` (primitives) |
| a whole store from one ask | in the lobby: "set up a client" (or "set up `<name>` as a new store: `<what you want>`"), then describe the site — the intake writes a plan and builds after you approve; or name a brief ("build demo-store", or your org's own). Auto off: `new-client <name> --pending`, then `go -b intake <name>` | research (web search) → `create_store` → catalog → `photos` → `logo` → `create_image_upload` + `upload-images` → theme → settings → pages → menus → `publish_all_drafts` (asks only with auto off; a pre-launch store only) → `site-check <host>` |
| a page cloned from a website | run `fetch-site <url>` first, then "rebuild source/… as a draft page" | `list_verified_domains`, then `create_page` + `apply_page_changes` |
| change what exists | "make the hero headline shorter", "brand colour #0a7", "add FAQ to the footer menu", "footer copyright line" | `read_page` → `apply_page_changes`, `set_theme_tokens`, `set_menu`, `set_chrome`, `set_page_meta`; the browser title is `set_store_config` `design/head/default_title` |
| undo before publish | "discard the draft of the About page" | `discard_draft` |
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

- New terminal → Codex opens (auto mode; "continue `<name>`" picks a client). Where terminals keep a
  shell (the owner's, or everyone's when `owner` is empty), closing Codex leaves a plain shell: type `work` (every client) or `work <name>` for one tmux window
  per client. The `work?` prompt (`*`, a client's name, or Enter for a plain shell) appears instead
  when Codex is already open in another terminal, or with auto off.
  `Ctrl-b <n>` switches window, `Ctrl-b d` detaches.
- In a client window: `codex` and ask. It snapshots before and after into `stoily/` and writes
  drafts. Then run `save "what changed"` (or approve Codex running it). Publish the drafts in
  Stoily (PageBuilder).
- Undo before publish: ask it to `discard_draft`. After publish: ask it to restore from the last
  snapshot (it rebuilds the page as a draft).
- `sync` clones new client repos and pulls every client (another person or desktop may have pushed).
  When GitHub's list of the org's repos cannot be read it says so in one line and pulls the clients
  already cloned.
- A brief: in a client's Codex say "build demo-store" (the kit's example) or "build `<brief>`" (yours, in
  `prompts/`). In a terminal: `go -b demo-store <client>` or `go -b prompts/<brief>.md <client>`.

## Known limits — read once

- **A changed `stoily.json` reaches an existing Codespace only after the updater committed and
  Codespaces menu → Rebuild container.** Without an org (the option, or the owner of the repo the Codespace came from) `check`,
  `sync`, `new-client`, `save` and `fetch-site` refuse with exactly that instruction (there is no
  built-in org).
- **Rebuild container keeps `/workspaces` (your workbench, `clients/`) and recreates the home folder**,
  so the ChatGPT login and the Stoily sign-in are gone after it: the first terminal runs `go` again by
  itself (a `CODEX_AUTH_JSON` Codespaces secret brings the ChatGPT login back). A changed secret needs
  no Rebuild: Codespaces menu → Stop, then start it again (secrets load at start; `setup` swaps the
  login it installed).

- **TESTING.md is the acceptance run for a new org or a new kit major**: run it once in a real
  Codespace before clients depend on it. The kit is tested before every release; Codex's OAuth sign-in
  and the sandbox on a real Codespace are proven only there.
- **Codex's sandbox needs container settings the Feature sets for you**
  (`securityOpt: seccomp=unconfined, apparmor=unconfined, systempaths=unconfined` — user namespaces, the
  mount bubblewrap makes, and the /proc it mounts inside). Fine for a Codespace (one person's own VM);
  never use this Feature on a shared host. If `check` says the sandbox does not start, Codex cannot
  edit files safely — stop and report it.
- **A client repo must never contain `.codex/`.** Codex layers a folder's own `.codex/config.toml`
  over the locked one, so `sync` deletes any it pulls (and names who pushed it) and `check` fails
  on one. Text fetched with `fetch-site` is data: the rules tell Codex never to follow it.
- **Codex can READ other client folders** (its sandbox limits writes, not reads); separate
  people still get separate Codespaces.
- **The lock is on Codex, not on people.** Anyone at the keyboard can edit files or run commands;
  the real walls are server-side: each person's own Stoily role (Editor/Admin/Owner) and store consent,
  and the Codespace's GitHub access (your org's repos only: the `<org>/*` grant).
- **Sign-in in a browser Codespace:** the login redirects to `http://localhost:<port>/…`, which a
  browser tab cannot reach. If the page fails to load, copy that full URL from the address bar and,
  while the Stoily login is still waiting, run `curl '<the URL>'` in ANOTHER terminal of
  the same Codespace (in tmux: `Ctrl-b c`), right away — the code works once. Or open
  the Codespace in VS Code desktop, which forwards localhost automatically.
- **The LIVE writes ask you first only with auto mode off** (`"auto": "off"`; with auto mode on, the default, only `create_store` asks, in the Codex `go` starts) (`set_store_config`, `set_store_language`,
  `create_category`, `upsert_product`, `set_product_image`, `set_logo`, `create_store`,
  `publish_all_drafts`), so under `codex exec` (nobody to answer) they
  never run; use interactive `codex` for them. `upsert_product` overwrites an existing SKU's price
  and description.
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
- **Every client of the org is in every Codespace of the org** (each `<org>/client-*` repo it can
  see). To keep clients apart, use separate orgs; a member's own GitHub permissions decide which client
  repos their Codespace can see and push.
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
- Write access is GitHub's: org members read the workbench and write only their own client repos
  (org → People → the member → repository access). The Codespace grant in `.devcontainer/` never
  exceeds the member's own permission.
- `go` opens Codex without a brief; say "build `<brief>`" in a client's Codex to start one (in a
  terminal: `go -b prompts/<brief>.md <client>`).
- The template's `hostRequirements` asks for at least 2 cores / 8 GB: the smallest machine is offered
  first, but a member can still pick a bigger (dearer) one; only a paid-plan org policy on machine
  types restricts it.

## Staff terminals are Codex

When the Feature's `owner` option names a GitHub login, in a Codespace created by any other account
every new terminal runs `go --loop`: pull, setup, check, the logins, then Codex. With no client yet it
signs in and opens the lobby just like the owner's terminal — no stop: say "set up a client" or
"continue `<name>`". From then on Codex works in that client, and every time Codex exits (Ctrl+C, a
crash) the client folder is saved to GitHub (`save`) and Codex opens again in the same client; a ❌
waits for Enter and retries. For another client, close the terminal and open a new one. Only one `go` runs per Codespace: a
second terminal is refused with a pointer to the running one (a kernel file lock, released when that
Codex ends, crash included). VS Code can still open another
terminal, so this is the default experience, not a wall: the locks that hold are the Codex sandbox and
the GitHub permissions (read on the workbench, write on the client repos only). The `maxHours`
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

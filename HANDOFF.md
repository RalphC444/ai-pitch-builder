# Handoff: AI Pitch Builder prototype

Everything a new session needs to keep working on this project: what exists, how to run and check it, what the user decided, how they like to work, and what's still open. Last updated 2026-10-24.

---

## 1. The project in one paragraph

A front-end-only React prototype of Guidepoint's **AI Pitch Builder** (expert network). A Project Manager picks advisors from a CRM table (the **Express List**), the app drafts a client pitch for each advisor using an AI prompt per project "angle", scores every statement for confidence, offers sourced rewrites through an **AI companion card**, then composes and sends a **Guidepoint-branded client email**. Demo data: request **#1085069**, a GLP-1 elastomer and device supply project with three angles (GLP-1 Formers; GLP-1 primary packaging/elastomer procurement; Biosimilar players) and 25 advisors.

The user is **Ralph Capriglione**, a product designer at Guidepoint. He also uses this app to strengthen his portfolio case study (section 9).

---

## 2. Run it

```bash
cd "/Users/ralphcapriglione/Desktop/New Cursor MVP For Pitch Curation"
BROWSER=none PORT=3000 npm start      # http://localhost:3000
npx tsc --noEmit -p .                 # typecheck (clean as of handoff)
npx eslint --ext .ts,.tsx src         # 0 errors; ~15 old warnings in legacy files
```

- Stack: React 18, TypeScript 4.9, Create React App (react-scripts 5), Tailwind 3, **MUI v5** + @mui/icons-material + Emotion. `StyledEngineProvider injectFirst` lets Tailwind classes override MUI.
- Theme: `src/theme.ts`. Font **Poppins** everywhere in the UI. Primary #0068bc, success #149c4d, warning #fe800f, error #c41e2f, radius 6, buttons not uppercase.
- Breakpoints: `src/hooks/useMediaQuery.ts`. `MOBILE_QUERY` = max-width 639px, `COMPACT_QUERY` = max-width 1023px.
- Git repo: **https://github.com/RalphC444/ai-pitch-builder** (public). `main` holds the source.
- Live demo: **https://ralphc444.github.io/ai-pitch-builder/** (GitHub Pages, served from the `gh-pages` branch).
- The OpenRouter key lives in **`.env.local`** (git-ignored; template in `.env.example`) and is read as `REACT_APP_OPENROUTER_API_KEY`. Restart `npm start` after changing it.
- **Redeploying the demo:**
  1. Build **without the key**, or it gets baked into the public JavaScript: `REACT_APP_OPENROUTER_API_KEY= npm run build`.
  2. Check for the key: `grep -rl sk-or-v1 build` must print nothing.
  3. Copy `build/` into a fresh folder, add `.nojekyll`, commit, and force-push to `origin gh-pages`.

  The demo uses the offline AI fallbacks. `package.json` sets `homepage: "."` so assets load from the Pages subpath.
- `plan.md` is the user's original project plan.

---

## 3. Rules and preferences (follow these)

**Hard rules**
- **Never download or pull SVGs from Figma, and never add SVG files yourself.** This is at the top of `plan.md`. That is why the Guidepoint logo is a text stand-in (section 7).
- **Ask before building ideas the user frames as discussion** ("let's talk about it", "prompt me with questions", "maybe a scale of…"). Building the human-in-the-loop review agent unasked earlier drew "you kind of went and did your own thing, which I did not want you to do". Build only what's explicitly requested, and flag any extra you add.
- Call the role **"Project Manager"**, never "RM". Email addresses like `rm1@guidepoint.com` are data, so leave them.
- **Security:** the OpenRouter key is in `.env.local` only. It was moved out of `src/services/aiService.ts` before the first commit, so it has never been in git. Never commit it, and never build the public demo with it. The app falls back to offline rule-based logic without it.
- Don't send the user's email address to outside services.

**How they work**
- They iterate fast and often send new requests mid-task. Handle each one, then report everything that changed.
- They want short, plain explanations and a visual check before you report. Verify in the browser at desktop (1440) and phone (390) widths.
- Mobile matters: buttons hug their content (not full width), no horizontal page scroll.
- MUI across the board. Use MUI icons (no ✉︎-style glyphs).
- They like questions when something is truly ambiguous (AskUserQuestion), but not for things with an obvious default.

---

## 4. Screens and flow (V2, the "ideal experience")

`Express List → Pitch Curation (step 1) → Compose Email (step 2) → Send To Client (step 3)`

**Navigation** (`src/components/navigation/Navigation.tsx`)
- Sticky white top bar. On the left, the **Guidepoint logo** and then "Request: #1085069 • {crumb}". The crumb is "Express List" or "AI Pitch Builder"; the "• Email" crumb was removed.
- On phones only the logo and request number show, because the page title already names the step.
- **Every main button for a step sits in the nav's top-right.** Steps place them there with `NavActions` (`src/components/navigation/NavActions.tsx`, a portal into `#nav-step-actions`).
- **Close** is a plain X icon with a tooltip:
  - hidden on the Express List
  - on the other steps it goes back to the Express List
- A floating kebab button at the bottom-right switches between **V2** (ideal) and **V1** (original), stored in localStorage `experienceVersion`.

**Express List** (`src/experiences/express/`)
- **Table** (`ExpressList.tsx`): an MUI table of 25 advisors (`src/data/expressList.ts`).
  - The checkbox and name columns are pinned on the left and use solid row backgrounds, which fixed a text-overlap bug.
  - 7 essential columns by default (Name, Status, Angle, Company, Job Title, Country, Rate, Engagement). An "All columns" toggle shows all 27.
  - The header line reads "25 advisors · 7 selected". Filter and sort show as chips only when active.
- **Nav buttons** (`ExpressActions.tsx`): an **Actions ▾** menu and **Send (n)**.
  - Actions contains Add advisors, then Apply to request page, Add qualifier, and Assign angle 1–3.
  - **Send to Client (n)** ("Send (n)" on phones) is one action that starts the client send. It drafts the pitches and opens the Pitch Builder, and the toast reads "Drafting pitches for n advisors". It replaced a "Send To Client ▾" dropdown from the original Figma and the ambiguous "Send".
- **Detail card** (`AdvisorDetailCard.tsx`): clicking a row opens it. ↑ / ↓ / Esc navigate.
- **Status icons** (`QualifiedStatusChips.tsx`): tinted squares without borders.
- **Agentic PM** (`AgenticPM.tsx`): a natural-language chat that applies filters. It is **hidden** (`AGENTIC_PM_ENABLED = false`).

**Pitch Curation, step 1** (`src/experiences/v2/`)
- **Page** (`PitchCurationV2.tsx`):
  - Pitches draft automatically. The user explicitly does **not** want a Generate button. Loading starts when advisors arrive from the Express List (`startPitchLoading` in `App.tsx`): each card shows a mini skeleton (`src/components/loader/PitchSkeleton.tsx`, a name bar, tag pill and three lines, modelled on the 'AI goes to work' frame of the deck film). The first pitch lands at 500ms, the rest follow about 90ms apart with a short fade, and the header reads "Drafting pitches…" until they're all in. Regenerating after an Edit Prompt change uses the same skeleton.
  - An **Edit Prompt** button in the pitches header opens `PromptDrawer` (`src/components/prompt/PromptDrawer.tsx`), with one prompt template and key details per angle.
  - Saving the prompt regenerates the pitches, and the app asks before replacing pitches someone has edited.
  - The nav button is **Next: Review & Send** ("Next" on phones).
- **Pitch card** (`PitchCardV2.tsx`):
  - The name is followed by **tags** (`src/components/badges/Tag.tsx`): neutral for the angle, purple Vetted, orange Unvetted. All tags are 22px tall, 12px semibold.
  - A quality score out of 100 shows in view and edit mode.
  - The current role sits inside the editor text.
  - In edit mode, statements are underlined by confidence (green, orange, red). The score updates **4 seconds** after typing stops, and the caret position is kept.
  - The ↗ button opens `QualityPanel.tsx`.
  - Top-right actions have tooltips: Clear pitch / Discard changes / Save pitch in edit mode, Edit pitch / Remove advisor otherwise. They're keyed separately so a tooltip can't carry over between modes.
- **Companion card** (`IssuePopover.tsx`, the "Direction A compact card" the user chose): click a flagged statement to open it.
  - Header: issue type, confidence, previous/next issue, close.
  - Each suggestion shows a highlighted diff, a reason pill (e.g. "Uses their screener answer · 3 sources") that opens the sources, a **profile icon button** that opens Profile Data, and **Apply**.
  - Sources have copy icon buttons.
  - Prompted rewrites replace the current options (only the latest set shows).
  - After Apply, a one-line **"✓ Rewrite applied · Undo · Next issue · ✕"** bar docks in the editor's bottom-left corner, clear of the text.
- **Profile drawer** (`src/components/drawer/ProfileDrawer.tsx` + `GenerateFromProfileBar.tsx`): select profile items, add an optional prompt, then **Generate Into Pitch** (Add to Pitch / Replace Bullets / Discard / Regenerate) or **Insert As-Is**.
- **Analysis logic** (`src/data/pitchAnalysis.ts`): rule-based scoring, issue types, suggestions and a word-level diff, with an OpenRouter call and offline fallback. Vetted advisors get a per-statement confidence bonus (+8) and unvetted a small penalty (-6), so vetted pitches typically score higher (demo data averages ~86 vetted vs ~78 unvetted); it's a tendency, not a hard rule, so a strong unvetted pitch can still score well.
- **Prompt data** (`src/data/anglePrompts.ts`): angle prompts and the fallback pitch generator.

**Compose Email, step 2** (`src/experiences/composer/EmailComposer.tsx`)
- **Landing view (preview)**: the page title is "Compose Email". It shows the email as recipients get it, built from the Guidepoint email template (Figma `kDmgH7b7mKLNZNUBozkJWK`, node `9738:5834`):
  - an email-client header (From / To / Cc including Compliance / Bcc / Subject, in Arial 14)
  - the logo centred
  - a 600px Arial 16/1.4 body
  - the office list and legal disclaimer in grey
  - a yellow #FFCD00 footer band with the logo and MUI LinkedIn / X / Facebook / Instagram icons

  The thread pill was removed. A **copy button** (`CopyEmailButton.tsx` using the shared `ElevatedIconButton`) floats at the top-right and stays pinned while scrolling. It copies only the body, as HTML plus plain text. The preview card uses `overflow: clip`, not `hidden`, so sticky positioning keeps working. "Emails In This Thread" sits below the preview, collapsed.
- **Two buttons only, in the nav:** **Edit Email** and **Send Email**.
- **Edit view** (the "composer screen"):
  - **Specify Recipients** is collapsed to the Thread field (with a "+ New thread" option) and a "Show all fields" toggle.
  - **Introduction** editor.
  - **Advisor pitches**, read-only. The pencil goes back to step 1.
  - **Content blocks**: sections styled like the Introduction, each titled "Content Block" (numbered when there are several) with a rich-text editor and a remove button. A dashed-border **"＋ Add content block"** box adds one and focuses it. They sit between the pitches and the Closing Message, are stored in `draft.blocks` (`src/data/contentBlocks.ts`, type `text`), and render in the preview and email. The earlier Notion-style block editor was replaced at the user's request.
  - **Closing Message** editor (previously "Content Block", then "Footer").
  - The nav buttons are **Preview Email** and **Send Email**, and the back arrow returns to the preview.
- **Shared email pieces** (`EmailPreviewModal.tsx`): `EmailBody` (intro, advisors with tags, blocks, closing), `EmailHeaderRows`, `EmailBrandHeader`, `EmailBrandFooter`. The modal itself is no longer used.
- **Saving:** "Save As Draft" was removed. Draft state lives in `App.tsx` (`emailDraft`).

**Send To Client, step 3** (`SendConfirmation.tsx`)
- A centred full-screen message: a big check, "Email sent", the time, then the subject and recipients using the same `EmailHeaderRows` as the preview. Before this change they differed, and the user complained.
- A **Sent | Failed** toggle previews the error state. Failed reads "Email didn't send" and offers **Back to Email** and **Try Again** in the nav.
- On success the only button is **Back To Project** ("Project" on phones), which goes to the Express List. Taking it there was my call; the user asked only for the label.

**Brand logo** (`src/components/brand/GuidepointLogo.tsx`)
- It loads `public/guidepoint-logo.svg` if it exists. Otherwise it shows a text stand-in: "Guidepoint" plus a yellow dot, or a black dot with `tone="black"` for the yellow footer.
- **The user still needs to supply the official logo file.** Figma uses a one-colour black version in the footer.

**Hidden features (don't re-enable without asking)**
- `AGENT_REVIEW_ENABLED = false` in `src/data/agentReview.ts`: the AI review agent with 0–100% human-in-the-loop levels, hard compliance constraints and an undo window (`AgentReviewPanel.tsx`).
- `AGENTIC_PM_ENABLED = false` in `src/experiences/express/AgenticPM.tsx`.
- V1 (`src/experiences/v1/PitchBuilderV1.tsx`) is the legacy experience, kept for reference and not converted to MUI.

---

## 5. Decision log (what the user asked for, in order)

1. Make it mobile responsive. Buttons hug on mobile, and the loading UI is optimised for mobile.
2. Translation moved to the top nav. An Edit Prompt flow was added (per-angle template and key details, side drawer, save and regenerate), and a composer was built from Figma.
3. The original became "V1" behind the kebab menu, and V2 was built from Figma `KREujOveMkpdUPT72F5K0d`.
4. All fonts changed to Poppins. The agentic and human-in-the-loop work was **hidden** afterwards; the user wants to discuss it first. The only automatic edit they'd consider is **pitch rewrites**.
5. Built Figma 1-9493 (suggestion popover) and 1-19886 (↗ opens the side Pitch Quality panel). The current role goes inside the editor, and the quality score shows outside edit mode.
6. Live quality feedback 4 seconds after edits, and an initial AI load of 500ms.
7. Select profile data and generate into the pitch, with or without a prompt.
8. Companion cleanup via an ideation board. The user picked **"A · Compact companion card"** and asked to "barely touch the sidebar". Companion options show only the most recent set.
9. The breadcrumb became "AI Pitch Builder". The step 3 preview opens by default.
10. Express List built (Figma `7:4995`). Filtering became a chat called "Agentic PM", which is now hidden.
11. Recipients collapsed to Thread, with a new thread option.
12. Agentic PM hidden, the table cleaned up, more advisors added, MUI everywhere, and the mail glyph replaced.
13. Fixed the text overlap in the pinned table cells.
14. The Express List simplified, and Actions + Send replaced Add Advisors and Close in the nav (Express List only). "Veer from designs a bit" was explicitly allowed.
15. Close on the Pitch Builder goes back to the Express List. The "• Email" crumb was removed.
16. Step 2 lands on a preview with only Edit Email and Send Email. Edit Email lands on the composer.
17. All docked bottom buttons moved to the top nav. Angle and vetting tags were unified. Close became an X icon.
18. The sent screen became a full-screen message with a Sent/Failed toggle, and recipients match the preview. A floating copy button was added.
19. The email preview wraps sooner (600px) and was restyled to the GP-branded Figma. The thread pill was removed and the logo added to the nav (as a stand-in).
20. Tooltips on the edit actions, and the Clear tooltip carry-over bug fixed.
21. Companion: a consistent reason pill plus a profile icon button in the same style as the copy button. The applied bar was cleaned up and stopped covering text.
22. Content blocks in edit mode (first Notion-style, later replaced by Introduction-style sections with a dashed "Add content block" box, see decision 26). "Content Block" became **Closing Message**. Step 2's title is **Compose Email**.
23. "Back to Pitch Builder" became **Back To Project**. The divider between the logo and the request number was removed.
24. Copy pass: each line now does a different job.
    - Stepper labels stay **Pitch Curation / Compose Email / Send To Client**. Shorter labels were tried and reverted, because the connector lines got too long.
    - Step 1's title is **"Review these AI drafts"** and its subtitle is "Fix anything flagged, then continue to the email."
    - The pitches header is a live status line, "7 advisors · 3 need a look", or "All pitches look good" when none are flagged. It counts pitches whose score isn't green.
    - Step 2's preview subtitle is "Check how it reads, then send."
25. Angle tags shortened and made consistent, using `src/components/badges/AngleTags.tsx` on the pitch cards, the email editor and the email preview.
    - Short names: GLP-1 Formers, Packaging & Elastomers, Biosimilars.
    - An advisor with several angles shows a single "2 angles" tag. Hovering any angle tag lists each angle by number and full name.
    - Demo data: Dr. Matyas Lakatos also covers Angle 1, and Kam Tektas also covers Angle 2. `angles[0]` stays the primary angle, which drives the prompt.
26. Content blocks simplified: each one is an Introduction-style section titled "Content Block", added from a dashed-border "＋ Add content block" box. The Notion-style editor (`ContentBlocks.tsx`) was deleted.
27. The Express List button became **Send to Client (n)** ("Send (n)" on phones), one action.
28. Every dropdown uses the rounded `ExpandMoreRounded` chevron: the MUI selects get it through `theme.ts` (`MuiSelect.defaultProps.IconComponent`), and the toolbar dropdowns, Actions and the recipients toggle use it directly. The recipients toggle sits at the right edge at every width, reading "Show all fields ⌄" closed and "Hide fields ⌃" open, with the To/Subject summary shown while closed. Redeployed to GitHub Pages on 2026-10-25 (bundle `main.7b8603bc.js`). The portfolio case study's "Try the app" banner links there.

---

## 6. Artifacts (claude.ai, all private to the user)

| Artifact | URL | Local source |
|---|---|---|
| Agentic / human-in-the-loop story (1–10 scale) | https://claude.ai/artifact/85Nt2cv1WY89vj23hA3oeq | `docs/handoff/artifacts/agentic-story.html` |
| Case study revision plan (with screenshots, plus the redesigned basic-vs-fast-path section with copyable React + CSS at `#fast-path`) | https://claude.ai/artifact/XLsx4aSoDcdd8TkLAYCUL4 | `docs/handoff/artifacts/case-study/index.html` + `shots/` |
| Companion card ideation board | https://claude.ai/artifact/V5we6bdefis4hCtYq4o8vT | `docs/handoff/artifacts/ai-companion-cleanup.html` |

To update one from a new session, pass its URL as `url` to the Artifact tool. Read it first; the tool refuses a publish to an artifact the session hasn't read. The case study page publishes its 14 screenshots as `files` under `shots/`.

---

## 7. The autonomy story (what was agreed)

- Scale: **1** means a person does everything; **10** means no person is involved. The page header says the level describes the core work (writing pitches and the client email), and the step cards show per-step scores.
- **Today = 5, "Draft by default"**: the AI produces the first version of everything and a person reviews and edits all of it. I first scored it 3 (an average of the steps); **the user corrected me to 5**, and the page was re-anchored.
- Scenarios: Today 5 → **Next 6** (approve once) → **Target 7** (routine sends on their own, exceptions escalated). A "Why we stop at 7" card explains that a machine can't judge whether an email is right for a particular client.
- Step scores today: Pick advisors 4, Draft 5, Prompt 4, Quality 5, Profile 4, Compose 5, Send 2. Two of these rest on assumptions:
  - The Express List recommendation and summary fields are treated as AI-generated. In the prototype they're mock data.
  - The email arriving "drafted" comes from a template in the prototype.
- The user said they're **"technically at 8 because of the companion"**. We agreed this is about **AI capability** (~8), not autonomy (5). They said **don't change the page for now**. If they revisit it, add a capability axis next to the autonomy one; the message is that capability is high and what's missing is trust and guardrails.
- Hard constraints, from the hidden review-agent spike (`HARD_CONSTRAINTS` in `src/data/agentReview.ts`):

  | Rule | Can a machine check it today? |
  |---|---|
  | Valid recipients | Yes |
  | Compliance copied | Yes |
  | Advisor volume capped at 10 | Yes |
  | Unvetted advisors disclosed | Partly |
  | No unverified claims (<60% confidence) | Partly |
  | No confidential information (MNPI) | Partly |
  | Right for this client | No |

- The user wants to **talk through** human in the loop before anything is built. Don't build it.

---

## 8. Open items and known UX risks

**Waiting on the user**
- The official Guidepoint logo file, saved as `public/guidepoint-logo.svg`, plus a one-colour black version for the footer.
- Whether to act on the UX risks below. I raised them; they haven't asked for fixes yet.

**UX risks I raised (not fixed unless noted)**
1. Send is one click away in the pinned nav, with no checks and no undo. My suggestion: an undo window or a pre-send check.
2. Clicking Next while a pitch is still being edited discards the unsaved draft without warning. Confirmed in code.
3. The Express List button was renamed **Send to Client**, so it now names where the advisors are going. Resolved.
4. Unvetted disclosure: the email now shows Vetted/Unvetted tags on each advisor, which partly addresses this.
5. "Hi Claire" is hard-coded, so the greeting doesn't follow the recipients. The preview also doesn't flag low-quality pitches.
6. Label mismatches: resolved by the copy pass (decision 24).
7. The back arrow and the X go to different places.
8. Toasts linger across steps and cover content on phones.
9. Seven advisors start out pre-selected on the Express List.

**Contradictions with the published case study** (section 9): auto-generate on load, the send approval gate, translation moving into the editor toolbar, and the bulk toolbar.

---

## 9. Portfolio case study

- Live page: https://www.ralphanthonycapriglione.com/#/case-study/ai-pitch-short. It's a single-page app, so WebFetch gets nothing. The text lives in the chunk `assets/ai-pitch-short-*.js`; a copy is at `docs/handoff/artifacts/folio-ai-pitch-short.bundle.js`.
- Current content:
  - Title "AI Advisor Pitches", Guidepoint · CRM Next · Q1–Q2 2025.
  - Outcomes **4×** faster (40–60 minutes down to under 10), **100%** drop in clients lost to speed (unvetted flow), **250** Project Managers on early release.
  - Sections:
    1. Problem: "Competitors answered in 15 minutes. We took an hour."
    2. How-might-we
    3. Discovery with 10 PMs: "seven ways of writing the same thing"
    4. Basic path vs fast path (unvetted)
    5. Usability testing with 7 PMs, Option A vs B. B won, and auto-generate on load was killed.
    6. Model workshop: "confident and wrong about unvetted advisors"; "Trust comes before polish"; "Weight recent screeners, and show the reasoning"
    7. What shipped: an editing-first layout, bulk toolbar, single rewrite, and composer merged and gated on approval
    8. "An hour down to less than ten minutes."
    9. Thesis: "The model drafts, the PM judges."
- Recommendations (full detail in the case study artifact):
  - Keep the shipped story as chapter 1, with its metrics labelled as the beta.
  - Add **Chapter 2, "From fast drafts to trusted drafts"**, with seven sections: Express List start, statement scoring, companion with sources, generate from evidence, per-angle house style, review then send, outcome states.
  - Add the autonomy section.
  - New thesis: "The model drafts and shows its work. The PM judges faster."
  - Don't claim numbers for v2; measure edits per pitch, accept rate, undo rate, and time from shortlist to send.
  - The user said not to worry about blurring advisor names.
  - **Basic vs fast path section:** redesigned into a shared start, two 4-step lanes and a shared end, with copyable React + CSS. It's in the case study plan at `#fast-path`.
  - **Usability test image (`/ai-summ-UT.png`):** redrawn in the current UI with the same Option A (lost) / Option B (won) structure. Files: `docs/handoff/artifacts/case-study/shots/15-ut-concepts.png` (3868×2580, same size as the original); source in `docs/handoff/artifacts/ut-concepts-source.html`. It's in the case study plan at `#ut-concepts`.

---

## 10. Figma references

- `KREujOveMkpdUPT72F5K0d`: V2 ideal flow (nodes 1-6249, 1-24126, 1-9493, 1-19886, 7-4995, 0-1). Accessible.
- `kDmgH7b7mKLNZNUBozkJWK` node `9738:5834`: Guidepoint email template (email comp 2026). Accessible.
- `xBj4VoY2hXpv52AQcYZsZ0` (Unified Email Experience POC): **no edit access** from the MCP. The user copied the frames into `KREuj…`.
- With the Figma MCP, call `create_session` first, and load the `figma-design-to-code` guidance (MCP resource `skill://figma/figma-design-to-code/SKILL.md`) before `get_design_context`. **Do not download Figma assets** (rule in section 3).

---

## 11. Checking changes in a real browser

- I drove headless Chrome over the DevTools protocol:
  ```bash
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --remote-debugging-port=9333 --user-data-dir=/tmp/chrome-profile about:blank &
  ```
- The scripts are in `docs/handoff/scripts/` and need the `ws` package path as their first argument, e.g. `node review.js <path-to>/node_modules/ws <outDir> 1440 900`. Last session used an npx cache path that may not exist any more; `npm i --no-save ws` in a temp folder works.

| Script | What it checks |
|---|---|
| `review.js` | Full flow: Express List → Curate → Compose preview → copy → edit → send → failed → Back To Project |
| `companion.js` | Card tooltips, companion card suggestion rows and sources, Apply, position of the applied bar |
| `blocks.js` | Content blocks (add, Enter, "/" menu, divider), preview, pinned copy button, width of the footer band |
| `capture.js` | Retakes the 14 case study screenshots at 2× |
| `express.js` | Older Express List and Agentic PM check; the chat is now hidden, so it needs updating |

- Quirks:
  - Size arguments must be separate shell words; zsh needs `${=s}`.
  - Crop screenshots only on an unscrolled page, or take full-viewport shots.
  - Chrome fires a hover on whatever element appears under a stationary cursor. A tooltip showing straight after a mode switch can just be normal hover, so check that it closes when the mouse moves.

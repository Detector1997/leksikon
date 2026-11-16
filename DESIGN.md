---
name: Лексикон
description: A nineteenth-century lexicon page as a working vocabulary trainer — engraving ink on uncoated cream stock, colour only where state lives.
colors:
  paper: "#f2ecdf"
  paper-2: "#e9e1cf"
  paper-3: "#ded4bf"
  ink: "#16130f"
  ink-2: "#4b4337"
  ink-3: "#685e4f"
  rule: "rgba(22, 19, 15, 0.2)"
  rule-2: "rgba(22, 19, 15, 0.42)"
  vermilion: "#b5321f"
  vermilion-ink: "#fbf3e4"
  chrome: "#c98a0e"
  emerald: "#2e6b47"
  ultramarine: "#24489a"
  violet: "#6b4e8e"
  night-paper: "#1a1712"
  night-paper-2: "#231f18"
  night-paper-3: "#2e2920"
  night-ink: "#ede5d3"
  night-ink-2: "#c2b8a4"
  night-ink-3: "#a0957f"
  night-rule: "rgba(237, 229, 211, 0.18)"
  night-rule-2: "rgba(237, 229, 211, 0.4)"
  night-vermilion: "#d9543c"
  night-chrome: "#dfa63a"
  night-emerald: "#5aa77a"
  night-ultramarine: "#7b98e3"
  night-violet: "#ab90d3"
typography:
  display:
    fontFamily: "Old Standard TT, Gentium Book Plus, Georgia, serif"
    fontSize: "76px"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  headword:
    fontFamily: "Old Standard TT, Gentium Book Plus, Georgia, serif"
    fontSize: "clamp(34px, 11vw, 52px)"
    fontWeight: 700
    lineHeight: 1.05
  headline:
    fontFamily: "Old Standard TT, Gentium Book Plus, Georgia, serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Old Standard TT, Gentium Book Plus, Georgia, serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.12
  entry-headword:
    fontFamily: "Old Standard TT, Gentium Book Plus, Georgia, serif"
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.35
  running-head:
    fontFamily: "Old Standard TT, Gentium Book Plus, Georgia, serif"
    fontSize: "16px"
    fontWeight: 400
  body:
    fontFamily: "Gentium Book Plus, Old Standard TT, Georgia, serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"lnum\""
  body-small:
    fontFamily: "Gentium Book Plus, Old Standard TT, Georgia, serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Gentium Book Plus, Old Standard TT, Georgia, serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.08em"
    fontFeature: "\"smcp\", \"c2sc\""
rounded:
  none: "0px"
  hairline: "2px"
spacing:
  unit: "8px"
  gutter: "20px"
  plate-inset: "14px 16px"
  section: "40px"
  measure: "560px"
  tabbar: "64px"
components:
  button-primary:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.vermilion-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.hairline}"
    padding: "0 22px"
    height: "52px"
  button-primary-active:
    backgroundColor: "color-mix(in srgb, #b5321f 86%, #16130f)"
    textColor: "{colors.vermilion-ink}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
    padding: "0 22px"
    height: "52px"
  button-secondary-active:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
  button-small:
    rounded: "{rounded.hairline}"
    padding: "0 16px"
    height: "44px"
  link-button:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    height: "44px"
  link-button-danger:
    textColor: "{colors.vermilion}"
  chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
    padding: "0 14px"
    height: "38px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
    padding: "8px 12px"
    height: "46px"
  plate:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "{spacing.plate-inset}"
  tab:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    height: "{spacing.tabbar}"
  tab-active:
    textColor: "{colors.vermilion}"
  thumb:
    textColor: "{colors.ink-2}"
    width: "44px"
    height: "52px"
  thumb-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  quiz-option:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
    padding: "10px 16px"
    height: "58px"
  quiz-option-right:
    backgroundColor: "{colors.emerald}"
    textColor: "{colors.paper}"
  quiz-option-wrong:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.vermilion-ink}"
  segmented-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    height: "44px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.hairline}"
    padding: "10px 16px"
---

# Design System: Лексикон

## Overview

**Creative North Star: "The Nineteenth-Century Lexicon Page"**

Every word is a dictionary entry and every list is a lexicon page. The app is set like a printed reference work: engraving black on uncoated cream stock, a running head ruled across the top of each page, entries with a bold headword, italic part of speech, bracketed IPA and an italic example in which the headword is printed as a swung dash (~). Structure is carried by rules (hairlines, a heavier head rule, double rules around plates and the tab bar), never by cards, fills or shadows. The night variant is the same page reversed: cream ink on dark stock, with the inks lifted so they still read.

Colour is ink, and ink means state. Five printer's inks code the five Leitner boxes (vermilion, chrome yellow, emerald, ultramarine, violet); vermilion also carries the one action that matters, today's progress, and selection. Everything else is black, two greys and the paper. The page is dense the way a dictionary is dense: generous type sizes for thumb use (17px body, 21px headwords), tight ruling between entries, one 560px column.

Motion is a page passing. Screens and training items slide in horizontally from the side they lie on, a short distance on a decelerating curve; nothing fades in. The app mark follows the same world: a vermilion plate with a cream double rule and "Aa" cut from real Old Standard TT outlines (authored vector, generated by script, no raster provenance gap).

**Key Characteristics:**
- Cream stock, engraving-black ink, no shadows, no rounded cards.
- Hairline, head and double rules do all the structural work.
- Five Leitner inks plus vermilion are the only colours, and each one means a state.
- Old Standard TT for headwords, numerals and display; Gentium Book Plus for text, IPA and small-caps labels.
- Guide words in the running head, a thumb index on the shoulder, page-passing motion.

## Colors

A two-grey engraving palette on cream stock, with five saturated printer's inks reserved for state.

### Primary
- **Vermilion** (#b5321f; night #d9543c): the action ink. The primary button ("Тренировать", "Сохранить набор", "Помню"), the active tab, the daily-goal fill, completed days in the week row and calendar, the selected entry's headword and margin tick, "к повтору" counts, wrong answers, destructive links, the focus ring, text selection and the caret. It is also Leitner box 0 (new words).
- **Vermilion Ink** (#fbf3e4; night flips to #1a1712): the only text colour allowed on a vermilion fill.

### Secondary
- **Emerald** (#2e6b47; night #5aa77a): Leitner box 2, and the "right" state: correct quiz option, correct typing, the "помню" stamp, chart bars that met the goal, success status lines.

### Tertiary
- **Chrome Yellow** (#c98a0e; night #dfa63a): Leitner box 1. Never used for text on paper.
- **Ultramarine** (#24489a; night #7b98e3): Leitner box 3.
- **Violet** (#6b4e8e; night #ab90d3): Leitner box 4, "выучено" (learned).

### Neutral
- **Uncoated Cream Stock** (#f2ecdf; night #1a1712): the page, every surface, the sticky head and tab bar, button faces. Also the manifest and theme colour.
- **Thumbed Stock** (#e9e1cf; night #231f18): pressed state of rows and buttons, the notice panel, the switch track when on.
- **Foxed Stock** (#ded4bf; night #2e2920): skeleton bars only.
- **Engraving Black** (#16130f; night #ede5d3): body text, headwords, the head rule, plate and button rules, selected chips, thumbs and segments, the toast.
- **Second Impression** (#4b4337; night #c2b8a4): secondary text: running-head ornament, captions, parts of speech, IPA, examples, inactive tabs, icons.
- **Faint Impression** (#685e4f; night #a0957f): placeholders, option keys, hints, out-of-month calendar days, the goal denominator.
- **Hairline** (rgba 20% ink): rules between entries, rows, week cells and tabs.
- **Rule** (rgba 42% ink): section underlines, control outlines, the inner line of the button double rule, unchecked tick boxes.

### Named Rules
**The Ink-Is-State Rule.** Every coloured pixel answers a question: which box, is it right, is it today's action, is it selected. Decorative colour does not exist; if a colour can't name the state it reports, it is black.

**The Five-Box Order Rule.** The Leitner inks always appear in box order 0 → 4 (vermilion, chrome, emerald, ultramarine, violet), whether as box-bar segments, legend swatches or entry box marks. Box ink is set through `--box-0…4`, never by picking a hue directly.

**The Vermilion-Ink Rule.** Text on vermilion is always Vermilion Ink, never white or paper, so the pairing survives the night flip.

## Typography

**Display Font:** Old Standard TT 400/700 (with Gentium Book Plus, Georgia, serif)
**Body Font:** Gentium Book Plus 400, 400 italic, 700 (with Old Standard TT, Georgia, serif)
**Label Font:** Gentium Book Plus in all-small-caps, tracked 0.08em

**Character:** A Didone-leaning dictionary face for everything that is looked up or counted, set against a calm scholarly text face that carries Cyrillic, IPA and italics well. Both are self-hosted via Fontsource; there is no system display face.

### Hierarchy
- **Display** (700, 76px, 0.9, -0.02em): the streak numeral. The same treatment, sized by role, sets the session score (84px), and the due count in its plate (46px). Tracker figures are ledger values at 20px, not display numerals.
- **Headword** (700, clamp(34px, 11vw, 52px), 1.05): the word on a flashcard; the quiz and typing prompt use a near sibling (clamp(32px, 10vw, 46px)). Breaks anywhere rather than overflowing.
- **Headline** (700, 34px, 1.12): one page title per screen ("Выбери слова", set name, "Настройки").
- **Title** (700, 22px): section titles, ruled underneath with a count at the right; button labels (19px) and setting labels (19px) sit in this voice.
- **Entry Headword** (700, 21px, 1.35): the bold lemma of every entry row and set row.
- **Running Head** (400, 16px): guide words and the back link in the head rule.
- **Body** (400, 17px, 1.5): translations, ledes (max 34em), notices. Lining numerals by default; tabular lining numerals (`.num`) wherever figures sit in columns or change.
- **Body Small** (400, 15px): examples (italic), plate captions' right side, hints, status lines.
- **Label** (400, 14px, 0.08em, all small caps): tab labels, weekday heads, plate captions ("К повторению"), flashcard level·pos, the "помню / не помню" stamps.

### Named Rules
**The Dictionary Entry Rule.** An entry is always: bold headword (display face) → italic part of speech → [IPA] in second impression → translation → italic example with the headword as "~". Never a bare word–translation pair.

**The Small-Caps Rule.** Labels are small caps from the text face, never uppercase display type.

**The Numerals-Are-Display Rule.** Any count the learner is meant to notice (streak, due, score, goal, ledger values) is set in Old Standard TT bold with tabular lining figures.

## Layout

One column, max 560px (`--measure`), centred, with 20px side gutters and an 8px base unit (sections open at 40px, page titles at 24px, plates sit 16px off their neighbours). There are no breakpoints: on wider screens the page simply stays a page.

The page is framed top and bottom. A sticky running head (safe-area aware) carries two guide words with a fleuron between them over a 1.5px ink rule; on list screens the guide words are recomputed from the first and last entry currently in view, on other screens they carry the page's running context (weekday and date on Today, back link on detail screens). A fixed tab bar sits on a 3px double rule at the bottom, 64px tall plus the safe area, four equal cells divided by hairlines.

The pick screen adds a shoulder: a 44px thumb-index column on the right edge, sticky under the head, one 52px thumb per CEFR level, ruled off with a 1px ink line. A sticky pick bar rides above the tab bar on a 1.5px ink rule. Training screens drop the tab bar and become a full-height column: close button, a 3px progress rule and count, then the stage.

Lists are ruled, not boxed: entries, set rows, settings, the tracker ledger (label left, value right) and calendar weeks are separated by hairlines with 12–16px vertical padding.

### Named Rules
**The Running-Head Rule.** Every non-training screen opens with the head rule. Where entries are in view, its two sides are guide words; nowhere is it replaced by a toolbar or a title bar.

**The Thumb-Height Rule.** The one primary action on a screen is a full-width 52px button docked at thumb height: on Today it sits in a sticky dock (paper ground, 1px rule above) directly over the tab bar; on the pick screen the pick bar plays the same role.

## Elevation & Depth

The system is flat. There are no drop shadows anywhere; depth is conveyed by sticky layers on opaque paper and by rule weight (hairline < 1.5px head rule < 3px double rule). `box-shadow` appears only as a rule-drawing device, always inset, to print the inner line of a double rule or a focus stroke.

### Shadow Vocabulary
- **Double-rule inset** (`box-shadow: inset 0 0 0 3px var(--paper), inset 0 0 0 4px var(--rule-2)`): the inner line of the secondary button's double rule. The primary button prints its inner line in 65% Vermilion Ink.
- **Field focus stroke** (`box-shadow: inset 0 0 0 1px var(--ink)`): thickens a field's outline to 2px ink on focus.
- **Partial-day ring** (`box-shadow: inset 0 0 0 1.5px var(--vermilion)`): a calendar day with some practice but the goal unmet.

### Named Rules
**The Printed-Not-Lifted Rule.** Nothing floats. If a surface needs to read as separate, rule it; never shadow it, blur it or tint it into a card.

## Shapes

Square-cut stock. Plates, card faces, the typing input and the thumb index have no radius at all; interactive controls (buttons, chips, fields, segmented controls, switch, quiz options, mode tiles, toast) take a 2px corner, just enough to read as a cut edge rather than a drawn box. Nothing is pill-shaped or circular except the week-row day marks.

Borders are the form language: 1px hairlines between rows, a 1px Rule outline on quiet controls, a 1px ink outline on segmented controls and the switch, a 1.5px ink head rule, and the 3px CSS `double` border on plates, flashcard faces and the tab bar top. Swatches are 9px squares. Ornament is engraved SVG at currentColor: the fleuron (two hairlines, two dots, a lozenge) and the proof-correction tick in the entry margin.

## Components

### Buttons
Engraved and confident: every button is a ruled frame with the label in the display face.
- **Shape:** 2px corner, 52px tall (44px small), 22px side padding (16px small).
- **Primary:** vermilion fill and border, Vermilion Ink label in Old Standard TT bold 19px, with an inner 1px rule 3px inside the edge. A trailing count is set in Gentium 17px behind a 1px divider ("Тренировать | 3").
- **Secondary:** paper face, 1px ink border plus the inner Rule line, ink label.
- **Active:** translates down 1px and darkens (primary mixes 14% ink into vermilion; secondary goes to Thumbed Stock), 140ms on the house ease-out. Disabled is 45% opacity.
- **Link button:** underlined body text with a Rule-coloured underline 4px below, 44px hit area; the danger variant is vermilion with a matching underline.
- **Icon button:** 44px square, no frame, Second Impression icon, Thumbed Stock on press.

### Chips
- **Style:** 38px tall, 1px Rule outline, 2px corner, paper face, body text 16px. Topic chips scroll horizontally without a scrollbar.
- **State:** selected inverts to ink fill with paper text (`aria-pressed`). Removable chips carry a trailing 14px ×.

### Cards / Containers (Plates)
The only bordered container. A plate is a figure in a book, not a card.
- **Corner Style:** square (0).
- **Background:** paper; never tinted.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 3px double ink.
- **Internal Padding:** 14px 16px.
- **Caption:** a plate caption in small caps on the left (a plain name, never a number), a supporting figure on the right, 10px above the content. A plate that shows box inks carries its own legend; there is no second key elsewhere on the screen.
- **Notice** is the one quiet exception: a 1px Rule outline on Thumbed Stock for install hints and fallback messages. It is not a plate and carries no colour.

### Inputs / Fields
- **Style:** 46px, 1px Rule outline, 2px corner, paper face, 17px body; placeholder in Faint Impression; caret vermilion.
- **Focus:** outline becomes a 2px ink stroke (border + inset stroke), no glow.
- **Typing answer:** a bare 2px ink baseline under 30px bold display type; vermilion on focus, emerald when right, vermilion with a 2px strike-through when wrong.

### Navigation
- **Tab bar:** four equal cells on a 3px double ink rule, hairline dividers, 22px Lucide line icons (1.5 stroke) over small-caps labels in Second Impression. Active is vermilion with a 1px underline 4px below the label.
- **Running head:** guide word left, fleuron centre, guide word right; long words truncate with an ellipsis. Back navigation replaces the left guide word with a chevron and the parent page's name.
- **Shoulder thumb index:** stacked 52px thumbs with level codes in display bold 15px; the current level is an inverted ink tab, like a cut thumb index.
- **Segmented control:** 1px ink outline, hairline Rule dividers, selected segment inverted to ink.

### Box Bar (signature)
The Leitner state of a set or of today's due words, as a single bar of ink segments in box order, each `flex-grow` proportional to its count with 2px gaps (14px tall in plates, 6px in set rows). Empty sets show a ruled hatch of hairlines. The optional legend sets each box as swatch, bold display count and small label.

### Entry Row (signature)
The dictionary entry as defined by the Dictionary Entry Rule, separated by hairlines, with a speak button and a side slot (box mark or "знаю") at the right. In pick mode the row is a checkbox with a 30px margin column holding a proof-correction tick: an empty Rule-outlined square, or a vermilion tick when chosen, which also turns the headword vermilion.

### Flashcard
A plate-ruled card face (3px double ink, square, paper) with a small-caps header over a hairline, the headword centred, a hint at the foot. Tap turns it over (3D rotateY, 520ms ease-out); drag flings it horizontally with up to 7° of tilt, revealing a rotated double-ruled stamp ("помню" emerald right, "не помню" vermilion left) whose opacity tracks the drag. A decided card leaves at 260ms on an accelerating curve.

### Quiz Option
58px rows with an italic display-face key letter in a 26px column, 1px Rule outline, 2px corner. Right fills emerald, wrong fills vermilion, 160ms colour transition. A verdict follows as a 1px coloured left rule with ink text.

### Week Row and Calendar
Seven ruled cells between Rule lines, small-caps weekday over an 18px mark: Rule-outlined circle (none), half-filled vermilion (some practice), solid vermilion (goal met). The tracker calendar repeats the code as square cells: solid vermilion, a 1.5px vermilion inset ring, and a 2px underline for today.

## Do's and Don'ts

### Do:
- **Do** separate content with rules: 1px hairlines between rows, the 1.5px ink head rule, and the 3px double rule for plates, flashcard faces and the tab bar.
- **Do** keep colour to state: the five box inks via `--box-0…4` in box order, vermilion for the primary action, progress, selection and error, emerald for right.
- **Do** set every word as a full entry: headword, italic part of speech, [IPA], translation, italic example with "~".
- **Do** set counts in Old Standard TT bold with tabular lining figures (`.num`).
- **Do** set labels, tabs and plate captions in Gentium small caps tracked 0.08em.
- **Do** move screens as a page passing: going forward the new page slides in from 100% over the old one, which gives way to -28%; going back the top page lifts off to the right (AnimatePresence popLayout, 340ms, cubic-bezier(0.22, 1, 0.36, 1), transform only). Training items enter with a 36px slide. Skip all of it under reduced motion. Progress rules animate `scaleX`, never `width`.
- **Do** keep every touch target at least 44px (an inline glyph such as the entry's speak button gets a 48px `::after` hit area), and the primary action at 52px full width.
- **Do** define both stocks: every new token needs a night value under `prefers-color-scheme: dark` and `[data-theme="dark"]`.

### Don't:
- **Don't** use drop shadows, blurs, glows or tinted card surfaces; `box-shadow` is allowed only inset, to print a rule.
- **Don't** nest a plate inside a plate or wrap list rows in individual cards.
- **Don't** round anything past 2px, and never round plates or card faces.
- **Don't** fade a screen or item in; the page passes horizontally.
- **Don't** put white or paper text on vermilion; use Vermilion Ink.
- **Don't** use chrome yellow as a text colour on paper; it is a fill ink only. (Vermilion and emerald may set short state text: verdicts, status lines, stamps.)
- **Don't** introduce a colour that isn't one of the five box inks; the reference board's madder rose and sepia were not adopted.
- **Don't** set display type or labels in uppercase; small caps carry that voice.

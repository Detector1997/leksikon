# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

(Installable PWA, used standalone from the iPhone home screen. Mobile web, not native.)

## Stack

Vite + React + TypeScript, vite-plugin-pwa, IndexedDB (idb-keyval), motion. Optional Claude API via `@anthropic-ai/sdk`. Chosen in planning because the Mac has no Xcode; a native SwiftUI + WidgetKit build is a possible future step.

## Users

One person, a Russian speaker at English level B2, learning vocabulary on their iPhone in short 3–5 minute sessions throughout the day (commute, queues, breaks). Previously used Quizlet and got tired of finding and typing in words by hand.

## Product Purpose

The app suggests 20 words at a time; the user picks the ones they want, and those become a set to train. A new set can be made at any moment. A daily tracker keeps the habit going. Success: the user opens the app, trains immediately, and keeps a streak without ever adding words by hand.

## Positioning

Quizlet is "bring your own words". This one is "we bring the words, you just choose": the suggestion → pick → train loop replaces manual entry.

## Operating Context

- Short sessions, one-handed, often on the move: open → train within one tap.
- Spaced repetition (Leitner boxes) decides what is due today across all sets.
- Works offline from a built-in word bank (A2–C1, by topic). With the user's own Claude API key, words can be generated on any topic.

## Capabilities and Constraints

- Training modes: flashcards (flip and swipe), multiple-choice quiz both directions, typing the English word.
- Every word has a transcription, a Russian translation and an example sentence with its translation. Pronunciation via the device's speech synthesis.
- Data lives only on the device; JSON export/import for backup. No accounts, no server.
- No home-screen widget: iOS does not offer widgets to web apps.
- Interface language: Russian.

## Brand Commitments

No name, logo or brand assets yet. The working name is open.

## Evidence on Hand

None. No testimonials, users or metrics exist and none may be invented.

## Product Principles

1. Zero friction to start training: the next useful action is always one tap away.
2. The app does the finding; the user only chooses.
3. Words come with context: example, translation and sound, never a bare pair.
4. Everything free and available at once: no ads, no paywalls, no locked features.
5. The habit is visible but never nagging.

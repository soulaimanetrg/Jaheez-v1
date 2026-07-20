# Resolve AI Feature Conflict

## What & Why
The JAHEEZ spec is explicit: **no AI/ML features anywhere** (no AI moderation, no AI scoring, no AI recommendations). The current user app contains:
- `app/ai-suggestion.tsx` — an AI suggestion screen.
- "AI Assistant" references on the home screen.
- ModernMT translation API in `languageStore.ts` (translation, not recommendation — likely OK but worth flagging).

This task removes the spec-violating pieces and re-frames anything user-visible into a non-AI equivalent that still serves the underlying user need.

## Done looks like
- `app/ai-suggestion.tsx` is removed (or replaced with a non-AI equivalent like a curated FAQ + canned support responses).
- Home screen no longer references "AI Assistant"; the entry point either points to the new non-AI replacement or is removed entirely.
- Any imports, navigation links, or strings referencing "AI" are cleaned up across both apps.
- ModernMT is **kept** but documented in `replit.md` as "translation, not AI recommendation — spec-compatible" so future audits don't flag it.
- `GAP_ANALYSIS.md` is updated: the "AI Feature Conflict" appendix is replaced with a "AI features removed on YYYY-MM-DD" note.

## Out of scope
- Removing ModernMT (it's a translation service, not AI per the spec's intent).
- Building a new chatbot — if a replacement is needed, use a static FAQ tree, not an LLM.

## Architectural constraints
- The replacement (if any) must function fully offline-capable and require no external AI/LLM API calls.
- Don't break navigation — every removed link must either be re-pointed or deleted from its parent screen.

## Steps
1. **Audit references** — Grep across `user-app/`, `admin/`, `scripts/` for strings: "ai", "AI", "openai", "anthropic", "gpt", "llm", "suggestion". Build a complete list of touchpoints.
2. **Decision** — For each touchpoint, decide: remove entirely OR replace with a non-AI equivalent. For `ai-suggestion.tsx` specifically, recommended replacement is a curated "Help / FAQ" screen with predefined Q&A; if the user prefers full removal, delete the file and its routes.
3. **Implement removals/replacements** — Apply the decisions. Update home screen entry points. Update any navigation, tab bars, or deep links.
4. **Clean strings** — Remove "AI Assistant", "Suggestion IA", and similar from the i18n strings in both FR and AR.
5. **Document the keep-list** — Add a short section to `replit.md` explaining ModernMT is allowed (translation only, no recommendation/scoring/moderation).
6. **Update gap analysis** — Replace the AI conflict appendix in `GAP_ANALYSIS.md` with a resolution note.
7. **Manual testing** — Walk every user-app screen; verify no dead links, no AI references visible, no console errors after removals.

## Relevant files
- `user-app/app/ai-suggestion.tsx`
- `user-app/app/(tabs)/index.tsx`
- `user-app/store/languageStore.ts`
- `user-app/translations/`
- `replit.md`
- `GAP_ANALYSIS.md`
- `JAHEEZ_FULL_SPEC.txt`

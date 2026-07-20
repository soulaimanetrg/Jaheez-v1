/**
 * Runtime DOM auto-translator for FR → AR.
 *
 * Walks document.body collecting Text nodes that contain French (Latin) text,
 * batches them through /api/translate, and swaps the translation in place.
 * A MutationObserver re-runs the walk when new content appears (route change,
 * async data, modal opens, etc.). The ORIGINAL French is remembered per text
 * node so switching back to FR restores it without a page reload.
 *
 * Why this exists: the admin is hundreds of hardcoded FR strings inside JSX.
 * Wrapping each one with t("...") would be a multi-day refactor. This walker
 * gives the user a working FR/AR switch today; over time strings can migrate
 * to t() (which short-circuits the walker because the text will already be
 * Arabic).
 */

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "OPTION",
  "SVG",
  "PATH",
]);

// Some content shouldn't be translated even if it looks French (emails,
// brand names, monetary values, …).  Keep this conservative.
const NEVER_TRANSLATE = /^[\s\d.,:;()/+\-*%€$£¥]+$|@|jaheez|JAHEEZ|DH|DH/i;

// Only translate if the text contains at least one Latin letter — avoids
// re-translating already-Arabic text and pure punctuation/numbers.
const HAS_LATIN = /[A-Za-zÀ-ÿ]/;

type FetchTranslations = (texts: string[]) => Promise<Record<string, string>>;

export type DomTranslatorHandle = {
  /** Force a full re-walk (called when language flips to AR). */
  retranslate: () => void;
  /** Restore every touched node back to its original French. */
  restore: () => void;
  /** Tear down the observer; safe to call multiple times. */
  destroy: () => void;
};

export function createDomTranslator(opts: {
  /** Returns a map original → translation. Should consult cache + fetch missing. */
  fetchTranslations: FetchTranslations;
  /** Synchronous cache lookup; returns translation or undefined. */
  lookup: (text: string) => string | undefined;
}): DomTranslatorHandle {
  const { fetchTranslations, lookup } = opts;
  const originalFR = new WeakMap<Text, string>();
  // Last value WE wrote into each touched node. Lets us tell apart:
  //   - our own translation (skip on re-walk, do not re-store originalFR)
  //   - a real React replacement (the node was reused but with different data)
  // Without this, translations whose target script is also Latin (e.g. EN)
  // would get re-fed into the walker, overwriting originalFR with the
  // translated string and breaking restore().
  const translatedValue = new WeakMap<Text, string>();
  const touched = new Set<Text>();
  let isApplying = false;
  let pendingNodes: Text[] = [];
  let flushTimer: number | null = null;
  let destroyed = false;

  function shouldSkipNode(node: Text): boolean {
    const parent = node.parentElement;
    if (!parent) return true;
    if (SKIP_TAGS.has(parent.tagName)) return true;
    if (parent.closest("[data-no-translate]")) return true;
    if ((parent as HTMLElement).isContentEditable) return true;
    return false;
  }

  function shouldTranslateText(text: string): boolean {
    const trimmed = text.trim();
    if (trimmed.length < 2) return false;
    if (!HAS_LATIN.test(trimmed)) return false;
    if (NEVER_TRANSLATE.test(trimmed)) return false;
    return true;
  }

  /**
   * True when this Text node currently holds the translation WE wrote into
   * it. Skipping such nodes on re-walks prevents us from translating our
   * own output (catastrophic for Latin-script targets like English).
   */
  function isOurOwnTranslation(t: Text): boolean {
    const tv = translatedValue.get(t);
    return tv !== undefined && tv === t.data;
  }

  function collect(root: Node): Text[] {
    const out: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const t = n as Text;
        if (shouldSkipNode(t)) return NodeFilter.FILTER_REJECT;
        if (isOurOwnTranslation(t)) return NodeFilter.FILTER_REJECT;
        if (!shouldTranslateText(t.data)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let cur: Node | null = walker.nextNode();
    while (cur) {
      out.push(cur as Text);
      cur = walker.nextNode();
    }
    return out;
  }

  async function flush() {
    flushTimer = null;
    if (destroyed) return;
    const nodes = pendingNodes;
    pendingNodes = [];
    if (nodes.length === 0) return;

    const uniqueTexts = new Set<string>();
    for (const n of nodes) uniqueTexts.add(n.data.trim());

    // Try cache first; only fetch what's missing.
    const need: string[] = [];
    for (const text of uniqueTexts) {
      if (lookup(text) === undefined) need.push(text);
    }

    let map: Record<string, string> = {};
    if (need.length > 0) {
      try {
        map = await fetchTranslations(need);
      } catch {
        /* network fail — try again later */
      }
    }

    // After the await: bail if we were torn down (e.g. user switched back to FR
    // and called restore() while the request was in flight). Without this guard
    // we would re-apply Arabic to nodes that were just restored.
    if (destroyed) return;

    isApplying = true;
    try {
      for (const node of nodes) {
        // If this node was already translated by us in a previous flush and
        // its current data still matches what we wrote, skip — re-running
        // would clobber originalFR with our own (translated) output.
        if (isOurOwnTranslation(node)) continue;
        const original = node.data;
        const trimmed = original.trim();
        const translated = map[trimmed] ?? lookup(trimmed);
        if (!translated) continue;
        // Preserve any leading/trailing whitespace.
        const leading = original.match(/^\s*/)?.[0] ?? "";
        const trailing = original.match(/\s*$/)?.[0] ?? "";
        const newData = `${leading}${translated}${trailing}`;
        originalFR.set(node, original);
        touched.add(node);
        node.data = newData;
        translatedValue.set(node, newData);
      }
    } finally {
      isApplying = false;
    }
  }

  function scheduleNodes(nodes: Text[]) {
    if (nodes.length === 0) return;
    pendingNodes.push(...nodes);
    if (flushTimer === null) {
      flushTimer = window.setTimeout(flush, 80);
    }
  }

  function retranslate() {
    if (typeof document === "undefined") return;
    const nodes = collect(document.body);
    scheduleNodes(nodes);
  }

  function restore() {
    isApplying = true;
    try {
      for (const node of touched) {
        const orig = originalFR.get(node);
        if (orig !== undefined) {
          node.data = orig;
        }
      }
    } finally {
      isApplying = false;
    }
    touched.clear();
  }

  // Watch for new content.
  const observer = new MutationObserver((mutations) => {
    if (isApplying) return;
    const fresh: Text[] = [];
    for (const m of mutations) {
      if (m.type === "characterData") {
        const t = m.target as Text;
        if (
          t.nodeType === Node.TEXT_NODE &&
          !shouldSkipNode(t) &&
          !isOurOwnTranslation(t) &&
          shouldTranslateText(t.data)
        ) {
          fresh.push(t);
        }
      } else if (m.type === "childList") {
        for (const added of Array.from(m.addedNodes)) {
          if (added.nodeType === Node.TEXT_NODE) {
            const t = added as Text;
            if (
              !shouldSkipNode(t) &&
              !isOurOwnTranslation(t) &&
              shouldTranslateText(t.data)
            ) {
              fresh.push(t);
            }
          } else if (added.nodeType === Node.ELEMENT_NODE) {
            fresh.push(...collect(added));
          }
        }
      }
    }
    scheduleNodes(fresh);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  return {
    retranslate,
    restore,
    destroy() {
      destroyed = true;
      observer.disconnect();
      pendingNodes = [];
      if (flushTimer !== null) {
        window.clearTimeout(flushTimer);
        flushTimer = null;
      }
    },
  };
}

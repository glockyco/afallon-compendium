/** One tab of a tab set: its key in the address, its reader-facing label, and the anchors that its panel renders. */
export interface TabSpec {
  key: string;
  label: string;
  anchors?: readonly string[];
}

/** The tab that the address selects, and whether the address must replace the value of its tab set to name that tab. */
export interface TabSelection {
  key: string;
  replace: boolean;
}

/**
 * The element id that a URL fragment names. A malformed escape such as `#%` is a valid address but not valid percent
 * encoding, so it names the id with its raw text instead of failing.
 */
export function fragmentId(hash: string): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** The tab whose panel renders the anchor, or undefined when no tab owns it. */
export function tabOwningAnchor(tabs: readonly TabSpec[], anchor: string): string | undefined {
  if (!anchor) return undefined;
  return tabs.find((tab) => tab.anchors?.includes(anchor))?.key;
}

/**
 * The tab that the address selects. `param` is the query field of the tab set, so tab sets with different fields choose
 * independently. A fragment that a tab owns wins over the field. Without such a fragment, a known value selects its tab,
 * and an absent or unknown value selects the first tab. The address must then name the selected tab when its value is
 * unknown or names another tab than the owner of the fragment.
 */
export function selectTab(tabs: readonly TabSpec[], url: URL, param: string): TabSelection {
  const requested = url.searchParams.get(param);
  const owner = tabOwningAnchor(tabs, fragmentId(url.hash));
  if (owner !== undefined) return { key: owner, replace: requested !== owner };
  if (requested !== null && tabs.some((tab) => tab.key === requested)) return { key: requested, replace: false };
  return { key: tabs[0]?.key ?? '', replace: requested !== null };
}

/**
 * The address with `key` as the value of `param`. Other query fields keep their values. `clearHash` removes the
 * fragment, because an anchor of another view no longer names a visible target after an explicit tab choice.
 */
export function withTab(url: URL, param: string, key: string, clearHash: boolean): URL {
  const next = new URL(url.href);
  next.searchParams.set(param, key);
  if (clearHash) next.hash = '';
  return next;
}

/** One tab of a tab set: its key in the address, its reader-facing label, and the anchors that its panel renders. */
export interface TabSpec {
  key: string;
  label: string;
  anchors?: readonly string[];
}

/** The tab that the address selects, and whether the address must replace its `tab` value to name that tab. */
export interface TabSelection {
  key: string;
  replace: boolean;
}

/** The tab whose panel renders the anchor, or undefined when no tab owns it. */
export function tabOwningAnchor(tabs: readonly TabSpec[], anchor: string): string | undefined {
  if (!anchor) return undefined;
  return tabs.find((tab) => tab.anchors?.includes(anchor))?.key;
}

/**
 * The tab that the address selects. A fragment that a tab owns wins over the `tab` value. Without such a fragment, a
 * known `tab` value selects its tab, and an absent or unknown value selects the first tab. The address must then name
 * the selected tab when its value is unknown or names another tab than the owner of the fragment.
 */
export function selectTab(tabs: readonly TabSpec[], url: URL): TabSelection {
  const requested = url.searchParams.get('tab');
  const owner = tabOwningAnchor(tabs, decodeURIComponent(url.hash.slice(1)));
  if (owner !== undefined) return { key: owner, replace: requested !== owner };
  if (requested !== null && tabs.some((tab) => tab.key === requested)) return { key: requested, replace: false };
  return { key: tabs[0]?.key ?? '', replace: requested !== null };
}

/**
 * The address with `key` as its `tab` value. Other query fields keep their values. `clearHash` removes the fragment,
 * because an anchor of another view no longer names a visible target after an explicit tab choice.
 */
export function withTab(url: URL, key: string, clearHash: boolean): URL {
  const next = new URL(url.href);
  next.searchParams.set('tab', key);
  if (clearHash) next.hash = '';
  return next;
}

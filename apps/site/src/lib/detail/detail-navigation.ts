import { getContext, setContext } from 'svelte';
import { writable, type Readable, type Writable } from 'svelte/store';

/** A page lists its sections when at least this many render. */
export const SECTION_LIST_MINIMUM = 4;

/** A rendered section of a detail page: its anchor, its heading, and its element after it mounts. */
export interface SectionEntry {
  id: string;
  title: string;
  element?: HTMLElement;
}

/** The registration of one section. The section keeps it while it renders. */
export interface SectionHandle {
  update(id: string, title: string): void;
  place(element: HTMLElement): void;
  remove(): void;
}

/** Expands the part of a view that hides the anchor, and reports whether the view holds the anchor. */
export type AnchorRevealer = (id: string) => Promise<boolean>;

/**
 * The navigation state of one detail page. Each page creates its own, so no state is shared between pages or between
 * server renders. `location` is the address that tab sets read. It is null on the server and before the page mounts,
 * because a prerendered page has no query.
 */
export interface DetailNavigation {
  sections: Readable<SectionEntry[]>;
  addSection(id: string, title: string): SectionHandle;
  location: Writable<URL | null>;
  addRevealer(revealer: AnchorRevealer): () => void;
  reveal(id: string): Promise<void>;
  /**
   * Sets `location` to an address whose target a component already shows, such as a talent selected in the talent web,
   * so tab sets follow it without scrolling. The caller writes the history entry.
   */
  showInPlace(url: URL): void;
  /** Whether `showInPlace` set `url`. */
  isShownInPlace(url: URL): boolean;
}

const KEY = Symbol('detail-navigation');

function createDetailNavigation(): DetailNavigation {
  const entries: SectionEntry[] = [];
  const sections = writable<SectionEntry[]>([]);
  const revealers = new Set<AnchorRevealer>();
  const location = writable<URL | null>(null);
  const shownInPlace = new WeakSet<URL>();
  // Sections register in render order. After they mount, the page order of their elements decides, because a section
  // that appears later, such as the panel of another tab, can stand between earlier ones.
  const publish = () => {
    if (entries.every((entry) => entry.element)) {
      entries.sort((left, right) => left.element === right.element ? 0 : left.element!.compareDocumentPosition(right.element!) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    }
    sections.set(entries.map((entry) => ({ ...entry })));
  };
  return {
    sections,
    addSection(id, title) {
      const entry: SectionEntry = { id, title };
      entries.push(entry);
      publish();
      return {
        update(nextId, nextTitle) {
          if (entry.id === nextId && entry.title === nextTitle) return;
          entry.id = nextId;
          entry.title = nextTitle;
          publish();
        },
        place(element) {
          entry.element = element;
          publish();
        },
        remove() {
          const index = entries.indexOf(entry);
          if (index >= 0) entries.splice(index, 1);
          publish();
        },
      };
    },
    location,
    addRevealer(revealer) {
      revealers.add(revealer);
      return () => revealers.delete(revealer);
    },
    async reveal(id) {
      // A row can be inside a disclosure inside a tab: every owner must open before scrolling.
      for (const revealer of revealers) await revealer(id);
    },
    showInPlace(url) {
      shownInPlace.add(url);
      location.set(url);
    },
    isShownInPlace(url) {
      return shownInPlace.has(url);
    },
  };
}

/** Creates the navigation of a detail page for the components below the caller. */
export function provideDetailNavigation(): DetailNavigation {
  return setContext(KEY, createDetailNavigation());
}

/** The navigation of the enclosing detail page, or undefined outside one. */
export function detailNavigation(): DetailNavigation | undefined {
  return getContext<DetailNavigation | undefined>(KEY);
}

/**
 * Scrolls the target of an anchor into view. A target inside an element marked `data-anchor-frame`, such as a talent in
 * the talent web, is shown by that element itself, so the page only scrolls as far as it must to show the whole frame.
 */
export function scrollToAnchor(id: string): void {
  const target = document.getElementById(id);
  const frame = target?.closest('[data-anchor-frame]');
  if (frame) frame.scrollIntoView({ block: 'nearest' });
  else target?.scrollIntoView({ block: 'center' });
}

/**
 * Keeps `location` equal to the browser address. A tab set writes its own history entries and sets `location` itself,
 * so this covers the reader's Back and Forward and fragment links. Returns the cleanup for `onMount`.
 */
export function followLocation(navigation: DetailNavigation): () => void {
  const read = () => navigation.location.set(new URL(window.location.href));
  read();
  window.addEventListener('popstate', read);
  window.addEventListener('hashchange', read);
  return () => {
    window.removeEventListener('popstate', read);
    window.removeEventListener('hashchange', read);
  };
}

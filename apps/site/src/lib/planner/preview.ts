import { get, writable, type Readable } from 'svelte/store';
import { parsePlannerBuild, type PlannerBuild } from './build';
import { decodeBuildLink, encodeBuildLink, type BuildLinkDecodeResult, type BuildLinkResult } from './build-link';
import type { CharacterStore, CharacterTarget, MutationResult } from './characters';
export type PreviewResolution = {
  readonly catalogChanged: boolean;
  readonly unresolved: readonly { readonly key: string; readonly description: string }[];
  readonly unevaluated: readonly string[];
};
export type PreviewResolver = (build: PlannerBuild) => PreviewResolution;
export type PreviewState = {
  readonly status: 'none' | 'loading' | 'ready' | 'invalid' | 'unsupported';
  readonly source: 'url' | 'handoff' | null;
  readonly build: PlannerBuild | null;
  readonly resolution: PreviewResolution | null;
  readonly message: string;
  readonly canUndo: boolean;
};
export type CopyLinkResult = {
  readonly status: 'copied' | 'failed' | 'unsupported' | 'confirmation-required';
  readonly message: string;
  readonly contents: string;
  readonly url?: string;
};
export const BUILD_LINK_CONTENTS = 'Includes race, class, level, entered point totals, talent purchase order or unknown-order final ranks, Heroic ranks, gear modifications and party. Character names and local character identities are not included. Links are not encrypted and can be read from browser history, scripts or by recipients.';
export type PreviewEnvironment = {
  readonly resolve: PreviewResolver;
  readonly clipboard: () => Pick<Clipboard, 'writeText'>;
  readonly origin: string;
  readonly decode?: (url: URL) => Promise<BuildLinkDecodeResult>;
  readonly encode?: (build: PlannerBuild) => Promise<BuildLinkResult<string>>;
  /** Optional deliberate omission, never used for ordinary copying or adoption. */
  readonly omitUnresolved?: (build: PlannerBuild, resolution: PreviewResolution) => PlannerBuild;
};
export type ReplacementOffer = { readonly target: CharacterTarget; readonly label: string };
export interface PlannerPreview extends Readable<PreviewState> {
  snapshot(): PreviewState;
  navigate(url: URL): Promise<void>;
  cancelNavigation(): void;
  openHandoff(build: PlannerBuild): void;
  edit(build: PlannerBuild): void;
  undo(): boolean;
  copyLink(options?: { omitUnresolved?: boolean; confirmOmission?: boolean }): Promise<CopyLinkResult>;
  saveAsNew(name: string): Promise<MutationResult>;
  captureReplacement(id: string): ReplacementOffer;
  replace(target: CharacterTarget): Promise<MutationResult>;
  undoAdoption(): Promise<MutationResult>;
}

/** A URL/save workspace has its own build and Undo. Only explicit adoption calls the character store.
 * Mount via bindPreviewNavigation; SvelteKit afterNavigate should additionally call navigate(url).
 * Resolution describes current data without rewriting source provenance or unresolved stable keys.
 */
export function createPlannerPreview(characters: CharacterStore, environment: PreviewEnvironment): PlannerPreview {
  const state = writable<PreviewState>({ status: 'none', source: null, build: null, resolution: null, message: '', canUndo: false });
  const history: PlannerBuild[] = [];
  let navigationIdentity: string | undefined;
  let generation = 0;
  function ready(build: PlannerBuild, source: 'url' | 'handoff', historyChange?: 'reset' | 'undo' | PlannerBuild): void {
    const detached = parsePlannerBuild(build);
    const resolution = structuredClone(environment.resolve(parsePlannerBuild(detached)));
    if (historyChange === 'reset') history.length = 0;
    else if (historyChange === 'undo') history.pop();
    else if (historyChange) history.push(historyChange);
    state.set({ status: 'ready', source, build: detached, resolution, message: resolution.catalogChanged ? 'This build uses different game data. Unresolved choices are kept; checks use the current data.' : '', canUndo: history.length > 0 });
  }
  async function navigate(url: URL): Promise<void> {
    if (navigationIdentity === url.href) return;
    navigationIdentity = url.href;
    const token = ++generation;
    state.update(current => ({ ...current, status: 'loading', message: 'Opening build preview…' }));
    let result: BuildLinkDecodeResult;
    try { result = await (environment.decode ?? decodeBuildLink)(new URL(url.href)); }
    catch (error) { result = { status: 'invalid', message: error instanceof Error ? error.message : 'The build preview could not be opened.' }; }
    if (token !== generation) return;
    if (result.status === 'ok') {
      try { ready(result.value, 'url', 'reset'); }
      catch (error) { state.update(current => ({ ...current, status: 'invalid', message: error instanceof Error ? error.message : 'The build preview could not be resolved.' })); }
    } else if (result.status === 'none') {
      history.length = 0;
      state.set({ status: 'none', source: null, build: null, resolution: null, message: '', canUndo: false });
    } else state.update(current => ({ ...current, status: result.status, message: result.message }));
  }
  function openHandoff(build: PlannerBuild): void {
    // Validate before interrupting a pending URL decode or touching the current preview.
    const validated = parsePlannerBuild(build);
    ++generation;
    ready(validated, 'handoff', 'reset');
  }
  function currentBuild(): PlannerBuild {
    const current = get(state);
    if (current.status !== 'ready' || !current.build) throw new Error('Open a valid build preview first.');
    return parsePlannerBuild(current.build);
  }
  function edit(build: PlannerBuild): void {
    const previous = currentBuild();
    // Resolution completes before history changes, so rejected edits leave Undo untouched.
    ready(build, get(state).source!, previous);
  }
  function undo(): boolean {
    const previous = history.at(-1);
    if (!previous) return false;
    ready(previous, get(state).source!, 'undo');
    return true;
  }
  async function copyLink(options: { omitUnresolved?: boolean; confirmOmission?: boolean } = {}): Promise<CopyLinkResult> {
    let build: PlannerBuild;
    try { build = currentBuild(); }
    catch (error) { return { status: 'failed', message: (error as Error).message, contents: BUILD_LINK_CONTENTS }; }
    const resolution = structuredClone(get(state).resolution!);
    let contents = BUILD_LINK_CONTENTS;
    if (options.omitUnresolved && resolution.unresolved.length) {
      const warning = `This would omit unresolved choices: ${resolution.unresolved.map(choice => choice.description).join('; ')}. The preview and saved characters will keep them.`;
      if (!options.confirmOmission) return { status: 'confirmation-required', message: warning, contents };
      if (!environment.omitUnresolved) return { status: 'failed', message: 'Unresolved choices cannot be omitted here. Copy the complete build instead.', contents };
      try { build = parsePlannerBuild(environment.omitUnresolved(parsePlannerBuild(build), resolution)); }
      catch (error) { return { status: 'failed', message: (error as Error).message, contents }; }
      contents = `Unresolved choices were omitted from this link only. ${contents}`;
    }
    try {
      const encoded = await (environment.encode ?? encodeBuildLink)(build);
      if (encoded.status !== 'ok') return { status: encoded.status === 'unsupported' ? 'unsupported' : 'failed', message: encoded.message, contents };
      const url = new URL(encoded.value, environment.origin).href;
      await environment.clipboard().writeText(url);
      return { status: 'copied', message: 'Build link copied.', contents, url };
    } catch { return { status: 'failed', message: 'The link could not be copied. Check clipboard permissions and try again.', contents }; }
  }
  return {
    subscribe: state.subscribe,
    snapshot: () => structuredClone(get(state)),
    navigate, openHandoff, edit, undo, copyLink,
    cancelNavigation: () => { ++generation; navigationIdentity = undefined; },
    saveAsNew: (name: string): Promise<MutationResult> => characters.addCharacter(name, currentBuild()),
    /** Capture when presenting the confirmation, not after asynchronous confirmation work. */
    captureReplacement: (id: string): ReplacementOffer => {
      const target = characters.capture(id, false);
      return { target, label: `Replace ${target.character.name}'s Build` };
    },
    replace: (target: CharacterTarget): Promise<MutationResult> => characters.replaceBuild({ ...target, active: false }, currentBuild()),
    undoAdoption: () => characters.undo(),
  };
}

/** Bind after mount. hashchange and popstate cover fragments/Back/Forward; framework client navigation
 * calls preview.navigate too. Duplicate events share one URL identity.
 */
export function bindPreviewNavigation(preview: Pick<PlannerPreview, 'navigate' | 'cancelNavigation'>, host: Pick<Window, 'location' | 'addEventListener' | 'removeEventListener'>): () => void {
  let disposed = false;
  const navigate = () => { if (!disposed) void preview.navigate(new URL(host.location.href)); };
  host.addEventListener('hashchange', navigate);
  host.addEventListener('popstate', navigate);
  navigate();
  return () => {
    disposed = true;
    host.removeEventListener('hashchange', navigate);
    host.removeEventListener('popstate', navigate);
    preview.cancelNavigation();
  };
}

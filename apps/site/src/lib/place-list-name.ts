// A place's level range already appears beside its name on browse surfaces.
export function placeListName(name: string, range: string | null): string {
  const suffix = range ? ` (Level ${range})` : '';
  return suffix && name.endsWith(suffix) ? name.slice(0, -suffix.length) : name;
}

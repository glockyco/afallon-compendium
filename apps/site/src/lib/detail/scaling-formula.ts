import type { AbilityAppliedEffect, EffectScaling, Ref } from '@afallon/contracts/public';
import { formatNumber } from '../format';

/** One added part of a rank's damage or healing. `id` stays the same across ranks so their amounts line up in one row. */
export interface ScalingPart {
  id: string;
  /** Text before the linked stat, or the whole label when there is no stat. */
  label: string;
  ref?: Ref;
  amount: string;
}

export interface ScalingBreakdown {
  healing: boolean;
  parts: ScalingPart[];
  /** A base amount whose calculation is unknown. */
  note?: string;
}

const capitalize = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
const signed = (value: number, text: string) => `${value < 0 ? '−' : ''}${text}`;

/** Whether a rank adds anything that a reader can see. */
export function hasScaling(scaling: EffectScaling | undefined): scaling is EffectScaling {
  return Boolean(scaling && (scaling.weaponPercent !== 0 || scaling.baseAmount !== 0 || scaling.stats.some((row) => row.coefficientPercent !== 0)));
}

/** The parts that add up to a rank's damage or healing, each with its own amount. */
export function scalingBreakdown(scaling: EffectScaling): ScalingBreakdown {
  const parts: ScalingPart[] = [];
  const category = scaling.category && scaling.category !== 'Neutral' && scaling.category !== 'None'
    ? scaling.category.replace(/ Damage$/i, '') : '';
  if (scaling.weaponPercent !== 0) parts.push({
    id: 'weapon',
    label: scaling.weapons.length ? `${capitalize(scaling.weapons.join(' and '))} weapon damage` : 'Weapon damage',
    amount: signed(scaling.weaponPercent, `${formatNumber(Math.abs(scaling.weaponPercent))}%`),
  });
  if (scaling.baseAmount !== 0 && scaling.baseKind !== 'unknown') {
    const amount = Math.abs(scaling.baseAmount);
    if (scaling.baseKind === 'flat') {
      parts.push(scaling.healing && scaling.baseStat
        ? { id: 'base', label: 'Base healing', amount: signed(scaling.baseAmount, formatNumber(amount)) }
        : { id: 'base', label: scaling.healing ? 'Base healing' : `${category ? `${category} damage` : 'Base damage'}`, amount: signed(scaling.baseAmount, formatNumber(amount)) });
    } else {
      const which = scaling.baseKind === 'percentMax' ? 'maximum' : 'current';
      parts.push({ id: `base-${which}`, label: `Target's ${which} ${scaling.baseStat ? '' : 'amount'}`,
        ...(scaling.baseStat ? { ref: scaling.baseStat } : {}), amount: signed(scaling.baseAmount, `${formatNumber(amount)}%`) });
    }
  }
  for (const row of scaling.stats) {
    if (row.coefficientPercent === 0) continue;
    parts.push({ id: `stat-${row.stat.key}`, label: "Caster's ", ref: row.stat,
      amount: signed(row.coefficientPercent, `${formatNumber(Math.abs(row.coefficientPercent))}%`) });
  }
  return {
    healing: scaling.healing, parts,
    ...(scaling.baseKind === 'unknown' && scaling.baseAmount !== 0
      ? { note: `The game lists an amount of ${formatNumber(scaling.baseAmount)}, but how it is calculated is not known.` } : {}),
  };
}

/** Rows of parts across ranks: one row per part, one amount per rank, blank where a rank lacks that part. */
export function scalingRows(ranks: readonly EffectScaling[]): { part: ScalingPart; amounts: string[] }[] {
  const rows = new Map<string, { part: ScalingPart; amounts: string[] }>();
  ranks.forEach((scaling, index) => {
    for (const part of scalingBreakdown(scaling).parts) {
      const row = rows.get(part.id) ?? { part, amounts: ranks.map(() => '') };
      row.amounts[index] = part.amount;
      rows.set(part.id, row);
    }
  });
  return [...rows.values()];
}

/**
 * The game's tooltip text is printed for a caster without stats. This line names the caster's stats that add to the
 * amount in play. A rank gets one only when it applies exactly one damage or one healing calculation, so no stat is credited to
 * the wrong effect.
 */
export function rankStatNote(rows: readonly AbilityAppliedEffect[], rankIndex: number): string | undefined {
  const scalings = [...new Map(rows.filter((row) => hasScaling(row.scaling) && (row.rank ?? 0) === rankIndex)
    .map((row) => [JSON.stringify(row.scaling), row.scaling!])).values()];
  const notes = [false, true].flatMap((healing) => {
    const matching = scalings.filter((scaling) => scaling.healing === healing);
    if (matching.length !== 1) return [];
    const scaling = matching[0]!;
    const terms = scaling.stats.filter((row) => row.coefficientPercent !== 0)
      .map((row, index) => `${index ? (row.coefficientPercent < 0 ? ' − ' : ' + ') : row.coefficientPercent < 0 ? '−' : ''}${formatNumber(Math.abs(row.coefficientPercent))}% of the caster's ${'name' in row.stat ? row.stat.name : row.stat.label}`);
    if (!terms.length) return [];
    const type = scaling.category && !['Neutral', 'None'].includes(scaling.category) ? scaling.category.replace(/ damage$/i, ' Damage') : 'damage';
    return [`Adds ${terms.join('')} to the ${healing ? 'healing' : type}.`];
  });
  return notes.length ? notes.join(' ') : undefined;
}

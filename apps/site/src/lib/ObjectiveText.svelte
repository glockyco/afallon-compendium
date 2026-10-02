<script lang="ts">
  import type { QuestObjective } from '@afallon/contracts/public';
  import { formatDuration } from './format';

  export let objective: QuestObjective;
</script>

<span>{objective.text}</span>{#if objective.timeLimit !== undefined}<small>{formatDuration(objective.timeLimit)} time limit</small>{/if}{#if 'keepItems' in objective && objective.keepItems}<small>Keep items</small>{/if}

<style>
  small { display: inline-block; margin-left: .55rem; color: var(--c-text-dim); white-space: nowrap; }
</style>

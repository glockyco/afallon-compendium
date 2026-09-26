<script lang="ts">
  import type { QuestObjective } from '@afallon/contracts/public';
  import { formatDuration } from './format';

  // The objective's authored text with its time limit and item retention, as every objective table shows them.
  export let objective: QuestObjective;
</script>

{objective.text}{#if objective.timeLimit !== undefined}<small>{formatDuration(objective.timeLimit)} time limit</small>{/if}{#if 'keepItems' in objective && objective.keepItems}<small>Keep items</small>{/if}

<script lang="ts">
  export let label: string;
  export let tone: 'neutral' | 'rarity' | 'accent' | 'boss' = 'neutral';
</script>

<span class="c-badge" data-tone={tone}>{label}</span>

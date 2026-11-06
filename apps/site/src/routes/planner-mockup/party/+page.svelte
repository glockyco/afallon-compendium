<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/stores';
  import AnswerCard from '$lib/detail/AnswerCard.svelte';
  import SideCard from '$lib/detail/SideCard.svelte';
  import Section from '$lib/detail/Section.svelte';
  import Sections from '$lib/detail/Sections.svelte';
  import Workspace from '../kit/Workspace.svelte';
  import PartyList from '../kit/PartyList.svelte';
  import MemberDetail from '../kit/MemberDetail.svelte';
  import RoleCounts from '../kit/RoleCounts.svelte';
  import type { PlannerMock } from '../data.server';

  export let data: { registry: never; release: never; mock: PlannerMock };
  $: mock = data.mock;
  $: preview = $page.url.searchParams.has('preview');
  $: classIcon = mock.talents.doc.art.icon ? `${base}/data/${mock.talents.doc.art.icon.url}` : undefined;
</script>

<Workspace {data} view="party" {preview}>
  <AnswerCard slot="answer" title="Party Roles">
    <RoleCounts counts={{ Tank: 1, Healer: 1, Damage: 2 }} />
    <p class="pm-note">4 of 5 in the party. The Dungeon Finder makes a party of one tank, one healer and three damage dealers.</p>
  </AnswerCard>

  <div slot="inspector" class="wide-only"><SideCard title="Party Member"><MemberDetail detail={mock.memberDetail} registry={data.registry} id="side" /></SideCard></div>

  <Sections>
    <Section id="party" title="Party">
      <PartyList party={mock.party} {classIcon} selected="brielle-dawnfield">
        <MemberDetail slot="expanded" detail={mock.memberDetail} registry={data.registry} id="inline" />
      </PartyList>
    </Section>
  </Sections>
</Workspace>

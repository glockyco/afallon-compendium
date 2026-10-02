## Context

Creature loot runs through a native drop generator that can flag newly created equipment Heroic while the Heroic tier is live. Quest reward, crafted item, and chest paths do not set the flag. Equipped template stat contributions and weapon damage use the captured Heroic gear percentage.

## Decisions

- Only equipment with a published creature-drop row receives a Heroic preview setting. The setting is taken from the captured Heroic tier progression fact, not a site constant.
- Preview fixed template stats, Item Power, and weapon damage with the native additive bonus. Keep random stat ranges, gems, and enchantments unchanged. An existing corruption level adds its bonus to the same base rather than multiplying Heroic and corruption together.
- The Heroic Tier guide publishes native-verified origin and bonus rules with the numeric rule operand checked against the captured setting.

## Risks

- Template pages are not saved instances. The preview cannot identify a particular roll or assert a Heroic outcome for a specific kill.

## ADDED Requirements

### Requirement: Browse views keep useful facts aligned

Gallery and table SHALL share the same sentence-case name filter and result count, including their spacing above the content. Property rows SHALL show a known currency beside each amount and the known income interval; an absent currency SHALL leave the amount readable without an invented unit. Property artwork SHALL fill the same wide scene frame whether the picture comes from artwork or an icon. Place cards SHALL show a level range once. Ordinary zones SHALL not advertise zero bosses in their table cards and SHALL show available creature or quest counts instead. Gear-set piece counts SHALL align with other numeric columns. Recipe and station rows SHALL not repeat the name of a matching skill. The Abilities Source filter SHALL not offer an unavailable zero-count value before its entries are revealed. At 1100–1280 px, the Quest list SHALL keep the quest, level, chain, and area readable without cutting words, and MAY omit the giver from that view. Race table cards SHALL preserve the starting place and class availability even when they match across races. A faction with no count SHALL say the count is unavailable. On phones, a mechanics description SHALL use its card width.

#### Scenario: Gallery and table controls
- **WHEN** a reader switches between Gallery and Table at desktop or phone width
- **THEN** the filter and count use the same words, size, and position above content

#### Scenario: Property price and income
- **WHEN** a property has a purchase price, currency, income, and income interval
- **THEN** both views name the currency and say how often active play pays that income
- **AND** a missing currency omits its unit without substituting a placeholder

#### Scenario: Place comparisons
- **WHEN** a place name ends with its displayed level range
- **THEN** the browse card or row names that range only once
- **AND** ordinary zones show useful creatures or quests instead of an empty boss count

#### Scenario: Hidden ability sources
- **WHEN** abilities without a known use have not been revealed
- **THEN** the Source filter does not offer a zero-count option for those hidden abilities

#### Scenario: Distinct row facts
- **WHEN** a recipe or station shares its skill name, or a faction has no NPC count
- **THEN** the repeated skill is hidden and the unavailable faction count is explained

#### Scenario: Races and mechanics on phones
- **WHEN** a reader compares races or reads a mechanics table card on a phone
- **THEN** race cards show starting places and class availability, and descriptions span the mechanics card

#### Scenario: Readable desktop tables
- **WHEN** a reader opens gear sets at desktop width or quests at 1100–1280 px
- **THEN** piece counts align right and visible quest names and areas do not end mid-word

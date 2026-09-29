var database = Il2CppBLINK.RPGBuilder.Managers.GameDatabase.Instance;
if (database == null) throw new System.InvalidOperationException("The game database is not initialized.");
var projectSupportEntry = new System.Func<Il2Cpp.RPGBuilderDatabaseEntry, string, object>((entry, prefix) =>
{
    if (entry == null) throw new System.InvalidOperationException("A supporting database record is null.");
    var nameKey = prefix == null ? null : prefix + "." + entry.ID + ".name";
    var descriptionKey = prefix == null ? null : prefix + "." + entry.ID + ".desc";
    var nameResolved = nameKey != null && Il2Cpp.Localize.HasKey(nameKey);
    var descriptionResolved = descriptionKey != null && Il2Cpp.Localize.HasKey(descriptionKey);
    var icon = entry.entryIcon;
    var rect = icon == null ? new UnityEngine.Rect() : icon.rect;
    return new
    {
        nativeId = entry.ID, internalName = entry.entryName, sourceName = entry.name, sourceFileName = entry.entryFileName,
        name = nameResolved ? Il2Cpp.Localize.Get(nameKey, entry.entryDisplayName) : entry.entryDisplayName,
        description = descriptionResolved ? Il2Cpp.Localize.Get(descriptionKey, entry.entryDescription) : entry.entryDescription,
        localization = new { language = Il2Cpp.Localize.CurrentLanguage, nameKey = nameKey, descriptionKey = descriptionKey, nameResolved = nameResolved, descriptionResolved = descriptionResolved },
        icon = icon == null ? (object)null : new { name = icon.name, textureName = icon.texture == null ? null : icon.texture.name, rect = new { x = rect.x, y = rect.y, width = rect.width, height = rect.height } }
    };
});
// Progression projections. A null list or list member stays visible as an `unavailable` row with its field path.
// An enum keeps its number and its name, and a database record reference keeps its id and name.
string At(string path, int index) { return path + "[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]"; }
object ListOf<T>(Il2CppSystem.Collections.Generic.List<T> list, string path, System.Func<T, int, string, object> project)
{
    if (list == null) return new { unavailable = "null list", sourceFieldPath = path };
    var rows = new System.Collections.Generic.List<object>();
    for (var index = 0; index < list.Count; index++)
    {
        var value = list[index];
        if (value == null) { rows.Add(new { sourceIndex = index, unavailable = "null list member", sourceFieldPath = At(path, index) }); continue; }
        rows.Add(project(value, index, At(path, index)));
    }
    return rows;
}
// A null record in a game table stays visible as an unavailable row with its field path.
object NullRecord(string table, int key) { return new { sourceKey = key, unavailable = "null record", sourceFieldPath = At("GameDatabase." + table, key) }; }
// Armor slots are keyed by name and have no id without their record.
object NullNamedRecord(string table, string key) { return new { sourceKey = -1, unavailable = "null record", sourceFieldPath = "GameDatabase." + table + "[\"" + key + "\"]" }; }
object Named(System.Enum value) { return value == null ? null : new { value = System.Convert.ToInt32(value, System.Globalization.CultureInfo.InvariantCulture), name = value.ToString() }; }
object Record(Il2Cpp.RPGBuilderDatabaseEntry entry) { return entry == null ? null : new { nativeId = entry.ID, name = getEntryName(entry) }; }
object Requirements(bool useTemplate, Il2CppBLINK.RPGBuilder.Templates.RequirementsTemplate template, Il2CppSystem.Collections.Generic.List<Il2Cpp.RequirementsData.RequirementGroup> groups, string path)
{
    return new { useRequirementsTemplate = useTemplate, groups = ListOf(groups, path + ".Requirements", (group, index, groupPath) => projectGroup(group, groupPath, index)), template = projectTemplate(template, path + ".RequirementsTemplate") };
}
object CustomStats(Il2CppSystem.Collections.Generic.List<Il2CppBLINK.RPGBuilder.Combat.CombatData.CustomStatValues> list, string path)
{
    return ListOf(list, path, (stat, index, statPath) => (object)new { sourceIndex = index, statId = stat.statID, overrideMinValue = stat.overrideMinValue, minValue = stat.minValue, overrideMaxValue = stat.overrideMaxValue, maxValue = stat.maxValue, overrideStartPercentage = stat.overrideStartPercentage, startPercentage = stat.startPercentage, addedValue = stat.addedValue, valuePerLevel = stat.valuePerLevel, isPercent = stat.Percent, chance = stat.chance });
}
object StatTemplate(Il2CppBLINK.RPGBuilder.Templates.StatListTemplate template, string path)
{
    return template == null ? null : new { nativeId = template.ID, name = getEntryName(template), customStats = CustomStats(template.CustomStats, path + ".CustomStats") };
}
var skills = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetSkills())
{
    if (pair.Value == null) { skills.Add(NullRecord("Skills", pair.Key)); continue; }
    var skill = pair.Value; var path = At("GameDatabase.Skills", pair.Key);
    skills.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(skill, "skill"), gameplay = new
    {
        automaticallyAdded = skill.automaticallyAdded, maxLevel = skill.MaxLevel, levelTemplateId = skill.levelTemplateID,
        talentTreeIds = ListOf(skill.talentTrees, path + ".talentTrees", (row, index, rowPath) => (object)new { sourceIndex = index, talentTreeId = row.talentTreeID }),
        stats = ListOf(skill.stats, path + ".stats", (row, index, rowPath) => (object)new { sourceIndex = index, statId = row.statID, amount = row.amount, isPercent = row.isPercent, bonusPerLevel = row.bonusPerLevel }),
        customStats = CustomStats(skill.CustomStats, path + ".CustomStats"), useStatListTemplate = skill.UseStatListTemplate, statListTemplate = StatTemplate(skill.StatListTemplate, path + ".StatListTemplate"),
        startItems = ListOf(skill.startItems, path + ".startItems", (row, index, rowPath) => (object)new { sourceIndex = index, itemId = row.itemID, count = row.count, equipped = row.equipped }),
        actionAbilities = ListOf(skill.actionAbilities, path + ".actionAbilities", (row, index, rowPath) => (object)new { sourceIndex = index, keyType = Named(row.keyType), abilityId = row.abilityID }),
        allocatedStatsEntriesGame = ListOf(skill.allocatedStatsEntriesGame, path + ".allocatedStatsEntriesGame", (row, index, rowPath) => (object)new { sourceIndex = index, statId = row.statID, maxValue = row.maxValue, cost = row.cost, valueAdded = row.valueAdded, isPercent = row.isPercent })
    } });
}
var stats = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetStats())
{
    if (pair.Value == null) { stats.Add(NullRecord("Stats", pair.Key)); continue; }
    var stat = pair.Value; var path = At("GameDatabase.Stats", pair.Key);
    stats.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(stat, "stat"), gameplay = new
    {
        minCheck = stat.minCheck, minValue = stat.minValue, maxCheck = stat.maxCheck, maxValue = stat.maxValue, baseValue = stat.baseValue,
        isPercentStat = stat.isPercentStat, isVitalityStat = stat.isVitalityStat, isPersistent = stat.IsPersistent, startPercentage = stat.startPercentage,
        shiftsInSprint = stat.isShiftingInSprint, shiftsInBlock = stat.isShiftingInBlock, shiftsOutsideCombat = stat.isShiftingOutsideCombat, shiftsInCombat = stat.isShiftingInCombat,
        shiftAmountOutsideCombat = stat.shiftAmountOutsideCombat, shiftIntervalOutsideCombat = stat.shiftIntervalOutsideCombat, shiftAmountInCombat = stat.shiftAmountInCombat, shiftIntervalInCombat = stat.shiftIntervalInCombat,
        uiCategory = stat.StatUICategory, statCategory = Record(stat.StatCategory), procCooldown = stat.ProcCooldown,
        statBonuses = ListOf(stat.statBonuses, path + ".statBonuses", (row, index, rowPath) => (object)new { sourceIndex = index, statType = Named(row.statType), modifyValue = row.modifyValue, mainDamageType = Named(row.MainDamageType), customDamageType = Record(row.CustomDamageType), customHealingType = Record(row.CustomHealingType), resistanceStatId = row.ResistanceStatID, penetrationStatId = row.PenetrationStatID, statId = row.statID, creatureType = Named(row.CreatureType) }),
        onHitEffects = ListOf(stat.onHitEffectsData, path + ".onHitEffectsData", (row, index, rowPath) => (object)new { sourceIndex = index, effectId = row.effectID, effectRank = row.effectRank, target = Named(row.targetType), tag = Named(row.tagType), chance = row.chance })
    } });
}
var projectAbility = new System.Func<Il2Cpp.RPGAbility, object>((ability) =>
{
    var ranks = new System.Collections.Generic.List<object>();
    var nativeRanks = ability.ranks;
    var rankCount = nativeRanks == null ? 0 : nativeRanks.Count;
    for (var rankIndex = 0; rankIndex < rankCount; rankIndex++)
    {
        var rank = nativeRanks[rankIndex];
        if (rank == null)
        {
            ranks.Add(new { rankIndex = rankIndex, generator = "AbilityTooltipGenerator.Generate(null, RPGAbility, RPGAbilityRankData)", succeeded = false, text = (string)null, error = "null RPGAbilityRankData record" });
            continue;
        }
        try
        {
            var generated = Il2Cpp.AbilityTooltipGenerator.Generate(null, ability, rank);
            ranks.Add(new { rankIndex = rankIndex, generator = "AbilityTooltipGenerator.Generate(null, RPGAbility, RPGAbilityRankData)", succeeded = true, text = generated, error = (string)null });
        }
        catch (System.Exception error)
        {
            ranks.Add(new { rankIndex = rankIndex, generator = "AbilityTooltipGenerator.Generate(null, RPGAbility, RPGAbilityRankData)", succeeded = false, text = (string)null, error = error.GetType().FullName + ": " + error.Message });
        }
    }
    var path = At("GameDatabase.Abilities", ability.ID);
    var mechanics = ListOf(ability.ranks, path + ".ranks", (rank, index, rankPath) => (object)new
    {
        rankIndex = index, unlockCost = rank.unlockCost, activationType = Named(rank.activationType), castTime = rank.castTime, channelTime = rank.channelTime,
        cooldown = rank.cooldown, usesGlobalCooldown = rank.isGCD, minRange = rank.minRange, maxRange = rank.maxRange, targetType = Named(rank.targetType),
        areaRadius = rank.AOERadius, coneDegree = rank.coneDegree, coneRange = rank.coneRange, projectileCount = rank.projectileCount, maxUnitsHit = rank.MaxUnitHit,
        effectsApplied = ListOf(rank.effectsApplied, rankPath + ".effectsApplied", (row, rowIndex, rowPath) => (object)new { sourceIndex = rowIndex, effectId = row.effectID, chance = row.chance, effectRank = row.effectRank, target = Named(row.target), delay = row.delay, requirements = Requirements(row.UseRequirementsTemplate, row.RequirementsTemplate, row.Requirements, rowPath) }),
        casterEffectsApplied = ListOf(rank.casterEffectsApplied, rankPath + ".casterEffectsApplied", (row, rowIndex, rowPath) => (object)new { sourceIndex = rowIndex, effectId = row.effectID, chance = row.chance, effectRank = row.effectRank, target = Named(row.target), delay = row.delay, requirements = Requirements(row.UseRequirementsTemplate, row.RequirementsTemplate, row.Requirements, rowPath) }),
        requirements = Requirements(rank.UseRequirementsTemplate, rank.RequirementsTemplate, rank.Requirements, rankPath)
    });
    return new { ranks = ranks, abilityType = Named(ability.abilityType), learnedByDefault = ability.learnedByDefault, requiresRangedWeapon = ability.RequiresRangedWeapon, rankMechanics = mechanics };
});
var abilities = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetAbilities()) { if (pair.Value == null) { abilities.Add(NullRecord("Abilities", pair.Key)); continue; } abilities.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "ability"), gameplay = projectAbility(pair.Value) }); }
var effects = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetEffects())
{
    if (pair.Value == null) { effects.Add(NullRecord("Effects", pair.Key)); continue; }
    var effect = pair.Value; var path = At("GameDatabase.Effects", pair.Key);
    effects.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(effect, "effect"), gameplay = new
    {
        effectType = Named(effect.effectType), effectTag = Record(effect.EffectTag), isState = effect.isState, isBuffOnSelf = effect.isBuffOnSelf, stackLimit = effect.stackLimit,
        allowMultiple = effect.allowMultiple, allowMixedCaster = effect.allowMixedCaster, pulses = effect.pulses, duration = effect.duration, endless = effect.endless,
        canBeManuallyRemoved = effect.canBeManuallyRemoved, isPersistent = effect.IsPersistent,
        ranks = ListOf(effect.ranks, path + ".ranks", (rank, index, rankPath) => (object)new
        {
            rankIndex = index, mainDamageType = Named(rank.mainDamageType), customDamageType = Record(rank.customDamageType), customHealingType = Record(rank.customHealingType),
            damage = rank.Damage, alteredStatId = rank.alteredStatID, flatCalculation = rank.FlatCalculation, cannotCrit = rank.CannotCrit,
            skillModifier = rank.skillModifier, skillModifierId = rank.skillModifierID, weaponDamageModifier = rank.weaponDamageModifier, useWeapon1Damage = rank.useWeapon1Damage, useWeapon2Damage = rank.useWeapon2Damage,
            lifesteal = rank.lifesteal, maxHealthModifier = rank.maxHealthModifier, missingHealthModifier = rank.missingHealthModifier, delay = rank.delay,
            requiredEffectId = rank.requiredEffectID, requiredEffectDamageModifier = rank.requiredEffectDamageModifier, damageStatId = rank.damageStatID, damageStatModifier = rank.damageStatModifier,
            teleportType = Named(rank.teleportType), gameSceneId = rank.gameSceneID, lootTableId = rank.lootTableID,
            petNpcId = rank.petNPCDataID, petDuration = rank.petDuration, petSpawnCount = rank.petSPawnCount,
            knockbackDistance = rank.knockbackDistance, motionDistance = rank.motionDistance,
            dispelType = Named(rank.dispelType), dispelEffectType = Named(rank.dispelEffectType), dispelEffectTag = Record(rank.DispelEffectTag), dispelEffectId = rank.dispelEffectID,
            tauntFlatThreat = rank.tauntFlatThreat, resurrectHealthPercent = rank.resurrectHealthPercent,
            statEffects = ListOf(rank.statEffectsData, rankPath + ".statEffectsData", (row, rowIndex, rowPath) => (object)new { sourceIndex = rowIndex, statId = row.statID, amount = row.statEffectModification, isPercent = row.isPercent }),
            nestedEffects = ListOf(rank.nestedEffects, rankPath + ".nestedEffects", (row, rowIndex, rowPath) => (object)new { sourceIndex = rowIndex, effectId = row.effectID, chance = row.chance, effectRank = row.effectRank, target = Named(row.target), delay = row.delay, requirements = Requirements(row.UseRequirementsTemplate, row.RequirementsTemplate, row.Requirements, rowPath) })
        })
    } });
}
var factions = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetFactions())
{
    if (pair.Value == null) { factions.Add(NullRecord("Factions", pair.Key)); continue; }
    var faction = pair.Value; var path = At("GameDatabase.Factions", pair.Key);
    factions.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(faction, null), gameplay = new
    {
        showInReputation = faction.ShowInReputation,
        stances = ListOf(faction.factionStances, path + ".factionStances", (row, index, rowPath) => (object)new { sourceIndex = index, stance = Record(row.FactionStance), pointsRequired = row.pointsRequired, alignmentToPlayer = Named(row.AlignementToPlayer) }),
        relations = ListOf(faction.factionInteractions, path + ".factionInteractions", (row, index, rowPath) => (object)new { sourceIndex = index, factionId = row.factionID, defaultStance = Record(row.DefaultFactionStance), startingPoints = row.startingPoints })
    } });
}
var classes = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetClasses())
{
    if (pair.Value == null) { classes.Add(NullRecord("Classes", pair.Key)); continue; }
    var classEntry = pair.Value;
    var allowedWeaponTypes = new System.Collections.Generic.List<object>();
    if (classEntry.AllowedWeaponTypes != null)
    {
        foreach (var weaponType in classEntry.AllowedWeaponTypes)
        {
            if (weaponType != null) allowedWeaponTypes.Add(new { nativeId = weaponType.ID, name = weaponType.entryDisplayName ?? weaponType.entryName });
        }
    }
    var path = At("GameDatabase.Classes", pair.Key);
    classes.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(classEntry, "class"), gameplay = new
    {
        allowedWeaponTypes = allowedWeaponTypes, autoAttackAbilityId = classEntry.autoAttackAbilityID, levelTemplateId = classEntry.levelTemplateID,
        stats = ListOf(classEntry.stats, path + ".stats", (row, index, rowPath) => (object)new { sourceIndex = index, statId = row.statID, amount = row.amount, isPercent = row.isPercent, bonusPerLevel = row.bonusPerLevel }),
        customStats = CustomStats(classEntry.CustomStats, path + ".CustomStats"), useStatListTemplate = classEntry.UseStatListTemplate, statListTemplate = StatTemplate(classEntry.StatListTemplate, path + ".StatListTemplate"),
        skillBonuses = ListOf(classEntry.skillBonuses, path + ".skillBonuses", (row, index, rowPath) => (object)new { sourceIndex = index, skillId = row.skillID, amount = row.amount }),
        talentTreeIds = ListOf(classEntry.talentTrees, path + ".talentTrees", (row, index, rowPath) => (object)new { sourceIndex = index, talentTreeId = row.talentTreeID }),
        spellbookIds = ListOf(classEntry.spellbooks, path + ".spellbooks", (row, index, rowPath) => (object)new { sourceIndex = index, spellbookId = row.spellbookID }),
        startItems = ListOf(classEntry.startItems, path + ".startItems", (row, index, rowPath) => (object)new { sourceIndex = index, itemId = row.itemID, count = row.count, equipped = row.equipped }),
        actionAbilities = ListOf(classEntry.actionAbilities, path + ".actionAbilities", (row, index, rowPath) => (object)new { sourceIndex = index, keyType = Named(row.keyType), abilityId = row.abilityID }),
        allocationStatPoints = classEntry.allocationStatPoints,
        allocatedStatsEntries = ListOf(classEntry.allocatedStatsEntries, path + ".allocatedStatsEntries", (row, index, rowPath) => (object)new { sourceIndex = index, statId = row.statID, maxValue = row.maxValue, cost = row.cost, valueAdded = row.valueAdded, isPercent = row.isPercent }),
        allocatedStatsEntriesGame = ListOf(classEntry.allocatedStatsEntriesGame, path + ".allocatedStatsEntriesGame", (row, index, rowPath) => (object)new { sourceIndex = index, statId = row.statID, maxValue = row.maxValue, cost = row.cost, valueAdded = row.valueAdded, isPercent = row.isPercent })
    } });
}
var armorSlots = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetArmorSlots())
{
    if (pair.Value == null) { armorSlots.Add(NullNamedRecord("ArmorSlots", pair.Key)); continue; }
    var armorSlot = pair.Value;
    var itemSlot = armorSlot.ItemSlot;
    armorSlots.Add(new { sourceKey = armorSlot.ID, entry = projectSupportEntry(armorSlot, null), gameplay = new { itemSlot = itemSlot == null ? (object)null : new { nativeId = itemSlot.ID, name = itemSlot.entryDisplayName ?? itemSlot.entryName } } });
}
var races = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetRaces()) { if (pair.Value == null) { races.Add(NullRecord("Races", pair.Key)); continue; } races.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "race"), gameplay = new { availableClasses = ListOf(pair.Value.availableClasses, At("GameDatabase.Races", pair.Key) + ".availableClasses", (row, index, rowPath) => (object)new { sourceIndex = index, classId = row.classID }) } }); }
var levels = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetLevels())
{
    if (pair.Value == null) { levels.Add(NullRecord("Levels", pair.Key)); continue; }
    var template = pair.Value; var path = At("GameDatabase.Levels", pair.Key);
    levels.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(template, null), gameplay = new
    {
        levels = template.levels, baseExperience = template.baseXPValue, increaseAmount = template.increaseAmount,
        allLevels = ListOf(template.allLevels, path + ".allLevels", (row, index, rowPath) => (object)new { sourceIndex = index, level = row.level, name = row.levelName, experienceRequired = row.XPRequired })
    } });
}
var worldQuests = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetWorldQuests()) { if (pair.Value == null) { worldQuests.Add(NullRecord("WorldQuests", pair.Key)); continue; } worldQuests.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "worldquest") }); }
var worldPositions = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetWorldPositions()) { if (pair.Value == null) { worldPositions.Add(NullRecord("WorldPositions", pair.Key)); continue; } worldPositions.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null) }); }
var properties = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetProperties()) { if (pair.Value == null) { properties.Add(NullRecord("Properties", pair.Key)); continue; } properties.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "property") }); }
var currencies = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetCurrencies()) { if (pair.Value == null) { currencies.Add(NullRecord("Currencies", pair.Key)); continue; } currencies.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "currency") }); }
var tasks = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetTasks()) { if (pair.Value == null) { tasks.Add(NullRecord("Tasks", pair.Key)); continue; } tasks.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "task") }); }
// Recipe ranks carry the player-facing crafting facts: products, materials, unlock cost, and
// craft time per rank. Negative ids are the authored "none" sentinel and stay as they are.
var projectRecipe = new System.Func<Il2Cpp.RPGCraftingRecipe, object>((recipe) =>
{
    var ranks = new System.Collections.Generic.List<object>();
    var nativeRanks = recipe.ranks;
    var rankCount = nativeRanks == null ? 0 : nativeRanks.Count;
    for (var rankIndex = 0; rankIndex < rankCount; rankIndex++)
    {
        var rank = nativeRanks[rankIndex];
        if (rank == null) { ranks.Add(new { rankIndex = rankIndex, unavailable = "null rank record" }); continue; }
        var crafted = new System.Collections.Generic.List<object>();
        var craftedCount = rank.allCraftedItems == null ? 0 : rank.allCraftedItems.Count;
        for (var index = 0; index < craftedCount; index++)
        {
            var row = rank.allCraftedItems[index];
            if (row == null) continue;
            crafted.Add(new { sourceIndex = index, itemId = row.craftedItemID, count = row.count, chance = row.chance });
        }
        var components = new System.Collections.Generic.List<object>();
        var componentCount = rank.allComponents == null ? 0 : rank.allComponents.Count;
        for (var index = 0; index < componentCount; index++)
        {
            var row = rank.allComponents[index];
            if (row == null) continue;
            components.Add(new { sourceIndex = index, itemId = row.componentItemID, count = row.count });
        }
        ranks.Add(new { rankIndex = rankIndex, unlockCost = rank.unlockCost, experience = rank.Experience, craftTime = rank.craftTime, craftedItems = crafted, components = components });
    }
    return new { learnedByDefault = recipe.learnedByDefault, craftingSkillId = recipe.craftingSkillID, craftingStationId = recipe.craftingStationID, ranks = ranks };
});
var recipes = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetRecipes()) { if (pair.Value == null) { recipes.Add(NullRecord("Recipes", pair.Key)); continue; } recipes.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "recipe"), gameplay = pair.Value == null ? null : projectRecipe(pair.Value) }); }
var projectStation = new System.Func<Il2Cpp.RPGCraftingStation, object>((station) =>
{
    var skillIds = new System.Collections.Generic.List<int>();
    var skillCount = station.craftSkills == null ? 0 : station.craftSkills.Count;
    for (var index = 0; index < skillCount; index++) { var row = station.craftSkills[index]; if (row != null) skillIds.Add(row.craftSkillID); }
    return new { maxDistance = station.maxDistance, craftSkillIds = skillIds };
});
var craftingStations = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetCraftingStations()) { if (pair.Value == null) { craftingStations.Add(NullRecord("CraftingStations", pair.Key)); continue; } craftingStations.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null), gameplay = pair.Value == null ? null : projectStation(pair.Value) }); }
var treePoints = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetPoints())
{
    if (pair.Value == null) { treePoints.Add(NullRecord("Points", pair.Key)); continue; }
    var point = pair.Value; var path = At("GameDatabase.Points", pair.Key);
    treePoints.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(point, null), gameplay = new
    {
        startAmount = point.startAmount, maxPoints = point.maxPoints,
        gainRules = ListOf(point.gainPointRequirements, path + ".gainPointRequirements", (row, index, rowPath) => (object)new { sourceIndex = index, gainType = Named(row.gainType), amount = row.amountGained, classId = row.classRequiredID, skillId = row.skillRequiredID, itemId = row.itemRequiredID, itemCount = row.itemRequiredCount, npcId = row.npcRequiredID, weaponTemplateId = row.weaponTemplateRequiredID })
    } });
}
var weaponTemplates = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetWeaponTemplates()) { if (pair.Value == null) { weaponTemplates.Add(NullRecord("WeaponTemplates", pair.Key)); continue; } weaponTemplates.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null) }); }
var enchantments = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetEnchantments())
{
    if (pair.Value == null) { enchantments.Add(NullRecord("Enchantments", pair.Key)); continue; }
    var enchantment = pair.Value; var path = At("GameDatabase.Enchantments", pair.Key);
    enchantments.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(enchantment, null), gameplay = new
    {
        applyRequirements = ListOf(enchantment.applyRequirements, path + ".applyRequirements", (row, index, rowPath) => (object)new { sourceIndex = index, type = Named(row.type), itemType = Record(row.ItemType), itemRarity = Record(row.ItemRarity), weaponType = Record(row.WeaponType), armorType = Record(row.ArmorType), armorSlot = Record(row.ArmorSlot), weaponSlot = Record(row.WeaponSlot) }),
        tiers = ListOf(enchantment.enchantmentTiers, path + ".enchantmentTiers", (tier, index, tierPath) => (object)new
        {
            tierIndex = index, successRate = tier.successRate, enchantTime = tier.enchantTime, skillId = tier.skillID, skillExperience = tier.skillXPAmount,
            currencyCosts = ListOf(tier.currencyCosts, tierPath + ".currencyCosts", (row, rowIndex, rowPath) => (object)new { sourceIndex = rowIndex, currencyId = row.currencyID, amount = row.amount }),
            itemCosts = ListOf(tier.itemCosts, tierPath + ".itemCosts", (row, rowIndex, rowPath) => (object)new { sourceIndex = rowIndex, itemId = row.itemID, count = row.itemCount }),
            stats = ListOf(tier.stats, tierPath + ".stats", (row, rowIndex, rowPath) => (object)new { sourceIndex = rowIndex, statId = row.statID, amount = row.amount, isPercent = row.isPercent })
        })
    } });
}
// A gear set carries the two lists the item tooltip renders: the items that belong to the set, and
// the tiers that reward wearing a number of them. Negative member ids are the authored "none"
// sentinel and stay as they are.
var projectGearSet = new System.Func<Il2Cpp.RPGGearSet, object>((gearSet) =>
{
    var members = new System.Collections.Generic.List<object>();
    var nativeMembers = gearSet.itemsInSet;
    var memberCount = nativeMembers == null ? 0 : nativeMembers.Count;
    for (var index = 0; index < memberCount; index++)
    {
        var member = nativeMembers[index];
        if (member == null) continue;
        members.Add(new { sourceIndex = index, itemId = member.itemID });
    }
    var tiers = new System.Collections.Generic.List<object>();
    var nativeTiers = gearSet.gearSetTiers;
    var tierCount = nativeTiers == null ? 0 : nativeTiers.Count;
    for (var tierIndex = 0; tierIndex < tierCount; tierIndex++)
    {
        var tier = nativeTiers[tierIndex];
        if (tier == null) { tiers.Add(new { tierIndex = tierIndex, unavailable = "null tier record" }); continue; }
        var stats = new System.Collections.Generic.List<object>();
        var statCount = tier.gearSetTierStats == null ? 0 : tier.gearSetTierStats.Count;
        for (var statIndex = 0; statIndex < statCount; statIndex++)
        {
            var stat = tier.gearSetTierStats[statIndex];
            if (stat == null) continue;
            stats.Add(new { sourceIndex = statIndex, statId = stat.statID, amount = stat.amount, isPercent = stat.isPercent });
        }
        tiers.Add(new { tierIndex = tierIndex, equippedAmount = tier.equippedAmount, stats = stats });
    }
    return new { itemsInSet = members, gearSetTiers = tiers };
});
var gearSets = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetGearSets()) { if (pair.Value == null) { gearSets.Add(NullRecord("GearSets", pair.Key)); continue; } gearSets.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "gearset"), gameplay = pair.Value == null ? null : projectGearSet(pair.Value) }); }
var bonuses = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetBonuses())
{
    if (pair.Value == null) { bonuses.Add(NullRecord("Bonuses", pair.Key)); continue; }
    var bonus = pair.Value; var path = At("GameDatabase.Bonuses", pair.Key);
    bonuses.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(bonus, "bonus"), gameplay = new
    {
        learnedByDefault = bonus.learnedByDefault,
        ranks = ListOf(bonus.ranks, path + ".ranks", (rank, index, rankPath) => (object)new
        {
            rankIndex = index, unlockCost = rank.unlockCost, isEmpty = rank.IsEmptyBonus, emptyTooltip = rank.EmptyBonusTooltip,
            requirements = Requirements(rank.UseRequirementsTemplate, rank.RequirementsTemplate, rank.Requirements, rankPath),
            statEffects = ListOf(rank.statEffectsData, rankPath + ".statEffectsData", (row, rowIndex, rowPath) => (object)new { sourceIndex = rowIndex, statId = row.statID, amount = row.statEffectModification, isPercent = row.isPercent }),
            petStatEffects = ListOf(rank.petStatEffectsData, rankPath + ".petStatEffectsData", (row, rowIndex, rowPath) => (object)new { sourceIndex = rowIndex, targetType = Named(row.targetType), npcId = row.npcID, speciesId = row.speciesID, statId = row.statID, amount = row.statEffectModification, isPercent = row.isPercent })
        })
    } });
}
var dialogues = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetDialogues()) { if (pair.Value == null) { dialogues.Add(NullRecord("Dialogues", pair.Key)); continue; } dialogues.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null) }); }
var talentTrees = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetTalentTrees())
{
    if (pair.Value == null) { talentTrees.Add(NullRecord("TalentTrees", pair.Key)); continue; }
    var tree = pair.Value; var path = At("GameDatabase.TalentTrees", pair.Key);
    talentTrees.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(tree, "talenttree"), gameplay = new
    {
        tiers = tree.TiersAmount, treePointId = tree.treePointAcceptedID,
        nodes = ListOf(tree.nodeList, path + ".nodeList", (node, index, nodePath) => (object)new { sourceIndex = index, nodeType = Named(node.nodeType), abilityId = node.abilityID, recipeId = node.recipeID, resourceNodeId = node.resourceNodeID, bonusId = node.bonusID, tier = node.Tier, row = node.Row, requirements = Requirements(node.UseRequirementsTemplate, node.RequirementsTemplate, node.Requirements, nodePath) })
    } });
}
var spellbooks = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetSpellbooks())
{
    if (pair.Value == null) { spellbooks.Add(NullRecord("Spellbooks", pair.Key)); continue; }
    var book = pair.Value; var path = At("GameDatabase.Spellbooks", pair.Key);
    spellbooks.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(book, null), gameplay = new
    {
        sourceType = Named(book.sourceType),
        nodes = ListOf(book.nodeList, path + ".nodeList", (node, index, nodePath) => (object)new { sourceIndex = index, nodeType = Named(node.nodeType), abilityId = node.abilityID, bonusId = node.bonusID, unlockLevel = node.unlockLevel })
    } });
}
var combos = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetCombos()) { if (pair.Value == null) { combos.Add(NullRecord("Combos", pair.Key)); continue; } combos.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null) }); }
var species = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetSpecies()) { if (pair.Value == null) { species.Add(NullRecord("Species", pair.Key)); continue; } species.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null) }); }
var gameModifiers = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetGameModifiers()) { if (pair.Value == null) { gameModifiers.Add(NullRecord("GameModifiers", pair.Key)); continue; } gameModifiers.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null) }); }
// The live Heroic tier settings asset. The kill experience, Heroic Essence, creature scaling, affix, and Heroic gear
// rules read these values in build 25434619.
var heroicSettings = Il2CppBLINK.RPGBuilder.World.HeroicTierSettings.Get();
object heroicTierSettings = heroicSettings == null
    ? (object)new { unavailable = "HeroicTierSettings.Get() returned null", sourceFieldPath = "HeroicTierSettings.Get()" }
    : new
    {
        asset = heroicSettings.name,
        killExperienceMultiplier = heroicSettings.KillExperienceMultiplier,
        essenceTreePointId = heroicSettings.EssenceTreePointID, essenceBaseAmount = heroicSettings.EssenceBaseAmount, essencePerAffix = heroicSettings.EssencePerAffix,
        essenceEliteMultiplier = heroicSettings.EssenceEliteMultiplier, essenceRareMultiplier = heroicSettings.EssenceRareMultiplier, essenceBossMultiplier = heroicSettings.EssenceBossMultiplier,
        essenceHealthBaseline = heroicSettings.EssenceHealthBaseline, essenceHealthFactorMin = heroicSettings.EssenceHealthFactorMin, essenceHealthFactorMax = heroicSettings.EssenceHealthFactorMax,
        baseHealthMultiplier = heroicSettings.BaseHealthMultiplier, baseDamageMultiplier = heroicSettings.BaseDamageMultiplier,
        gearScoreCoefficient = heroicSettings.GearScoreCoefficient, maxGearBonus = heroicSettings.MaxGearBonus,
        affixChance = heroicSettings.AffixChance, extraAffixChance = heroicSettings.ExtraAffixChance, maxAffixes = heroicSettings.MaxAffixes, rareGuaranteedAffixes = heroicSettings.RareGuaranteedAffixes,
        affixLootDropMultiplier = heroicSettings.AffixLootDropMultiplier, heroicGearStatBonusPercent = heroicSettings.HeroicGearStatBonusPercent,
    };
return new { schemaVersion = "compendium.support.v3", requirementIssues = unresolved, language = Il2Cpp.Localize.CurrentLanguage, sourceTotals = new { skills = database.GetSkills().Count, stats = database.GetStats().Count, abilities = database.GetAbilities().Count, effects = database.GetEffects().Count, factions = database.GetFactions().Count, classes = database.GetClasses().Count, armorSlots = database.GetArmorSlots().Count, races = database.GetRaces().Count, levels = database.GetLevels().Count, worldQuests = database.GetWorldQuests().Count, worldPositions = database.GetWorldPositions().Count, properties = database.GetProperties().Count, currencies = database.GetCurrencies().Count, tasks = database.GetTasks().Count, recipes = database.GetRecipes().Count, craftingStations = database.GetCraftingStations().Count, treePoints = database.GetPoints().Count, weaponTemplates = database.GetWeaponTemplates().Count, enchantments = database.GetEnchantments().Count, gearSets = database.GetGearSets().Count, bonuses = database.GetBonuses().Count, dialogues = database.GetDialogues().Count, talentTrees = database.GetTalentTrees().Count, spellbooks = database.GetSpellbooks().Count, combos = database.GetCombos().Count, species = database.GetSpecies().Count, gameModifiers = database.GetGameModifiers().Count }, tables = new { craftingStations = craftingStations, skills = skills, stats = stats, abilities = abilities, effects = effects, factions = factions, classes = classes, armorSlots = armorSlots, races = races, levels = levels, worldQuests = worldQuests, worldPositions = worldPositions, properties = properties, currencies = currencies, tasks = tasks, recipes = recipes, treePoints = treePoints, weaponTemplates = weaponTemplates, enchantments = enchantments, gearSets = gearSets, bonuses = bonuses, dialogues = dialogues, talentTrees = talentTrees, spellbooks = spellbooks, combos = combos, species = species, gameModifiers = gameModifiers }, heroicTierSettings = heroicTierSettings };

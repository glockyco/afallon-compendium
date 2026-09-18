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
var skills = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetSkills()) skills.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "skill") });
var stats = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetStats()) stats.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "stat") });
var abilities = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetAbilities()) abilities.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "ability") });
var effects = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetEffects()) effects.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "effect") });
var factions = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetFactions()) factions.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null) });
var classes = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetClasses()) classes.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "class") });
var races = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetRaces()) races.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "race") });
var levels = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetLevels()) levels.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null) });
var worldQuests = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetWorldQuests()) worldQuests.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "worldquest") });
var worldPositions = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetWorldPositions()) worldPositions.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null) });
var properties = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetProperties()) properties.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "property") });
var currencies = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetCurrencies()) currencies.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "currency") });
var tasks = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetTasks()) tasks.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "task") });
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
foreach (var pair in database.GetRecipes()) recipes.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "recipe"), gameplay = pair.Value == null ? null : projectRecipe(pair.Value) });
var projectStation = new System.Func<Il2Cpp.RPGCraftingStation, object>((station) =>
{
    var skillIds = new System.Collections.Generic.List<int>();
    var skillCount = station.craftSkills == null ? 0 : station.craftSkills.Count;
    for (var index = 0; index < skillCount; index++) { var row = station.craftSkills[index]; if (row != null) skillIds.Add(row.craftSkillID); }
    return new { maxDistance = station.maxDistance, craftSkillIds = skillIds };
});
var craftingStations = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetCraftingStations()) craftingStations.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null), gameplay = pair.Value == null ? null : projectStation(pair.Value) });
var treePoints = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetPoints()) treePoints.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null) });
var weaponTemplates = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetWeaponTemplates()) weaponTemplates.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null) });
var enchantments = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetEnchantments()) enchantments.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null) });
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
foreach (var pair in database.GetGearSets()) gearSets.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "gearset"), gameplay = pair.Value == null ? null : projectGearSet(pair.Value) });
var bonuses = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetBonuses()) bonuses.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "bonus") });
var dialogues = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetDialogues()) dialogues.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null) });
var talentTrees = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetTalentTrees()) talentTrees.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, "talenttree") });
var spellbooks = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetSpellbooks()) spellbooks.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null) });
var combos = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetCombos()) combos.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null) });
var species = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetSpecies()) species.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null) });
var gameModifiers = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetGameModifiers()) gameModifiers.Add(new { sourceKey = pair.Key, entry = projectSupportEntry(pair.Value, null) });
return new { schemaVersion = "compendium.support.v1", language = Il2Cpp.Localize.CurrentLanguage, sourceTotals = new { skills = database.GetSkills().Count, stats = database.GetStats().Count, abilities = database.GetAbilities().Count, effects = database.GetEffects().Count, factions = database.GetFactions().Count, classes = database.GetClasses().Count, races = database.GetRaces().Count, levels = database.GetLevels().Count, worldQuests = database.GetWorldQuests().Count, worldPositions = database.GetWorldPositions().Count, properties = database.GetProperties().Count, currencies = database.GetCurrencies().Count, tasks = database.GetTasks().Count, recipes = database.GetRecipes().Count, craftingStations = database.GetCraftingStations().Count, treePoints = database.GetPoints().Count, weaponTemplates = database.GetWeaponTemplates().Count, enchantments = database.GetEnchantments().Count, gearSets = database.GetGearSets().Count, bonuses = database.GetBonuses().Count, dialogues = database.GetDialogues().Count, talentTrees = database.GetTalentTrees().Count, spellbooks = database.GetSpellbooks().Count, combos = database.GetCombos().Count, species = database.GetSpecies().Count, gameModifiers = database.GetGameModifiers().Count }, tables = new { craftingStations = craftingStations, skills = skills, stats = stats, abilities = abilities, effects = effects, factions = factions, classes = classes, races = races, levels = levels, worldQuests = worldQuests, worldPositions = worldPositions, properties = properties, currencies = currencies, tasks = tasks, recipes = recipes, treePoints = treePoints, weaponTemplates = weaponTemplates, enchantments = enchantments, gearSets = gearSets, bonuses = bonuses, dialogues = dialogues, talentTrees = talentTrees, spellbooks = spellbooks, combos = combos, species = species, gameModifiers = gameModifiers } };

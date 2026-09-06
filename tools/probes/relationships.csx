var nativeFieldUncertainties = new System.Collections.Generic.List<object>();

nativeFieldUncertainties.Add(new
{
    sourceFieldPath = "RPGNpc.merchantTableID",
    detail = "The legacy single merchant-table field is exported beside the current MerchantTables list. An empty legacy value does not remove current list bindings."
});
nativeFieldUncertainties.Add(new
{
    sourceFieldPath = "RPGMerchantTable.ON_SALE_ITEMS_DATA.cost",
    detail = "The authored cost is an integer paired with currencyID. This probe does not apply economy modifiers or format a player-facing amount."
});
nativeFieldUncertainties.Add(new
{
    sourceFieldPath = "RPGLootTable.LOOT_ITEMS.dropRate",
    detail = "The value is retained as an authored raw rate. It is not an effective probability and this probe does not combine it with outer rates or selection controls."
});
nativeFieldUncertainties.Add(new
{
    sourceFieldPath = "RPGLootTable.LevelBandGear",
    detail = "LevelBandGear enables runtime-generated gear. The authored lootItems list is retained but is not treated as an exhaustive dynamic output list."
});
nativeFieldUncertainties.Add(new
{
    sourceFieldPath = "RPGResourceNode.RPGResourceNodeRankData.lootTableID",
    detail = "A resource rank links to a loot table. The rank does not contain a second inline yield list."
});
nativeFieldUncertainties.Add(new
{
    sourceFieldPath = "RequirementsData.Requirement.BoolBalue1",
    detail = "The misspelled native field name BoolBalue1 is exported exactly, together with the other boolean predicate fields."
});

var database = Il2CppBLINK.RPGBuilder.Managers.GameDatabase.Instance;
var databaseAvailable = database != null;
var items = databaseAvailable ? database.GetItems() : null;
var npcs = databaseAvailable ? database.GetNPCs() : null;
var quests = databaseAvailable ? database.GetQuests() : null;
var tasks = databaseAvailable ? database.GetTasks() : null;
var lootTables = databaseAvailable ? database.GetLootTables() : null;
var merchantTables = databaseAvailable ? database.GetMerchantTables() : null;
var currencies = databaseAvailable ? database.GetCurrencies() : null;
var resources = databaseAvailable ? database.GetResources() : null;
var skills = databaseAvailable ? database.GetSkills() : null;

var getItemName = new System.Func<int, string>(id =>
{
    if (items == null)
    {
        return null;
    }
    try
    {
        var item = items[id];
        return getEntryName(item);
    }
    catch (System.Exception)
    {
        return null;
    }
});
var getNPCName = new System.Func<int, string>(id =>
{
    if (npcs == null)
    {
        return null;
    }
    try
    {
        var npc = npcs[id];
        return getEntryName(npc);
    }
    catch (System.Exception)
    {
        return null;
    }
});
var getQuestName = new System.Func<int, string>(id =>
{
    if (quests == null)
    {
        return null;
    }
    try
    {
        var quest = quests[id];
        return getEntryName(quest);
    }
    catch (System.Exception)
    {
        return null;
    }
});
var getTaskName = new System.Func<int, string>(id =>
{
    if (tasks == null)
    {
        return null;
    }
    try
    {
        var task = tasks[id];
        return getEntryName(task);
    }
    catch (System.Exception)
    {
        return null;
    }
});
var getLootTableName = new System.Func<int, string>(id =>
{
    if (lootTables == null)
    {
        return null;
    }
    try
    {
        var lootTable = lootTables[id];
        return getEntryName(lootTable);
    }
    catch (System.Exception)
    {
        return null;
    }
});
var getMerchantTableName = new System.Func<int, string>(id =>
{
    if (merchantTables == null)
    {
        return null;
    }
    try
    {
        var merchantTable = merchantTables[id];
        return getEntryName(merchantTable);
    }
    catch (System.Exception)
    {
        return null;
    }
});
var getCurrencyName = new System.Func<int, string>(id =>
{
    if (currencies == null)
    {
        return null;
    }
    try
    {
        var currency = currencies[id];
        return getEntryName(currency);
    }
    catch (System.Exception)
    {
        return null;
    }
});
var getResourceName = new System.Func<int, string>(id =>
{
    if (resources == null)
    {
        return null;
    }
    try
    {
        var resource = resources[id];
        return getEntryName(resource);
    }
    catch (System.Exception)
    {
        return null;
    }
});
var getSkillName = new System.Func<int, string>(id =>
{
    if (skills == null)
    {
        return null;
    }
    try
    {
        var skill = skills[id];
        return getEntryName(skill);
    }
    catch (System.Exception)
    {
        return null;
    }
});

var hasItem = new System.Func<int, bool>(id =>
{
    if (items == null)
    {
        return false;
    }
    try
    {
        return items[id] != null;
    }
    catch (System.Exception)
    {
        return false;
    }
});
var hasCurrency = new System.Func<int, bool>(id =>
{
    if (currencies == null)
    {
        return false;
    }
    try
    {
        return currencies[id] != null;
    }
    catch (System.Exception)
    {
        return false;
    }
});
var hasTask = new System.Func<int, bool>(id =>
{
    if (tasks == null)
    {
        return false;
    }
    try
    {
        return tasks[id] != null;
    }
    catch (System.Exception)
    {
        return false;
    }
});
var hasLootTable = new System.Func<int, bool>(id =>
{
    if (lootTables == null)
    {
        return false;
    }
    try
    {
        return lootTables[id] != null;
    }
    catch (System.Exception)
    {
        return false;
    }
});

var requirementGroups = new System.Collections.Generic.List<object>();
var requirements = new System.Collections.Generic.List<object>();
var appendRequirementSet = new System.Action<Il2CppSystem.Collections.Generic.List<Il2Cpp.RequirementsData.RequirementGroup>, string, string, int, int, string>((nativeGroups, ownerKind, sourceFieldPath, ownerNativeId, relationIndex, relationKey) =>
{
    var groupCount = nativeGroups == null ? 0 : nativeGroups.Count;
    for (var groupIndex = 0; groupIndex < groupCount; groupIndex++)
    {
        var group = nativeGroups[groupIndex];
        var groupSourcePath = sourceFieldPath + "[" + groupIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        var requirementCount = group == null || group.Requirements == null ? 0 : group.Requirements.Count;
        requirementGroups.Add(new
        {
            ownerKind = ownerKind,
            ownerNativeId = ownerNativeId,
            relationKey = relationKey,
            relationIndex = relationIndex,
            sourceFieldPath = groupSourcePath,
            groupIndex = groupIndex,
            checkCount = group == null ? false : group.checkCount,
            requiredCount = group == null ? 0 : group.requiredCount,
            nativeRequirementCount = requirementCount
        });
        for (var requirementIndex = 0; requirementIndex < requirementCount; requirementIndex++)
        {
            var requirementSourcePath = groupSourcePath + ".Requirements[" + requirementIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
            requirements.Add(new
            {
                ownerKind = ownerKind,
                ownerNativeId = ownerNativeId,
                relationKey = relationKey,
                relationIndex = relationIndex,
                groupIndex = groupIndex,
                requirementIndex = requirementIndex,
                sourceFieldPath = requirementSourcePath,
                predicate = projectRequirement(group.Requirements[requirementIndex], requirementSourcePath, groupIndex, requirementIndex)
            });
        }
    }
});

var currenciesOutput = new System.Collections.Generic.List<object>();
if (currencies != null)
{
    foreach (var currencyPair in currencies)
    {
        var currency = currencyPair.Value;
        if (currency == null)
        {
            unresolved.Add(new { kind = "currency", sourceFieldPath = "GameDatabase.Currencies[" + currencyPair.Key.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]", detail = "The native currency record is null." });
            continue;
        }
        currenciesOutput.Add(new
        {
            nativeId = currency.ID,
            dictionaryKey = currencyPair.Key,
            name = getEntryName(currency),
            internalName = currency.entryName,
            fileName = currency.entryFileName,
            description = currency.entryDescription,
            legacyName = currency._name,
            legacyFileName = currency._fileName,
            legacyDisplayName = currency.displayName,
            legacyDescription = currency.description,
            minValue = currency.minValue,
            maxValue = currency.maxValue,
            baseValue = currency.baseValue,
            splitWithCompanions = currency.SplitWithCompanions,
            amountToConvert = currency.AmountToConvert,
            convertToCurrencyID = currency.convertToCurrencyID,
            convertToCurrencyName = getCurrencyName(currency.convertToCurrencyID),
            lowestCurrencyID = currency.lowestCurrencyID,
            lowestCurrencyName = getCurrencyName(currency.lowestCurrencyID),
            sourceFieldPath = "GameDatabase.Currencies"
        });
    }
}

var merchantTablesOutput = new System.Collections.Generic.List<object>();
var merchantStock = new System.Collections.Generic.List<object>();
if (merchantTables != null)
{
    foreach (var merchantPair in merchantTables)
    {
        var merchantTable = merchantPair.Value;
        if (merchantTable == null)
        {
            unresolved.Add(new { kind = "merchantTable", sourceFieldPath = "GameDatabase.MerchantTables[" + merchantPair.Key.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]", detail = "The native merchant table record is null." });
            continue;
        }

        var tableID = merchantTable.ID;
        var projectedStock = new System.Collections.Generic.List<object>();
        var nativeStock = merchantTable.onSaleItems;
        var stockCount = nativeStock == null ? 0 : nativeStock.Count;
        for (var stockIndex = 0; stockIndex < stockCount; stockIndex++)
        {
            var stock = nativeStock[stockIndex];
            var stockSourcePath = "RPGMerchantTable.onSaleItems[" + stockIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
            if (stock == null)
            {
                unresolved.Add(new { kind = "merchantStock", sourceFieldPath = stockSourcePath, detail = "The native stock row is null." });
                continue;
            }

            if (!hasItem(stock.itemID))
            {
                unresolved.Add(new
                {
                    kind = "merchantStockItemReference",
                    sourceFieldPath = stockSourcePath + ".itemID",
                    detail = "itemID does not resolve in GameDatabase.Items.",
                    merchantTableID = tableID,
                    itemID = stock.itemID
                });
            }
            if (!hasCurrency(stock.currencyID))
            {
                unresolved.Add(new
                {
                    kind = "merchantStockCurrencyReference",
                    sourceFieldPath = stockSourcePath + ".currencyID",
                    detail = "currencyID does not resolve in GameDatabase.Currencies.",
                    merchantTableID = tableID,
                    currencyID = stock.currencyID
                });
            }

            var stockProjection = new
            {
                merchantTableID = tableID,
                merchantTableName = getMerchantTableName(tableID),
                stockIndex = stockIndex,
                itemID = stock.itemID,
                itemName = getItemName(stock.itemID),
                currencyID = stock.currencyID,
                currencyName = getCurrencyName(stock.currencyID),
                cost = stock.cost,
                costSemantics = "authored integer cost; no economy modifier applied",
                sourceFieldPath = stockSourcePath
            };
            projectedStock.Add(stockProjection);
            merchantStock.Add(stockProjection);
        }

        merchantTablesOutput.Add(new
        {
            nativeId = tableID,
            dictionaryKey = merchantPair.Key,
            name = getEntryName(merchantTable),
            internalName = merchantTable.entryName,
            fileName = merchantTable.entryFileName,
            displayName = merchantTable.entryDisplayName,
            legacyDisplayName = merchantTable.displayName,
            legacyName = merchantTable._name,
            legacyFileName = merchantTable._fileName,
            nativeStockCount = stockCount,
            onSaleItems = projectedStock,
            sourceFieldPath = "GameDatabase.MerchantTables"
        });
    }
}

var merchantBindings = new System.Collections.Generic.List<object>();
var merchantBindingOwners = new System.Collections.Generic.List<object>();
var merchantBindingCount = 0;
var merchantBindingOwnerCount = 0;
var merchantLegacyNonEmptyCount = 0;
if (npcs != null)
{
    foreach (var npcPair in npcs)
    {
        var npc = npcPair.Value;
        if (npc == null)
        {
            unresolved.Add(new { kind = "npc", sourceFieldPath = "GameDatabase.NPCs[" + npcPair.Key.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]", detail = "The native NPC record is null." });
            continue;
        }

        var npcID = npc.ID;
        var nativeBindings = npc.MerchantTables;
        var bindingCount = nativeBindings == null ? 0 : nativeBindings.Count;
        if (npc.merchantTableID >= 0)
        {
            merchantLegacyNonEmptyCount++;
        }
        merchantBindingOwners.Add(new
        {
            ownerNativeId = npcID,
            ownerName = getEntryName(npc),
            isMerchant = npc.isMerchant,
            legacyMerchantTableID = npc.merchantTableID,
            legacyMerchantTableName = npc.merchantTableID < 0 ? null : getMerchantTableName(npc.merchantTableID),
            currentMerchantTablesCount = bindingCount,
            currentSourceFieldPath = "RPGNpc.MerchantTables",
            legacySourceFieldPath = "RPGNpc.merchantTableID",
            currentListIsAuthoritativeForThisExport = true
        });
        merchantBindingOwnerCount++;

        for (var bindingIndex = 0; bindingIndex < bindingCount; bindingIndex++)
        {
            var binding = nativeBindings[bindingIndex];
            var bindingSourcePath = "RPGNpc.MerchantTables[" + bindingIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
            if (binding == null)
            {
                unresolved.Add(new { kind = "merchantBinding", sourceFieldPath = bindingSourcePath, detail = "The native merchant binding row is null." });
                continue;
            }

            var bindingTableID = binding.MerchantTableID;
            Il2Cpp.RPGMerchantTable bindingTable = null;
            var tableResolved = false;
            if (merchantTables != null)
            {
                try
                {
                    bindingTable = merchantTables[bindingTableID];
                    tableResolved = bindingTable != null;
                }
                catch (System.Exception)
                {
                    tableResolved = false;
                }
            }
            if (!tableResolved)
            {
                unresolved.Add(new
                {
                    kind = "merchantBindingReference",
                    sourceFieldPath = bindingSourcePath + ".MerchantTableID",
                    detail = "MerchantTableID does not resolve in GameDatabase.MerchantTables.",
                    ownerNativeId = npcID,
                    merchantTableID = bindingTableID
                });
            }

            var templateSourcePath = bindingSourcePath + ".RequirementsTemplate";
            var templateProjection = projectTemplate(binding.RequirementsTemplate, templateSourcePath);
            if (binding.RequirementsTemplate != null)
            {
                appendRequirementSet(binding.RequirementsTemplate.Requirements, "merchantBindingTemplate", templateSourcePath + ".Requirements", npcID, bindingIndex, "merchantTable:" + bindingTableID.ToString(System.Globalization.CultureInfo.InvariantCulture));
            }

            merchantBindings.Add(new
            {
                ownerNativeId = npcID,
                ownerName = getEntryName(npc),
                ownerLegacyMerchantTableID = npc.merchantTableID,
                merchantTableID = bindingTableID,
                merchantTableName = tableResolved ? getEntryName(bindingTable) : null,
                bindingIndex = bindingIndex,
                requirementsTemplate = templateProjection,
                sourceFieldPath = bindingSourcePath,
                legacySourceFieldPath = "RPGNpc.merchantTableID",
                resolved = tableResolved
            });
            merchantBindingCount++;
        }
    }
}

var lootTablesOutput = new System.Collections.Generic.List<object>();
var lootEntries = new System.Collections.Generic.List<object>();
var dynamicLevelBandGear = new System.Collections.Generic.List<object>();
if (lootTables != null)
{
    foreach (var lootPair in lootTables)
    {
        var lootTable = lootPair.Value;
        if (lootTable == null)
        {
            unresolved.Add(new { kind = "lootTable", sourceFieldPath = "GameDatabase.LootTables[" + lootPair.Key.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]", detail = "The native loot table record is null." });
            continue;
        }

        var lootTableID = lootTable.ID;
        var tableSourcePath = "GameDatabase.LootTables[" + lootPair.Key.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        var projectedEntries = new System.Collections.Generic.List<object>();
        var nativeEntries = lootTable.lootItems;
        var entryCount = nativeEntries == null ? 0 : nativeEntries.Count;
        for (var entryIndex = 0; entryIndex < entryCount; entryIndex++)
        {
            var entry = nativeEntries[entryIndex];
            var entrySourcePath = "RPGLootTable.lootItems[" + entryIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
            if (entry == null)
            {
                unresolved.Add(new { kind = "lootEntry", sourceFieldPath = entrySourcePath, detail = "The native loot row is null.", lootTableID = lootTableID });
                continue;
            }

            if (!hasItem(entry.itemID))
            {
                unresolved.Add(new
                {
                    kind = "lootEntryItemReference",
                    sourceFieldPath = entrySourcePath + ".itemID",
                    detail = "itemID does not resolve in GameDatabase.Items.",
                    lootTableID = lootTableID,
                    itemID = entry.itemID
                });
            }

            var entryProjection = new
            {
                lootTableID = lootTableID,
                lootTableName = getEntryName(lootTable),
                entryIndex = entryIndex,
                itemID = entry.itemID,
                itemName = getItemName(entry.itemID),
                min = entry.min,
                max = entry.max,
                dropRate = entry.dropRate,
                dropRateSemantics = "authored raw rate; effective probability unresolved",
                sourceFieldPath = entrySourcePath
            };
            projectedEntries.Add(entryProjection);
            lootEntries.Add(entryProjection);
        }

        var inlineRequirementSource = tableSourcePath + ".Requirements";
        var projectedInlineGroups = new System.Collections.Generic.List<object>();
        var nativeInlineGroups = lootTable.Requirements;
        var inlineGroupCount = nativeInlineGroups == null ? 0 : nativeInlineGroups.Count;
        for (var inlineGroupIndex = 0; inlineGroupIndex < inlineGroupCount; inlineGroupIndex++)
        {
            projectedInlineGroups.Add(projectGroup(nativeInlineGroups[inlineGroupIndex], inlineRequirementSource + "[" + inlineGroupIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]", inlineGroupIndex));
        }
        appendRequirementSet(lootTable.Requirements, "lootTable", inlineRequirementSource, lootTableID, -1, "lootTable:" + lootTableID.ToString(System.Globalization.CultureInfo.InvariantCulture));
        var templateSourcePath = tableSourcePath + ".RequirementsTemplate";
        var templateProjection = projectTemplate(lootTable.RequirementsTemplate, templateSourcePath);
        if (lootTable.RequirementsTemplate != null)
        {
            appendRequirementSet(lootTable.RequirementsTemplate.Requirements, "lootTableTemplate", templateSourcePath + ".Requirements", lootTableID, -1, "lootTable:" + lootTableID.ToString(System.Globalization.CultureInfo.InvariantCulture));
        }

        lootTablesOutput.Add(new
        {
            nativeId = lootTableID,
            dictionaryKey = lootPair.Key,
            name = getEntryName(lootTable),
            internalName = lootTable.entryName,
            fileName = lootTable.entryFileName,
            legacyName = lootTable._name,
            legacyFileName = lootTable._fileName,
            limitDroppedItems = lootTable.LimitDroppedItems,
            maxDroppedItems = lootTable.maxDroppedItems,
            hasMinimumDrops = lootTable.HasMinimumDrops,
            minDroppedItems = lootTable.minDroppedItems,
            levelBandGear = lootTable.LevelBandGear,
            useRequirementsTemplate = lootTable.UseRequirementsTemplate,
            nativeEntryCount = entryCount,
            lootItems = projectedEntries,
            inlineRequirements = lootTable.Requirements == null ? null : new
            {
                sourceFieldPath = inlineRequirementSource,
                nativeGroupCount = inlineGroupCount,
                groups = projectedInlineGroups
            },
            requirementsTemplate = templateProjection,
            sourceFieldPath = tableSourcePath
        });

        if (lootTable.LevelBandGear)
        {
            dynamicLevelBandGear.Add(new
            {
                lootTableID = lootTableID,
                lootTableName = getEntryName(lootTable),
                sourceFieldPath = "RPGLootTable.LevelBandGear",
                enabled = true,
                useRequirementsTemplate = lootTable.UseRequirementsTemplate,
                authoredStaticEntryCount = entryCount,
                authoredStaticEntries = projectedEntries,
                inlineRequirements = projectedInlineGroups,
                requirementsTemplate = templateProjection,
                levelBandRange = 4,
                levelBandRangeSourceFieldPath = "EconomyUtilities.LevelBandRange",
                economyGrowthPerLevel = 1.06,
                economyAnchorLevel = 20,
                economyScaleCap = 6,
                runtimeRuleMethods = new
                {
                    referenceLevel = "EconomyUtilities.GetLootReferenceLevel",
                    itemLevelGate = "EconomyUtilities.IsLootItemLevelAllowed",
                    itemSelection = "EconomyUtilities.PickMinimumDrops",
                    generatedLoot = "EconomyUtilities.GenerateDroppedLoot"
                },
                rule = "Runtime selects level-band gear; preserve the authored table, linked conditions, and raw entry fields without expanding an exhaustive output list.",
                effectiveOutputResolved = false
            });
            unresolved.Add(new
            {
                kind = "dynamicLevelBandGear",
                sourceFieldPath = "RPGLootTable.LevelBandGear",
                lootTableID = lootTableID,
                detail = "LevelBandGear is enabled. The runtime-generated gear selection rule is not represented by a static loot entry list; static entries and conditions remain available."
            });
        }
    }
}

var npcLootBindings = new System.Collections.Generic.List<object>();
var dynamicLevelBandGearLinks = new System.Collections.Generic.List<object>();
var npcLootBindingCount = 0;
if (npcs != null)
{
    foreach (var npcPair in npcs)
    {
        var npc = npcPair.Value;
        if (npc == null)
        {
            continue;
        }
        var nativeLootBindings = npc.lootTables;
        var lootBindingCount = nativeLootBindings == null ? 0 : nativeLootBindings.Count;
        for (var bindingIndex = 0; bindingIndex < lootBindingCount; bindingIndex++)
        {
            var binding = nativeLootBindings[bindingIndex];
            var bindingSourcePath = "RPGNpc.lootTables[" + bindingIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
            if (binding == null)
            {
                unresolved.Add(new { kind = "npcLootBinding", sourceFieldPath = bindingSourcePath, detail = "The native NPC loot binding row is null.", ownerNativeId = npc.ID });
                continue;
            }
            var resolved = false;
            var dynamic = false;
            if (lootTables != null)
            {
                try
                {
                    var linkedTable = lootTables[binding.lootTableID];
                    resolved = linkedTable != null;
                    dynamic = resolved && linkedTable.LevelBandGear;
                }
                catch (System.Exception)
                {
                    resolved = false;
                }
            }
            if (!resolved)
            {
                unresolved.Add(new
                {
                    kind = "npcLootBindingReference",
                    sourceFieldPath = bindingSourcePath + ".lootTableID",
                    detail = "lootTableID does not resolve in GameDatabase.LootTables.",
                    ownerNativeId = npc.ID,
                    lootTableID = binding.lootTableID
                });
            }
            var bindingProjection = new
            {
                ownerNativeId = npc.ID,
                ownerName = getEntryName(npc),
                lootTableID = binding.lootTableID,
                lootTableName = getLootTableName(binding.lootTableID),
                dropRate = binding.dropRate,
                dropRateSemantics = "authored outer raw rate; not an effective probability",
                levelBandGear = dynamic,
                bindingIndex = bindingIndex,
                sourceFieldPath = bindingSourcePath,
                resolved = resolved
            };
            npcLootBindings.Add(bindingProjection);
            if (dynamic)
            {
                dynamicLevelBandGearLinks.Add(new
                {
                    lootTableID = binding.lootTableID,
                    lootTableName = getLootTableName(binding.lootTableID),
                    ownerNativeId = npc.ID,
                    ownerName = getEntryName(npc),
                    bindingIndex = bindingIndex,
                    sourceFieldPath = bindingSourcePath,
                    relationship = "NPC loot binding references LevelBandGear table"
                });
            }
            npcLootBindingCount++;
        }
    }
}

var economySettings = databaseAvailable ? database.GetEconomySettings() : null;
if (economySettings == null || economySettings.WorldLootTables == null)
    throw new System.InvalidOperationException("Global loot settings are unavailable.");
var worldLootBindings = new System.Collections.Generic.List<object>();
for (var bindingIndex = 0; bindingIndex < economySettings.WorldLootTables.Count; bindingIndex++)
{
    var binding = economySettings.WorldLootTables[bindingIndex];
    var sourcePath = "GameDatabase.EconomySettings.WorldLootTables[" + bindingIndex + "]";
    if (binding == null) throw new System.InvalidOperationException("Global loot contains a null binding: " + sourcePath);
    var templatePath = sourcePath + ".RequirementsTemplate";
    var templateProjection = projectTemplate(binding.RequirementsTemplate, templatePath);
    if (binding.RequirementsTemplate != null)
        appendRequirementSet(binding.RequirementsTemplate.Requirements, "worldLootBindingTemplate", templatePath + ".Requirements", economySettings.ID, bindingIndex, "worldLootBinding:" + bindingIndex);
    worldLootBindings.Add(new
    {
        bindingIndex = bindingIndex,
        lootTableID = binding.lootTableID,
        lootTableName = getLootTableName(binding.lootTableID),
        dropRate = binding.dropRate,
        dropRateSemantics = "authored outer raw rate; not an effective probability",
        minimumNPCLevel = binding.MinNPCLevel,
        maximumNPCLevel = binding.MaxNPCLevel,
        requirementsTemplate = templateProjection,
        sourceFieldPath = sourcePath
    });
}
var worldLootSettings = new
{
    minimumNPCRank = (int)economySettings.MinimumWorldLootRank,
    minimumNPCRankName = economySettings.MinimumWorldLootRank.ToString(),
    maximumItemsPerNPC = economySettings.MaxWorldLootItemsPerNPC,
    sourceBindingCount = economySettings.WorldLootTables.Count,
    sourceFieldPath = "GameDatabase.EconomySettings"
};

var clothType = typeof(Il2Cpp.ClothDrops);
var clothStaticFlags = System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic;
var clothTierFlags = System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic;
var clothTiers = new System.Collections.Generic.List<object>();
var nativeClothTiers = (System.Collections.IEnumerable)clothType.GetProperty("Tiers", clothStaticFlags).GetValue(null);
foreach (var tier in nativeClothTiers)
{
    var tierType = tier.GetType();
    clothTiers.Add(new
    {
        tierIndex = clothTiers.Count,
        itemID = (int)tierType.GetProperty("ItemID", clothTierFlags).GetValue(tier),
        startLevel = (float)tierType.GetProperty("StartLevel", clothTierFlags).GetValue(tier),
        rampEnd = (float)tierType.GetProperty("RampEnd", clothTierFlags).GetValue(tier),
        lowWeight = (float)tierType.GetProperty("LowWeight", clothTierFlags).GetValue(tier),
        highWeight = (float)tierType.GetProperty("HighWeight", clothTierFlags).GetValue(tier),
        teaserWeight = (float)tierType.GetProperty("TeaserWeight", clothTierFlags).GetValue(tier)
    });
}
var clothDrops = new
{
    sourceFieldPath = "ClothDrops.Tiers",
    dropChance = (float)clothType.GetProperty("DropChance", clothStaticFlags).GetValue(null),
    minimumCount = (int)clothType.GetProperty("MinCount", clothStaticFlags).GetValue(null),
    maximumCount = (int)clothType.GetProperty("MaxCount", clothStaticFlags).GetValue(null),
    tiers = clothTiers,
    semantics = "Native supplemental loot source configuration; no effective probability is claimed."
};

var npcQuestBindings = new System.Collections.Generic.List<object>();
var questBindingCount = 0;
if (npcs != null)
{
    foreach (var npcPair in npcs)
    {
        var npc = npcPair.Value;
        if (npc == null)
        {
            continue;
        }

        var given = npc.questGiven;
        var givenCount = given == null ? 0 : given.Count;
        for (var questIndex = 0; questIndex < givenCount; questIndex++)
        {
            var association = given[questIndex];
            var associationPath = "RPGNpc.questGiven[" + questIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
            if (association == null)
            {
                unresolved.Add(new { kind = "npcQuestBinding", sourceFieldPath = associationPath, detail = "The native quest association row is null.", ownerNativeId = npc.ID });
                continue;
            }
            var resolved = false;
            if (quests != null)
            {
                try
                {
                    resolved = quests[association.questID] != null;
                }
                catch (System.Exception)
                {
                    resolved = false;
                }
            }
            npcQuestBindings.Add(new
            {
                ownerNativeId = npc.ID,
                ownerName = getEntryName(npc),
                association = "given",
                questID = association.questID,
                questName = getQuestName(association.questID),
                associationIndex = questIndex,
                sourceFieldPath = associationPath,
                resolved = resolved
            });
            questBindingCount++;
        }

        var completed = npc.questCompleted;
        var completedCount = completed == null ? 0 : completed.Count;
        for (var questIndex = 0; questIndex < completedCount; questIndex++)
        {
            var association = completed[questIndex];
            var associationPath = "RPGNpc.questCompleted[" + questIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
            if (association == null)
            {
                unresolved.Add(new { kind = "npcQuestBinding", sourceFieldPath = associationPath, detail = "The native quest association row is null.", ownerNativeId = npc.ID });
                continue;
            }
            var resolved = false;
            if (quests != null)
            {
                try
                {
                    resolved = quests[association.questID] != null;
                }
                catch (System.Exception)
                {
                    resolved = false;
                }
            }
            npcQuestBindings.Add(new
            {
                ownerNativeId = npc.ID,
                ownerName = getEntryName(npc),
                association = "completed",
                questID = association.questID,
                questName = getQuestName(association.questID),
                associationIndex = questIndex,
                sourceFieldPath = associationPath,
                resolved = resolved
            });
            questBindingCount++;
        }
    }
}

var questDefinitions = new System.Collections.Generic.List<object>();
var questObjectives = new System.Collections.Generic.List<object>();
var questItemsGiven = new System.Collections.Generic.List<object>();
var questRewards = new System.Collections.Generic.List<object>();
if (quests != null)
{
    foreach (var questPair in quests)
    {
        var quest = questPair.Value;
        if (quest == null)
        {
            unresolved.Add(new { kind = "quest", sourceFieldPath = "GameDatabase.Quests[" + questPair.Key.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]", detail = "The native quest record is null." });
            continue;
        }

        var questID = quest.ID;
        var questPath = "GameDatabase.Quests[" + questPair.Key.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        var questRequirementPath = questPath + ".Requirements";
        var projectedQuestGroups = new System.Collections.Generic.List<object>();
        var nativeQuestGroups = quest.Requirements;
        var questGroupCount = nativeQuestGroups == null ? 0 : nativeQuestGroups.Count;
        for (var questGroupIndex = 0; questGroupIndex < questGroupCount; questGroupIndex++)
        {
            projectedQuestGroups.Add(projectGroup(nativeQuestGroups[questGroupIndex], questRequirementPath + "[" + questGroupIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]", questGroupIndex));
        }
        appendRequirementSet(quest.Requirements, "quest", questRequirementPath, questID, -1, "quest:" + questID.ToString(System.Globalization.CultureInfo.InvariantCulture));
        var questTemplatePath = questPath + ".RequirementsTemplate";
        var questTemplate = projectTemplate(quest.RequirementsTemplate, questTemplatePath);
        if (quest.RequirementsTemplate != null)
        {
            appendRequirementSet(quest.RequirementsTemplate.Requirements, "questTemplate", questTemplatePath + ".Requirements", questID, -1, "quest:" + questID.ToString(System.Globalization.CultureInfo.InvariantCulture));
        }

        var objectiveOutput = new System.Collections.Generic.List<object>();
        var objectives = quest.objectives;
        var objectiveCount = objectives == null ? 0 : objectives.Count;
        for (var objectiveIndex = 0; objectiveIndex < objectiveCount; objectiveIndex++)
        {
            var objective = objectives[objectiveIndex];
            var objectivePath = "RPGQuest.objectives[" + objectiveIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
            if (objective == null)
            {
                unresolved.Add(new { kind = "questObjective", sourceFieldPath = objectivePath, detail = "The native quest objective row is null.", questID = questID });
                continue;
            }
            if (!hasTask(objective.taskID))
            {
                unresolved.Add(new
                {
                    kind = "questObjectiveTaskReference",
                    sourceFieldPath = objectivePath + ".taskID",
                    detail = "taskID does not resolve in GameDatabase.Tasks.",
                    questID = questID,
                    taskID = objective.taskID
                });
            }
            var objectiveProjection = new
            {
                questID = questID,
                questName = getEntryName(quest),
                objectiveIndex = objectiveIndex,
                objectiveType = objective.objectiveType.ToString(),
                objectiveTypeValue = (int)objective.objectiveType,
                taskID = objective.taskID,
                taskName = getTaskName(objective.taskID),
                timeLimit = objective.timeLimit,
                sourceFieldPath = objectivePath
            };
            objectiveOutput.Add(objectiveProjection);
            questObjectives.Add(objectiveProjection);
        }

        var itemGivenOutput = new System.Collections.Generic.List<object>();
        var itemsGiven = quest.itemsGiven;
        var itemsGivenCount = itemsGiven == null ? 0 : itemsGiven.Count;
        for (var itemIndex = 0; itemIndex < itemsGivenCount; itemIndex++)
        {
            var itemGiven = itemsGiven[itemIndex];
            var itemPath = "RPGQuest.itemsGiven[" + itemIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
            if (itemGiven == null)
            {
                unresolved.Add(new { kind = "questItemGiven", sourceFieldPath = itemPath, detail = "The native quest item row is null.", questID = questID });
                continue;
            }
            if (!hasItem(itemGiven.itemID))
            {
                unresolved.Add(new
                {
                    kind = "questItemGivenReference",
                    sourceFieldPath = itemPath + ".itemID",
                    detail = "itemID does not resolve in GameDatabase.Items.",
                    questID = questID,
                    itemID = itemGiven.itemID
                });
            }
            var itemProjection = new
            {
                questID = questID,
                questName = getEntryName(quest),
                itemIndex = itemIndex,
                itemID = itemGiven.itemID,
                itemName = getItemName(itemGiven.itemID),
                count = itemGiven.count,
                sourceFieldPath = itemPath
            };
            itemGivenOutput.Add(itemProjection);
            questItemsGiven.Add(itemProjection);
        }

        var rewardOutput = new System.Collections.Generic.List<object>();
        var rewardsGiven = quest.rewardsGiven;
        var rewardsGivenCount = rewardsGiven == null ? 0 : rewardsGiven.Count;
        for (var rewardIndex = 0; rewardIndex < rewardsGivenCount; rewardIndex++)
        {
            var reward = rewardsGiven[rewardIndex];
            var rewardPath = "RPGQuest.rewardsGiven[" + rewardIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
            if (reward == null)
            {
                unresolved.Add(new { kind = "questReward", sourceFieldPath = rewardPath, detail = "The native quest reward row is null.", questID = questID });
                continue;
            }
            var rewardTypeName = reward.rewardType.ToString();
            if (rewardTypeName == "item" && !hasItem(reward.itemID))
            {
                unresolved.Add(new
                {
                    kind = "questRewardItemReference",
                    sourceFieldPath = rewardPath + ".itemID",
                    detail = "itemID does not resolve in GameDatabase.Items.",
                    questID = questID,
                    itemID = reward.itemID
                });
            }
            if (rewardTypeName == "currency" && !hasCurrency(reward.currencyID))
            {
                unresolved.Add(new
                {
                    kind = "questRewardCurrencyReference",
                    sourceFieldPath = rewardPath + ".currencyID",
                    detail = "currencyID does not resolve in GameDatabase.Currencies.",
                    questID = questID,
                    currencyID = reward.currencyID
                });
            }
            var rewardProjection = new
            {
                questID = questID,
                questName = getEntryName(quest),
                rewardSource = "rewardsGiven",
                rewardIndex = rewardIndex,
                rewardType = reward.rewardType.ToString(),
                rewardTypeValue = (int)reward.rewardType,
                itemID = reward.itemID,
                itemName = getItemName(reward.itemID),
                currencyID = reward.currencyID,
                currencyName = getCurrencyName(reward.currencyID),
                treePointID = reward.treePointID,
                factionID = reward.factionID,
                weaponTemplateID = reward.weaponTemplateID,
                count = reward.count,
                Experience = reward.Experience,
                sourceFieldPath = rewardPath
            };
            rewardOutput.Add(rewardProjection);
            questRewards.Add(rewardProjection);
        }

        var rewardsToPick = quest.rewardsToPick;
        var rewardsToPickCount = rewardsToPick == null ? 0 : rewardsToPick.Count;
        for (var rewardIndex = 0; rewardIndex < rewardsToPickCount; rewardIndex++)
        {
            var reward = rewardsToPick[rewardIndex];
            var rewardPath = "RPGQuest.rewardsToPick[" + rewardIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
            if (reward == null)
            {
                unresolved.Add(new { kind = "questReward", sourceFieldPath = rewardPath, detail = "The native quest selectable reward row is null.", questID = questID });
                continue;
            }
            var rewardTypeName = reward.rewardType.ToString();
            if (rewardTypeName == "item" && !hasItem(reward.itemID))
            {
                unresolved.Add(new
                {
                    kind = "questRewardItemReference",
                    sourceFieldPath = rewardPath + ".itemID",
                    detail = "itemID does not resolve in GameDatabase.Items.",
                    questID = questID,
                    itemID = reward.itemID
                });
            }
            if (rewardTypeName == "currency" && !hasCurrency(reward.currencyID))
            {
                unresolved.Add(new
                {
                    kind = "questRewardCurrencyReference",
                    sourceFieldPath = rewardPath + ".currencyID",
                    detail = "currencyID does not resolve in GameDatabase.Currencies.",
                    questID = questID,
                    currencyID = reward.currencyID
                });
            }
            var rewardProjection = new
            {
                questID = questID,
                questName = getEntryName(quest),
                rewardSource = "rewardsToPick",
                rewardIndex = rewardIndex,
                rewardType = reward.rewardType.ToString(),
                rewardTypeValue = (int)reward.rewardType,
                itemID = reward.itemID,
                itemName = getItemName(reward.itemID),
                currencyID = reward.currencyID,
                currencyName = getCurrencyName(reward.currencyID),
                treePointID = reward.treePointID,
                factionID = reward.factionID,
                weaponTemplateID = reward.weaponTemplateID,
                count = reward.count,
                Experience = reward.Experience,
                sourceFieldPath = rewardPath
            };
            rewardOutput.Add(rewardProjection);
            questRewards.Add(rewardProjection);
        }

        questDefinitions.Add(new
        {
            nativeId = questID,
            dictionaryKey = questPair.Key,
            name = getEntryName(quest),
            internalName = quest.entryName,
            fileName = quest.entryFileName,
            description = quest.entryDescription,
            legacyName = quest._name,
            legacyFileName = quest._fileName,
            legacyDisplayName = quest.displayName,
            legacyDescription = quest.description,
            completedDescription = quest.CompletedDescription,
            objectiveText = quest.ObjectiveText,
            progressText = quest.ProgressText,
            questChainName = quest.QuestChainName,
            questChainOrder = quest.QuestChainOrder,
            repeatable = quest.repeatable,
            canBeTurnedInWithoutNPC = quest.canBeTurnedInWithoutNPC,
            useRequirementsTemplate = quest.UseRequirementsTemplate,
            inlineRequirements = quest.Requirements == null ? null : new
            {
                sourceFieldPath = questRequirementPath,
                nativeGroupCount = questGroupCount,
                groups = projectedQuestGroups
            },
            nativeObjectiveCount = objectiveCount,
            nativeItemGivenCount = itemsGivenCount,
            nativeRewardsGivenCount = rewardsGivenCount,
            nativeRewardsToPickCount = rewardsToPickCount,
            objectives = objectiveOutput,
            itemsGiven = itemGivenOutput,
            rewards = rewardOutput,
            requirementsTemplate = questTemplate,
            sourceFieldPath = questPath
        });
    }
}

var taskDefinitions = new System.Collections.Generic.List<object>();
if (tasks != null)
{
    foreach (var taskPair in tasks)
    {
        var task = taskPair.Value;
        if (task == null)
        {
            unresolved.Add(new { kind = "task", sourceFieldPath = "GameDatabase.Tasks[" + taskPair.Key.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]", detail = "The native task record is null." });
            continue;
        }
        var taskID = task.ID;
        var taskPath = "GameDatabase.Tasks[" + taskPair.Key.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        taskDefinitions.Add(new
        {
            nativeId = taskID,
            dictionaryKey = taskPair.Key,
            name = getEntryName(task),
            internalName = task.entryName,
            fileName = task.entryFileName,
            description = task.entryDescription,
            legacyName = task._name,
            legacyFileName = task._fileName,
            legacyDisplayName = task.displayName,
            legacyDescription = task.description,
            taskType = task.taskType.ToString(),
            taskTypeValue = (int)task.taskType,
            sceneName = task.sceneName,
            abilityToLearnID = task.abilityToLearnID,
            npcToKillID = task.npcToKillID,
            npcToKillName = getNPCName(task.npcToKillID),
            itemToGetID = task.itemToGetID,
            itemToGetName = getItemName(task.itemToGetID),
            keepItems = task.keepItems,
            classRequiredID = task.classRequiredID,
            skillRequiredID = task.skillRequiredID,
            skillRequiredName = getSkillName(task.skillRequiredID),
            itemToUseID = task.itemToUseID,
            itemToUseName = getItemName(task.itemToUseID),
            npcToTalkToID = task.npcToTalkToID,
            npcToTalkToName = getNPCName(task.npcToTalkToID),
            weaponTemplateRequiredID = task.weaponTemplateRequiredID,
            taskValue = task.taskValue,
            NPCFamily = projectEntry(task.NPCFamily),
            sourceFieldPath = taskPath
        });
    }
}

var resourceDefinitions = new System.Collections.Generic.List<object>();
var resourceRanks = new System.Collections.Generic.List<object>();
var resourceYields = new System.Collections.Generic.List<object>();
if (resources != null)
{
    foreach (var resourcePair in resources)
    {
        var resource = resourcePair.Value;
        if (resource == null)
        {
            unresolved.Add(new { kind = "resource", sourceFieldPath = "GameDatabase.Resources[" + resourcePair.Key.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]", detail = "The native resource record is null." });
            continue;
        }

        var resourceID = resource.ID;
        var resourcePath = "GameDatabase.Resources[" + resourcePair.Key.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        var rankOutput = new System.Collections.Generic.List<object>();
        var ranks = resource.ranks;
        var rankCount = ranks == null ? 0 : ranks.Count;
        for (var rankIndex = 0; rankIndex < rankCount; rankIndex++)
        {
            var rank = ranks[rankIndex];
            var rankPath = "RPGResourceNode.ranks[" + rankIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
            if (rank == null)
            {
                unresolved.Add(new { kind = "resourceRank", sourceFieldPath = rankPath, detail = "The native resource rank row is null.", resourceID = resourceID });
                continue;
            }
            if (!hasLootTable(rank.lootTableID))
            {
                unresolved.Add(new
                {
                    kind = "resourceYieldLootReference",
                    sourceFieldPath = rankPath + ".lootTableID",
                    detail = "lootTableID does not resolve in GameDatabase.LootTables.",
                    resourceID = resourceID,
                    lootTableID = rank.lootTableID
                });
            }

            var rankProjection = new
            {
                resourceID = resourceID,
                resourceName = getEntryName(resource),
                rankIndex = rankIndex,
                showedInEditor = rank.ShowedInEditor,
                unlockCost = rank.unlockCost,
                lootTableID = rank.lootTableID,
                lootTableName = getLootTableName(rank.lootTableID),
                skillLevelRequired = rank.skillLevelRequired,
                Experience = rank.Experience,
                distanceMax = rank.distanceMax,
                gatherTime = rank.gatherTime,
                respawnTime = rank.respawnTime,
                sourceFieldPath = rankPath
            };
            rankOutput.Add(rankProjection);
            resourceRanks.Add(rankProjection);
            resourceYields.Add(new
            {
                resourceID = resourceID,
                resourceName = getEntryName(resource),
                rankIndex = rankIndex,
                lootTableID = rank.lootTableID,
                lootTableName = getLootTableName(rank.lootTableID),
                skillLevelRequired = rank.skillLevelRequired,
                sourceFieldPath = rankPath + ".lootTableID",
                yieldSource = "RPGResourceNode rank loot table; inspect linked loot entries and conditions separately"
            });
        }

        resourceDefinitions.Add(new
        {
            nativeId = resourceID,
            dictionaryKey = resourcePair.Key,
            name = getEntryName(resource),
            internalName = resource.entryName,
            fileName = resource.entryFileName,
            displayName = resource.entryDisplayName,
            legacyDisplayName = resource.displayName,
            legacyName = resource._name,
            legacyFileName = resource._fileName,
            learnedByDefault = resource.learnedByDefault,
            skillRequiredID = resource.skillRequiredID,
            skillRequiredName = getSkillName(resource.skillRequiredID),
            nativeRankCount = rankCount,
            ranks = rankOutput,
            sourceFieldPath = resourcePath
        });
    }
}

return new
{
    schemaVersion = "compendium.relationships.v1",
    runtime = new
    {
        game = UnityEngine.Application.productName,
        version = UnityEngine.Application.version,
        unityVersion = UnityEngine.Application.unityVersion,
        activeScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name,
        activeScenePath = UnityEngine.SceneManagement.SceneManager.GetActiveScene().path
    },
    database = new
    {
        available = databaseAvailable,
        itemCount = items == null ? -1 : items.Count,
        npcCount = npcs == null ? -1 : npcs.Count,
        questCount = quests == null ? -1 : quests.Count,
        taskCount = tasks == null ? -1 : tasks.Count,
        lootTableCount = lootTables == null ? -1 : lootTables.Count,
        merchantTableCount = merchantTables == null ? -1 : merchantTables.Count,
        currencyCount = currencies == null ? -1 : currencies.Count,
        resourceCount = resources == null ? -1 : resources.Count,
        skillCount = skills == null ? -1 : skills.Count
    },
    merchantBindings = merchantBindings,
    merchantBindingOwners = merchantBindingOwners,
    merchantTables = merchantTablesOutput,
    merchantStock = merchantStock,
    currencies = currenciesOutput,
    npcLootBindings = npcLootBindings,
    worldLootBindings = worldLootBindings,
    worldLootSettings = worldLootSettings,
    clothDrops = clothDrops,
    lootTables = lootTablesOutput,
    lootEntries = lootEntries,
    dynamicLevelBandGear = dynamicLevelBandGear,
    dynamicLevelBandGearLinks = dynamicLevelBandGearLinks,
    npcQuestBindings = npcQuestBindings,
    quests = questDefinitions,
    tasks = taskDefinitions,
    questObjectives = questObjectives,
    questItemsGiven = questItemsGiven,
    questRewards = questRewards,
    resources = resourceDefinitions,
    resourceRanks = resourceRanks,
    resourceYields = resourceYields,
    requirementsTemplates = requirementTemplates,
    requirementGroups = requirementGroups,
    requirements = requirements,
    unresolved = unresolved,
    nativeFieldUncertainties = nativeFieldUncertainties,
    reconciliation = new
    {
        merchantBindingOwners = merchantBindingOwnerCount,
        merchantBindings = merchantBindingCount,
        merchantStock = merchantStock.Count,
        merchantLegacyNonEmpty = merchantLegacyNonEmptyCount,
        lootTables = lootTablesOutput.Count,
        lootEntries = lootEntries.Count,
        npcLootBindings = npcLootBindingCount,
        dynamicLevelBandGear = dynamicLevelBandGear.Count,
        dynamicLevelBandGearLinks = dynamicLevelBandGearLinks.Count,
        quests = questDefinitions.Count,
        tasks = taskDefinitions.Count,
        npcQuestBindings = questBindingCount,
        questObjectives = questObjectives.Count,
        questItemsGiven = questItemsGiven.Count,
        questRewards = questRewards.Count,
        resources = resourceDefinitions.Count,
        resourceRanks = resourceRanks.Count,
        resourceYields = resourceYields.Count,
        requirementsTemplates = requirementTemplates.Count,
        requirementGroups = requirementGroups.Count,
        requirements = requirements.Count,
        unresolved = unresolved.Count,
        nativeFieldUncertainties = nativeFieldUncertainties.Count,
        currentMerchantBindingsPreservedWhenLegacyIsEmpty = true
    }
};

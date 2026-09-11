var canonicalItems = new System.Collections.Generic.List<object>();
var canonicalNpcs = new System.Collections.Generic.List<object>();
var canonicalQuests = new System.Collections.Generic.List<object>();
var canonicalLootTables = new System.Collections.Generic.List<object>();
var canonicalScenes = new System.Collections.Generic.List<object>();
var canonicalResources = new System.Collections.Generic.List<object>();
var canonicalStats = new System.Collections.Generic.List<object>();
var canonicalRegions = new System.Collections.Generic.List<object>();
var canonicalProperties = new System.Collections.Generic.List<object>();

var database = Il2CppBLINK.RPGBuilder.Managers.GameDatabase.Instance;
var databaseAvailable = database != null;
var databaseError = databaseAvailable ? (string)null : "GameDatabase.Instance returned null.";
var localizationApiAvailable = false;
var localizationLanguage = (string)null;
var localizationLoadedEntryCount = -1;
var localizationError = (string)null;
try
{
    localizationLanguage = Il2Cpp.Localize.CurrentLanguage;
    localizationLoadedEntryCount = Il2Cpp.Localize.LoadedEntryCount;
    localizationApiAvailable = true;
}
catch (System.Exception error)
{
    localizationError = error.GetType().FullName + ": " + error.Message;
}

var items = databaseAvailable ? database.GetItems() : null;
var npcs = databaseAvailable ? database.GetNPCs() : null;
var quests = databaseAvailable ? database.GetQuests() : null;
var lootTables = databaseAvailable ? database.GetLootTables() : null;
var scenes = databaseAvailable ? database.GetGameScenes() : null;
var resources = databaseAvailable ? database.GetResources() : null;
var stats = databaseAvailable ? database.GetStats() : null;
var regions = databaseAvailable ? database.GetRegionTemplates() : null;
var properties = databaseAvailable ? database.GetProperties() : null;

var sourceItemTotal = items == null ? -1 : items.Count;
var sourceNpcTotal = npcs == null ? -1 : npcs.Count;
var sourceQuestTotal = quests == null ? -1 : quests.Count;
var sourceLootTableTotal = lootTables == null ? -1 : lootTables.Count;
var sourceSceneTotal = scenes == null ? -1 : scenes.Count;
var sourceResourceTotal = resources == null ? -1 : resources.Count;
var sourceStatTotal = stats == null ? -1 : stats.Count;
var sourceRegionTotal = regions == null ? -1 : regions.Count;
var sourcePropertyTotal = properties == null ? -1 : properties.Count;

if (items != null)
{
    foreach (var itemPair in items)
    {
        var item = itemPair.Value;
        if (item == null)
        {
            canonicalItems.Add(new { sourceKey = itemPair.Key, nativeId = (int?)null, name = (string)null, internalName = (string)null, description = (string)null, localization = (object)null, icon = new { available = false, reason = "null database record" }, gameplay = (object)null, unavailable = "Database returned a null RPGItem record." });
            continue;
        }

        var itemName = item.entryDisplayName;
        var itemInternalName = item.entryName;
        var itemDescription = item.entryDescription;
        var itemNameKey = "item." + item.ID + ".name";
        var itemDescriptionKey = "item." + item.ID + ".desc";
        var itemDisplayHasKey = localizationApiAvailable && itemNameKey != null && Il2Cpp.Localize.HasKey(itemNameKey);
        var itemDescriptionHasKey = localizationApiAvailable && itemDescriptionKey != null && Il2Cpp.Localize.HasKey(itemDescriptionKey);
        var itemResolvedDisplayName = itemDisplayHasKey ? Il2Cpp.Localize.Get(itemNameKey, itemName) : itemName;
        var itemResolvedDescription = itemDescriptionHasKey ? Il2Cpp.Localize.Get(itemDescriptionKey, itemDescription) : itemDescription;
        var itemIcon = item.entryIcon;
        object itemIconMetadata;
        if (itemIcon == null)
        {
            itemIconMetadata = new { available = false, reason = "no authored Sprite reference" };
        }
        else
        {
            var itemRect = itemIcon.rect;
            var itemTexture = itemIcon.texture;
            itemIconMetadata = new
            {
                available = true,
                name = itemIcon.name,
                rect = new { x = itemRect.x, y = itemRect.y, width = itemRect.width, height = itemRect.height },
                textureName = itemTexture == null ? null : itemTexture.name
            };
        }

        var itemStats = new System.Collections.Generic.List<object>();
        var itemStatsAvailable = item.stats != null;
        if (item.stats != null)
        {
            for (var statIndex = 0; statIndex < item.stats.Count; statIndex++)
            {
                var stat = item.stats[statIndex];
                if (stat == null) { itemStats.Add(new { sourceIndex = statIndex, unavailable = "null ITEM_STATS record" }); continue; }
                itemStats.Add(new { sourceIndex = statIndex, statId = stat.statID, amount = stat.amount, isPercent = stat.isPercent });
            }
        }

        var itemRandomStats = new System.Collections.Generic.List<object>();
        var itemRandomStatsAvailable = item.randomStats != null;
        if (item.randomStats != null)
        {
            for (var randomIndex = 0; randomIndex < item.randomStats.Count; randomIndex++)
            {
                var randomStat = item.randomStats[randomIndex];
                if (randomStat == null) { itemRandomStats.Add(new { sourceIndex = randomIndex, unavailable = "null RandomizedStatData record" }); continue; }
                itemRandomStats.Add(new { sourceIndex = randomIndex, statId = randomStat.statID, minValue = randomStat.minValue, maxValue = randomStat.maxValue, isPercent = randomStat.isPercent, isInt = randomStat.isInt, chance = randomStat.chance });
            }
        }

        var itemSockets = new System.Collections.Generic.List<object>();
        var itemSocketsAvailable = item.sockets != null;
        if (item.sockets != null)
        {
            for (var socketIndex = 0; socketIndex < item.sockets.Count; socketIndex++)
            {
                var socket = item.sockets[socketIndex];
                if (socket == null) { itemSockets.Add(new { sourceIndex = socketIndex, unavailable = "null SOCKETS_DATA record" }); continue; }
                itemSockets.Add(new { sourceIndex = socketIndex, socketType = socket.socketType, gemSocketType = socket.GemSocketType == null ? (object)new { available = false } : new { available = true, nativeId = socket.GemSocketType.ID, name = socket.GemSocketType.entryDisplayName ?? socket.GemSocketType.entryName } });
            }
        }

        var itemActionAbilities = new System.Collections.Generic.List<object>();
        var itemActionAbilitiesAvailable = item.actionAbilities != null;
        if (item.actionAbilities != null)
        {
            for (var actionIndex = 0; actionIndex < item.actionAbilities.Count; actionIndex++)
            {
                var action = item.actionAbilities[actionIndex];
                if (action == null) { itemActionAbilities.Add(new { sourceIndex = actionIndex, unavailable = "null ActionAbilityDATA record" }); continue; }
                itemActionAbilities.Add(new { sourceIndex = actionIndex, keyType = new { value = (int)action.keyType, name = action.keyType.ToString() }, key = action.key.ToString(), actionKeyName = action.actionKeyName, abilityId = action.abilityID });
            }
        }

        canonicalItems.Add(new
        {
            sourceKey = itemPair.Key,
            nativeId = item.ID,
            name = itemResolvedDisplayName,
            internalName = itemInternalName,
            description = itemResolvedDescription,
            localization = new
            {
                apiAvailable = localizationApiAvailable,
                language = localizationLanguage,
                displayNameKey = itemNameKey,
                displayName = itemResolvedDisplayName,
                displayNameResolved = itemDisplayHasKey,
                descriptionKey = itemDescriptionKey,
                description = itemResolvedDescription,
                descriptionResolved = itemDescriptionHasKey,
                authoredInternalName = item._name,
                authoredDisplayName = item.displayName,
                authoredFileName = item._fileName,
                entryName = item.entryName,
                entryDisplayName = item.entryDisplayName,
                entryFileName = item.entryFileName,
                entryDescription = item.entryDescription,
                authoredDescription = item.description
            },
            icon = itemIconMetadata,
            gameplay = new
            {
                itemType = item.ItemType == null ? (object)new { available = false, sourceName = item.itemType } : new { available = true, nativeId = item.ItemType.ID, name = item.ItemType.entryDisplayName ?? item.ItemType.entryName, sourceName = item.itemType, canBeEquipped = item.ItemType.CanBeEquipped },
                armorSlot = item.ArmorSlot == null ? (object)new { available = false, sourceName = item.equipmentSlot } : new { available = true, nativeId = item.ArmorSlot.ID, name = item.ArmorSlot.entryDisplayName ?? item.ArmorSlot.entryName, sourceName = item.equipmentSlot },
                weaponType = item.WeaponType == null ? (object)new { available = false, sourceName = item.weaponType } : new { available = true, nativeId = item.WeaponType.ID, name = item.WeaponType.entryDisplayName ?? item.WeaponType.entryName, sourceName = item.weaponType },
                armorType = item.ArmorType == null ? (object)new { available = false, sourceName = item.armorType } : new { available = true, nativeId = item.ArmorType.ID, name = item.ArmorType.entryDisplayName ?? item.ArmorType.entryName, sourceName = item.armorType },
                weaponSlot = item.WeaponSlot == null ? (object)new { available = false, sourceName = item.slotType } : new { available = true, nativeId = item.WeaponSlot.ID, name = item.WeaponSlot.entryDisplayName ?? item.WeaponSlot.entryName, sourceName = item.slotType },
                rarity = item.ItemRarity == null ? (object)new { available = false, sourceName = item.rarity } : new { available = true, nativeId = item.ItemRarity.ID, name = item.ItemRarity.entryDisplayName ?? item.ItemRarity.entryName, sourceName = item.rarity },
                questDropOnly = item.QuestDropOnly,
                attackSpeed = item.AttackSpeed,
                minDamage = item.minDamage,
                maxDamage = item.maxDamage,
                autoAttackAbilityId = item.autoAttackAbilityID,
                sellPrice = item.sellPrice,
                convertToCurrencyId = item.convertToCurrency,
                sellCurrencyId = item.sellCurrencyID,
                buyPrice = item.buyPrice,
                buyCurrencyId = item.buyCurrencyID,
                stackLimit = item.stackLimit,
                isCorruptionToken = item.IsCorruptionToken,
                dropInWorld = item.dropInWorld,
                durationInWorld = item.durationInWorld,
                worldInteractableLayer = item.worldInteractableLayer,
                enchantmentId = item.enchantmentID,
                isEnchantmentConsumed = item.isEnchantmentConsumed,
                modelName = item.itemModelName,
                weaponModelKey = item.weaponModelKey,
                itemWorldModelKey = item.itemWorldModelKey,
                buildingPrefabKey = item.buildingPrefabKey,
                randomStatsMax = item.randomStatsMax,
                statsAvailable = itemStatsAvailable,
                stats = itemStats,
                randomStatsAvailable = itemRandomStatsAvailable,
                randomStats = itemRandomStats,
                socketsAvailable = itemSocketsAvailable,
                sockets = itemSockets,
                actionAbilitiesAvailable = itemActionAbilitiesAvailable,
                actionAbilities = itemActionAbilities,
                requirementsAvailable = item.Requirements != null,
                requirementsGroupCount = item.Requirements == null ? -1 : item.Requirements.Count,
                useRequirementsTemplate = item.UseRequirementsTemplate,
                requirementsTemplateId = item.RequirementsTemplate == null ? (int?)null : (int?)item.RequirementsTemplate.ID
            }
        });
    }
}

if (npcs != null)
{
    foreach (var npcPair in npcs)
    {
        var npc = npcPair.Value;
        if (npc == null)
        {
            canonicalNpcs.Add(new { sourceKey = npcPair.Key, nativeId = (int?)null, name = (string)null, internalName = (string)null, description = (string)null, localization = (object)null, icon = new { available = false, reason = "null database record" }, gameplay = (object)null, unavailable = "Database returned a null RPGNpc record." });
            continue;
        }

        var npcName = npc.entryDisplayName;
        var npcInternalName = npc.entryName;
        var npcDescription = npc.entryDescription;
        var npcNameKey = "npc." + npc.ID + ".name";
        var npcDescriptionKey = "npc." + npc.ID + ".desc";
        var npcDisplayHasKey = localizationApiAvailable && npcNameKey != null && Il2Cpp.Localize.HasKey(npcNameKey);
        var npcDescriptionHasKey = localizationApiAvailable && npcDescriptionKey != null && Il2Cpp.Localize.HasKey(npcDescriptionKey);
        var npcResolvedDisplayName = npcDisplayHasKey ? Il2Cpp.Localize.Get(npcNameKey, npcName) : npcName;
        var npcResolvedDescription = npcDescriptionHasKey ? Il2Cpp.Localize.Get(npcDescriptionKey, npcDescription) : npcDescription;
        var npcIcon = npc.entryIcon;
        object npcIconMetadata;
        if (npcIcon == null)
        {
            npcIconMetadata = new { available = false, reason = "no authored Sprite reference" };
        }
        else
        {
            var npcRect = npcIcon.rect;
            var npcTexture = npcIcon.texture;
            npcIconMetadata = new
            {
                available = true,
                name = npcIcon.name,
                rect = new { x = npcRect.x, y = npcRect.y, width = npcRect.width, height = npcRect.height },
                textureName = npcTexture == null ? null : npcTexture.name
            };
        }

        var npcLootTables = new System.Collections.Generic.List<object>();
        var npcLootTablesAvailable = npc.lootTables != null;
        if (npc.lootTables != null)
        {
            for (var lootIndex = 0; lootIndex < npc.lootTables.Count; lootIndex++)
            {
                var loot = npc.lootTables[lootIndex];
                if (loot == null) { npcLootTables.Add(new { sourceIndex = lootIndex, unavailable = "null LOOT_TABLES record" }); continue; }
                npcLootTables.Add(new { sourceIndex = lootIndex, lootTableId = loot.lootTableID, dropRate = loot.dropRate });
            }
        }

        var npcAiPhases = new System.Collections.Generic.List<object>();
        if (npc.Phases != null)
        {
            for (var phaseIndex = 0; phaseIndex < npc.Phases.Count; phaseIndex++)
            {
                var phase = npc.Phases[phaseIndex];
                var template = phase == null ? null : phase.PhaseTemplate;
                if (template == null) continue;
                var phaseName = phase.Preset == null
                    ? template.entryDisplayName ?? template.entryName
                    : phase.Preset.entryDisplayName ?? phase.Preset.entryName;
                var requirementTemplate = template.EnterPhaseRequirementsTemplate;
                var requirement = requirementTemplate == null ? null : (requirementTemplate.entryDisplayName ?? requirementTemplate.entryName);
                var abilityIds = new System.Collections.Generic.List<int>();
                if (template.PotentialBehaviors != null)
                {
                    foreach (var potential in template.PotentialBehaviors)
                    {
                        var behavior = potential == null ? null : potential.BehaviorTemplate;
                        if (behavior == null || behavior.PotentialAbilities == null) continue;
                        foreach (var potentialAbilities in behavior.PotentialAbilities)
                        {
                            var abilitiesTemplate = potentialAbilities == null ? null : potentialAbilities.AbilitiesTemplate;
                            if (abilitiesTemplate == null || abilitiesTemplate.Abilities == null) continue;
                            foreach (var ability in abilitiesTemplate.Abilities) if (ability != null && !abilityIds.Contains(ability.abilityID)) abilityIds.Add(ability.abilityID);
                        }

                    }
                }
                npcAiPhases.Add(new { phaseIndex = phaseIndex, name = phaseName, requirement = requirement, abilityIds = abilityIds });
            }
        }
        var npcGuideStatsById = new System.Collections.Generic.Dictionary<int, float>();
        if (npc.stats != null) foreach (var stat in npc.stats) if (stat != null) npcGuideStatsById[stat.statID] = stat.baseValue;
        if (npc.CustomStats != null) foreach (var stat in npc.CustomStats) if (stat != null) npcGuideStatsById[stat.statID] = stat.addedValue;
        if (npc.UseStatListTemplate && npc.StatListTemplate != null && npc.StatListTemplate.CustomStats != null) foreach (var stat in npc.StatListTemplate.CustomStats) if (stat != null) npcGuideStatsById[stat.statID] = stat.addedValue;
        var npcGuideStats = new System.Collections.Generic.List<object>();
        foreach (var stat in npcGuideStatsById) npcGuideStats.Add(new { statId = stat.Key, value = stat.Value });

        var npcMerchantTables = new System.Collections.Generic.List<object>();
        var npcMerchantTablesAvailable = npc.MerchantTables != null;
        if (npc.MerchantTables != null)
        {
            for (var merchantIndex = 0; merchantIndex < npc.MerchantTables.Count; merchantIndex++)
            {
                var merchant = npc.MerchantTables[merchantIndex];
                if (merchant == null) { npcMerchantTables.Add(new { sourceIndex = merchantIndex, unavailable = "null NPCMerchantTable record" }); continue; }
                npcMerchantTables.Add(new { sourceIndex = merchantIndex, merchantTableId = merchant.MerchantTableID, requirementsTemplateId = merchant.RequirementsTemplate == null ? (int?)null : (int?)merchant.RequirementsTemplate.ID });
            }
        }

        var npcGivenQuests = new System.Collections.Generic.List<object>();
        var npcGivenQuestsAvailable = npc.questGiven != null;
        if (npc.questGiven != null)
        {
            for (var questIndex = 0; questIndex < npc.questGiven.Count; questIndex++)
            {
                var quest = npc.questGiven[questIndex];
                if (quest == null) { npcGivenQuests.Add(new { sourceIndex = questIndex, unavailable = "null NPC_QUEST_DATA record" }); continue; }
                npcGivenQuests.Add(new { sourceIndex = questIndex, questId = quest.questID });
            }
        }

        var npcCompletedQuests = new System.Collections.Generic.List<object>();
        var npcCompletedQuestsAvailable = npc.questCompleted != null;
        if (npc.questCompleted != null)
        {
            for (var questIndex = 0; questIndex < npc.questCompleted.Count; questIndex++)
            {
                var quest = npc.questCompleted[questIndex];
                if (quest == null) { npcCompletedQuests.Add(new { sourceIndex = questIndex, unavailable = "null NPC_QUEST_DATA record" }); continue; }
                npcCompletedQuests.Add(new { sourceIndex = questIndex, questId = quest.questID });
            }
        }

        var npcStartItems = new System.Collections.Generic.List<object>();
        var npcStartItemsAvailable = npc.startItems != null;
        if (npc.startItems != null)
        {
            for (var itemIndex = 0; itemIndex < npc.startItems.Count; itemIndex++)
            {
                var startItem = npc.startItems[itemIndex];
                if (startItem == null) { npcStartItems.Add(new { sourceIndex = itemIndex, unavailable = "null StartingItemsDATA record" }); continue; }
                npcStartItems.Add(new { sourceIndex = itemIndex, itemId = startItem.itemID, count = startItem.count, equipped = startItem.equipped });
            }
        }

        canonicalNpcs.Add(new
        {
            sourceKey = npcPair.Key,
            nativeId = npc.ID,
            name = npcResolvedDisplayName,
            internalName = npcInternalName,
            description = npcResolvedDescription,
            localization = new
            {
                apiAvailable = localizationApiAvailable,
                language = localizationLanguage,
                displayNameKey = npcNameKey,
                displayName = npcResolvedDisplayName,
                displayNameResolved = npcDisplayHasKey,
                descriptionKey = npcDescriptionKey,
                description = npcResolvedDescription,
                descriptionResolved = npcDescriptionHasKey,
                authoredInternalName = npc._name,
                authoredDisplayName = npc.displayName,
                authoredFileName = npc._fileName,
                entryName = npc.entryName,
                entryDisplayName = npc.entryDisplayName,
                entryFileName = npc.entryFileName,
                entryDescription = npc.entryDescription,
                factionTitle = npc.factionTitle,
                merchantText = npc.MerchantText,
                questText = npc.QuestText,
                dialogueText = npc.DialogueText,
                inspectText = npc.InspectText,
                tradeText = npc.TradeText,
                inviteText = npc.InviteText
            },
            icon = npcIconMetadata,
            gameplay = new
            {
                npcType = new { value = (int)npc.npcType, name = npc.npcType.ToString() },
                creatureType = new { value = (int)npc.creatureType, name = npc.creatureType.ToString() },
                npcFamily = npc.npcFamily == null ? (object)new { available = false } : new { available = true, nativeId = npc.npcFamily.ID, name = npc.npcFamily.entryDisplayName ?? npc.npcFamily.entryName },
                factionId = npc.factionID,
                speciesId = npc.speciesID,
                merchantTableId = npc.merchantTableID,
                dialogueId = npc.dialogueID,
                minLevel = npc.MinLevel,
                maxLevel = npc.MaxLevel,
                aiPhases = npcAiPhases,
                guideStats = npcGuideStats,
                isScalingWithPlayer = npc.isScalingWithPlayer,
                minExperience = npc.MinEXP,
                maxExperience = npc.MaxEXP,
                experienceBonusPerLevel = npc.EXPBonusPerLevel,
                lowerLevelExperienceModifier = npc.LowerLevelEXPModifier,
                higherLevelExperienceModifier = npc.HigherLevelEXPModifier,
                minRespawn = npc.MinRespawn,
                maxRespawn = npc.MaxRespawn,
                corpseDespawnTime = npc.corpseDespawnTime,
                isCombatEnabled = npc.isCombatEnabled,
                isMovementEnabled = npc.isMovementEnabled,
                isCollisionEnabled = npc.isCollisionEnabled,
                isTargetable = npc.isTargetable,
                isNameplateEnabled = npc.isNameplateEnabled,
                isPlayerInteractable = npc.isPlayerInteractable,
                isMerchant = npc.isMerchant,
                isQuestGiver = npc.isQuestGiver,
                isDialogue = npc.isDialogue,
                isInspectable = npc.isInspectable,
                isTradable = npc.isTradable,
                linkedNpcId = npc.HasLinkedNpc ? (int?)npc.LinkedNpcID : (int?)null,
                hasLinkedNpc = npc.HasLinkedNpc,
                inviteEffectId = npc.InviteEffectID,
                hasLootSpecialization = npc.HasLootSpecialization,
                lootSpecializationArmorType = npc.LootSpecArmorType == null ? (object)new { available = false } : new { available = true, nativeId = npc.LootSpecArmorType.ID, name = npc.LootSpecArmorType.entryDisplayName ?? npc.LootSpecArmorType.entryName },
                lootSpecializationWeaponType = npc.LootSpecWeaponType == null ? (object)new { available = false } : new { available = true, nativeId = npc.LootSpecWeaponType.ID, name = npc.LootSpecWeaponType.entryDisplayName ?? npc.LootSpecWeaponType.entryName },
                lootSpecializationWeaponType2 = npc.LootSpecWeaponType2 == null ? (object)new { available = false } : new { available = true, nativeId = npc.LootSpecWeaponType2.ID, name = npc.LootSpecWeaponType2.entryDisplayName ?? npc.LootSpecWeaponType2.entryName },
                lootSpecializationWeaponType3 = npc.LootSpecWeaponType3 == null ? (object)new { available = false } : new { available = true, nativeId = npc.LootSpecWeaponType3.ID, name = npc.LootSpecWeaponType3.entryDisplayName ?? npc.LootSpecWeaponType3.entryName },
                lootSpecializationStatId = npc.LootSpecStatID,
                useAggroRange = npc.UseAggroRange,
                aggroRange = npc.AggroRange,
                isDummyTarget = npc.isDummyTarget,
                resetPhaseAfterCombat = npc.ResetPhaseAfterCombat,
                instantlyHealAfterCombat = npc.InstantlyHealAfterCombat,
                immuneToStun = npc.IsImmuneToStun,
                immuneToSlow = npc.IsImmuneToSlow,
                lootTablesAvailable = npcLootTablesAvailable,
                lootTables = npcLootTables,
                merchantTablesAvailable = npcMerchantTablesAvailable,
                merchantTables = npcMerchantTables,
                givenQuestsAvailable = npcGivenQuestsAvailable,
                givenQuests = npcGivenQuests,
                completedQuestsAvailable = npcCompletedQuestsAvailable,
                completedQuests = npcCompletedQuests,
                startItemsAvailable = npcStartItemsAvailable,
                startItems = npcStartItems,
                requirementsNote = "NPC requirements are not a direct RPGNpc field; merchant and loot requirements remain in their source records."
            }
        });
    }
}

if (quests != null)
{
    foreach (var questPair in quests)
    {
        var quest = questPair.Value;
        if (quest == null)
        {
            canonicalQuests.Add(new { sourceKey = questPair.Key, nativeId = (int?)null, name = (string)null, internalName = (string)null, description = (string)null, localization = (object)null, icon = new { available = false, reason = "null database record" }, gameplay = (object)null, unavailable = "Database returned a null RPGQuest record." });
            continue;
        }

        var questName = quest.entryDisplayName;
        var questInternalName = quest.entryName;
        var questDescription = quest.entryDescription;
        var questNameKey = "quest." + quest.ID + ".name";
        var questDescriptionKey = "quest." + quest.ID + ".desc";
        var questDisplayHasKey = localizationApiAvailable && questNameKey != null && Il2Cpp.Localize.HasKey(questNameKey);
        var questDescriptionHasKey = localizationApiAvailable && questDescriptionKey != null && Il2Cpp.Localize.HasKey(questDescriptionKey);
        var questResolvedDisplayName = questDisplayHasKey ? Il2Cpp.Localize.Get(questNameKey, questName) : questName;
        var questResolvedDescription = questDescriptionHasKey ? Il2Cpp.Localize.Get(questDescriptionKey, questDescription) : questDescription;
        var questIcon = quest.entryIcon;
        object questIconMetadata;
        if (questIcon == null)
        {
            questIconMetadata = new { available = false, reason = "no authored Sprite reference" };
        }
        else
        {
            var questRect = questIcon.rect;
            var questTexture = questIcon.texture;
            questIconMetadata = new { available = true, name = questIcon.name, rect = new { x = questRect.x, y = questRect.y, width = questRect.width, height = questRect.height }, textureName = questTexture == null ? null : questTexture.name };
        }

        var questItemsGiven = new System.Collections.Generic.List<object>();
        var questItemsGivenAvailable = quest.itemsGiven != null;
        if (quest.itemsGiven != null)
        {
            for (var itemIndex = 0; itemIndex < quest.itemsGiven.Count; itemIndex++)
            {
                var given = quest.itemsGiven[itemIndex];
                if (given == null) { questItemsGiven.Add(new { sourceIndex = itemIndex, unavailable = "null QuestItemsGivenDATA record" }); continue; }
                questItemsGiven.Add(new { sourceIndex = itemIndex, itemId = given.itemID, count = given.count });
            }
        }

        var questObjectives = new System.Collections.Generic.List<object>();
        var questObjectivesAvailable = quest.objectives != null;
        if (quest.objectives != null)
        {
            for (var objectiveIndex = 0; objectiveIndex < quest.objectives.Count; objectiveIndex++)
            {
                var objective = quest.objectives[objectiveIndex];
                if (objective == null) { questObjectives.Add(new { sourceIndex = objectiveIndex, unavailable = "null QuestObjectiveDATA record" }); continue; }
                questObjectives.Add(new { sourceIndex = objectiveIndex, objectiveType = new { value = (int)objective.objectiveType, name = objective.objectiveType.ToString() }, taskId = objective.taskID, timeLimit = objective.timeLimit });
            }
        }

        var questRewardsGiven = new System.Collections.Generic.List<object>();
        var questRewardsGivenAvailable = quest.rewardsGiven != null;
        if (quest.rewardsGiven != null)
        {
            for (var rewardIndex = 0; rewardIndex < quest.rewardsGiven.Count; rewardIndex++)
            {
                var reward = quest.rewardsGiven[rewardIndex];
                if (reward == null) { questRewardsGiven.Add(new { sourceIndex = rewardIndex, unavailable = "null QuestRewardDATA record" }); continue; }
                questRewardsGiven.Add(new { sourceIndex = rewardIndex, rewardType = new { value = (int)reward.rewardType, name = reward.rewardType.ToString() }, itemId = reward.itemID, currencyId = reward.currencyID, treePointId = reward.treePointID, factionId = reward.factionID, weaponTemplateId = reward.weaponTemplateID, count = reward.count, experience = reward.Experience });
            }
        }

        var questRewardsToPick = new System.Collections.Generic.List<object>();
        var questRewardsToPickAvailable = quest.rewardsToPick != null;
        if (quest.rewardsToPick != null)
        {
            for (var rewardIndex = 0; rewardIndex < quest.rewardsToPick.Count; rewardIndex++)
            {
                var reward = quest.rewardsToPick[rewardIndex];
                if (reward == null) { questRewardsToPick.Add(new { sourceIndex = rewardIndex, unavailable = "null QuestRewardDATA record" }); continue; }
                questRewardsToPick.Add(new { sourceIndex = rewardIndex, rewardType = new { value = (int)reward.rewardType, name = reward.rewardType.ToString() }, itemId = reward.itemID, currencyId = reward.currencyID, treePointId = reward.treePointID, factionId = reward.factionID, weaponTemplateId = reward.weaponTemplateID, count = reward.count, experience = reward.Experience });
            }
        }

        canonicalQuests.Add(new
        {
            sourceKey = questPair.Key,
            nativeId = quest.ID,
            name = questResolvedDisplayName,
            internalName = questInternalName,
            description = questResolvedDescription,
            localization = new { apiAvailable = localizationApiAvailable, language = localizationLanguage, displayNameKey = questNameKey, displayName = questResolvedDisplayName, displayNameResolved = questDisplayHasKey, descriptionKey = questDescriptionKey, description = questResolvedDescription, descriptionResolved = questDescriptionHasKey, authoredInternalName = quest._name, authoredDisplayName = quest.displayName, authoredFileName = quest._fileName, entryName = quest.entryName, entryDisplayName = quest.entryDisplayName, entryFileName = quest.entryFileName, entryDescription = quest.entryDescription, authoredDescription = quest.description, completedDescription = quest.CompletedDescription, objectiveText = quest.ObjectiveText, progressText = quest.ProgressText, questChainName = quest.QuestChainName },
            icon = questIconMetadata,
            gameplay = new
            {
                questChainOrder = quest.QuestChainOrder,
                repeatable = quest.repeatable,
                canBeTurnedInWithoutNpc = quest.canBeTurnedInWithoutNPC,
                questItemsGivenAvailable = questItemsGivenAvailable,
                itemsGiven = questItemsGiven,
                objectivesAvailable = questObjectivesAvailable,
                objectives = questObjectives,
                rewardsGivenAvailable = questRewardsGivenAvailable,
                rewardsGiven = questRewardsGiven,
                rewardsToPickAvailable = questRewardsToPickAvailable,
                rewardsToPick = questRewardsToPick,
                requirementsAvailable = quest.Requirements != null,
                requirementsGroupCount = quest.Requirements == null ? -1 : quest.Requirements.Count,
                useRequirementsTemplate = quest.UseRequirementsTemplate,
                requirementsTemplateId = quest.RequirementsTemplate == null ? (int?)null : (int?)quest.RequirementsTemplate.ID
            }
        });
    }
}

if (lootTables != null)
{
    foreach (var lootTablePair in lootTables)
    {
        var lootTable = lootTablePair.Value;
        if (lootTable == null)
        {
            canonicalLootTables.Add(new { sourceKey = lootTablePair.Key, nativeId = (int?)null, name = (string)null, internalName = (string)null, description = (string)null, localization = (object)null, icon = new { available = false, reason = "null database record" }, gameplay = (object)null, unavailable = "Database returned a null RPGLootTable record." });
            continue;
        }

        var lootName = string.IsNullOrEmpty(lootTable.entryDisplayName) ? lootTable.entryName : lootTable.entryDisplayName;
        var lootInternalName = lootTable.entryName;
        var lootDescription = lootTable.entryDescription;
        var lootNameKey = (string)null;
        var lootDescriptionKey = (string)null;
        var lootDisplayHasKey = localizationApiAvailable && lootNameKey != null && Il2Cpp.Localize.HasKey(lootNameKey);
        var lootDescriptionHasKey = localizationApiAvailable && lootDescriptionKey != null && Il2Cpp.Localize.HasKey(lootDescriptionKey);
        var lootResolvedDisplayName = lootDisplayHasKey ? Il2Cpp.Localize.Get(lootNameKey, lootName) : lootName;
        var lootResolvedDescription = lootDescriptionHasKey ? Il2Cpp.Localize.Get(lootDescriptionKey, lootDescription) : lootDescription;
        var lootIcon = lootTable.entryIcon;
        object lootIconMetadata;
        if (lootIcon == null)
        {
            lootIconMetadata = new { available = false, reason = "no authored Sprite reference" };
        }
        else
        {
            var lootRect = lootIcon.rect;
            var lootTexture = lootIcon.texture;
            lootIconMetadata = new { available = true, name = lootIcon.name, rect = new { x = lootRect.x, y = lootRect.y, width = lootRect.width, height = lootRect.height }, textureName = lootTexture == null ? null : lootTexture.name };
        }

        var lootEntries = new System.Collections.Generic.List<object>();
        var lootEntriesAvailable = lootTable.lootItems != null;
        if (lootTable.lootItems != null)
        {
            for (var entryIndex = 0; entryIndex < lootTable.lootItems.Count; entryIndex++)
            {
                var entry = lootTable.lootItems[entryIndex];
                if (entry == null) { lootEntries.Add(new { sourceIndex = entryIndex, unavailable = "null LOOT_ITEMS record" }); continue; }
                lootEntries.Add(new { sourceIndex = entryIndex, itemId = entry.itemID, min = entry.min, max = entry.max, dropRate = entry.dropRate });
            }
        }

        canonicalLootTables.Add(new
        {
            sourceKey = lootTablePair.Key,
            nativeId = lootTable.ID,
            name = lootResolvedDisplayName,
            internalName = lootInternalName,
            description = lootResolvedDescription,
            localization = new { apiAvailable = localizationApiAvailable, language = localizationLanguage, displayNameKey = lootNameKey, displayName = lootResolvedDisplayName, displayNameResolved = lootDisplayHasKey, descriptionKey = lootDescriptionKey, description = lootResolvedDescription, descriptionResolved = lootDescriptionHasKey, authoredInternalName = lootTable._name, authoredFileName = lootTable._fileName, entryName = lootTable.entryName, entryDisplayName = lootTable.entryDisplayName, entryFileName = lootTable.entryFileName, entryDescription = lootTable.entryDescription },
            icon = lootIconMetadata,
            gameplay = new
            {
                entriesAvailable = lootEntriesAvailable,
                entries = lootEntries,
                limitDroppedItems = lootTable.LimitDroppedItems,
                maxDroppedItems = lootTable.maxDroppedItems,
                hasMinimumDrops = lootTable.HasMinimumDrops,
                minDroppedItems = lootTable.minDroppedItems,
                levelBandGear = lootTable.LevelBandGear,
                requirementsAvailable = lootTable.Requirements != null,
                requirementsGroupCount = lootTable.Requirements == null ? -1 : lootTable.Requirements.Count,
                useRequirementsTemplate = lootTable.UseRequirementsTemplate,
                requirementsTemplateId = lootTable.RequirementsTemplate == null ? (int?)null : (int?)lootTable.RequirementsTemplate.ID,
                probabilitySemantics = "dropRate is preserved as authored. Effective drop probability is not inferred."
            }
        });
    }
}

if (scenes != null)
{
    foreach (var scenePair in scenes)
    {
        var scene = scenePair.Value;
        if (scene == null)
        {
            canonicalScenes.Add(new { sourceKey = scenePair.Key, nativeId = (int?)null, name = (string)null, internalName = (string)null, description = (string)null, localization = (object)null, icon = new { available = false, reason = "null database record" }, gameplay = (object)null, unavailable = "Database returned a null RPGGameScene record." });
            continue;
        }

        var sceneName = scene.entryDisplayName;
        var sceneInternalName = scene.entryName;
        var sceneDescription = scene.entryDescription;
        var sceneNameKey = "gamescene." + scene.ID + ".name";
        var sceneDescriptionKey = "gamescene." + scene.ID + ".desc";
        var sceneDisplayHasKey = localizationApiAvailable && sceneNameKey != null && Il2Cpp.Localize.HasKey(sceneNameKey);
        var sceneDescriptionHasKey = localizationApiAvailable && sceneDescriptionKey != null && Il2Cpp.Localize.HasKey(sceneDescriptionKey);
        var sceneResolvedDisplayName = sceneDisplayHasKey ? Il2Cpp.Localize.Get(sceneNameKey, sceneName) : sceneName;
        var sceneResolvedDescription = sceneDescriptionHasKey ? Il2Cpp.Localize.Get(sceneDescriptionKey, sceneDescription) : sceneDescription;
        var sceneIcon = scene.entryIcon;
        object sceneIconMetadata;
        if (sceneIcon == null)
        {
            sceneIconMetadata = new { available = false, reason = "no authored Sprite reference" };
        }
        else
        {
            var sceneRect = sceneIcon.rect;
            var sceneTexture = sceneIcon.texture;
            sceneIconMetadata = new { available = true, name = sceneIcon.name, rect = new { x = sceneRect.x, y = sceneRect.y, width = sceneRect.width, height = sceneRect.height }, textureName = sceneTexture == null ? null : sceneTexture.name };
        }

        var sceneBosses = new System.Collections.Generic.List<object>();
        var sceneBossesAvailable = scene.adventureGuideBosses != null;
        if (scene.adventureGuideBosses != null)
        {
            for (var bossIndex = 0; bossIndex < scene.adventureGuideBosses.Count; bossIndex++)
            {
                var boss = scene.adventureGuideBosses[bossIndex];
                if (boss == null) { sceneBosses.Add(new { sourceIndex = bossIndex, unavailable = "null ADVENTURE_GUIDE_BOSS record" }); continue; }
                sceneBosses.Add(new { sourceIndex = bossIndex, npcId = boss.npcID });
            }
        }

        var sceneRegions = new System.Collections.Generic.List<object>();
        var sceneRegionsAvailable = scene.regions != null;
        if (scene.regions != null)
        {
            for (var regionIndex = 0; regionIndex < scene.regions.Count; regionIndex++)
            {
                var region = scene.regions[regionIndex];
                if (region == null) { sceneRegions.Add(new { sourceIndex = regionIndex, unavailable = "null REGION_DATA record" }); continue; }
                sceneRegions.Add(new { sourceIndex = regionIndex, regionName = region.regionName, showInEditor = region.showInEditor, fogEnabled = region.fogEnabled, lightEnabled = region.lightEnabled, combatEnabled = region.combatEnabled, inCombat = region.inCombat, welcomeMessageText = region.welcomeMessageText, welcomeMessageDuration = region.welcomeMessageDuration });
            }
        }

        var sceneBounds = scene.mapBounds;
        canonicalScenes.Add(new
        {
            sourceKey = scenePair.Key,
            nativeId = scene.ID,
            name = sceneResolvedDisplayName,
            internalName = sceneInternalName,
            description = sceneResolvedDescription,
            localization = new { apiAvailable = localizationApiAvailable, language = localizationLanguage, displayNameKey = sceneNameKey, displayName = sceneResolvedDisplayName, displayNameResolved = sceneDisplayHasKey, descriptionKey = sceneDescriptionKey, description = sceneResolvedDescription, descriptionResolved = sceneDescriptionHasKey, authoredInternalName = scene._name, authoredFileName = scene._fileName, authoredDisplayName = scene.displayName, entryName = scene.entryName, entryDisplayName = scene.entryDisplayName, entryFileName = scene.entryFileName, entryDescription = scene.entryDescription, loadingBackgroundKey = scene.loadingBGKey, minimapImageKey = scene.minimapImageKey, adventureGuideDescription = scene.adventureGuideDescription, adventureGuideImageKey = scene.adventureGuideImageKey },
            icon = sceneIconMetadata,
            gameplay = new
            {
                mapBounds = new { center = new { x = sceneBounds.center.x, y = sceneBounds.center.y, z = sceneBounds.center.z }, size = new { x = sceneBounds.size.x, y = sceneBounds.size.y, z = sceneBounds.size.z }, min = new { x = sceneBounds.min.x, y = sceneBounds.min.y, z = sceneBounds.min.z }, max = new { x = sceneBounds.max.x, y = sceneBounds.max.y, z = sceneBounds.max.z } },
                mapSize = new { x = scene.mapSize.x, y = scene.mapSize.y },
                startPositionId = scene.startPositionID,
                isProceduralScene = scene.isProceduralScene,
                spawnPointName = scene.SpawnPointName,
                alwaysSpawnAtPoint = scene.AlwaysSpawnAtPoint,
                includedInAdventureGuide = scene.includedInAdventureGuide,
                dungeonLevelMin = scene.DungeonLevelMin,
                dungeonLevelMax = scene.DungeonLevelMax,
                zoneScalingMinLevel = scene.ZoneScalingMinLevel,
                zoneScalingMaxLevel = scene.ZoneScalingMaxLevel,
                defaultRegionAvailable = scene.DefaultRegion != null,
                defaultRegionName = scene.DefaultRegion == null ? null : scene.DefaultRegion.name,
                adventureGuideBossesAvailable = sceneBossesAvailable,
                adventureGuideBosses = sceneBosses,
                regionsAvailable = sceneRegionsAvailable,
                regions = sceneRegions
            }
        });
    }
}

if (resources != null)
{
    foreach (var resourcePair in resources)
    {
        var resource = resourcePair.Value;
        if (resource == null)
        {
            canonicalResources.Add(new { sourceKey = resourcePair.Key, nativeId = (int?)null, name = (string)null, internalName = (string)null, description = (string)null, localization = (object)null, icon = new { available = false, reason = "null database record" }, gameplay = (object)null, unavailable = "Database returned a null RPGResourceNode record." });
            continue;
        }

        var resourceName = resource.entryDisplayName;
        var resourceInternalName = resource.entryName;
        var resourceDescription = resource.entryDescription;
        var resourceNameKey = (string)null;
        var resourceDescriptionKey = (string)null;
        var resourceDisplayHasKey = localizationApiAvailable && resourceNameKey != null && Il2Cpp.Localize.HasKey(resourceNameKey);
        var resourceDescriptionHasKey = localizationApiAvailable && resourceDescriptionKey != null && Il2Cpp.Localize.HasKey(resourceDescriptionKey);
        var resourceResolvedDisplayName = resourceDisplayHasKey ? Il2Cpp.Localize.Get(resourceNameKey, resourceName) : resourceName;
        var resourceResolvedDescription = resourceDescriptionHasKey ? Il2Cpp.Localize.Get(resourceDescriptionKey, resourceDescription) : resourceDescription;
        var resourceIcon = resource.entryIcon;
        object resourceIconMetadata;
        if (resourceIcon == null)
        {
            resourceIconMetadata = new { available = false, reason = "no authored Sprite reference" };
        }
        else
        {
            var resourceRect = resourceIcon.rect;
            var resourceTexture = resourceIcon.texture;
            resourceIconMetadata = new { available = true, name = resourceIcon.name, rect = new { x = resourceRect.x, y = resourceRect.y, width = resourceRect.width, height = resourceRect.height }, textureName = resourceTexture == null ? null : resourceTexture.name };
        }

        var resourceRanks = new System.Collections.Generic.List<object>();
        var resourceRanksAvailable = resource.ranks != null;
        if (resource.ranks != null)
        {
            for (var rankIndex = 0; rankIndex < resource.ranks.Count; rankIndex++)
            {
                var rank = resource.ranks[rankIndex];
                if (rank == null) { resourceRanks.Add(new { sourceIndex = rankIndex, unavailable = "null RPGResourceNodeRankData record" }); continue; }
                resourceRanks.Add(new { sourceIndex = rankIndex, showedInEditor = rank.ShowedInEditor, unlockCost = rank.unlockCost, lootTableId = rank.lootTableID, skillLevelRequired = rank.skillLevelRequired, experience = rank.Experience, distanceMax = rank.distanceMax, gatherTime = rank.gatherTime, respawnTime = rank.respawnTime });
            }
        }

        canonicalResources.Add(new
        {
            sourceKey = resourcePair.Key,
            nativeId = resource.ID,
            name = resourceResolvedDisplayName,
            internalName = resourceInternalName,
            description = resourceResolvedDescription,
            localization = new { apiAvailable = localizationApiAvailable, language = localizationLanguage, displayNameKey = resourceNameKey, displayName = resourceResolvedDisplayName, displayNameResolved = resourceDisplayHasKey, descriptionKey = resourceDescriptionKey, description = resourceResolvedDescription, descriptionResolved = resourceDescriptionHasKey, authoredInternalName = resource._name, authoredFileName = resource._fileName, authoredDisplayName = resource.displayName, entryName = resource.entryName, entryDisplayName = resource.entryDisplayName, entryFileName = resource.entryFileName, entryDescription = resource.entryDescription },
            icon = resourceIconMetadata,
            gameplay = new
            {
                learnedByDefault = resource.learnedByDefault,
                skillRequiredId = resource.skillRequiredID,
                ranksAvailable = resourceRanksAvailable,
                ranks = resourceRanks
            }
        });
    }
}

if (stats != null)
{
    foreach (var statPair in stats)
    {
        var stat = statPair.Value;
        if (stat == null) continue;
        var statName = stat.entryDisplayName;
        var statDescription = stat.entryDescription;
        var statNameKey = "stat." + stat.ID + ".name";
        var statDescriptionKey = "stat." + stat.ID + ".desc";
        var statNameResolved = localizationApiAvailable && Il2Cpp.Localize.HasKey(statNameKey);
        var statDescriptionResolved = localizationApiAvailable && Il2Cpp.Localize.HasKey(statDescriptionKey);
        var statDisplayName = statNameResolved ? Il2Cpp.Localize.Get(statNameKey, statName) : statName;
        var statDisplayDescription = statDescriptionResolved ? Il2Cpp.Localize.Get(statDescriptionKey, statDescription) : statDescription;
        var statIcon = stat.entryIcon;
        object statIconMetadata;
        if (statIcon == null)
        {
            statIconMetadata = new { available = false, reason = "no authored Sprite reference" };
        }
        else
        {
            var statRect = statIcon.rect;
            var statTexture = statIcon.texture;
            statIconMetadata = new { available = true, name = statIcon.name, rect = new { x = statRect.x, y = statRect.y, width = statRect.width, height = statRect.height }, textureName = statTexture == null ? null : statTexture.name };
        }
        canonicalStats.Add(new
        {
            sourceKey = statPair.Key,
            nativeId = stat.ID,
            name = statDisplayName,
            internalName = stat.entryName,
            description = statDisplayDescription,
            localization = new { apiAvailable = localizationApiAvailable, language = localizationLanguage, displayNameKey = statNameKey, displayName = statDisplayName, displayNameResolved = statNameResolved, descriptionKey = statDescriptionKey, description = statDisplayDescription, descriptionResolved = statDescriptionResolved, authoredInternalName = stat._name, authoredFileName = stat._fileName, authoredDisplayName = stat.displayName, entryName = stat.entryName, entryDisplayName = stat.entryDisplayName, entryFileName = stat.entryFileName, entryDescription = stat.entryDescription },
            icon = statIconMetadata,
            gameplay = new { isPercentStat = stat.isPercentStat, isVitalityStat = stat.isVitalityStat, baseValue = stat.baseValue }
        });
    }
}

// RegionTemplate records use string dictionary keys while runtime IDs are -1 in this build.
// They remain observed but unpublished until the identity contract supports that key.

if (properties != null)
{
    foreach (var propertyPair in properties)
    {
        var property = propertyPair.Value;
        if (property == null) continue;
        var propertyName = property.entryDisplayName ?? property.entryName;
        var propertyImage = property.propertyImage;
        object propertyIconMetadata;
        if (propertyImage == null) propertyIconMetadata = new { available = false, reason = "no authored Sprite reference" };
        else { var rect = propertyImage.rect; var texture = propertyImage.texture; propertyIconMetadata = new { available = true, name = propertyImage.name, rect = new { x = rect.x, y = rect.y, width = rect.width, height = rect.height }, textureName = texture == null ? null : texture.name }; }
        canonicalProperties.Add(new { sourceKey = propertyPair.Key, nativeId = property.ID, name = propertyName, internalName = property.entryName, description = property.entryDescription, localization = new { displayName = propertyName, description = property.entryDescription }, icon = propertyIconMetadata, gameplay = new { income = property.incomeAmount } });
    }
}

return new
{
    schemaVersion = "compendium.canonical.v3",
    databaseAvailable = databaseAvailable,
    databaseError = databaseError,
    localization = new
    {
        apiAvailable = localizationApiAvailable,
        language = localizationLanguage,
        loadedEntryCount = localizationLoadedEntryCount,
        error = localizationError,
        note = localizationApiAvailable ? "Resolved values use Il2Cpp.Localize.Get(key, fallback); authored keys remain in each record." : "The concrete localization API was unavailable; raw authored values remain unresolved."
    },
    sourceTotals = new
    {
        items = sourceItemTotal,
        npcs = sourceNpcTotal,
        quests = sourceQuestTotal,
        lootTables = sourceLootTableTotal,
        scenes = sourceSceneTotal,
        resources = sourceResourceTotal,
        stats = sourceStatTotal,
        regions = sourceRegionTotal,
        properties = sourcePropertyTotal
    },
    exportedTotals = new
    {
        items = canonicalItems.Count,
        npcs = canonicalNpcs.Count,
        quests = canonicalQuests.Count,
        lootTables = canonicalLootTables.Count,
        scenes = canonicalScenes.Count,
        resources = canonicalResources.Count,
        stats = canonicalStats.Count,
        regions = canonicalRegions.Count,
        properties = canonicalProperties.Count
    },
    guideCoverage = new { regionsObserved = regions == null ? 0 : regions.Count, regionsExported = canonicalRegions.Count, regionsOmittedReason = "RegionTemplate runtime IDs are -1; the dictionary key is a string and is outside the integer identity contract." },
    items = canonicalItems,
    npcs = canonicalNpcs,
    quests = canonicalQuests,
    lootTables = canonicalLootTables,
    scenes = canonicalScenes,
    resources = canonicalResources,
    stats = canonicalStats,
    regions = canonicalRegions,
    properties = canonicalProperties
};

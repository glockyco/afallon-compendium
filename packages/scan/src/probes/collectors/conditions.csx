var unresolved = new System.Collections.Generic.List<object>();

var getEntryName = new System.Func<Il2Cpp.RPGBuilderDatabaseEntry, string>(entry =>
{
    if (entry == null)
    {
        return null;
    }

    if (entry.entryDisplayName != null && entry.entryDisplayName.Length > 0)
    {
        return entry.entryDisplayName;
    }
    if (entry.entryName != null && entry.entryName.Length > 0)
    {
        return entry.entryName;
    }
    if (entry.entryFileName != null && entry.entryFileName.Length > 0)
    {
        return entry.entryFileName;
    }
    return entry.name;
});

var projectEntry = new System.Func<Il2Cpp.RPGBuilderDatabaseEntry, object>(entry =>
{
    if (entry == null)
    {
        return null;
    }

    return new
    {
        nativeId = entry.ID,
        name = getEntryName(entry),
        internalName = entry.entryName,
        fileName = entry.entryFileName,
        description = entry.entryDescription,
        nativeType = entry.GetType().FullName,
        text = entry.ToString()
    };
});

var projectObject = new System.Func<object, object>(value =>
{
    if (value == null)
    {
        return null;
    }

    return new
    {
        nativeType = value.GetType().FullName,
        text = value.ToString()
    };
});

var projectTimeRequirement = new System.Func<Il2Cpp.RequirementsData.TimeRequirement, object>(time =>
{
    if (time == null)
    {
        return null;
    }

    return new
    {
        checkYear = time.CheckYear,
        checkMonth = time.CheckMonth,
        checkWeek = time.CheckWeek,
        checkDay = time.CheckDay,
        checkHour = time.CheckHour,
        checkMinute = time.CheckMinute,
        checkSecond = time.CheckSecond,
        checkGlobalSpeed = time.CheckGlobalSpeed,
        year = time.Year,
        month = time.Month,
        week = time.Week,
        day = time.Day,
        hour = time.Hour,
        minute = time.Minute,
        second = time.Second,
        globalSpeed = time.GlobalSpeed
    };
});

var isKnownRequirementType = new System.Func<string, bool>(typeName =>
{
    return typeName == "Ability" ||
        typeName == "Bonus" ||
        typeName == "Recipe" ||
        typeName == "Resource" ||
        typeName == "Effect" ||
        typeName == "NPCKilled" ||
        typeName == "NPCFamily" ||
        typeName == "Stat" ||
        typeName == "StatCost" ||
        typeName == "Faction" ||
        typeName == "FactionStance" ||
        typeName == "Combo" ||
        typeName == "Race" ||
        typeName == "Level" ||
        typeName == "Gender" ||
        typeName == "Class" ||
        typeName == "Species" ||
        typeName == "Item" ||
        typeName == "Currency" ||
        typeName == "Point" ||
        typeName == "TalentTree" ||
        typeName == "Skill" ||
        typeName == "Spellbook" ||
        typeName == "WeaponTemplate" ||
        typeName == "Enchantment" ||
        typeName == "GearSet" ||
        typeName == "GameScene" ||
        typeName == "Quest" ||
        typeName == "DialogueNode" ||
        typeName == "Region" ||
        typeName == "CombatState" ||
        typeName == "Stealth" ||
        typeName == "Mounted" ||
        typeName == "Grounded" ||
        typeName == "Time";
});

var projectRequirement = new System.Func<Il2Cpp.RequirementsData.Requirement, string, int, int, object>((requirement, sourceFieldPath, groupIndex, requirementIndex) =>
{
    if (requirement == null)
    {
        unresolved.Add(new
        {
            kind = "requirement",
            sourceFieldPath = sourceFieldPath,
            detail = "The native requirement row is null."
        });
        return null;
    }

    var typeName = requirement.type.ToString();
    var conditionName = requirement.condition.ToString();
    if (!isKnownRequirementType(typeName))
    {
        unresolved.Add(new
        {
            kind = "requirementType",
            sourceFieldPath = sourceFieldPath,
            detail = "Unknown requirement type value " + ((int)requirement.type).ToString(System.Globalization.CultureInfo.InvariantCulture) + ". All native fields are retained."
        });
    }

    return new
    {
        sourceFieldPath = sourceFieldPath,
        groupIndex = groupIndex,
        requirementIndex = requirementIndex,
        requirementType = typeName,
        requirementTypeValue = (int)requirement.type,
        conditionRule = conditionName,
        conditionRuleValue = (int)requirement.condition,
        evaluation = "typed predicate retained; not evaluated against the research character",
        abilityID = requirement.AbilityID,
        bonusID = requirement.BonusID,
        recipeID = requirement.RecipeID,
        resourceID = requirement.ResourceID,
        effectID = requirement.EffectID,
        NPCID = requirement.NPCID,
        statID = requirement.StatID,
        factionID = requirement.FactionID,
        comboID = requirement.ComboID,
        raceID = requirement.RaceID,
        levelsID = requirement.LevelsID,
        classID = requirement.ClassID,
        speciesID = requirement.SpeciesID,
        itemID = requirement.ItemID,
        currencyID = requirement.CurrencyID,
        pointID = requirement.PointID,
        talentTreeID = requirement.TalentTreeID,
        skillID = requirement.SkillID,
        spellbookID = requirement.SpellbookID,
        weaponTemplateID = requirement.WeaponTemplateID,
        enchantmentID = requirement.EnchantmentID,
        gearSetID = requirement.GearSetID,
        gameSceneID = requirement.GameSceneID,
        questID = requirement.QuestID,
        dialogueID = requirement.DialogueID,
        knowledge = new { value = (int)requirement.Knowledge, name = requirement.Knowledge.ToString() },
        state = new { value = (int)requirement.State, name = requirement.State.ToString() },
        comparison = new { value = (int)requirement.Comparison, name = requirement.Comparison.ToString() },
        value = new { value = (int)requirement.Value, name = requirement.Value.ToString() },
        ownership = new { value = (int)requirement.Ownership, name = requirement.Ownership.ToString() },
        itemCondition = new { value = (int)requirement.ItemCondition, name = requirement.ItemCondition.ToString() },
        progression = new { value = (int)requirement.Progression, name = requirement.Progression.ToString() },
        entity = new { value = (int)requirement.Entity, name = requirement.Entity.ToString() },
        pointType = new { value = (int)requirement.PointType, name = requirement.PointType.ToString() },
        dialogueNodeState = new { value = (int)requirement.DialogueNodeState, name = requirement.DialogueNodeState.ToString() },
        effectCondition = new { value = (int)requirement.EffectCondition, name = requirement.EffectCondition.ToString() },
        amountType = new { value = (int)requirement.AmountType, name = requirement.AmountType.ToString() },
        timeType = new { value = (int)requirement.TimeType, name = requirement.TimeType.ToString() },
        timeValue = new { value = (int)requirement.TimeValue, name = requirement.TimeValue.ToString() },
        amount1 = requirement.Amount1,
        amount2 = requirement.Amount2,
        float1 = requirement.Float1,
        consume = requirement.Consume,
        boolBalue1 = requirement.BoolBalue1,
        boolBalue2 = requirement.BoolBalue2,
        boolBalue3 = requirement.BoolBalue3,
        isPercent = requirement.IsPercent,
        effectTag = projectEntry(requirement.EffectTag),
        effectType = new { value = (int)requirement.EffectType, name = requirement.EffectType.ToString() },
        factionStance = projectEntry(requirement.FactionStance),
        itemType = projectEntry(requirement.ItemType),
        weaponType = projectEntry(requirement.WeaponType),
        weaponSlot = projectEntry(requirement.WeaponSlot),
        armorType = projectEntry(requirement.ArmorType),
        armorSlot = projectEntry(requirement.ArmorSlot),
        gender = projectEntry(requirement.Gender),
        questState = new { value = (int)requirement.QuestState, name = requirement.QuestState.ToString() },
        dialogueNode = projectObject(requirement.DialogueNode),
        NPCFamily = projectEntry(requirement.NPCFamily),
        region = projectEntry(requirement.Region),
        timeRequirement1 = projectTimeRequirement(requirement.TimeRequirement1),
        timeRequirement2 = projectTimeRequirement(requirement.TimeRequirement2)
    };
});

var projectGroup = new System.Func<Il2Cpp.RequirementsData.RequirementGroup, string, int, object>((group, sourceFieldPath, groupIndex) =>
{
    if (group == null)
    {
        unresolved.Add(new
        {
            kind = "requirementGroup",
            sourceFieldPath = sourceFieldPath,
            detail = "The native requirement group row is null."
        });
        return null;
    }

    var projectedRequirements = new System.Collections.Generic.List<object>();
    var nativeRequirements = group.Requirements;
    var nativeRequirementCount = nativeRequirements == null ? 0 : nativeRequirements.Count;
    for (var requirementIndex = 0; requirementIndex < nativeRequirementCount; requirementIndex++)
    {
        projectedRequirements.Add(projectRequirement(nativeRequirements[requirementIndex], sourceFieldPath + ".Requirements[" + requirementIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]", groupIndex, requirementIndex));
    }

    return new
    {
        sourceFieldPath = sourceFieldPath,
        groupIndex = groupIndex,
        checkCount = group.checkCount,
        requiredCount = group.requiredCount,
        nativeRequirementCount = nativeRequirementCount,
        requirements = projectedRequirements
    };
});

var requirementTemplates = new System.Collections.Generic.List<object>();
var seenRequirementTemplates = new System.Collections.Generic.HashSet<System.IntPtr>();
var projectTemplate = new System.Func<Il2CppBLINK.RPGBuilder.Templates.RequirementsTemplate, string, object>((template, sourceFieldPath) =>
{
    if (template == null)
    {
        return null;
    }

    var projectedGroups = new System.Collections.Generic.List<object>();
    var nativeGroups = template.Requirements;
    var nativeGroupCount = nativeGroups == null ? 0 : nativeGroups.Count;
    for (var groupIndex = 0; groupIndex < nativeGroupCount; groupIndex++)
    {
        projectedGroups.Add(projectGroup(nativeGroups[groupIndex], sourceFieldPath + ".Requirements[" + groupIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]", groupIndex));
    }

    if (seenRequirementTemplates.Add(template.Pointer))
    {
        requirementTemplates.Add(new
        {
            nativeId = template.ID, sourceName = template.name,
            name = getEntryName(template),
            internalName = template.entryName,
            fileName = template.entryFileName,
            description = template.entryDescription,
            nativeType = template.GetType().FullName,
            nativeGroupCount = nativeGroupCount,
            groups = projectedGroups,
            sourceFieldPath = sourceFieldPath
        });
    }

    return new
    {
        nativeId = template.ID, sourceName = template.name,
        name = getEntryName(template),
        internalName = template.entryName,
        fileName = template.entryFileName,
        description = template.entryDescription,
        nativeType = template.GetType().FullName,
        nativeGroupCount = nativeGroupCount,
        sourceFieldPath = sourceFieldPath,
        groups = projectedGroups
    };
});

var npcProducers = new System.Collections.Generic.List<object>();
var currentNPCObservations = new System.Collections.Generic.List<object>();
var currentPersistentNPCObservations = new System.Collections.Generic.List<object>();
var currentNPCSeenInstanceIds = new System.Collections.Generic.List<int>();
var currentPersistentNPCSeenInstanceIds = new System.Collections.Generic.List<int>();
var adventurerProducers = new System.Collections.Generic.List<object>();
var adventurerObservations = new System.Collections.Generic.List<object>();
var adventurerPopulationManagers = new System.Collections.Generic.List<object>();
var adventurerSeenInstanceIds = new System.Collections.Generic.List<int>();

var sourceSpawnerCount = -1;
var sourceAdventurerZoneCount = -1;
var sourceAdventurerPopulationManagerCount = -1;
var sourceCandidateCount = 0;
var exportedCandidateCount = 0;
var currentNPCSourceCount = 0;
var currentPersistentNPCSourceCount = 0;
var currentNPCNullCount = 0;
var currentPersistentNPCNullCount = 0;
var currentNPCUnavailableListCount = 0;
var currentPersistentNPCUnavailableListCount = 0;
var currentNPCDuplicateCount = 0;
var currentPersistentNPCDuplicateCount = 0;
var adventurerObservationSourceCount = 0;
var adventurerObservationNullCount = 0;
var adventurerObservationDuplicateCount = 0;
var adventurerUnavailableListCount = 0;
var adventurerRosterSourceCount = 0;
var adventurerRosterExportedCount = 0;
var requirementsTemplateManagedNullCount = 0;
var requirementsTemplateUnityNullCount = 0;
var requirementsTemplateNativeObjectCount = 0;
var requirementsTemplateFieldReadFailureCount = 0;
var runtimeNamingUncertainties = new System.Collections.Generic.List<object>();
runtimeNamingUncertainties.Add(new
{
    member = "Il2CppBLINK.RPGBuilder.AI.NPCSpawner.Saver",
    detail = "The recovered field may be null before NPCSpawnerSaver lifecycle initialization; the probe also checks the required NPCSpawnerSaver component on the same GameObject."
});
runtimeNamingUncertainties.Add(new
{
    member = "Il2Cpp.AddressableLoader.addressableAsset.AssetGUID",
    detail = "An addressable ancestor is a candidate source identity only. Scene-authored producers can have no ancestor loader, and loader hierarchy ownership requires repeat-load proof."
});
runtimeNamingUncertainties.Add(new
{
    member = "Il2Cpp.GameState.CurrentGameScene",
    detail = "RPGGameScene has no recovered buildIndex field. Native scene IDs are assigned only when entryFileName matches Scene.path or entryName/entryDisplayName matches Scene.name."
});
runtimeNamingUncertainties.Add(new
{
    member = "NPCSpawner.npcCountMax / spawnedCountMax",
    detail = "Native Initialize checks both live lists against npcCountMax and checks spawnedCount against spawnedCountMax in Limited mode. Counter updates and reset behavior across every spawn path remain unverified."
});
runtimeNamingUncertainties.Add(new
{
    member = "NPCSpawner.NPC_SPAWN_DATA.spawnChance",
    detail = "The authored spawnChance value is retained as a native field. No recovered PickRandomNPC body establishes whether it is a weight, percentage, or another selection input."
});
runtimeNamingUncertainties.Add(new
{
    member = "CombatEntity.GetNPCData()",
    detail = "The runtime entity exposes its canonical RPGNpc through GetNPCData(); a null result remains an unresolved observation rather than a synthetic canonical entity."
});
runtimeNamingUncertainties.Add(new
{
    member = "Il2CppBLINK.RPGBuilder.AI.AdventurerSpawnZone / AdventurerPopulationManager",
    detail = "AdventurerSpawnZone is an additional authored NPC producer family. The zone exposes limits and spawn geometry, while AdventurerPopulationManager owns the global AdventurerRoster. The manager's private availablePool and npcToZone state are not projected. No recovered per-zone candidate association or FillZoneRoutine/SpawnAdventurer body proves selection semantics."
});

var getHierarchy = new System.Func<UnityEngine.Transform, System.Tuple<string, System.Collections.Generic.List<object>>>(transform =>
{
    var hierarchyNodes = new System.Collections.Generic.List<object>();
    var hierarchyParts = new System.Collections.Generic.List<string>();
    var cursor = transform;
    while (cursor != null)
    {
        var nodeName = cursor.name == null ? "" : cursor.name;
        var siblingIndex = cursor.GetSiblingIndex();
        hierarchyNodes.Add(new { name = nodeName, siblingIndex = siblingIndex });
        hierarchyParts.Add(nodeName + "[" + siblingIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]");
        cursor = cursor.parent;
    }

    for (var hierarchyIndex = 0; hierarchyIndex < hierarchyNodes.Count / 2; hierarchyIndex++)
    {
        var oppositeIndex = hierarchyNodes.Count - hierarchyIndex - 1;
        var node = hierarchyNodes[hierarchyIndex];
        hierarchyNodes[hierarchyIndex] = hierarchyNodes[oppositeIndex];
        hierarchyNodes[oppositeIndex] = node;
        var part = hierarchyParts[hierarchyIndex];
        hierarchyParts[hierarchyIndex] = hierarchyParts[oppositeIndex];
        hierarchyParts[oppositeIndex] = part;
    }

    return new System.Tuple<string, System.Collections.Generic.List<object>>(string.Join("/", hierarchyParts.ToArray()), hierarchyNodes);
});

var projectSourceScene = new System.Func<UnityEngine.SceneManagement.Scene, System.Tuple<object, string>>(scene =>
{
    var currentScene = Il2Cpp.GameState.CurrentGameScene;
    var matchedByPath = false;
    var matchedByName = false;
    if (currentScene != null)
    {
        matchedByPath = !string.IsNullOrEmpty(scene.path) && currentScene.entryFileName != null && currentScene.entryFileName == scene.path;
        matchedByName = !string.IsNullOrEmpty(scene.name) &&
            ((currentScene.entryDisplayName != null && currentScene.entryDisplayName == scene.name) ||
             (currentScene.entryName != null && currentScene.entryName == scene.name));
    }
    var matched = matchedByPath || matchedByName;
    var matchBasis = matchedByPath ? "currentGameScene.entryFileName == observed Scene.path" : (matchedByName ? "currentGameScene entryName/displayName == observed Scene.name" : null);
    var sourceScene = new
    {
        nativeId = matched ? (int?)currentScene.ID : (int?)null,
        name = scene.name,
        path = scene.path,
        buildIndex = scene.buildIndex,
        handle = scene.handle,
        isLoaded = scene.isLoaded,
        rootCount = scene.rootCount,
        nativeIdMatched = matched,
        nativeIdMatchBasis = matchBasis
    };

    var sceneKey = scene.path;
    if (string.IsNullOrEmpty(sceneKey))
    {
        sceneKey = scene.name;
    }
    if (string.IsNullOrEmpty(sceneKey))
    {
        sceneKey = "buildIndex:" + scene.buildIndex.ToString(System.Globalization.CultureInfo.InvariantCulture);
    }
    return new System.Tuple<object, string>(sourceScene, sceneKey);
});

var projectColor = new System.Func<UnityEngine.Color, object>(color => new
{
    r = color.r,
    g = color.g,
    b = color.b,
    a = color.a
});

var projectPatrolPath = new System.Func<Il2Cpp.PatrolPath, string, object, object>((path, ownerSourcePath, sourceSceneProjection) =>
{
    if (path == null)
    {
        return null;
    }

    var points = new System.Collections.Generic.List<object>();
    var pointsAvailable = path.Points != null;
    if (!pointsAvailable)
    {
        unresolved.Add(new
        {
            kind = "npcProducerPatrolPoints",
            sourceFieldPath = ownerSourcePath + ".Points",
            detail = "PatrolPath.Points returned null."
        });
    }
    else
    {
        for (var pointIndex = 0; pointIndex < path.Points.Count; pointIndex++)
        {
            var point = path.Points[pointIndex];
            if (point == null)
            {
                unresolved.Add(new
                {
                    kind = "npcProducerPatrolPoint",
                    sourceFieldPath = ownerSourcePath + ".Points[" + pointIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]",
                    detail = "PatrolPath point is null."
                });
                points.Add(new { sourceIndex = pointIndex, unavailable = "null Transform point" });
                continue;
            }

            var pointHierarchy = getHierarchy(point);
            var pointPosition = point.position;
            var pointComponentIndex = -1;
            try
            {
                pointComponentIndex = point.gameObject.GetComponentIndex(point);
            }
            catch (System.Exception error)
            {
                unresolved.Add(new
                {
                    kind = "npcProducerPatrolPointComponentIndex",
                    sourceFieldPath = ownerSourcePath + ".Points[" + pointIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]",
                    detail = error.GetType().FullName + ": " + error.Message
                });
            }
            points.Add(new
            {
                sourceIndex = pointIndex,
                name = point.name,
                sourceScene = sourceSceneProjection,
                source = new
                {
                    hierarchyPath = pointHierarchy.Item1,
                    hierarchyNodes = pointHierarchy.Item2,
                    componentType = "UnityEngine.Transform",
                    componentIndex = pointComponentIndex,
                    saverIdentifier = (string)null,
                    addressableAssetGuid = (string)null
                },
                position = new { x = pointPosition.x, y = pointPosition.y, z = pointPosition.z },
                activeSelf = point.gameObject.activeSelf,
                activeInHierarchy = point.gameObject.activeInHierarchy,
                enabled = (bool?)null
            });
        }
    }

    var pathHierarchy = getHierarchy(path.transform);
    var pathComponentIndex = -1;
    try
    {
        pathComponentIndex = path.gameObject.GetComponentIndex(path);
    }
    catch (System.Exception error)
    {
        unresolved.Add(new
        {
            kind = "npcProducerPatrolPathComponentIndex",
            sourceFieldPath = ownerSourcePath,
            detail = error.GetType().FullName + ": " + error.Message
        });
    }
    return new
    {
        nativeType = path.GetType().FullName,
        name = path.name,
        sourceScene = sourceSceneProjection,
        source = new
        {
            hierarchyPath = pathHierarchy.Item1,
            hierarchyNodes = pathHierarchy.Item2,
            componentType = path.GetType().FullName,
            componentIndex = pathComponentIndex,
            saverIdentifier = (string)null,
            addressableAssetGuid = (string)null
        },
        looping = path.Looping,
        groupPatrol = path.GroupPatrol,
        groupSpacing = path.GroupSpacing,
        poiRadius = path.POIRadius,
        pointsAvailable = pointsAvailable,
        pointCount = points.Count,
        points = points
    };
});

var projectSavedSpawnerState = new System.Func<string, string, object>((identifier, ownerSourcePath) =>
{
    if (string.IsNullOrEmpty(identifier))
    {
        return new
        {
            available = false,
            reason = "No non-empty SaverIdentifier candidate was available.",
            sourceFieldPath = ownerSourcePath + ".NPCSpawnerSaver"
        };
    }

    Il2CppBLINK.RPGBuilder.WorldPersistence.PersistenceManager persistenceManager = null;
    try
    {
        persistenceManager = Il2CppBLINK.RPGBuilder.WorldPersistence.PersistenceManager.Instance;
    }
    catch (System.Exception error)
    {
        unresolved.Add(new
        {
            kind = "npcProducerPersistenceManager",
            sourceFieldPath = ownerSourcePath + ".NPCSpawnerSaver",
            detail = error.GetType().FullName + ": " + error.Message
        });
        return new
        {
            available = false,
            reason = "PersistenceManager.Instance was unavailable.",
            sourceFieldPath = ownerSourcePath + ".NPCSpawnerSaver"
        };
    }

    if (persistenceManager == null)
    {
        return new
        {
            available = false,
            reason = "PersistenceManager.Instance returned null.",
            sourceFieldPath = ownerSourcePath + ".NPCSpawnerSaver"
        };
    }

    Il2CppBLINK.RPGBuilder.WorldPersistence.NPCSpawnerSaverTemplate savedTemplate = null;
    try
    {
        savedTemplate = persistenceManager.GetNPCSpawnerTemplateData(identifier);
    }
    catch (System.Exception error)
    {
        unresolved.Add(new
        {
            kind = "npcProducerPersistenceTemplate",
            sourceFieldPath = ownerSourcePath + ".NPCSpawnerSaverTemplate[" + identifier + "]",
            detail = error.GetType().FullName + ": " + error.Message
        });
        return new
        {
            available = false,
            reason = "GetNPCSpawnerTemplateData failed.",
            sourceFieldPath = ownerSourcePath + ".NPCSpawnerSaverTemplate[" + identifier + "]"
        };
    }

    if (savedTemplate == null)
    {
        return new
        {
            available = false,
            reason = "No saved NPCSpawner template was returned for this candidate identifier.",
            sourceFieldPath = ownerSourcePath + ".NPCSpawnerSaverTemplate[" + identifier + "]"
        };
    }

    var savedPersistentNPCs = new System.Collections.Generic.List<object>();
    var savedPersistentNPCsAvailable = savedTemplate.persistentNPCs != null;
    if (!savedPersistentNPCsAvailable)
    {
        unresolved.Add(new
        {
            kind = "npcProducerPersistenceEntries",
            sourceFieldPath = ownerSourcePath + ".NPCSpawnerSaverTemplate.persistentNPCs",
            detail = "NPCSpawnerSaverTemplate.persistentNPCs returned null."
        });
    }
    else
    {
        for (var savedIndex = 0; savedIndex < savedTemplate.persistentNPCs.Count; savedIndex++)
        {
            var savedNPC = savedTemplate.persistentNPCs[savedIndex];
            var savedPath = ownerSourcePath + ".NPCSpawnerSaverTemplate.persistentNPCs[" + savedIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
            if (savedNPC == null)
            {
                unresolved.Add(new
                {
                    kind = "npcProducerPersistenceEntry",
                    sourceFieldPath = savedPath,
                    detail = "PersistentNPCEntry is null."
                });
                savedPersistentNPCs.Add(new { sourceIndex = savedIndex, unavailable = "null PersistentNPCEntry" });
                continue;
            }

            var savedPosition = savedNPC.position;
            var savedRotation = savedNPC.rotation;
            var vitalityStats = new System.Collections.Generic.List<object>();
            var vitalityStatsAvailable = savedNPC.VitalityStats != null;
            if (!vitalityStatsAvailable)
            {
                unresolved.Add(new
                {
                    kind = "npcProducerPersistenceVitality",
                    sourceFieldPath = savedPath + ".VitalityStats",
                    detail = "PersistentNPCEntry.VitalityStats returned null."
                });
            }
            else
            {
                for (var statIndex = 0; statIndex < savedNPC.VitalityStats.Count; statIndex++)
                {
                    var vitality = savedNPC.VitalityStats[statIndex];
                    if (vitality == null)
                    {
                        unresolved.Add(new
                        {
                            kind = "npcProducerPersistenceVitalityEntry",
                            sourceFieldPath = savedPath + ".VitalityStats[" + statIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]",
                            detail = "VitalityStatEntry is null."
                        });
                        vitalityStats.Add(new { sourceIndex = statIndex, unavailable = "null VitalityStatEntry" });
                        continue;
                    }
                    vitalityStats.Add(new
                    {
                        sourceIndex = statIndex,
                        statName = vitality.StatName,
                        statId = vitality.StatID,
                        value = vitality.value
                    });
                }
            }

            savedPersistentNPCs.Add(new
            {
                sourceIndex = savedIndex,
                npcName = savedNPC.NPCName,
                npcId = savedNPC.ID,
                position = new { x = savedPosition.x, y = savedPosition.y, z = savedPosition.z },
                rotation = new { x = savedRotation.x, y = savedRotation.y, z = savedRotation.z },
                vitalityStatsAvailable = vitalityStatsAvailable,
                vitalityStats = vitalityStats,
                sourceFieldPath = savedPath
            });
        }
    }

    return new
    {
        available = true,
        sourceFieldPath = ownerSourcePath + ".NPCSpawnerSaverTemplate[" + identifier + "]",
        nativeType = savedTemplate.GetType().FullName,
        spawnedCount = savedTemplate.spawnedCount,
        persistentNPCsAvailable = savedPersistentNPCsAvailable,
        persistentNPCCount = savedPersistentNPCs.Count,
        persistentNPCs = savedPersistentNPCs
    };
});

var collectObservationList = new System.Action<Il2CppSystem.Collections.Generic.List<Il2CppBLINK.RPGBuilder.Combat.CombatEntity>, string, string, System.Collections.Generic.List<object>, System.Collections.Generic.List<int>>((nativeList, listName, producerSourcePath, output, seenIds) =>
{
    var sourceFieldPath = producerSourcePath + "." + listName;
    if (nativeList == null)
    {
        if (listName == "CurrentNPCs")
        {
            currentNPCUnavailableListCount++;
        }
        else
        {
            currentPersistentNPCUnavailableListCount++;
        }
        unresolved.Add(new
        {
            kind = "npcObservationList",
            sourceFieldPath = sourceFieldPath,
            detail = "The live NPC observation list returned null."
        });
        return;
    }

    if (listName == "CurrentNPCs")
    {
        currentNPCSourceCount += nativeList.Count;
    }
    else
    {
        currentPersistentNPCSourceCount += nativeList.Count;
    }

    for (var observationIndex = 0; observationIndex < nativeList.Count; observationIndex++)
    {
        var entity = nativeList[observationIndex];
        var observationPath = sourceFieldPath + "[" + observationIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        if (entity == null)
        {
            if (listName == "CurrentNPCs") currentNPCNullCount++;
            else currentPersistentNPCNullCount++;
            unresolved.Add(new
            {
                kind = "npcObservation",
                sourceFieldPath = observationPath,
                detail = "Current NPC list entry is null."
            });
            output.Add(new
            {
                observationList = listName,
                sourceProducerPath = producerSourcePath,
                sourceIndex = observationIndex,
                instanceId = (int?)null,
                sourceScene = (object)null,
                source = (object)null,
                position = (object)null,
                activeSelf = (bool?)null,
                activeInHierarchy = (bool?)null,
                enabled = (bool?)null,
                npcId = (int?)null,
                npc = (object)null,
                level = (int?)null,
                persistent = (bool?)null,
                unavailable = "null CombatEntity"
            });
            continue;
        }

        var instanceId = -1;
        var instanceIdAvailable = false;
        try
        {
            instanceId = entity.GetInstanceID();
            instanceIdAvailable = true;
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "npcObservationInstanceId",
                sourceFieldPath = observationPath,
                detail = error.GetType().FullName + ": " + error.Message
            });
        }

        if (!instanceIdAvailable)
        {
            output.Add(new
            {
                observationList = listName,
                sourceProducerPath = producerSourcePath,
                sourceIndex = observationIndex,
                instanceId = (int?)null,
                sourceScene = (object)null,
                source = (object)null,
                position = (object)null,
                activeSelf = (bool?)null,
                activeInHierarchy = (bool?)null,
                enabled = (bool?)null,
                npcId = (int?)null,
                npc = (object)null,
                level = (int?)null,
                persistent = (bool?)null,
                unavailable = "CombatEntity instance ID unavailable; observation cannot be deduplicated"
            });
            continue;
        }

        var duplicate = false;
        for (var seenIndex = 0; seenIndex < seenIds.Count; seenIndex++)
        {
            if (seenIds[seenIndex] == instanceId)
            {
                duplicate = true;
                break;
            }
        }
        if (duplicate)
        {
            if (listName == "CurrentNPCs") currentNPCDuplicateCount++;
            else currentPersistentNPCDuplicateCount++;
            continue;
        }
        seenIds.Add(instanceId);

        var entityScene = entity.gameObject.scene;
        var entitySceneInfo = projectSourceScene(entityScene);
        var entityHierarchy = getHierarchy(entity.transform);
        var entityComponentIndex = -1;
        var entityComponentIndexAvailable = false;
        try
        {
            entityComponentIndex = entity.gameObject.GetComponentIndex(entity);
            entityComponentIndexAvailable = true;
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "npcObservationComponentIndex",
                sourceFieldPath = observationPath,
                detail = error.GetType().FullName + ": " + error.Message
            });
        }

        object observedPosition = null;
        var observedActiveSelf = (bool?)null;
        var observedActiveInHierarchy = (bool?)null;
        var observedEnabled = (bool?)null;
        try
        {
            var entityPosition = entity.transform.position;
            observedPosition = new { x = entityPosition.x, y = entityPosition.y, z = entityPosition.z };
            observedActiveSelf = entity.gameObject.activeSelf;
            observedActiveInHierarchy = entity.gameObject.activeInHierarchy;
            observedEnabled = entity.enabled;
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "npcObservationTransform",
                sourceFieldPath = observationPath,
                detail = error.GetType().FullName + ": " + error.Message
            });
        }

        Il2Cpp.RPGNpc observedNPC = null;
        try
        {
            observedNPC = entity.GetNPCData();
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "npcObservationNPCData",
                sourceFieldPath = observationPath + ".GetNPCData()",
                detail = error.GetType().FullName + ": " + error.Message
            });
        }
        if (observedNPC == null)
        {
            unresolved.Add(new
            {
                kind = "npcObservationNPCData",
                sourceFieldPath = observationPath + ".GetNPCData()",
                detail = "CombatEntity.GetNPCData() returned null."
            });
        }

        var observedLevel = (int?)null;
        try
        {
            observedLevel = entity.GetLevel();
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "npcObservationLevel",
                sourceFieldPath = observationPath + ".GetLevel()",
                detail = error.GetType().FullName + ": " + error.Message
            });
        }

        var observedPersistent = (bool?)null;
        try
        {
            observedPersistent = entity.IsPersistentNPC();
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "npcObservationPersistence",
                sourceFieldPath = observationPath + ".IsPersistentNPC()",
                detail = error.GetType().FullName + ": " + error.Message
            });
        }

        object observedSpawnerCandidate = null;
        try
        {
            var observedSpawner = entity.GetSpawner();
            if (observedSpawner != null)
            {
                var observedSpawnerSceneInfo = projectSourceScene(observedSpawner.gameObject.scene);
                var observedSpawnerHierarchy = getHierarchy(observedSpawner.transform);
                var observedSpawnerComponentIndex = -1;
                try
                {
                    observedSpawnerComponentIndex = observedSpawner.gameObject.GetComponentIndex(observedSpawner);
                }
                catch (System.Exception error)
                {
                    unresolved.Add(new
                    {
                        kind = "npcObservationSpawnerComponentIndex",
                        sourceFieldPath = observationPath + ".GetSpawner()",
                        detail = error.GetType().FullName + ": " + error.Message
                    });
                }
                var observedSpawnerSourcePath = observedSpawnerSceneInfo.Item2 + "::" + observedSpawnerHierarchy.Item1 + "::" + observedSpawner.GetType().FullName + "[" + observedSpawnerComponentIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
                observedSpawnerCandidate = new
                {
                    sourcePath = observedSpawnerSourcePath,
                    sourceScene = observedSpawnerSceneInfo.Item1,
                    hierarchyPath = observedSpawnerHierarchy.Item1,
                    hierarchyNodes = observedSpawnerHierarchy.Item2,
                    componentType = observedSpawner.GetType().FullName,
                    componentIndex = observedSpawnerComponentIndex,
                    stability = "candidate only; repeat loads are required",
                    provenStable = false
                };
            }
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "npcObservationSpawner",
                sourceFieldPath = observationPath + ".GetSpawner()",
                detail = error.GetType().FullName + ": " + error.Message
            });
        }

        var entityComponentType = entity.GetType().FullName;
        var entitySourcePath = entitySceneInfo.Item2 + "::" + entityHierarchy.Item1 + "::" + entityComponentType + "[" + entityComponentIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        output.Add(new
        {
            observationList = listName,
            sourceProducerPath = producerSourcePath,
            sourceIndex = observationIndex,
            instanceId = instanceId,
            sourceScene = entitySceneInfo.Item1,
            source = new
            {
                hierarchyPath = entityHierarchy.Item1,
                hierarchyNodes = entityHierarchy.Item2,
                componentType = entityComponentType,
                componentIndex = entityComponentIndex,
                saverIdentifier = (string)null,
                addressableAssetGuid = (string)null
            },
            sourcePath = entitySourcePath,
            sourceIdentity = new
            {
                status = "runtime observation only; instanceId is not a stable source identity",
                hierarchyPathCandidate = entityHierarchy.Item1,
                provenStable = false,
                componentIndexAvailable = entityComponentIndexAvailable
            },
            sourceSpawnerCandidate = observedSpawnerCandidate,
            position = observedPosition,
            activeSelf = observedActiveSelf,
            activeInHierarchy = observedActiveInHierarchy,
            enabled = observedEnabled,
            npcId = observedNPC == null ? (int?)null : (int?)observedNPC.ID,
            npc = observedNPC == null ? (object)null : projectEntry(observedNPC),
            level = observedLevel,
            persistent = observedPersistent
        });
    }
});

var collectAdventurerObservationList = new System.Action<Il2CppSystem.Collections.Generic.List<Il2CppBLINK.RPGBuilder.Combat.CombatEntity>, string, System.Collections.Generic.List<object>, System.Collections.Generic.List<int>>((nativeList, zoneSourcePath, output, seenIds) =>
{
    var sourceFieldPath = zoneSourcePath + ".CurrentAdventurers";
    if (nativeList == null)
    {
        adventurerUnavailableListCount++;
        unresolved.Add(new
        {
            kind = "adventurerObservationList",
            sourceFieldPath = sourceFieldPath,
            detail = "AdventurerSpawnZone.CurrentAdventurers returned null."
        });
        return;
    }

    adventurerObservationSourceCount += nativeList.Count;
    for (var observationIndex = 0; observationIndex < nativeList.Count; observationIndex++)
    {
        var entity = nativeList[observationIndex];
        var observationPath = sourceFieldPath + "[" + observationIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        if (entity == null)
        {
            adventurerObservationNullCount++;
            unresolved.Add(new
            {
                kind = "adventurerObservation",
                sourceFieldPath = observationPath,
                detail = "AdventurerSpawnZone.CurrentAdventurers contains a null CombatEntity."
            });
            output.Add(new
            {
                observationList = "CurrentAdventurers",
                sourceProducerPath = zoneSourcePath,
                sourceIndex = observationIndex,
                instanceId = (int?)null,
                sourceScene = (object)null,
                source = (object)null,
                position = (object)null,
                activeSelf = (bool?)null,
                activeInHierarchy = (bool?)null,
                enabled = (bool?)null,
                npcId = (int?)null,
                npc = (object)null,
                level = (int?)null,
                persistent = (bool?)null,
                unavailable = "null CombatEntity"
            });
            continue;
        }

        var instanceId = -1;
        var instanceIdAvailable = false;
        try
        {
            instanceId = entity.GetInstanceID();
            instanceIdAvailable = true;
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "adventurerObservationInstanceId",
                sourceFieldPath = observationPath,
                detail = error.GetType().FullName + ": " + error.Message
            });
        }
        if (!instanceIdAvailable)
        {
            output.Add(new
            {
                observationList = "CurrentAdventurers",
                sourceProducerPath = zoneSourcePath,
                sourceIndex = observationIndex,
                instanceId = (int?)null,
                sourceScene = (object)null,
                source = (object)null,
                position = (object)null,
                activeSelf = (bool?)null,
                activeInHierarchy = (bool?)null,
                enabled = (bool?)null,
                npcId = (int?)null,
                npc = (object)null,
                level = (int?)null,
                persistent = (bool?)null,
                unavailable = "CombatEntity instance ID unavailable; observation cannot be deduplicated"
            });
            continue;
        }

        var duplicate = false;
        for (var seenIndex = 0; seenIndex < seenIds.Count; seenIndex++)
        {
            if (seenIds[seenIndex] == instanceId)
            {
                duplicate = true;
                break;
            }
        }
        if (duplicate)
        {
            adventurerObservationDuplicateCount++;
            continue;
        }
        seenIds.Add(instanceId);

        var entityScene = entity.gameObject.scene;
        var entitySceneInfo = projectSourceScene(entityScene);
        var entityHierarchy = getHierarchy(entity.transform);
        var entityComponentIndex = -1;
        var entityComponentIndexAvailable = false;
        try
        {
            entityComponentIndex = entity.gameObject.GetComponentIndex(entity);
            entityComponentIndexAvailable = true;
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "adventurerObservationComponentIndex",
                sourceFieldPath = observationPath,
                detail = error.GetType().FullName + ": " + error.Message
            });
        }

        object observedPosition = null;
        var observedActiveSelf = (bool?)null;
        var observedActiveInHierarchy = (bool?)null;
        var observedEnabled = (bool?)null;
        try
        {
            var entityPosition = entity.transform.position;
            observedPosition = new { x = entityPosition.x, y = entityPosition.y, z = entityPosition.z };
            observedActiveSelf = entity.gameObject.activeSelf;
            observedActiveInHierarchy = entity.gameObject.activeInHierarchy;
            observedEnabled = entity.enabled;
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "adventurerObservationTransform",
                sourceFieldPath = observationPath,
                detail = error.GetType().FullName + ": " + error.Message
            });
        }

        Il2Cpp.RPGNpc observedNPC = null;
        try
        {
            observedNPC = entity.GetNPCData();
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "adventurerObservationNPCData",
                sourceFieldPath = observationPath + ".GetNPCData()",
                detail = error.GetType().FullName + ": " + error.Message
            });
        }
        if (observedNPC == null)
        {
            unresolved.Add(new
            {
                kind = "adventurerObservationNPCData",
                sourceFieldPath = observationPath + ".GetNPCData()",
                detail = "CombatEntity.GetNPCData() returned null."
            });
        }

        var observedLevel = (int?)null;
        try
        {
            observedLevel = entity.GetLevel();
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "adventurerObservationLevel",
                sourceFieldPath = observationPath + ".GetLevel()",
                detail = error.GetType().FullName + ": " + error.Message
            });
        }

        var observedPersistent = (bool?)null;
        try
        {
            observedPersistent = entity.IsPersistentNPC();
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "adventurerObservationPersistence",
                sourceFieldPath = observationPath + ".IsPersistentNPC()",
                detail = error.GetType().FullName + ": " + error.Message
            });
        }

        object observedZoneCandidate = null;
        try
        {
            var observedZone = entity.GetAdventurerZone();
            if (observedZone != null)
            {
                var observedZoneSceneInfo = projectSourceScene(observedZone.gameObject.scene);
                var observedZoneHierarchy = getHierarchy(observedZone.transform);
                var observedZoneComponentIndex = -1;
                try
                {
                    observedZoneComponentIndex = observedZone.gameObject.GetComponentIndex(observedZone);
                }
                catch (System.Exception error)
                {
                    unresolved.Add(new
                    {
                        kind = "adventurerObservationZoneComponentIndex",
                        sourceFieldPath = observationPath + ".GetAdventurerZone()",
                        detail = error.GetType().FullName + ": " + error.Message
                    });
                }
                var observedZoneSourcePath = observedZoneSceneInfo.Item2 + "::" + observedZoneHierarchy.Item1 + "::" + observedZone.GetType().FullName + "[" + observedZoneComponentIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
                observedZoneCandidate = new
                {
                    sourcePath = observedZoneSourcePath,
                    sourceScene = observedZoneSceneInfo.Item1,
                    hierarchyPath = observedZoneHierarchy.Item1,
                    hierarchyNodes = observedZoneHierarchy.Item2,
                    componentType = observedZone.GetType().FullName,
                    componentIndex = observedZoneComponentIndex,
                    stability = "candidate only; repeat loads are required",
                    provenStable = false
                };
            }
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "adventurerObservationZone",
                sourceFieldPath = observationPath + ".GetAdventurerZone()",
                detail = error.GetType().FullName + ": " + error.Message
            });
        }

        var entityComponentType = entity.GetType().FullName;
        var entitySourcePath = entitySceneInfo.Item2 + "::" + entityHierarchy.Item1 + "::" + entityComponentType + "[" + entityComponentIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        output.Add(new
        {
            observationList = "CurrentAdventurers",
            sourceProducerPath = zoneSourcePath,
            sourceIndex = observationIndex,
            instanceId = instanceId,
            sourceScene = entitySceneInfo.Item1,
            source = new
            {
                hierarchyPath = entityHierarchy.Item1,
                hierarchyNodes = entityHierarchy.Item2,
                componentType = entityComponentType,
                componentIndex = entityComponentIndex,
                saverIdentifier = (string)null,
                addressableAssetGuid = (string)null
            },
            sourcePath = entitySourcePath,
            sourceIdentity = new
            {
                status = "runtime observation only; instanceId is not a stable source identity",
                hierarchyPathCandidate = entityHierarchy.Item1,
                provenStable = false,
                componentIndexAvailable = entityComponentIndexAvailable
            },
            sourceAdventurerZoneCandidate = observedZoneCandidate,
            position = observedPosition,
            activeSelf = observedActiveSelf,
            activeInHierarchy = observedActiveInHierarchy,
            enabled = observedEnabled,
            npcId = observedNPC == null ? (int?)null : (int?)observedNPC.ID,
            npc = observedNPC == null ? (object)null : projectEntry(observedNPC),
            level = observedLevel,
            persistent = observedPersistent
        });
    }
});

Il2CppBLINK.RPGBuilder.AI.NPCSpawner[] npcSpawners = null;
try
{
    npcSpawners = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.AI.NPCSpawner>(true);
}
catch (System.Exception error)
{
    unresolved.Add(new
    {
        kind = "npcProducerScan",
        sourceFieldPath = "UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.AI.NPCSpawner>(includeInactive:true)",
        detail = error.GetType().FullName + ": " + error.Message
    });
}

if (npcSpawners == null)
{
    sourceSpawnerCount = -1;
    unresolved.Add(new
    {
        kind = "npcProducerScan",
        sourceFieldPath = "UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.AI.NPCSpawner>(includeInactive:true)",
        detail = "The inactive-inclusive NPCSpawner scan returned null."
    });
}
else
{
    sourceSpawnerCount = npcSpawners.Length;
    for (var producerIndex = 0; producerIndex < npcSpawners.Length; producerIndex++)
    {
        var spawner = npcSpawners[producerIndex];
        if (spawner == null)
        {
            unresolved.Add(new
            {
                kind = "npcProducer",
                sourceFieldPath = "NPCSpawner[" + producerIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]",
                detail = "FindObjectsOfType returned a null NPCSpawner component."
            });
            npcProducers.Add(new
            {
                sourceIndex = producerIndex,
                sourceScene = (object)null,
                source = (object)null,
                position = (object)null,
                activeSelf = (bool?)null,
                activeInHierarchy = (bool?)null,
                enabled = (bool?)null,
                unavailable = "null NPCSpawner"
            });
            continue;
        }

        var spawnerSceneInfo = projectSourceScene(spawner.gameObject.scene);
        var spawnerHierarchy = getHierarchy(spawner.transform);
        var spawnerComponentIndex = -1;
        var spawnerComponentIndexAvailable = false;
        try
        {
            spawnerComponentIndex = spawner.gameObject.GetComponentIndex(spawner);
            spawnerComponentIndexAvailable = true;
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "npcProducerComponentIndex",
                sourceFieldPath = spawnerSceneInfo.Item2 + "::" + spawnerHierarchy.Item1,
                detail = error.GetType().FullName + ": " + error.Message
            });
        }

        var spawnerComponentType = spawner.GetType().FullName;
        var producerSourcePath = spawnerSceneInfo.Item2 + "::" + spawnerHierarchy.Item1 + "::" + spawnerComponentType + "[" + spawnerComponentIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        var conditionOwnerPath = producerSourcePath + ".conditions";

        Il2CppBLINK.RPGBuilder.WorldPersistence.NPCSpawnerSaver saver = null;
        try
        {
            saver = spawner.Saver;
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "npcProducerSaver",
                sourceFieldPath = producerSourcePath + ".Saver",
                detail = error.GetType().FullName + ": " + error.Message
            });
        }
        if (saver == null)
        {
            try
            {
                saver = spawner.gameObject.GetComponent<Il2CppBLINK.RPGBuilder.WorldPersistence.NPCSpawnerSaver>();
            }
            catch (System.Exception error)
            {
                unresolved.Add(new
                {
                    kind = "npcProducerSaver",
                    sourceFieldPath = producerSourcePath + ".gameObject.NPCSpawnerSaver",
                    detail = error.GetType().FullName + ": " + error.Message
                });
            }
        }

        var saverIdentifier = (string)null;
        var saverIsDynamic = (bool?)null;
        var saverIdentifierDynamic = (bool?)null;
        if (saver != null)
        {
            try
            {
                saverIdentifier = saver.GetIdentifier();
            }
            catch (System.Exception error)
            {
                unresolved.Add(new
                {
                    kind = "npcProducerSaverIdentifier",
                    sourceFieldPath = producerSourcePath + ".Saver.GetIdentifier()",
                    detail = error.GetType().FullName + ": " + error.Message
                });
            }
            try
            {
                saverIsDynamic = saver.IsDynamic();
            }
            catch (System.Exception error)
            {
                unresolved.Add(new
                {
                    kind = "npcProducerSaverDynamic",
                    sourceFieldPath = producerSourcePath + ".Saver.IsDynamic()",
                    detail = error.GetType().FullName + ": " + error.Message
                });
            }
            try
            {
                var saverIdentifierComponent = saver.gameObject.GetComponent<Il2CppBLINK.RPGBuilder.WorldPersistence.SaverIdentifier>();
                if (saverIdentifierComponent != null)
                {
                    saverIdentifierDynamic = saverIdentifierComponent.Dynamic;
                    if (string.IsNullOrEmpty(saverIdentifier))
                    {
                        saverIdentifier = saverIdentifierComponent.GetIdentifier();
                    }
                }
            }
            catch (System.Exception error)
            {
                unresolved.Add(new
                {
                    kind = "npcProducerSaverIdentifierComponent",
                    sourceFieldPath = producerSourcePath + ".Saver.SaverIdentifier",
                    detail = error.GetType().FullName + ": " + error.Message
                });
            }
        }
        if (string.IsNullOrEmpty(saverIdentifier))
        {
            saverIdentifier = null;
        }

        Il2Cpp.AddressableLoader sourceAddressableLoader = null;
        var addressableAssetGuid = (string)null;
        try
        {
            sourceAddressableLoader = spawner.gameObject.GetComponentInParent<Il2Cpp.AddressableLoader>(true);
            if (sourceAddressableLoader != null && sourceAddressableLoader.addressableAsset != null)
            {
                addressableAssetGuid = sourceAddressableLoader.addressableAsset.AssetGUID;
                if (string.IsNullOrEmpty(addressableAssetGuid))
                {
                    addressableAssetGuid = null;
                }
            }
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "npcProducerAddressableIdentity",
                sourceFieldPath = producerSourcePath + ".ancestor.AddressableLoader.addressableAsset.AssetGUID",
                detail = error.GetType().FullName + ": " + error.Message
            });
        }

        var candidates = new System.Collections.Generic.List<object>();
        var sourceCandidatesAvailable = spawner.spawnData != null;
        var sourceCandidatesCount = sourceCandidatesAvailable ? spawner.spawnData.Count : -1;
        if (!sourceCandidatesAvailable)
        {
            unresolved.Add(new
            {
                kind = "npcProducerCandidates",
                sourceFieldPath = producerSourcePath + ".spawnData",
                detail = "NPCSpawner.spawnData returned null."
            });
        }
        else
        {
            for (var candidateIndex = 0; candidateIndex < spawner.spawnData.Count; candidateIndex++)
            {
                sourceCandidateCount++;
                var candidate = spawner.spawnData[candidateIndex];
                var candidatePath = producerSourcePath + ".spawnData[" + candidateIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
                if (candidate == null)
                {
                    unresolved.Add(new
                    {
                        kind = "npcProducerCandidate",
                        sourceFieldPath = candidatePath,
                        detail = "NPC_SPAWN_DATA row is null."
                    });
                    candidates.Add(new
                    {
                        sourceIndex = candidateIndex,
                        sourceFieldPath = candidatePath,
                        npcId = (int?)null,
                        npc = (object)null,
                        rawSpawnChance = (float?)null,
                        spawnChance = (float?)null,
                        spawnChanceSemantics = "native authored field unavailable for this null NPC_SPAWN_DATA row",
                        persistent = (bool?)null,
                        isPersistent = (bool?)null,
                        unavailable = "null NPC_SPAWN_DATA"
                    });
                    exportedCandidateCount++;
                    continue;
                }

                var candidateNPC = candidate.npc;
                if (candidateNPC == null)
                {
                    unresolved.Add(new
                    {
                        kind = "npcProducerCandidateNPC",
                        sourceFieldPath = candidatePath + ".npc",
                        detail = "NPC_SPAWN_DATA.npc returned null."
                    });
                }
                candidates.Add(new
                {
                    sourceIndex = candidateIndex,
                    npcId = candidateNPC == null ? (int?)null : (int?)candidateNPC.ID,
                    npc = candidateNPC == null ? (object)null : projectEntry(candidateNPC),
                    rawSpawnChance = (float?)candidate.spawnChance,
                    spawnChance = (float?)candidate.spawnChance,
                    spawnChanceSemantics = "native authored NPC_SPAWN_DATA.spawnChance; effective selection behavior is not established by recovered native evidence",
                    persistent = (bool?)candidate.IsPersistent,
                    isPersistent = (bool?)candidate.IsPersistent,
                    sourceFieldPath = candidatePath
                });
                exportedCandidateCount++;
            }
        }

        var inlineRequirementGroups = new System.Collections.Generic.List<object>();
        var inlineRequirementsAvailable = spawner.RequirementGroups != null;
        var inlineRequirementGroupCount = inlineRequirementsAvailable ? spawner.RequirementGroups.Count : -1;
        if (!inlineRequirementsAvailable)
        {
            unresolved.Add(new
            {
                kind = "npcProducerRequirementGroups",
                sourceFieldPath = conditionOwnerPath + ".RequirementGroups",
                detail = "RequirementGroups returned null. Native AreRequirementsMet dereferences this list when inline groups are selected; no empty list is inferred."
            });
        }
        else
        {
            for (var groupIndex = 0; groupIndex < spawner.RequirementGroups.Count; groupIndex++)
            {
                var groupPath = conditionOwnerPath + ".RequirementGroups[" + groupIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
                inlineRequirementGroups.Add(projectGroup(spawner.RequirementGroups[groupIndex], groupPath, groupIndex));
            }
        }

        var requirementsTemplate = (object)null;
        var nativeRequirementsTemplate = (Il2CppBLINK.RPGBuilder.Templates.RequirementsTemplate)null;
        var requirementsTemplateFieldReadAvailable = false;
        var requirementsTemplateManagedNull = (bool?)null;
        var requirementsTemplateUnityNull = (bool?)null;
        var requirementsTemplateRepresentation = "field-read-unavailable";
        var requirementsTemplateGroupsAvailable = (bool?)null;
        var requirementsTemplateGroupCount = -1;
        var requirementsTemplateAvailable = false;
        var requirementsTemplateProjectionAvailable = false;
        try
        {
            nativeRequirementsTemplate = spawner.RequirementsTemplate;
            requirementsTemplateFieldReadAvailable = true;
            requirementsTemplateManagedNull = System.Object.ReferenceEquals(nativeRequirementsTemplate, null);
            requirementsTemplateUnityNull = nativeRequirementsTemplate == null;
            if (requirementsTemplateManagedNull.Value)
            {
                requirementsTemplateManagedNullCount++;
                requirementsTemplateRepresentation = "managed-null";
            }
            else if (requirementsTemplateUnityNull.Value)
            {
                requirementsTemplateUnityNullCount++;
                requirementsTemplateRepresentation = "unity-null-managed-wrapper";
            }
            else
            {
                requirementsTemplateNativeObjectCount++;
                requirementsTemplateAvailable = true;
                requirementsTemplateRepresentation = "native-scriptable-object";
                try
                {
                    var nativeTemplateGroups = nativeRequirementsTemplate.Requirements;
                    requirementsTemplateGroupsAvailable = nativeTemplateGroups != null;
                    requirementsTemplateGroupCount = nativeTemplateGroups == null ? -1 : nativeTemplateGroups.Count;
                    if (!requirementsTemplateGroupsAvailable.Value)
                    {
                        unresolved.Add(new
                        {
                            kind = "npcProducerRequirementsTemplateGroups",
                            sourceFieldPath = conditionOwnerPath + ".RequirementsTemplate.Requirements",
                            detail = "RequirementsTemplate.Requirements returned null. This may represent no template groups, but this probe has no serialization or native evaluation evidence to distinguish that from an unavailable list."
                        });
                    }
                    requirementsTemplate = projectTemplate(nativeRequirementsTemplate, conditionOwnerPath + ".RequirementsTemplate");
                    requirementsTemplateProjectionAvailable = requirementsTemplate != null;
                }
                catch (System.Exception error)
                {
                    unresolved.Add(new
                    {
                        kind = "npcProducerRequirementsTemplate",
                        sourceFieldPath = conditionOwnerPath + ".RequirementsTemplate",
                        detail = error.GetType().FullName + ": " + error.Message
                    });
                }
            }
        }
        catch (System.Exception error)
        {
            requirementsTemplateFieldReadFailureCount++;
            unresolved.Add(new
            {
                kind = "npcProducerRequirementsTemplate",
                sourceFieldPath = conditionOwnerPath + ".RequirementsTemplate",
                detail = error.GetType().FullName + ": " + error.Message
            });
        }

        var useRequirementsTemplate = spawner.UseRequirementsTemplate;
        var nullTemplatePass = useRequirementsTemplate && requirementsTemplateFieldReadAvailable && requirementsTemplateUnityNull == true;
        var patrolOverride = (object)null;
        var patrolOverrideAvailable = spawner.PatrolPathOverride != null;
        if (patrolOverrideAvailable)
        {
            patrolOverride = projectPatrolPath(spawner.PatrolPathOverride, producerSourcePath + ".PatrolPathOverride", spawnerSceneInfo.Item1);
        }
        if (spawner.OverridePatrol && !patrolOverrideAvailable)
        {
            unresolved.Add(new
            {
                kind = "npcProducerPatrolOverride",
                sourceFieldPath = producerSourcePath + ".PatrolPathOverride",
                detail = "OverridePatrol is true but PatrolPathOverride is null."
            });
        }
        if (spawner.OverrideFaction && spawner.Faction == null)
        {
            unresolved.Add(new
            {
                kind = "npcProducerFactionOverride",
                sourceFieldPath = producerSourcePath + ".Faction",
                detail = "OverrideFaction is true but Faction is null."
            });
        }
        if (spawner.OverrideSpecies && spawner.Species == null)
        {
            unresolved.Add(new
            {
                kind = "npcProducerSpeciesOverride",
                sourceFieldPath = producerSourcePath + ".Species",
                detail = "OverrideSpecies is true but Species is null."
            });
        }

        var pendingRespawnTimes = new System.Collections.Generic.List<object>();
        var pendingRespawnTimesAvailable = spawner.PendingRespawnTimes != null;
        if (pendingRespawnTimesAvailable)
        {
            for (var pendingIndex = 0; pendingIndex < spawner.PendingRespawnTimes.Count; pendingIndex++)
            {
                pendingRespawnTimes.Add(new
                {
                    sourceIndex = pendingIndex,
                    time = spawner.PendingRespawnTimes[pendingIndex]
                });
            }
        }

        var spawnerPosition = spawner.transform.position;
        var spawnerRotation = spawner.transform.rotation;
        var currentNPCCount = spawner.CurrentNPCs == null ? -1 : spawner.CurrentNPCs.Count;
        var currentPersistentNPCCount = spawner.CurrentPersistentNPCs == null ? -1 : spawner.CurrentPersistentNPCs.Count;
        collectObservationList(spawner.CurrentNPCs, "CurrentNPCs", producerSourcePath, currentNPCObservations, currentNPCSeenInstanceIds);
        collectObservationList(spawner.CurrentPersistentNPCs, "CurrentPersistentNPCs", producerSourcePath, currentPersistentNPCObservations, currentPersistentNPCSeenInstanceIds);

        var savedSpawnerState = projectSavedSpawnerState(saverIdentifier, producerSourcePath);
        npcProducers.Add(new
        {
            sourceIndex = producerIndex,
            sourcePath = producerSourcePath,
            sourceScene = spawnerSceneInfo.Item1,
            source = new
            {
                hierarchyPath = spawnerHierarchy.Item1,
                hierarchyNodes = spawnerHierarchy.Item2,
                componentType = spawnerComponentType,
                componentIndex = spawnerComponentIndex,
                saverIdentifier = saverIdentifier,
                addressableAssetGuid = addressableAssetGuid
            },
            sourceIdentity = new
            {
                status = "candidate only; repeat scene loads and equivalent extraction are required",
                provenStable = false,
                sourcePathCandidate = producerSourcePath,
                hierarchyPathCandidate = spawnerHierarchy.Item1,
                saverIdentifierCandidate = saverIdentifier,
                addressableAssetGuidCandidate = addressableAssetGuid,
                sourceAddressableLoaderHierarchyCandidate = sourceAddressableLoader == null ? null : getHierarchy(sourceAddressableLoader.transform).Item1,
                componentIndexAvailable = spawnerComponentIndexAvailable
            },
            position = new { x = spawnerPosition.x, y = spawnerPosition.y, z = spawnerPosition.z },
            rotation = new { x = spawnerRotation.x, y = spawnerRotation.y, z = spawnerRotation.z, w = spawnerRotation.w },
            activeSelf = spawner.gameObject.activeSelf,
            activeInHierarchy = spawner.gameObject.activeInHierarchy,
            enabled = spawner.enabled,
            name = spawner.name,
            spawnerType = new { value = (int)spawner.spawnerType, name = spawner.spawnerType.ToString() },
            isActive = spawner.IsActive,
            shape = new
            {
                kind = spawner.usePosition ? "point" : "area",
                usePosition = spawner.usePosition,
                radius = spawner.areaRadius,
                height = spawner.areaHeight,
                semantics = spawner.usePosition ? "native fixed-position mode; XYZ is the authored transform position" : "native square XZ sampling within center +/- areaRadius; ground rays use center Y +/- areaHeight. GetNPCPosition can fall back to NavMesh sampling or the authored position. Live roaming positions are observations, not spawn geometry."
            },
            count = new
            {
                npcCountMax = spawner.npcCountMax,
                spawnedCount = spawner.spawnedCount,
                spawnedCountMax = spawner.spawnedCountMax,
                currentNPCCount = currentNPCCount,
                currentPersistentNPCCount = currentPersistentNPCCount,
                spawnerType = new { value = (int)spawner.spawnerType, name = spawner.spawnerType.ToString() },
                semantics = "Initialize checks npcCountMax against both live lists and spawnedCountMax against spawnedCount in Limited mode. Other spawn paths remain unverified."
            },
            candidatesAvailable = sourceCandidatesAvailable,
            candidateCount = sourceCandidatesCount,
            candidates = candidates,
            activation = new
            {
                isActive = spawner.IsActive,
                triggerSpawn = spawner.TriggerSpawn,
                playerDistanceMax = spawner.PlayerDistanceMax,
                spawningCoroutineCount = spawner.SpawningCoroutines == null ? -1 : spawner.SpawningCoroutines.Count
            },
            conditions = new
            {
                ownerSourcePath = conditionOwnerPath,
                useRequirementsTemplate,
                selectedConditionSource = nullTemplatePass ? "none" : (useRequirementsTemplate ? "requirements-template" : "inline-requirement-groups"),
                behaviorStatus = nullTemplatePass ? "native-null-template-pass" : (useRequirementsTemplate && !requirementsTemplateProjectionAvailable ? "unresolved" : "source-fields-retained; not evaluated"),
                inlineRequirementsAvailable = inlineRequirementsAvailable,
                inlineRequirementGroupCount = inlineRequirementGroupCount,
                inlineRequirementGroups = inlineRequirementGroups,
                requirementsTemplateFieldReadAvailable = requirementsTemplateFieldReadAvailable,
                requirementsTemplateFieldType = "Il2CppBLINK.RPGBuilder.Templates.RequirementsTemplate : UnityEngine.ScriptableObject",
                requirementsTemplateManagedNull = requirementsTemplateManagedNull,
                requirementsTemplateUnityNull = requirementsTemplateUnityNull,
                requirementsTemplateRepresentation = requirementsTemplateRepresentation,
                requirementsTemplateGroupsAvailable = requirementsTemplateGroupsAvailable,
                requirementsTemplateGroupCount = requirementsTemplateGroupCount,
                requirementsTemplateAvailable = requirementsTemplateAvailable,
                requirementsTemplateProjectionAvailable = requirementsTemplateProjectionAvailable,
                requirementsTemplate = requirementsTemplate
            },
            overrides = new
            {
                levels = new
                {
                    enabled = spawner.OverrideLevels,
                    minLevel = spawner.MinLevel,
                    maxLevel = spawner.MaxLevel
                },
                scaleWithPlayer = spawner.ScaleWithPlayer,
                zoneScaling = new
                {
                    enabled = spawner.OverrideZoneScaling,
                    minLevel = spawner.ZoneScalingMinLevel,
                    maxLevel = spawner.ZoneScalingMaxLevel
                },
                faction = new
                {
                    enabled = spawner.OverrideFaction,
                    value = spawner.Faction == null ? (object)null : projectEntry(spawner.Faction)
                },
                species = new
                {
                    enabled = spawner.OverrideSpecies,
                    value = spawner.Species == null ? (object)null : projectEntry(spawner.Species)
                },
                respawn = new
                {
                    enabled = spawner.OverrideRespawn,
                    minSeconds = spawner.MinRespawn,
                    maxSeconds = spawner.MaxRespawn
                },
                patrol = new
                {
                    enabled = spawner.OverridePatrol,
                    pointPauseSeconds = spawner.PatrolPointPause,
                    pathAvailable = patrolOverrideAvailable,
                    path = patrolOverride
                },
                leash = new
                {
                    enabled = spawner.OverrideLeash,
                    range = spawner.LeashRange
                }
            },
            runtime = new
            {
                nextAllowedSpawnTime = spawner.nextAllowedSpawnTime,
                pendingRespawnTimesAvailable = pendingRespawnTimesAvailable,
                pendingRespawnTimes = pendingRespawnTimes,
                framesBetweenBatchSpawns = spawner.framesBetweenBatchSpawns,
                groundLayers = new { value = spawner.groundLayers.value },
                gizmoColor = projectColor(spawner.gizmoColor),
                lineColor = projectColor(spawner.lineColor)
            },
            persistence = new
            {
                saverPresent = saver != null,
                saverIdentifier = saverIdentifier,
                saverIsDynamic = saverIsDynamic,
                saverIdentifierDynamic = saverIdentifierDynamic,
                savedState = savedSpawnerState
            }
        });
    }
}

Il2CppBLINK.RPGBuilder.AI.AdventurerPopulationManager[] populationManagers = null;
try
{
    populationManagers = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.AI.AdventurerPopulationManager>(true);
}
catch (System.Exception error)
{
    unresolved.Add(new
    {
        kind = "npcProducerFamilyScan",
        sourceFieldPath = "UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.AI.AdventurerPopulationManager>(includeInactive:true)",
        detail = error.GetType().FullName + ": " + error.Message
    });
}

if (populationManagers == null)
{
    sourceAdventurerPopulationManagerCount = -1;
}
else
{
    sourceAdventurerPopulationManagerCount = populationManagers.Length;
    for (var managerIndex = 0; managerIndex < populationManagers.Length; managerIndex++)
    {
        var manager = populationManagers[managerIndex];
        var managerScanPath = "AdventurerPopulationManager[" + managerIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        if (manager == null)
        {
            unresolved.Add(new
            {
                kind = "npcProducerFamily",
                sourceFieldPath = managerScanPath,
                detail = "FindObjectsOfType returned a null AdventurerPopulationManager."
            });
            adventurerPopulationManagers.Add(new
            {
                sourceIndex = managerIndex,
                sourcePath = managerScanPath,
                sourceScene = (object)null,
                source = (object)null,
                unavailable = "null AdventurerPopulationManager"
            });
            continue;
        }

        var managerSceneInfo = projectSourceScene(manager.gameObject.scene);
        var managerHierarchy = getHierarchy(manager.transform);
        var managerComponentIndex = -1;
        var managerComponentIndexAvailable = false;
        try
        {
            managerComponentIndex = manager.gameObject.GetComponentIndex(manager);
            managerComponentIndexAvailable = true;
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "npcProducerFamilyComponentIndex",
                sourceFieldPath = managerScanPath,
                detail = error.GetType().FullName + ": " + error.Message
            });
        }

        var managerComponentType = manager.GetType().FullName;
        var managerSourcePath = managerSceneInfo.Item2 + "::" + managerHierarchy.Item1 + "::" + managerComponentType + "[" + managerComponentIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        var rosterRows = new System.Collections.Generic.List<object>();
        var rosterAvailable = false;
        var rosterCount = -1;
        try
        {
            var roster = manager.AdventurerRoster;
            rosterAvailable = roster != null;
            if (!rosterAvailable)
            {
                adventurerRosterSourceCount = -1;
                unresolved.Add(new
                {
                    kind = "adventurerProducerRoster",
                    sourceFieldPath = managerSourcePath + ".AdventurerRoster",
                    detail = "AdventurerPopulationManager.AdventurerRoster returned null."
                });
            }
            else
            {
                rosterCount = roster.Count;
                if (adventurerRosterSourceCount >= 0) adventurerRosterSourceCount += rosterCount;
                for (var rosterIndex = 0; rosterIndex < rosterCount; rosterIndex++)
                {
                    var rosterPath = managerSourcePath + ".AdventurerRoster[" + rosterIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
                    try
                    {
                        var rosterNPC = roster[rosterIndex];
                        if (rosterNPC == null)
                        {
                            unresolved.Add(new
                            {
                                kind = "adventurerProducerRosterEntry",
                                sourceFieldPath = rosterPath,
                                detail = "AdventurerRoster entry is null."
                            });
                            rosterRows.Add(new
                            {
                                sourceIndex = rosterIndex,
                                sourceFieldPath = rosterPath,
                                npcId = (int?)null,
                                npc = (object)null,
                                unavailable = "null RPGNpc roster entry"
                            });
                            adventurerRosterExportedCount++;
                            continue;
                        }
                        rosterRows.Add(new
                        {
                            sourceIndex = rosterIndex,
                            sourceFieldPath = rosterPath,
                            npcId = (int?)rosterNPC.ID,
                            npc = projectEntry(rosterNPC),
                            selection = "global roster candidate; per-zone assignment and order are unresolved"
                        });
                        adventurerRosterExportedCount++;
                    }
                    catch (System.Exception error)
                    {
                        var detail = error.GetType().FullName + ": " + error.Message;
                        unresolved.Add(new { kind = "adventurerProducerRosterEntry", sourceFieldPath = rosterPath, detail = detail });
                        rosterRows.Add(new { sourceIndex = rosterIndex, sourceFieldPath = rosterPath, unavailable = detail });
                        adventurerRosterExportedCount++;
                    }
                }
            }
        }
        catch (System.Exception error)
        {
            rosterAvailable = false;
            adventurerRosterSourceCount = -1;
            unresolved.Add(new
            {
                kind = "adventurerProducerRoster",
                sourceFieldPath = managerSourcePath + ".AdventurerRoster",
                detail = error.GetType().FullName + ": " + error.Message
            });
        }

        adventurerPopulationManagers.Add(new
        {
            sourceIndex = managerIndex,
            sourcePath = managerSourcePath,
            sourceScene = managerSceneInfo.Item1,
            source = new
            {
                hierarchyPath = managerHierarchy.Item1,
                hierarchyNodes = managerHierarchy.Item2,
                componentType = managerComponentType,
                componentIndex = managerComponentIndex,
                saverIdentifier = (string)null,
                addressableAssetGuid = (string)null
            },
            sourceIdentity = new
            {
                status = "candidate only; repeat scene loads and equivalent extraction are required",
                provenStable = false,
                sourcePathCandidate = managerSourcePath,
                hierarchyPathCandidate = managerHierarchy.Item1,
                componentIndexAvailable = managerComponentIndexAvailable
            },
            activeSelf = manager.gameObject.activeSelf,
            activeInHierarchy = manager.gameObject.activeInHierarchy,
            enabled = manager.enabled,
            name = manager.name,
            managerType = managerComponentType,
            candidateRules = new
            {
                sourceFieldPath = managerSourcePath + ".AdventurerRoster",
                available = rosterAvailable,
                candidateCount = rosterCount,
                exportedCandidateCount = rosterRows.Count,
                candidates = rosterRows,
                semantics = "Recovered AdventurerRoster tooltip states that each roster asset can appear at most once; per-zone assignment and spawn order are not established by available native evidence."
            },
            overrides = new
            {
                faction = new
                {
                    enabled = manager.OverrideFaction != null,
                    value = manager.OverrideFaction == null ? (object)null : projectEntry(manager.OverrideFaction),
                    semantics = "Population-manager override applies to adventurers if native spawn behavior uses this field; scope is not independently recovered."
                }
            },
            runtime = new
            {
                deathReturnToPoolDelay = manager.DeathReturnToPoolDelay
            }
        });
    }
}

Il2CppBLINK.RPGBuilder.AI.AdventurerSpawnZone[] adventurerZones = null;
try
{
    adventurerZones = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.AI.AdventurerSpawnZone>(true);
}
catch (System.Exception error)
{
    unresolved.Add(new
    {
        kind = "npcProducerFamilyScan",
        sourceFieldPath = "UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.AI.AdventurerSpawnZone>(includeInactive:true)",
        detail = error.GetType().FullName + ": " + error.Message
    });
}

if (adventurerZones == null)
{
    sourceAdventurerZoneCount = -1;
}
else
{
    sourceAdventurerZoneCount = adventurerZones.Length;
    if (adventurerZones.Length > 0)
    {
        unresolved.Add(new
        {
            kind = "npcProducerFamily",
            sourceFieldPath = "UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.AI.AdventurerSpawnZone>(includeInactive:true)",
            detail = "AdventurerSpawnZone is an additional authored NPC producer family. Its global candidate roster is exported from AdventurerPopulationManager, but no recovered native method establishes which roster entries can spawn in each zone."
        });
    }
    for (var zoneIndex = 0; zoneIndex < adventurerZones.Length; zoneIndex++)
    {
        var zone = adventurerZones[zoneIndex];
        var zoneScanPath = "AdventurerSpawnZone[" + zoneIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        if (zone == null)
        {
            unresolved.Add(new
            {
                kind = "npcProducerFamily",
                sourceFieldPath = zoneScanPath,
                detail = "FindObjectsOfType returned a null AdventurerSpawnZone."
            });
            adventurerProducers.Add(new
            {
                sourceIndex = zoneIndex,
                sourcePath = zoneScanPath,
                sourceScene = (object)null,
                source = (object)null,
                unavailable = "null AdventurerSpawnZone"
            });
            continue;
        }

        var zoneSceneInfo = projectSourceScene(zone.gameObject.scene);
        var zoneHierarchy = getHierarchy(zone.transform);
        var zoneComponentIndex = -1;
        var zoneComponentIndexAvailable = false;
        try
        {
            zoneComponentIndex = zone.gameObject.GetComponentIndex(zone);
            zoneComponentIndexAvailable = true;
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "npcProducerFamilyComponentIndex",
                sourceFieldPath = zoneScanPath,
                detail = error.GetType().FullName + ": " + error.Message
            });
        }

        var zoneComponentType = zone.GetType().FullName;
        var zoneSourcePath = zoneSceneInfo.Item2 + "::" + zoneHierarchy.Item1 + "::" + zoneComponentType + "[" + zoneComponentIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        Il2CppSystem.Collections.Generic.List<Il2CppBLINK.RPGBuilder.Combat.CombatEntity> currentAdventurers = null;
        var currentAdventurersFieldReadAvailable = false;
        try
        {
            currentAdventurers = zone.CurrentAdventurers;
            currentAdventurersFieldReadAvailable = true;
        }
        catch (System.Exception error)
        {
            unresolved.Add(new
            {
                kind = "adventurerObservationList",
                sourceFieldPath = zoneSourcePath + ".CurrentAdventurers",
                detail = error.GetType().FullName + ": " + error.Message
            });
        }
        var currentAdventurerCount = currentAdventurers == null ? -1 : currentAdventurers.Count;
        if (currentAdventurersFieldReadAvailable)
        {
            collectAdventurerObservationList(currentAdventurers, zoneSourcePath, adventurerObservations, adventurerSeenInstanceIds);
        }

        var zonePosition = zone.transform.position;
        var zoneRotation = zone.transform.rotation;
        adventurerProducers.Add(new
        {
            sourceIndex = zoneIndex,
            sourcePath = zoneSourcePath,
            sourceScene = zoneSceneInfo.Item1,
            source = new
            {
                hierarchyPath = zoneHierarchy.Item1,
                hierarchyNodes = zoneHierarchy.Item2,
                componentType = zoneComponentType,
                componentIndex = zoneComponentIndex,
                saverIdentifier = (string)null,
                addressableAssetGuid = (string)null
            },
            sourceIdentity = new
            {
                status = "candidate only; repeat scene loads and equivalent extraction are required",
                provenStable = false,
                sourcePathCandidate = zoneSourcePath,
                hierarchyPathCandidate = zoneHierarchy.Item1,
                componentIndexAvailable = zoneComponentIndexAvailable
            },
            producerFamily = "adventurerSpawnZone",
            name = zone.name,
            position = new { x = zonePosition.x, y = zonePosition.y, z = zonePosition.z },
            rotation = new { x = zoneRotation.x, y = zoneRotation.y, z = zoneRotation.z, w = zoneRotation.w },
            activeSelf = zone.gameObject.activeSelf,
            activeInHierarchy = zone.gameObject.activeInHierarchy,
            enabled = zone.enabled,
            shape = new
            {
                kind = zone.usePosition ? "point" : "area",
                usePosition = zone.usePosition,
                radius = zone.areaRadius,
                height = zone.areaHeight,
                semantics = zone.usePosition ? "native fixed-position mode; XYZ is the authored transform position" : "native area mode; radius and height are preserved without generating sample coordinates"
            },
            count = new
            {
                maxAdventurers = zone.MaxAdventurers,
                currentAdventurerCount = currentAdventurerCount,
                currentAdventurersFieldReadAvailable = currentAdventurersFieldReadAvailable,
                semantics = "Native zone population limit is retained separately from the global roster and live observations."
            },
            activation = new
            {
                isActive = zone.IsActive,
                playerDistanceMax = zone.PlayerDistanceMax
            },
            candidateRules = new
            {
                sourceFieldPath = zoneSourcePath + ".candidateRules",
                candidateSourceFieldPath = "AdventurerPopulationManager.AdventurerRoster",
                available = false,
                candidateCount = -1,
                candidates = new System.Collections.Generic.List<object>(),
                semantics = "No candidate list is declared on AdventurerSpawnZone. The global manager roster is exported separately; per-zone applicability is unresolved."
            },
            conditions = new
            {
                sourceFieldPath = zoneSourcePath,
                available = false,
                semantics = "No requirement fields are declared on AdventurerSpawnZone; manager and native population conditions are not reconstructed."
            },
            overrides = new
            {
                faction = new
                {
                    available = false,
                    semantics = "No zone-level faction override is declared; any population-manager override is exported on the manager record without inferring zone ownership."
                }
            },
            spawnRules = new
            {
                navMeshSampleRadius = zone.navMeshSampleRadius,
                minWalkableRadius = zone.minWalkableRadius,
                groundLayers = new { value = zone.groundLayers.value }
            },
            runtime = new
            {
                gizmoColor = projectColor(zone.gizmoColor),
                lineColor = projectColor(zone.lineColor)
            }
        });
    }
}

return new
{
    schemaVersion = "compendium.npc-producers.v1",
    coverage = new
    {
        scope = "currently loaded Unity scenes",
        includesInactiveComponents = true,
        sourceComponentType = "Il2CppBLINK.RPGBuilder.AI.NPCSpawner",
        sourceCount = sourceSpawnerCount,
        additionalSourceComponentTypes = new[]
        {
            "Il2CppBLINK.RPGBuilder.AI.AdventurerSpawnZone",
            "Il2CppBLINK.RPGBuilder.AI.AdventurerPopulationManager"
        },
        additionalSourceCounts = new
        {
            adventurerSpawnZones = sourceAdventurerZoneCount,
            adventurerPopulationManagers = sourceAdventurerPopulationManagerCount
        },
        note = "Authored producers are separate from CurrentNPCs, CurrentPersistentNPCs, and AdventurerSpawnZone runtime observations."
    },
    producers = npcProducers,
    adventurerProducers = adventurerProducers,
    adventurerPopulationManagers = adventurerPopulationManagers,
    observations = new
    {
        currentNPCs = currentNPCObservations,
        currentPersistentNPCs = currentPersistentNPCObservations,
        currentAdventurers = adventurerObservations
    },
    requirementTemplates = requirementTemplates,
    runtimeNamingUncertainties = runtimeNamingUncertainties,
    sourceTotals = new
    {
        producers = sourceSpawnerCount,
        npcSpawnerComponents = sourceSpawnerCount,
        spawnDataCandidates = sourceCandidateCount,
        currentNPCs = currentNPCSourceCount,
        currentPersistentNPCs = currentPersistentNPCSourceCount,
        allObservations = currentNPCSourceCount + currentPersistentNPCSourceCount + adventurerObservationSourceCount,
        adventurerSpawnZones = sourceAdventurerZoneCount,
        adventurerPopulationManagers = sourceAdventurerPopulationManagerCount,
        adventurerRosterCandidates = adventurerRosterSourceCount,
        adventurerObservations = adventurerObservationSourceCount,
        currentNPCUnavailableLists = currentNPCUnavailableListCount,
        currentPersistentNPCUnavailableLists = currentPersistentNPCUnavailableListCount,
        adventurerUnavailableLists = adventurerUnavailableListCount
    },
    exportedTotals = new
    {
        producers = npcProducers.Count,
        observations = currentNPCObservations.Count + currentPersistentNPCObservations.Count,
        spawnDataCandidates = exportedCandidateCount,
        currentNPCs = currentNPCObservations.Count,
        currentPersistentNPCs = currentPersistentNPCObservations.Count,
        allObservations = currentNPCObservations.Count + currentPersistentNPCObservations.Count + adventurerObservations.Count,
        adventurerSpawnZones = adventurerProducers.Count,
        adventurerPopulationManagers = adventurerPopulationManagers.Count,
        adventurerRosterCandidates = adventurerRosterExportedCount,
        adventurerObservations = adventurerObservations.Count
    },
    totals = new
    {
        producers = npcProducers.Count,
        observations = currentNPCObservations.Count + currentPersistentNPCObservations.Count,
        sourceNPCSpawnerComponents = sourceSpawnerCount,
        exportedProducers = npcProducers.Count,
        sourceSpawnDataCandidates = sourceCandidateCount,
        exportedSpawnDataCandidates = exportedCandidateCount,
        sourceCurrentNPCs = currentNPCSourceCount,
        sourceCurrentPersistentNPCs = currentPersistentNPCSourceCount,
        sourceAllObservations = currentNPCSourceCount + currentPersistentNPCSourceCount + adventurerObservationSourceCount,
        sourceAdventurerSpawnZones = sourceAdventurerZoneCount,
        sourceAdventurerPopulationManagers = sourceAdventurerPopulationManagerCount,
        sourceAdventurerRosterCandidates = adventurerRosterSourceCount,
        sourceAdventurerObservations = adventurerObservationSourceCount,
        exportedCurrentNPCs = currentNPCObservations.Count,
        exportedCurrentPersistentNPCs = currentPersistentNPCObservations.Count,
        exportedAllObservations = currentNPCObservations.Count + currentPersistentNPCObservations.Count + adventurerObservations.Count,
        exportedAdventurerSpawnZones = adventurerProducers.Count,
        exportedAdventurerPopulationManagers = adventurerPopulationManagers.Count,
        exportedAdventurerRosterCandidates = adventurerRosterExportedCount,
        exportedAdventurerObservations = adventurerObservations.Count,
        adventurerObservationNullEntries = adventurerObservationNullCount,
        adventurerObservationDuplicateInstanceIds = adventurerObservationDuplicateCount,
        adventurerUnavailableLists = adventurerUnavailableListCount,
        requirementsTemplateManagedNull = requirementsTemplateManagedNullCount,
        requirementsTemplateUnityNull = requirementsTemplateUnityNullCount,
        requirementsTemplateNativeObjects = requirementsTemplateNativeObjectCount,
        requirementsTemplateFieldReadFailures = requirementsTemplateFieldReadFailureCount,
        currentNPCNullEntries = currentNPCNullCount,
        currentPersistentNPCNullEntries = currentPersistentNPCNullCount,
        currentNPCUnavailableLists = currentNPCUnavailableListCount,
        currentPersistentNPCUnavailableLists = currentPersistentNPCUnavailableListCount,
        currentNPCDuplicateInstanceIds = currentNPCDuplicateCount,
        currentPersistentNPCDuplicateInstanceIds = currentPersistentNPCDuplicateCount,
        observationDeduplication = "Runtime instance IDs are used only to deduplicate within each named observation list; they are never canonical entity or source identities."
    },
    unresolved = unresolved
};

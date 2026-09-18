import sharp from "sharp";
import { ArtifactStore, type ObjectWriteProtection } from "@afallon/artifacts";
import type { CatalogArtworkBinding, CatalogEntityRow } from "@afallon/contracts/catalog";
import type { Art, ArtRef } from "@afallon/contracts/public";
import type { PublicationCandidateAsset } from "./selection";

export interface GeneratedArtworkResources {
  artByEntity: ReadonlyMap<string, Art>;
  assetsByPath: ReadonlyMap<string, PublicationCandidateAsset>;
}

const WIDTH_BY_ROLE: Readonly<Record<CatalogArtworkBinding["role"], number>> = {
  icon: 128,
  portrait: 512,
  artwork: 1600,
};

export async function generateArtworkResources(
  store: ArtifactStore,
  entities: readonly CatalogEntityRow[],
  protection?: ObjectWriteProtection,
): Promise<GeneratedArtworkResources> {
  const variants = new Map<string, ArtRef>();
  const assetsByPath = new Map<string, PublicationCandidateAsset>();
  const artByEntity = new Map<string, Art>();
  for (const entity of entities) {
    const art: Art = {};
    for (const binding of entity.artwork) {
      if (art[binding.role]) continue;
      const variantKey = `${binding.sha256}:${WIDTH_BY_ROLE[binding.role]}`;
      let ref = variants.get(variantKey);
      if (!ref) {
        await store.verify({ sha256: binding.sha256, bytes: binding.bytes });
        // Entity art is decorative and displayed below its encoded size, so q86 avoids a large
        // lossless penalty without a visible change. Map tiles remain lossless because they are
        // calibrated source imagery whose pixels must stay exact.
        const output = await sharp(store.objectPath(binding.sha256))
          .resize({ width: WIDTH_BY_ROLE[binding.role] })
          .webp({ quality: 86, effort: 5 })
          .toBuffer({ resolveWithObject: true });
        if (!output.info.width || !output.info.height) throw new Error(`Artwork variant has no dimensions: ${binding.assetId}.`);
        const stored = await store.putBytes(output.data, protection);
        ref = { url: `art/${stored.sha256}.webp`, sha256: stored.sha256, bytes: stored.bytes, width: output.info.width, height: output.info.height };
        variants.set(variantKey, ref);
        assetsByPath.set(ref.url, { path: ref.url, identity: { sha256: ref.sha256, bytes: ref.bytes } });
      }
      art[binding.role] = ref;
    }
    if (Object.keys(art).length > 0) artByEntity.set(entity.entityKey, art);
  }
  return { artByEntity, assetsByPath };
}

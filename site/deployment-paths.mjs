import { join } from "node:path";

export function deploymentPaths(siteDir = process.cwd()) {
  const root = join(siteDir, ".stage", "production");
  return {
    root,
    staticDir: join(root, "static"),
    outputDir: join(root, "output"),
  };
}

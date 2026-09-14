const packageDependencies = {
  contracts: [],
  artifacts: ["contracts"],
  runtime: ["contracts"],
  scan: ["contracts", "artifacts", "runtime"],
  capture: ["contracts", "artifacts", "runtime"],
  catalog: ["contracts", "artifacts"],
  publication: ["contracts", "artifacts", "catalog"],
};

const packageRules = Object.entries(packageDependencies).map(([name, dependencies]) => ({
  name: `${name}-dependency-direction`,
  comment: `${name} may import only its declared lower-level packages`,
  severity: "error",
  from: { path: `^packages/${name}/` },
  to: { path: `^packages/(?!${[name, ...dependencies].join("|")}/)` },
}));

module.exports = {
  forbidden: [
    {
      name: "no-circular-packages",
      severity: "error",
      from: { path: "^(apps|packages)/" },
      to: { circular: true },
    },
    {
      name: "no-unresolved-workspace-imports",
      severity: "error",
      from: { path: "^(apps|packages)/" },
      to: { couldNotResolve: true, pathNot: "^\\$(?:app|lib)(?:/|$)" },
    },
    {
      name: "packages-do-not-import-apps-or-legacy",
      severity: "error",
      from: { path: "^packages/" },
      to: { path: "^(apps|tools|pipeline|site)/" },
    },
    {
      name: "cli-does-not-import-legacy",
      severity: "error",
      from: { path: "^apps/compendium-cli/" },
      to: { path: "^(tools|pipeline|site)/" },
    },
    {
      name: "site-imports-public-contracts-only",
      severity: "error",
      from: { path: "^apps/site/" },
      to: { path: "^(tools|pipeline|site|packages/(?!contracts/src/public(?:/|$)))" },
    },
    ...packageRules,
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.base.json" },
    enhancedResolveOptions: {
      conditionNames: ["import", "types", "default"],
      exportsFields: ["exports"],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
};

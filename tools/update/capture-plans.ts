export {};
// Operator tool: captures each plan in its own sweep, so a finished plan is sealed at once and a later game failure
// cannot discard it. A plan whose tiles an earlier sealed run already holds reuses them. Stops at the first failure.
// usage: bun tools/update/capture-plans.ts CONFIG PLAN...
const [configPath, ...plans] = Bun.argv.slice(2);
if (!configPath || plans.length === 0) throw new Error("usage: capture-plans CONFIG PLAN...");
for (const [index, plan] of plans.entries()) {
  console.log(`capture ${index + 1}/${plans.length}: ${plan}`);
  const child = Bun.spawn(["bun", "run", "compendium", "capture", "--config", configPath, "--plan", plan, "--candidate"], { stdout: "inherit", stderr: "inherit" });
  const code = await child.exited;
  if (code !== 0) throw new Error(`Capture of ${plan} failed with exit code ${code}; plans before it are sealed.`);
}
console.log(`captured ${plans.length} plans`);

export interface DependencyRisk {
  name: string;
  risk: "none" | "low" | "medium" | "high";
  reason: string;
}

export class SupplyChain {
  inspectPackageJson(packageJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }): DependencyRisk[] {
    const deps = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) };
    return Object.entries(deps).map(([name, version]) => ({
      name,
      risk: version === "latest" ? "medium" : "low",
      reason: version === "latest" ? "Floating version; lockfile must be reviewed." : "Pinned by package lock."
    }));
  }
}

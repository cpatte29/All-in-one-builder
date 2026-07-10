import type { PackManifest } from "./types";

const registry = new Map<string, PackManifest>();

export function registerPack(manifest: PackManifest): void {
  registry.set(manifest.id, manifest);
}

export function packFor(id: string): PackManifest {
  const pack = registry.get(id);
  if (!pack) {
    throw new Error(`No content pack registered for id "${id}". Check registerPacks.ts at the template root.`);
  }
  return pack;
}

/** Test-only. Never called from a production code path. */
export function __resetPackRegistryForTests(): void {
  registry.clear();
}

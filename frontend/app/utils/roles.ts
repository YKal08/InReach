export type RoleLike = string | { name?: string | null } | null | undefined;

function normalizeRoleName(role: RoleLike): string | null {
  if (!role) return null;
  if (typeof role === "string") return role.trim().toUpperCase();
  if (typeof role.name === "string") return role.name.trim().toUpperCase();
  return null;
}

export function extractRoleNames(roles: RoleLike[] | null | undefined): string[] {
  if (!Array.isArray(roles)) return [];
  const unique = new Set<string>();

  for (const role of roles) {
    const normalized = normalizeRoleName(role);
    if (normalized) unique.add(normalized);
  }

  return Array.from(unique);
}

export function hasRole(roles: RoleLike[] | null | undefined, targetRole: string): boolean {
  const target = targetRole.trim().toUpperCase();
  return extractRoleNames(roles).includes(target);
}

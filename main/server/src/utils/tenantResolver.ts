type TenantRelationLike = {
  tenantId?: string;
  role?: {
    permissions?: Array<{ code: string }>;
  };
  tenant?: {
    id: string;
    slug: string;
    status?: string;
    name?: string;
    logo?: string | null;
    plan?: { name?: string; features?: Record<string, unknown> } | null;
    features?: Record<string, unknown>;
  };
};

export const resolveActiveTenantRelation = (
  tenantRelations: TenantRelationLike[] = [],
  requestedSlug?: string
): TenantRelationLike | undefined => {
  if (!tenantRelations.length) {
    return undefined;
  }

  if (requestedSlug) {
    const requested = tenantRelations.find(
      (relation) => relation.tenant?.slug?.toLowerCase() === requestedSlug.toLowerCase()
    );
    if (requested) {
      return requested;
    }
  }

  const nonStoreAiActive = tenantRelations.find(
    (relation) => relation.tenant?.status === 'ACTIVE' && relation.tenant?.slug?.toLowerCase() !== 'storeai'
  );

  if (nonStoreAiActive) {
    return nonStoreAiActive;
  }

  const activeTenant = tenantRelations.find((relation) => relation.tenant?.status === 'ACTIVE');
  if (activeTenant) {
    return activeTenant;
  }

  return tenantRelations[0];
};

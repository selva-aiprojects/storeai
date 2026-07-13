import assert from 'assert';
import { resolveActiveTenantRelation } from './tenantResolver';

const tenants = [
  {
    tenantId: 'storeai-tenant',
    tenant: { id: 'storeai-tenant', slug: 'storeai', status: 'ACTIVE' }
  },
  {
    tenantId: 'acme-tenant',
    tenant: { id: 'acme-tenant', slug: 'acme', status: 'ACTIVE' }
  }
];

const resolved = resolveActiveTenantRelation(tenants as any);
assert.ok(resolved, 'Expected a tenant relationship to be resolved');
assert.strictEqual(resolved?.tenant?.slug, 'acme', 'Expected a non-storeai active tenant to be preferred when no tenant slug is provided');

const requested = resolveActiveTenantRelation(tenants as any, 'storeai');
assert.ok(requested, 'Expected a tenant relationship to be resolved');
assert.strictEqual(requested?.tenant?.slug, 'storeai', 'Expected the requested tenant slug to be honored');

console.log('tenant resolver regression test passed');

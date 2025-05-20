import { describe, it, expect } from 'vitest';
import { runTrafficFinesSystemHealthCheck, testTrafficFineAssignment } from '@/utils/traffic-fines-test-utils';
import { checkDatabaseHealth, runDatabaseDiagnostics } from '@/utils/database-health-check';

describe('traffic fines utilities', () => {
  it('runs system health check', async () => {
    const result = await runTrafficFinesSystemHealthCheck();
    expect(result).toHaveProperty('status');
  });

  it('tests traffic fine assignment', async () => {
    const result = await testTrafficFineAssignment('test-id');
    expect(result).toHaveProperty('success');
  });

  it('checks database health', async () => {
    const result = await checkDatabaseHealth();
    expect(result).toHaveProperty('isHealthy');
  });

  it('runs database diagnostics', async () => {
    const result = await runDatabaseDiagnostics();
    expect(result).toHaveProperty('isConnected');
  });
});

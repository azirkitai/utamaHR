// Environment variables checker untuk production deployment
export interface EnvCheckResult {
  name: string;
  exists: boolean;
  length?: number;
  status: 'OK' | 'MISSING' | 'EMPTY';
  message?: string;
}

export interface EnvCheckSummary {
  allValid: boolean;
  results: EnvCheckResult[];
  timestamp: string;
  environment: string;
}

const REQUIRED_SECRETS = [
  {
    name: 'JWT_SECRET',
    minLength: 32,
    description: 'JWT token signing secret'
  },
  {
    name: 'SESSION_SECRET', 
    minLength: 32,
    description: 'Express session secret'
  },
  {
    name: 'DATABASE_URL',
    minLength: 20,
    description: 'PostgreSQL connection string'
  }
];

export function checkEnvironmentSecrets(): EnvCheckSummary {
  const results: EnvCheckResult[] = [];
  let allValid = true;

  for (const secret of REQUIRED_SECRETS) {
    const value = process.env[secret.name];
    const exists = !!value;
    const length = value ? value.length : 0;
    
    let status: 'OK' | 'MISSING' | 'EMPTY' = 'OK';
    let message = '';

    if (!exists) {
      status = 'MISSING';
      message = `Secret ${secret.name} tidak wujud within environment variables`;
      allValid = false;
    } else if (length === 0) {
      status = 'EMPTY';
      message = `Secret ${secret.name} wujud tetapi kosong`;
      allValid = false;
    } else if (length < secret.minLength) {
      status = 'OK'; // Still OK but with warning
      message = `Secret ${secret.name} mungkin terlalu pendek (${length} chars, recommended: ${secret.minLength}+)`;
    }

    results.push({
      name: secret.name,
      exists,
      length: exists ? length : undefined,
      status,
      message: message || `Secret ${secret.name} configured correctly`
    });
  }

  return {
    allValid,
    results,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };
}

export function logEnvironmentCheck(): void {
  const check = checkEnvironmentSecrets();
  
  console.log('\n=== ENVIRONMENT SECRETS CHECK ===');
  console.log(`Environment: ${check.environment}`);
  console.log(`Timestamp: ${check.timestamp}`);
  console.log(`Overall Status: ${check.allValid ? '✅ ALL OK' : '❌ ISSUES FOUND'}`);
  console.log('');

  for (const result of check.results) {
    const icon = result.status === 'OK' ? '✅' : '❌';
    const lengthInfo = result.length ? ` (${result.length} chars)` : '';
    
    console.log(`${icon} ${result.name}_EXISTS: ${result.exists}${lengthInfo}`);
    if (result.message) {
      console.log(`   → ${result.message}`);
    }
  }
  
  console.log('\n=== END CHECK ===\n');
}

// Auto-check on startup
export function initializeEnvironmentCheck(): void {
  logEnvironmentCheck();
  
  // Check for missing critical secrets
  const check = checkEnvironmentSecrets();
  if (!check.allValid) {
    console.warn('⚠️  WARNING: Missing or invalid environment secrets detected!');
    console.warn('Please check your Replit Secrets configuration.');
  }
}
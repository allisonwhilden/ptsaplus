#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates all required environment variables are set for production deployment
 * Run before deployment: npx tsx scripts/validate-env.ts
 */

interface EnvVariable {
  name: string;
  required: boolean;
  description: string;
  format?: RegExp;
  minLength?: number;
  production?: boolean; // Only required in production
}

const ENV_VARIABLES: EnvVariable[] = [
  // Supabase
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    format: /^https:\/\/.+\.supabase\.co$/,
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key',
    minLength: 40,
  },
  {
    name: 'SUPABASE_SERVICE_KEY',
    required: true,
    description: 'Supabase service role key',
    minLength: 40,
  },
  
  // Clerk
  {
    name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    required: true,
    description: 'Clerk publishable key',
    format: /^pk_(test|live)_.+/,
  },
  {
    name: 'CLERK_SECRET_KEY',
    required: true,
    description: 'Clerk secret key',
    format: /^sk_(test|live)_.+/,
  },
  {
    name: 'CLERK_WEBHOOK_SECRET',
    required: false,
    description: 'Clerk webhook secret',
    format: /^whsec_.+/,
  },
  
  // Stripe
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: true,
    description: 'Stripe publishable key',
    format: /^pk_(test|live)_.+/,
  },
  {
    name: 'STRIPE_SECRET_KEY',
    required: true,
    description: 'Stripe secret key',
    format: /^sk_(test|live)_.+/,
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: true,
    description: 'Stripe webhook secret',
    format: /^whsec_.+/,
  },
  
  // Encryption Keys (CRITICAL for production)
  {
    name: 'ENCRYPTION_KEY_PII',
    required: true,
    production: true,
    description: 'AES-256 key for PII encryption (32 bytes hex)',
    format: /^[a-f0-9]{64}$/,
    minLength: 64,
  },
  {
    name: 'ENCRYPTION_KEY_FINANCIAL',
    required: true,
    production: true,
    description: 'AES-256 key for financial data encryption (32 bytes hex)',
    format: /^[a-f0-9]{64}$/,
    minLength: 64,
  },
  {
    name: 'ENCRYPTION_KEY_HEALTH',
    required: true,
    production: true,
    description: 'AES-256 key for health data encryption (32 bytes hex)',
    format: /^[a-f0-9]{64}$/,
    minLength: 64,
  },
  {
    name: 'HASH_SALT',
    required: true,
    production: true,
    description: 'Salt for PBKDF2 key derivation',
    minLength: 32,
  },
  
  // OpenAI (optional)
  {
    name: 'OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key for AI features',
    format: /^sk-.+/,
  },
  
  // Cron Security
  {
    name: 'CRON_SECRET',
    required: true,
    production: true,
    description: 'Secret for authenticating cron job requests',
    minLength: 32,
  },
  
  // Session
  {
    name: 'SESSION_SECRET',
    required: true,
    production: true,
    description: 'Secret for signing session cookies',
    minLength: 32,
  },
];

function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log('🔍 Validating environment variables...\n');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
  
  for (const variable of ENV_VARIABLES) {
    const value = process.env[variable.name];
    
    // Skip non-required variables
    if (!variable.required && !value) {
      console.log(`⚪ ${variable.name}: Optional (not set)`);
      continue;
    }
    
    // Skip production-only variables in development
    if (variable.production && !isProduction && !value) {
      console.log(`⚪ ${variable.name}: Production only (skipped)`);
      continue;
    }
    
    // Check if required variable is missing
    if (variable.required && !value) {
      errors.push(`❌ ${variable.name}: Missing (${variable.description})`);
      console.log(`❌ ${variable.name}: Missing`);
      continue;
    }
    
    // Validate format
    if (value && variable.format && !variable.format.test(value)) {
      errors.push(`❌ ${variable.name}: Invalid format (${variable.description})`);
      console.log(`❌ ${variable.name}: Invalid format`);
      continue;
    }
    
    // Validate minimum length
    if (value && variable.minLength && value.length < variable.minLength) {
      errors.push(`❌ ${variable.name}: Too short (min ${variable.minLength} chars)`);
      console.log(`❌ ${variable.name}: Too short`);
      continue;
    }
    
    // Check for test keys in production
    if (isProduction && value) {
      if (value.includes('test') || value.includes('TEST')) {
        errors.push(`⚠️  ${variable.name}: Contains 'test' - verify this is intentional`);
        console.log(`⚠️  ${variable.name}: Test key in production?`);
        continue;
      }
    }
    
    console.log(`✅ ${variable.name}: Valid`);
  }
  
  // Additional security checks
  console.log('\n🔒 Security Checks:\n');
  
  // Check encryption keys are different
  const piiKey = process.env.ENCRYPTION_KEY_PII;
  const financialKey = process.env.ENCRYPTION_KEY_FINANCIAL;
  const healthKey = process.env.ENCRYPTION_KEY_HEALTH;
  
  if (piiKey && financialKey && healthKey) {
    if (piiKey === financialKey || piiKey === healthKey || financialKey === healthKey) {
      errors.push('❌ Encryption keys must be unique for each data type');
      console.log('❌ Encryption keys are not unique');
    } else {
      console.log('✅ Encryption keys are unique');
    }
  }
  
  // Check for default values
  if (process.env.HASH_SALT === 'default-salt-change-in-production') {
    errors.push('❌ HASH_SALT is using default value - must be changed for production');
    console.log('❌ HASH_SALT is default value');
  }
  
  return { valid: errors.length === 0, errors };
}

// Generate encryption keys helper
function generateKeys() {
  console.log('\n🔑 To generate secure encryption keys:\n');
  console.log('Run the following commands:\n');
  console.log('  # Generate PII encryption key');
  console.log('  openssl rand -hex 32\n');
  console.log('  # Generate Financial encryption key');
  console.log('  openssl rand -hex 32\n');
  console.log('  # Generate Health encryption key');
  console.log('  openssl rand -hex 32\n');
  console.log('  # Generate hash salt');
  console.log('  openssl rand -base64 32\n');
  console.log('  # Generate session secret');
  console.log('  openssl rand -base64 32\n');
  console.log('  # Generate cron secret');
  console.log('  openssl rand -base64 32\n');
}

// Main execution
if (require.main === module) {
  const { valid, errors } = validateEnvironment();
  
  console.log('\n' + '='.repeat(60));
  
  if (valid) {
    console.log('\n✅ All environment variables are valid!\n');
    process.exit(0);
  } else {
    console.log(`\n❌ Found ${errors.length} issue(s):\n`);
    errors.forEach(error => console.log(`  ${error}`));
    generateKeys();
    process.exit(1);
  }
}

export { validateEnvironment };
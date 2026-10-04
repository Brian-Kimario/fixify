#!/usr/bin/env node

/**
 * OAuth Configuration Verification Script
 * 
 * Checks:
 * 1. Supabase OAuth configuration
 * 2. Environment variables
 * 3. Redirect URL configuration
 * 4. Database tables exist
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(type, message) {
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
  }[type] || '•';

  console.log(`${prefix} ${message}`);
}

function logSection(title) {
  console.log('\n' + colors.bright + colors.blue + title + colors.reset);
  console.log('─'.repeat(60));
}

async function main() {
  console.log('\n' + colors.bright + colors.blue + '╔════════════════════════════════════════════════════════════════╗' + colors.reset);
  console.log(colors.bright + colors.blue + '║        OAuth Configuration Verification                       ║' + colors.reset);
  console.log(colors.bright + colors.blue + '╚════════════════════════════════════════════════════════════════╝' + colors.reset + '\n');

  const projectRoot = path.resolve(__dirname, '..');
  const envPath = path.join(projectRoot, '.env.local');
  const envExamplePath = path.join(projectRoot, '.env.example');

  // 1. Check environment files
  logSection('1. Environment Configuration');

  if (fs.existsSync(envPath)) {
    log('success', '.env.local exists');
    const envContent = fs.readFileSync(envPath, 'utf-8');

    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_APP_URL',
    ];

    let allFound = true;
    for (const envVar of requiredEnvVars) {
      if (envContent.includes(`${envVar}=`)) {
        log('success', `${envVar} is set`);
      } else {
        log('error', `${envVar} is MISSING`);
        allFound = false;
      }
    }

    if (allFound) {
      log('success', 'All required environment variables are present');
    }

    // Parse and check values
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
    const appUrlMatch = envContent.match(/NEXT_PUBLIC_APP_URL=(.+)/);

    if (urlMatch) {
      const supabaseUrl = urlMatch[1].trim();
      log('info', `Supabase URL: ${supabaseUrl}`);
      
      if (supabaseUrl.includes('supabase.co')) {
        log('success', 'Supabase URL format is valid');
      } else {
        log('error', 'Supabase URL format looks invalid');
      }
    }

    if (appUrlMatch) {
      const appUrl = appUrlMatch[1].trim();
      log('info', `App URL: ${appUrl}`);
      
      if (appUrl.includes('localhost') || appUrl.includes('vercel.app')) {
        log('success', 'App URL format is valid');
      } else {
        log('warning', 'App URL should be localhost or vercel.app');
      }
    }
  } else {
    log('error', '.env.local does not exist');
    log('info', 'Create it by copying .env.example and filling in values');
  }

  // 2. Check source files
  logSection('2. Authentication Files');

  const filesToCheck = [
    {
      path: 'src/app/auth/callback/route.ts',
      description: 'OAuth callback handler',
    },
    {
      path: 'src/app/auth/actions.ts',
      description: 'Auth server actions',
    },
    {
      path: 'src/app/auth/login/page.tsx',
      description: 'Login page',
    },
    {
      path: 'src/middleware.ts',
      description: 'Request middleware',
    },
  ];

  for (const file of filesToCheck) {
    const filePath = path.join(projectRoot, file.path);
    if (fs.existsSync(filePath)) {
      log('success', `${file.description}: ${file.path}`);
      
      // Check for key functions
      const content = fs.readFileSync(filePath, 'utf-8');
      if (file.path.includes('callback') && !content.includes('exchangeCodeForSession')) {
        log('warning', '  → Missing exchangeCodeForSession call');
      }
      if (file.path.includes('callback') && !content.includes('profiles')) {
        log('warning', '  → Missing profile lookup');
      }
    } else {
      log('error', `${file.description}: ${file.path} NOT FOUND`);
    }
  }

  // 3. Check database schema
  logSection('3. Database Schema');

  const migrationsDir = path.join(projectRoot, 'supabase', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrations = fs.readdirSync(migrationsDir);
    log('success', `Found ${migrations.length} migrations`);

    // Check for profiles table
    let hasProfilesTable = false;
    for (const migration of migrations) {
      const content = fs.readFileSync(path.join(migrationsDir, migration), 'utf-8');
      if (content.includes('profiles') || content.includes('CREATE TABLE') && content.includes('role')) {
        hasProfilesTable = true;
        log('success', `Profiles table created in: ${migration}`);
        
        // Check for required columns
        if (content.includes('role')) {
          log('success', '  → role column present');
        }
        if (content.includes('id') && content.includes('user_id')) {
          log('success', '  → user_id column present');
        }
      }
    }

    if (!hasProfilesTable) {
      log('warning', 'Could not verify profiles table in migrations');
    }
  } else {
    log('warning', 'Migrations directory not found');
  }

  // 4. OAuth Flow Verification
  logSection('4. OAuth Flow Configuration');

  log('info', 'Expected OAuth redirect URLs:');
  console.log(`  • Local:      http://localhost:3000/auth/callback`);
  console.log(`  • Production: https://fixify-brian-kimarios-projects.vercel.app/auth/callback`);

  log('info', 'To verify in Supabase:');
  console.log(`  1. Go to: https://supabase.co/dashboard`);
  console.log(`  2. Select your project`);
  console.log(`  3. Navigate to: Authentication → Providers → Google`);
  console.log(`  4. Check "Redirect URLs" section includes both URLs above`);
  console.log(`  5. Ensure Google OAuth credentials are configured`);

  // 5. Key Configuration Points
  logSection('5. Critical OAuth Settings');

  log('info', 'For OAuth to work correctly:');
  log('info', '✓ Vercel Deployment Protection must be DISABLED');
  log('info', '✓ NEXT_PUBLIC_APP_URL must match your deployment domain');
  log('info', '✓ Supabase redirect URLs must include /auth/callback');
  log('info', '✓ Profiles table must have auto-creation trigger (optional but recommended)');

  // 6. Test recommendations
  logSection('6. Testing Recommendations');

  log('info', 'Manual testing:');
  console.log(`  1. Start local dev: npm run dev`);
  console.log(`  2. Visit: http://localhost:3000/auth/login`);
  console.log(`  3. Click "Continue with Google"`);
  console.log(`  4. Sign in and verify redirect to /customer`);
  console.log(`  5. Check browser console for errors`);

  log('info', 'Automated testing:');
  console.log(`  • Run: npm run test:oauth:local`);
  console.log(`  • Run: npm run test:oauth:prod`);
  console.log(`  • Run: npm run test:oauth:watch (for development)`);

  // 7. Summary
  logSection('7. Verification Summary');

  let passCount = 0;
  let issues = [];

  if (fs.existsSync(envPath)) passCount++;
  else issues.push('Missing .env.local file');

  const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
  if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL=')) passCount++;
  else issues.push('NEXT_PUBLIC_SUPABASE_URL not configured');

  if (envContent.includes('NEXT_PUBLIC_APP_URL=')) passCount++;
  else issues.push('NEXT_PUBLIC_APP_URL not configured');

  if (fs.existsSync(path.join(projectRoot, 'src/app/auth/callback/route.ts'))) passCount++;
  else issues.push('Callback handler missing');

  if (fs.existsSync(migrationsDir)) passCount++;
  else issues.push('Migrations directory missing');

  console.log(`\n${colors.bright}Configuration Score: ${passCount}/5${colors.reset}`);

  if (issues.length > 0) {
    console.log(`\n${colors.yellow}Issues found:${colors.reset}`);
    issues.forEach((issue) => log('error', issue));
  } else {
    console.log(`\n${colors.green}All checks passed! OAuth should be configured correctly.${colors.reset}`);
  }

  console.log('\n' + colors.bright + colors.blue + '═'.repeat(60) + colors.reset + '\n');
}

main().catch((err) => {
  console.error(colors.red + 'Error:' + colors.reset, err.message);
  process.exit(1);
});

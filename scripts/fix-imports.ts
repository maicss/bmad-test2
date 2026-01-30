/**
 * Fix missing imports in API files
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const filesNeedingImports = [
  'app/api/points/adjust/route.ts',
  'app/api/tasks/route.ts',
  'app/api/tasks/[id]/complete/route.ts',
  'app/api/wishes/route.ts',
  'app/api/wishes/[id]/route.ts',
  'app/api/wishes/[id]/approve/route.ts',
  'app/api/wishes/[id]/redeem/route.ts',
  'app/api/auth/parent-login/route.ts',
  'app/api/auth/admin-login/route.ts',
  'app/api/auth/child-login/route.ts',
  'app/api/auth/logout/route.ts',
  'app/api/auth/session-check/route.ts',
  'app/api/auth/otp/send/route.ts',
];

const importLine = 'import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";';

for (const file of filesNeedingImports) {
  const fullPath = join(process.cwd(), file);
  
  try {
    let content = readFileSync(fullPath, 'utf-8');
    
    if (!content.includes('from "@/lib/constant"')) {
      // Find a good place to insert import (after other imports)
      const lines = content.split('\n');
      let lastImportIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      
      if (lastImportIndex >= 0) {
        lines.splice(lastImportIndex + 1, 0, importLine);
        content = lines.join('\n');
        writeFileSync(fullPath, content, 'utf-8');
        console.log(`✅ Added import to: ${file}`);
      } else {
        console.log(`⚠️  No imports found in: ${file}`);
      }
    } else {
      console.log(`⏭️  Already has import: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Failed to fix ${file}:`, error);
  }
}

console.log('\n✨ Import fix complete!');

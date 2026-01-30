/**
 * Batch fix API error response formats
 * Convert from { success: false, error/message: ... } to { code: ..., message: ..., details?: ... }
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const filesToFix = [
  'app/api/tasks/route.ts',
  'app/api/tasks/[id]/route.ts',
  'app/api/tasks/[id]/complete/route.ts',
  'app/api/auth/parent-login/route.ts',
  'app/api/auth/admin-login/route.ts',
  'app/api/auth/child-login/route.ts',
  'app/api/auth/logout/route.ts',
  'app/api/auth/session-check/route.ts',
  'app/api/auth/otp/send/route.ts',
  'app/api/wishes/route.ts',
  'app/api/wishes/[id]/route.ts',
  'app/api/wishes/[id]/approve/route.ts',
  'app/api/wishes/[id]/redeem/route.ts',
  'app/api/points/route.ts',
  'app/api/points/adjust/route.ts',
  'app/api/points/history/route.ts',
];

function getErrorCode(status: number, message: string): string {
  if (message.includes('Unauthorized') || status === 401) return 'ErrorCodes.UNAUTHORIZED';
  if (message.includes('Access denied') || message.includes('permission') || status === 403) return 'ErrorCodes.FORBIDDEN';
  if (message.includes('Validation') || message.includes('required') || status === 400) return 'ErrorCodes.VALIDATION_ERROR';
  if (message.includes('not found') || status === 404) return 'ErrorCodes.NOT_FOUND';
  if (message.includes('already exists') || status === 409) return 'ErrorCodes.CONFLICT';
  return 'ErrorCodes.INTERNAL_ERROR';
}

function fixFile(filePath: string): boolean {
  const fullPath = join(process.cwd(), filePath);
  
  try {
    let content = readFileSync(fullPath, 'utf-8');
    const originalContent = content;
    
    // Remove file-level docstrings
    content = content.replace(/\/\*\*[\s\S]*?\*\/\s*\n\s*import/m, 'import');
    
    // Add import for ErrorCodes and helpers if not present
    if (!content.includes('from "@/lib/constant"')) {
      // Find the last import statement
      const lastImportMatch = content.match(/import .* from ".*";?\s*\n(?=const|function|export|\/\/)/);
      if (lastImportMatch) {
        const importStatement = 'import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/constant";\n';
        content = content.replace(lastImportMatch[0], lastImportMatch[0] + importStatement);
      }
    }
    
    // Replace error responses
    // Pattern 1: { success: false, error: "..." }
    content = content.replace(
      /return Response\.json\(\s*\{\s*success:\s*false,\s*(?:error|message):\s*"([^"]+)"\s*\},?\s*\{\s*status:\s*(\d+)\s*\}\s*\);?/g,
      (match, message, status) => {
        const code = getErrorCode(parseInt(status), message);
        return `return Response.json(\n        createErrorResponse(${code}, "${message}"),\n        { status: ${status} }\n      );`;
      }
    );
    
    // Replace success responses
    // Pattern: { success: true, data: ... }
    content = content.replace(
      /return Response\.json\(\{\s*success:\s*true,\s*data:\s*([^}]+)\}\);?/g,
      'return Response.json(createSuccessResponse($1));'
    );
    
    // Pattern with status: { success: true, data: ... }, { status: 201 }
    content = content.replace(
      /return Response\.json\(\{\s*success:\s*true,\s*data:\s*([^}]+)\},\s*\{\s*status:\s*(\d+)\s*\}\);?/g,
      'return Response.json(createSuccessResponse($1), { status: $2 });'
    );
    
    // Fix error responses in catch blocks with error variable
    content = content.replace(
      /return Response\.json\(\s*\{\s*success:\s*false,\s*(?:error|message):\s*"Internal server error"(?:,\s*error:\s*(\w+))?\s*\},?\s*\{\s*status:\s*500\s*\}\s*\);?/g,
      (match, errorVar) => {
        if (errorVar) {
          return `return Response.json(\n      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error", ${errorVar}),\n      { status: 500 }\n    );`;
        }
        return `return Response.json(\n      createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error"),\n      { status: 500 }\n    );`;
      }
    );
    
    if (content !== originalContent) {
      writeFileSync(fullPath, content, 'utf-8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Failed to fix ${filePath}:`, error);
    return false;
  }
}

console.log('🔧 Fixing API error response formats...\n');

let fixed = 0;
let failed = 0;
let skipped = 0;

for (const file of filesToFix) {
  const result = fixFile(file);
  if (result) {
    fixed++;
  } else {
    skipped++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Fixed: ${fixed}`);
console.log(`   Skipped (no changes): ${skipped}`);
console.log(`   Failed: ${failed}`);
console.log('\n✨ Done!');

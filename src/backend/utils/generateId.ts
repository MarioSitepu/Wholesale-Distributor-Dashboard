/**
 * Generate ID dengan format yang sama seperti FE mockData.ts
 * Contoh: STR-PAL-1716789012345678
 */
export function generateId(prefix: string, branch: string): string {
  const branchCode = branch.toUpperCase().substring(0, 3);
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${branchCode}-${timestamp}${random}`;
}

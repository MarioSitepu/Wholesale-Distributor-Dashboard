import { api } from './apiClient';

let cachedBranches: string[] | null = null;
let cachedCategories: string[] | null = null;

/**
 * Fetch branches with in-memory caching.
 * Prevents redundant HTTP requests to /api/branches on every page navigation.
 */
export async function fetchBranchesCached(): Promise<string[]> {
  if (cachedBranches && cachedBranches.length > 0) {
    return cachedBranches;
  }
  try {
    const res = await api.get<{ branches: string[] }>('/api/branches');
    if (res && res.branches) {
      cachedBranches = res.branches.map((b: any) => b.name || b);
      return cachedBranches;
    }
  } catch (error) {
    console.error('Failed to fetch branches:', error);
  }
  return [];
}

/**
 * Fetch categories with in-memory caching.
 * Prevents redundant HTTP requests to /api/categories on every page navigation.
 */
export async function fetchCategoriesCached(): Promise<string[]> {
  if (cachedCategories && cachedCategories.length > 0) {
    return cachedCategories;
  }
  try {
    const res = await api.get<{ categories: string[] }>('/api/categories');
    if (res && res.categories) {
      cachedCategories = res.categories;
      return cachedCategories;
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }
  return [];
}

/** Invalidate category cache when a new category is created or deleted */
export function invalidateCategoriesCache() {
  cachedCategories = null;
}

/** Invalidate branch cache when an account/branch is updated */
export function invalidateBranchesCache() {
  cachedBranches = null;
}

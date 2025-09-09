/**
 * Utility functions for managing rule drafts in browser localStorage
 */

const RULE_DRAFT_KEY = 'rule-builder-draft';
const DRAFT_EXPIRY_HOURS = 1; // Draft expires after 1 hour

export interface RuleDraft {
  name: string;
  ruleType: string;
  applyTo: number;
  root: any;
  timestamp: number;
}

/**
 * Save a rule draft to localStorage
 */
export const saveRuleDraft = (rule: Omit<RuleDraft, 'timestamp'>): void => {
  try {
    const draft: RuleDraft = {
      ...rule,
      timestamp: Date.now()
    };
    localStorage.setItem(RULE_DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error('Failed to save rule draft:', error);
  }
};

/**
 * Check if a draft is expired (older than 1 hour)
 */
const isDraftExpired = (timestamp: number): boolean => {
  const ageMs = Date.now() - timestamp;
  const ageHours = ageMs / (1000 * 60 * 60);
  return ageHours > DRAFT_EXPIRY_HOURS;
};

/**
 * Load a rule draft from localStorage
 * Returns null if draft doesn't exist or is expired
 */
export const loadRuleDraft = (): RuleDraft | null => {
  try {
    const stored = localStorage.getItem(RULE_DRAFT_KEY);
    if (stored) {
      const draft: RuleDraft = JSON.parse(stored);
      
      // Check if draft is expired
      if (isDraftExpired(draft.timestamp)) {
        // Auto-delete expired draft
        deleteRuleDraft();
        return null;
      }
      
      return draft;
    }
    return null;
  } catch (error) {
    console.error('Failed to load rule draft:', error);
    return null;
  }
};

/**
 * Delete a rule draft from localStorage
 */
export const deleteRuleDraft = (): void => {
  try {
    localStorage.removeItem(RULE_DRAFT_KEY);
  } catch (error) {
    console.error('Failed to delete rule draft:', error);
  }
};

/**
 * Check if a rule draft exists and is not expired
 */
export const hasDraft = (): boolean => {
  try {
    const stored = localStorage.getItem(RULE_DRAFT_KEY);
    if (!stored) return false;
    
    const draft: RuleDraft = JSON.parse(stored);
    
    // Check if draft is expired
    if (isDraftExpired(draft.timestamp)) {
      // Auto-delete expired draft
      deleteRuleDraft();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to check for rule draft:', error);
    return false;
  }
};

/**
 * Get the age of the current draft in hours
 * Returns 0 if no draft exists or draft is expired
 */
export const getDraftAge = (): number => {
  try {
    const stored = localStorage.getItem(RULE_DRAFT_KEY);
    if (!stored) return 0;
    
    const draft: RuleDraft = JSON.parse(stored);
    
    // Check if draft is expired
    if (isDraftExpired(draft.timestamp)) {
      return 0;
    }
    
    const ageMs = Date.now() - draft.timestamp;
    return ageMs / (1000 * 60 * 60); // Convert to hours
  } catch (error) {
    console.error('Failed to get draft age:', error);
    return 0;
  }
};

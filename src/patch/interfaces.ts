/**
 * @imrabo/patch - Patch Interfaces
 *
 * Defines the structure for proposing, validating, and applying file modifications.
 */

export interface IPatch {
  filepath: string;
  operation: 'insert' | 'replace' | 'delete' | 'rename' | 'move';
  content?: string; // Required for insert/replace operations
  reasoning: string; // Agent's reasoning for the change. Crucial for review.
  confidenceScore: number; // Confidence score (0.0 to 1.0) derived from the Review Pipeline (Step 9).
  affectedFiles: string[]; // List of files affected by this patch.
}

export interface IPatchResult {
  success: boolean;
  appliedPath?: string;
  reason?: string;
  details?: any;
  error?: string;
}

/**
 * Interface for the core Patch Engine execution.
 */
export interface IPatchEngine {
  applyPatch(patch: IPatch): Promise<IPatchResult>;
  validatePatch(patch: IPatch): boolean;
}
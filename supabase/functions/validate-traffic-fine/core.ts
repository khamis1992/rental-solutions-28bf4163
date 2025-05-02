
// Core functionality and shared utilities for traffic fine validation

// Shared utilities
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Response helper functions
export function createSuccessResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status
  });
}

export function createErrorResponse(error: string, status = 500, details?: any): Response {
  return new Response(JSON.stringify({ 
    error, 
    details,
    environment: Deno.env.get("DEVELOPMENT_MODE") === "true" ? "development" : "production" 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status
  });
}

// Simple HTML parsing function since we can't use deno_dom
export function extractTextBetween(html: string, startMarker: string, endMarker: string): string {
  const startIndex = html.indexOf(startMarker);
  if (startIndex === -1) return '';
  
  const contentStartIndex = startIndex + startMarker.length;
  const endIndex = html.indexOf(endMarker, contentStartIndex);
  if (endIndex === -1) return '';
  
  return html.substring(contentStartIndex, endIndex).trim();
}

// Types for validation results
export interface ValidationResult {
  licensePlate: string;
  validationDate: Date;
  validationSource: string;
  hasFine: boolean;
  details: string;
  environment: 'development' | 'production';
}

export interface ValidationBatchResults {
  results: ValidationResult[];
  errors: Array<{ licensePlate: string; error: string }>;
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    environment: 'development' | 'production';
  };
}

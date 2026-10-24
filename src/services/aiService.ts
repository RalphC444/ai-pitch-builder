/**
 * AI Service for OpenRouter API integration
 */

// OpenRouter API Configuration
// Read from .env.local (REACT_APP_OPENROUTER_API_KEY); without it the app uses its offline fallbacks
const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY || '';
// Using Google Gemma model
const OPENROUTER_MODEL = 'google/gemma-2-9b-it';

export type SourceType = 'bio' | 'job_history' | 'screener' | 'past_screener';

export interface SourceResponse {
  type: SourceType;
  // For bio
  bioText?: string;
  // For job history
  companyName?: string;
  role?: string;
  dateRange?: string;
  // For screeners (current and past)
  question?: string;
  answer?: string;
  // Only for past_screener - shows Project ID
  projectId?: string;
  projectName?: string;
  date?: string;
}

export interface AIRewriteResponse {
  id: string;
  text: string;
  sources?: SourceResponse[];
}

export interface AIRewriteResult {
  suggestions: AIRewriteResponse[];
  error?: string;
}

/**
 * Select relevant sources based on the text being rewritten
 * Priority: Screeners (most important) > Bio > Job History
 * Returns max 4 most relevant sources
 * 
 * Exported for use by AI Sources widget
 */
export function selectRelevantSources(selectedText: string, sources?: SourceResponse[]): SourceResponse[] {
  if (!sources || sources.length === 0) return [];
  
  const textLower = selectedText.toLowerCase();
  const words = textLower.split(/\s+/).filter(w => w.length > 3);
  
  // Base priority scores by type (screeners most important)
  const typePriority: Record<SourceType, number> = {
    'screener': 100,        // Current screeners - highest priority
    'past_screener': 100,   // Past screeners - highest priority  
    'bio': 50,              // Bio - second priority
    'job_history': 10,      // Job history - lowest priority
  };
  
  // Score each source by relevance to the selected text
  const scoredSources = sources.map(source => {
    // Start with base priority score for the type
    let score = typePriority[source.type] || 0;
    let sourceText = '';
    
    // Build searchable text based on source type
    if (source.type === 'bio' && source.bioText) {
      sourceText = source.bioText.toLowerCase();
    } else if (source.type === 'job_history') {
      sourceText = `${source.companyName || ''} ${source.role || ''}`.toLowerCase();
    } else if (source.type === 'screener' || source.type === 'past_screener') {
      sourceText = `${source.question || ''} ${source.answer || ''}`.toLowerCase();
    }
    
    // Add bonus points for word matches (relevance to selected text)
    for (const word of words) {
      if (sourceText.includes(word)) {
        score += 5; // Bonus for each matching word
      }
    }
    
    // Extra bonus for screeners with substantive answers
    if ((source.type === 'screener' || source.type === 'past_screener') && source.answer && source.answer.length > 50) {
      score += 10;
    }
    
    return { source, score };
  });
  
  // Sort by score descending and take top 4
  return scoredSources
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(s => s.source);
}

/**
 * Build context string from sources for the AI prompt
 */
function buildSourceContext(sources: SourceResponse[]): string {
  if (sources.length === 0) return '';
  
  const contextParts: string[] = [];
  
  for (const source of sources) {
    if (source.type === 'bio' && source.bioText) {
      contextParts.push(`Background: ${source.bioText}`);
    } else if (source.type === 'job_history') {
      contextParts.push(`Experience: ${source.role} at ${source.companyName}`);
    } else if ((source.type === 'screener' || source.type === 'past_screener') && source.answer) {
      contextParts.push(`Q: ${source.question}\nA: ${source.answer}`);
    }
  }
  
  return contextParts.join('\n\n');
}

/**
 * Generate AI rewrite suggestions for the given text
 * Returns 2 different rewrite options enriched with relevant profile context
 * @param selectedText - The text to rewrite
 * @param sources - Optional source responses from profile details to enrich the rewrite
 */
export async function generateRewriteSuggestions(
  selectedText: string, 
  sources?: SourceResponse[]
): Promise<AIRewriteResult> {
  // Select relevant sources (max 4)
  const relevantSources = selectRelevantSources(selectedText, sources);
  const sourceContext = buildSourceContext(relevantSources);
  
  // Build prompt with context if available
  let prompt: string;
  
  if (sourceContext) {
    prompt = `Rewrite this text in 2 different ways using the context provided.

Context:
${sourceContext}

Text to rewrite: "${selectedText}"

IMPORTANT RULES:
- Output ONLY the rewritten text, nothing else
- NO numbering, NO bullets, NO labels, NO formatting
- NO "1." or "2." or "Short:" or "Option:" prefixes
- NO markdown, NO bold, NO asterisks
- Just two plain text rewrites separated by a newline
- First rewrite should be SHORT and concise
- Second rewrite should be LONGER and detailed`;
  } else {
    prompt = `Rewrite this text in 2 different ways.

Text to rewrite: "${selectedText}"

IMPORTANT RULES:
- Output ONLY the rewritten text, nothing else
- NO numbering, NO bullets, NO labels, NO formatting
- NO "1." or "2." or "Short:" or "Option:" prefixes
- NO markdown, NO bold, NO asterisks
- Just two plain text rewrites separated by a newline
- First rewrite should be SHORT and concise
- Second rewrite should be LONGER and detailed`;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://email-workflow-cursor.com",
        "X-Title": "Email Workflow Cursor",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": OPENROUTER_MODEL,
        "messages": [
          {
            "role": "user",
            "content": prompt
          }
        ]
      })
    });

    if (!response.ok) {
      // Try to get error details from response body
      let errorDetails = '';
      try {
        const errorBody = await response.json();
        errorDetails = JSON.stringify(errorBody);
        console.error('OpenRouter API error response:', errorBody);
      } catch {
        errorDetails = await response.text().catch(() => 'No details');
      }
      
      if (response.status === 401) {
        console.error('401 Auth Error - Details:', errorDetails);
        throw new Error(`API key is invalid or expired. Details: ${errorDetails}`);
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`API error ${response.status}: ${errorDetails}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI raw response:', content);
    
    if (!content) {
      throw new Error('No content in response');
    }

    // Parse the numbered list response
    try {
      const lines = content.trim().split('\n').filter((line: string) => line.trim().length > 0);
      const suggestions: AIRewriteResponse[] = [];
      
      for (const line of lines) {
        // Remove all formatting, numbering, labels, etc.
        const cleanedLine = line
          .replace(/^[>\s]+/, '')           // Remove leading ">" and whitespace
          .replace(/^[\d]+[\.\):\-]\s*/, '') // Remove "1. " or "1) " or "1: " or "1- "
          .replace(/^[-\*•]\s*/, '')        // Remove "- " or "* " or "• "
          .replace(/^\[.*?\]\s*/, '')       // Remove "[short]" or "[detailed]"
          .replace(/^(Short|Concise|Detailed|Long|Version|Rewrite|Option|enumerate)[:\s]*/gi, '') // Remove labels
          .replace(/^[\d]+[\.\):\-]\s*/, '') // Remove numbering again after label removal
          .replace(/^[>\s]+/, '')           // Remove any remaining ">" after other removals
          .replace(/^\*\*.*?\*\*\s*/, '')   // Remove bold markdown like **Short:**
          .replace(/^#+\s*/, '')            // Remove markdown headers
          .trim();
        
        if (cleanedLine.length > 10) {
          suggestions.push({
            id: `suggestion-${suggestions.length + 1}`,
            text: cleanedLine,
            sources: relevantSources, // Only relevant sources (max 4)
          });
        }
        
        // Only take first 2 suggestions
        if (suggestions.length >= 2) break;
      }
      
      if (suggestions.length === 0) {
        // Fallback: just use the whole content as one suggestion
        suggestions.push({
          id: 'suggestion-1',
          text: content.trim().substring(0, 500),
          sources: relevantSources,
        });
      }
      
      console.log('Parsed suggestions:', suggestions);
      return { suggestions };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw content was:', content);
      
      return {
        suggestions: [
          { id: 'suggestion-1', text: content.trim().substring(0, 500), sources: relevantSources }
        ],
        error: 'Could not parse response properly'
      };
    }
  } catch (error) {
    console.error('AI rewrite error:', error);
    return {
      suggestions: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}


/**
 * Send a single prompt to the model and return its text.
 * Throws on network/API errors; rethrows AbortError when the signal is aborted.
 */
export async function generateCompletion(prompt: string, signal?: AbortSignal): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://email-workflow-cursor.com",
      "X-Title": "Email Workflow Cursor",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": OPENROUTER_MODEL,
      "messages": [{ "role": "user", "content": prompt }]
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content in response');
  }
  return content;
}

/**
 * Split a model response into clean lines - strips bullets, numbering and markdown
 */
export function parseResponseLines(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line
      .replace(/^[>\s]+/, '')
      .replace(/^[\d]+[.):-]\s*/, '')
      .replace(/^[-*•]\s*/, '')
      .replace(/\*\*/g, '')
      .replace(/^#+\s*/, '')
      .trim())
    .filter((line) => line.length > 10);
}

export const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';

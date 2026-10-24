import type { ProfileDetailsData } from '../components/drawer';
import { generateCompletion, parseResponseLines } from '../services/aiService';

/**
 * Key details for an angle - the project-specific facts the prompt template draws on
 */
export interface AngleKeyDetails {
  /** What the client wants to learn from this angle */
  clientObjective: string;
  /** The expertise we are pitching for */
  targetExpertise: string;
  /** Topics every pitch should cover - one per line */
  mustCover: string;
  /** Things pitches must avoid (compliance, confidentiality, tone) */
  avoid: string;
  /** Number of bullets per pitch */
  bulletCount: number;
}

/**
 * Prompt configuration for one angle of the project
 */
export interface AnglePrompt {
  angleNumber: number;
  angleLabel: string;
  template: string;
  keyDetails: AngleKeyDetails;
}

/**
 * Template variables available in prompt templates, written as {{key}}
 */
export const PROMPT_VARIABLES: Array<{ key: string; description: string }> = [
  { key: 'advisor_name', description: "Advisor's full name" },
  { key: 'angle', description: 'Angle name' },
  { key: 'current_role', description: 'Most recent role and company' },
  { key: 'biography', description: 'Advisor biography' },
  { key: 'job_history', description: 'Roles, companies and dates' },
  { key: 'screener_answers', description: 'Screener questions and answers' },
  { key: 'client_objective', description: 'Key detail: client objective' },
  { key: 'target_expertise', description: 'Key detail: target expertise' },
  { key: 'must_cover', description: 'Key detail: must-cover topics' },
  { key: 'avoid', description: 'Key detail: things to avoid' },
  { key: 'bullet_count', description: 'Key detail: bullets per pitch' },
];

export const DEFAULT_PROMPT_TEMPLATE = `Write exactly {{bullet_count}} concise bullet points pitching {{advisor_name}} to an expert network client for the "{{angle}}" angle.

Client objective: {{client_objective}}
Expertise we need: {{target_expertise}}
Must-cover topics:
{{must_cover}}
Avoid: {{avoid}}

Advisor background
Current role: {{current_role}}
Job history:
{{job_history}}
Screener answers:
{{screener_answers}}

Rules:
- Bullet 1 states their current or most relevant role and company
- Remaining bullets say what they can speak to, grounded in their screener answers
- Plain text, one bullet per line, no numbering, labels or markdown`;

const DEFAULT_AVOID = 'Confidential or non-public information from current or former employers';

/**
 * Starting prompts for each angle of request #1085069
 */
export const DEFAULT_ANGLE_PROMPTS: Record<number, AnglePrompt> = {
  1: {
    angleNumber: 1,
    angleLabel: 'GLP-1 Formers',
    template: DEFAULT_PROMPT_TEMPLATE,
    keyDetails: {
      clientObjective: 'Understand GLP-1 commercial, clinical and supply dynamics from former Novo Nordisk and Eli Lilly leaders',
      targetExpertise: 'Former senior leaders at GLP-1 manufacturers across commercial, medical affairs and supply chain',
      mustCover: 'Multi-dose vs single-use pen strategy\nManufacturing and fill/finish constraints\n3-5 year GLP-1 injectables growth outlook',
      avoid: DEFAULT_AVOID,
      bulletCount: 3,
    },
  },
  2: {
    angleNumber: 2,
    angleLabel: 'GLP-1 primary packaging/elastomer procurement',
    template: DEFAULT_PROMPT_TEMPLATE,
    keyDetails: {
      clientObjective: 'Size elastomer content and pricing across GLP-1 pens, vials and KwikPen formats',
      targetExpertise: 'Primary packaging, elastomer procurement and corporate development leaders',
      mustCover: 'Elastomer $ content by format\nHVS vs standard components\nDrivers of West\'s GLP-1 channel growth',
      avoid: DEFAULT_AVOID,
      bulletCount: 3,
    },
  },
  3: {
    angleNumber: 3,
    angleLabel: 'Biosimilar players',
    template: DEFAULT_PROMPT_TEMPLATE,
    keyDetails: {
      clientObjective: 'Assess how biosimilar and generic entrants will reshape GLP-1 devices and supply',
      targetExpertise: 'Operations, finance and supply chain leaders at biosimilar and generic manufacturers',
      mustCover: 'Biosimilar GLP-1 timing by geography\nAPI vs device capacity constraints\nWest\'s exposure to OUS and biosimilars',
      avoid: DEFAULT_AVOID,
      bulletCount: 3,
    },
  },
};

/**
 * Advisor data a prompt is rendered against
 */
export interface PromptAdvisor {
  name: string;
  details?: ProfileDetailsData;
}

const getCurrentRole = (details?: ProfileDetailsData) => {
  const latestJob = details?.jobHistory?.[0];
  return latestJob ? `${latestJob.role} at ${latestJob.companyName} (${latestJob.dateRange})` : 'Not available';
};

const getScreenerAnswers = (details?: ProfileDetailsData) => {
  const screeners = [...(details?.screeners || []), ...(details?.pastScreeners || [])];
  if (screeners.length === 0) return 'None';
  return screeners.map((screener) => `Q: ${screener.question}\nA: ${screener.answer}`).join('\n');
};

/**
 * Fill a prompt template's {{variables}} for one advisor. Unknown variables are left as-is.
 */
export const renderPrompt = (prompt: AnglePrompt, advisor: PromptAdvisor): string => {
  const { details } = advisor;
  const { keyDetails } = prompt;
  const values: Record<string, string> = {
    advisor_name: advisor.name,
    angle: prompt.angleLabel,
    current_role: getCurrentRole(details),
    biography: details?.biography || 'Not available',
    job_history: details?.jobHistory?.map((job) => `- ${job.role}, ${job.companyName} (${job.dateRange})`).join('\n') || 'Not available',
    screener_answers: getScreenerAnswers(details),
    client_objective: keyDetails.clientObjective,
    target_expertise: keyDetails.targetExpertise,
    must_cover: keyDetails.mustCover.split('\n').filter((line) => line.trim()).map((line) => `- ${line.trim()}`).join('\n'),
    avoid: keyDetails.avoid,
    bullet_count: String(keyDetails.bulletCount),
  };

  return prompt.template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => values[key] ?? match);
};

/**
 * Whether two prompts have the same template and key details
 */
export const isSamePrompt = (a: AnglePrompt, b: AnglePrompt): boolean =>
  a.template === b.template && JSON.stringify(a.keyDetails) === JSON.stringify(b.keyDetails);

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Turn bullet lines into Quill-compliant list HTML
 */
export const bulletsToHtml = (bullets: string[]): string =>
  `<ul>${bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`;

const firstSentence = (text: string) => {
  const match = text.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim().replace(/[.!?]$/, '');
};

/**
 * Offline fallback: build a pitch from the advisor's profile without the AI service.
 * Picks the role, then the screener answers most relevant to the must-cover topics.
 */
export const buildFallbackPitch = (prompt: AnglePrompt, advisor: PromptAdvisor): string[] => {
  const { details } = advisor;
  const bulletCount = prompt.keyDetails.bulletCount;
  const bullets: string[] = [];

  const latestJob = details?.jobHistory?.[0];
  if (latestJob) {
    const isCurrent = /present/i.test(latestJob.dateRange);
    bullets.push(`${isCurrent ? '' : 'Former '}${latestJob.role} at ${latestJob.companyName}`);
  }

  const topicWords = prompt.keyDetails.mustCover.toLowerCase().split(/\W+/).filter((word) => word.length > 3);
  const screeners = [...(details?.screeners || []), ...(details?.pastScreeners || [])]
    .filter((screener) => screener.answer && !/^n\/a/i.test(screener.answer.trim()))
    .map((screener) => {
      const text = `${screener.question} ${screener.answer}`.toLowerCase();
      const score = topicWords.filter((word) => text.includes(word)).length + (screener.isKeyQuestion ? 2 : 0);
      return { screener, score };
    })
    .sort((a, b) => b.score - a.score);

  for (const { screener } of screeners) {
    if (bullets.length >= bulletCount) break;
    const answer = firstSentence(screener.answer || '');
    const bullet = /^(yes|can|i can|i have)/i.test(answer)
      ? answer.replace(/^(yes,?\s*)?(i\s+)?/i, '').replace(/^\w/, (c) => c.toUpperCase())
      : `Can speak to: ${answer.charAt(0).toLowerCase()}${answer.slice(1)}`;
    if (!bullets.includes(bullet)) bullets.push(bullet);
  }

  for (const job of details?.jobHistory?.slice(1) || []) {
    if (bullets.length >= bulletCount) break;
    bullets.push(`Previously ${job.role} at ${job.companyName}`);
  }

  return bullets.slice(0, bulletCount);
};

/**
 * Generate a pitch for one advisor from an angle prompt.
 * Uses the model when available, otherwise builds it from the advisor's profile.
 */
export const generatePitchHtml = async (
  prompt: AnglePrompt,
  advisor: PromptAdvisor,
): Promise<{ html: string; usedFallback: boolean }> => {
  try {
    const content = await generateCompletion(renderPrompt(prompt, advisor));
    const bullets = parseResponseLines(content).slice(0, prompt.keyDetails.bulletCount);
    if (bullets.length >= 2) {
      return { html: bulletsToHtml(bullets), usedFallback: false };
    }
  } catch (error) {
    console.warn('Pitch generation fell back to the offline builder:', error);
  }
  return { html: bulletsToHtml(buildFallbackPitch(prompt, advisor)), usedFallback: true };
};

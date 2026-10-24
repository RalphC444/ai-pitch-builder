import type { Profile } from './profiles';
import type { AnglePrompt } from './anglePrompts';
import { generateCompletion, isAbortError, parseResponseLines } from '../services/aiService';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** Confidence thresholds from the Figma "Confidence Breakdown": High 80%+, Medium 60-79%, Low <60% */
export const getConfidenceLevel = (confidence: number): ConfidenceLevel => {
  if (confidence >= 80) return 'high';
  if (confidence >= 60) return 'medium';
  return 'low';
};

export const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  high: '#149c4d',
  medium: '#fe800f',
  low: '#c41e2f',
};

export type IssueKind = 'confidential' | 'unsupported' | 'vague' | 'off-angle' | 'partial' | 'supported';

/** Plain-language headings for the AI companion card */
export const ISSUE_LABELS: Record<IssueKind, string> = {
  confidential: 'Confidential reference',
  unsupported: 'Not backed by profile',
  vague: 'Vague statement',
  'off-angle': 'Off-angle',
  partial: 'Partially supported',
  supported: 'Well supported',
};

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  high: 'High Confidence',
  medium: 'Medium Confidence',
  low: 'Low Confidence',
};

/** A screener answer, bio or job a suggestion is grounded in */
export interface PitchSource {
  id: string;
  projectLabel: string;
  date?: string;
  question: string;
  answer: string;
}

export interface PitchSuggestion {
  id: string;
  title: string;
  text: string;
  sources: PitchSource[];
}

/** One statement (bullet) in a pitch, scored for confidence */
export interface PitchIssue {
  id: string;
  /** Index of the bullet in the pitch */
  index: number;
  text: string;
  confidence: number;
  level: ConfidenceLevel;
  /** Short explanation shown in the AI Suggestions list */
  message: string;
  /** What kind of problem it is, for the companion card's heading */
  kind: IssueKind;
  suggestions: PitchSuggestion[];
  /** Set once a suggestion has been applied */
  resolved?: boolean;
}

export interface PitchAnalysis {
  issues: PitchIssue[];
  score: number;
  summary: string;
  counts: Record<ConfidenceLevel, number>;
}

const STOP_WORDS = new Set([
  'with', 'that', 'this', 'from', 'their', 'about', 'have', 'into', 'over', 'they', 'were', 'will', 'which',
  'what', 'when', 'where', 'there', 'been', 'being', 'also', 'more', 'most', 'such', 'than', 'then', 'them',
  'these', 'those', 'your', 'yours', 'able', 'speak', 'including', 'across', 'based',
]);

const VAGUE_PATTERN = /\b(deep knowledge|expertise in|knowledgeable|familiar with|can speak|general knowledge)\b/i;
const CONFIDENTIAL_PATTERN = /\b(confidential|non-public|insider|proprietary)\b/i;

const keywords = (text: string): string[] =>
  Array.from(new Set(
    text.toLowerCase().split(/[^a-z0-9$%-]+/).filter((word) => word.length > 3 && !STOP_WORDS.has(word))
  ));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Pull bullet texts out of pitch HTML
 */
export const extractBullets = (html: string | null | undefined): string[] => {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const items = Array.from(doc.querySelectorAll('li')).map((li) => li.textContent?.trim() || '');
  if (items.length > 0) return items.filter(Boolean);
  return Array.from(doc.querySelectorAll('p')).map((p) => p.textContent?.trim() || '').filter(Boolean);
};

/**
 * Every screener (current and past) for an advisor, as sources
 */
export const getProfileSources = (profile: Profile): PitchSource[] => {
  const details = profile.profileDetails;
  const angle = profile.angles[0];
  const current = (details?.screeners || []).map((screener) => ({
    id: `${profile.id}-${screener.id}`,
    projectLabel: `1085069 - Angle ${angle?.number}: ${angle?.label}`,
    date: screener.responseDate,
    question: screener.question,
    answer: screener.answer || '',
  }));
  const past = (details?.pastScreeners || []).map((screener) => ({
    id: `${profile.id}-${screener.id}`,
    projectLabel: 'Past Screener',
    date: screener.responseDate,
    question: screener.question,
    answer: screener.answer || '',
  }));
  return [...current, ...past].filter((source) => source.answer && !/^n\/a/i.test(source.answer.trim()));
};

const overlap = (words: string[], text: string) => {
  if (words.length === 0) return 0;
  const lower = text.toLowerCase();
  return words.filter((word) => lower.includes(word)).length / words.length;
};

const rankSources = (text: string, sources: PitchSource[]) => {
  const words = keywords(text);
  return [...sources]
    .map((source) => ({ source, score: overlap(words, `${source.question} ${source.answer}`) }))
    .sort((a, b) => b.score - a.score)
    .map(({ source }) => source);
};

const firstSentence = (text: string) => {
  const match = text.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim().replace(/[.!?]$/, '');
};

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Rewrite a first-person screener answer as a third-person pitch statement
 */
const answerToStatement = (answer: string): string => {
  const sentence = firstSentence(answer)
    .replace(/^(yes|yeah)[,.]?\s*/i, '')
    .replace(/^but\s+/i, '')
    .replace(/^from (a|my) [\w\s]+ perspective,\s*/i, '')
    .replace(/^i can\b/i, 'Can')
    .replace(/^i have\b/i, 'Has')
    .replace(/^i worked\b/i, 'Worked')
    .replace(/^i was\b/i, 'Was')
    .replace(/\bI have\b/g, 'they have')
    .replace(/\bI\b/g, 'they')
    .replace(/\bmy\b/gi, 'their');
  return upperFirst(sentence);
};

/**
 * Score one pitch statement against the advisor's sources and the angle's key details
 */
const scoreStatement = (text: string, profile: Profile, prompt: AnglePrompt | undefined, sources: PitchSource[]) => {
  const words = keywords(text);
  const details = profile.profileDetails;
  const corpus = [
    details?.biography || '',
    ...(details?.jobHistory || []).map((job) => `${job.role} ${job.companyName}`),
    ...sources.map((source) => `${source.question} ${source.answer}`),
  ].join(' ');
  const angleText = prompt
    ? `${prompt.angleLabel} ${prompt.keyDetails.clientObjective} ${prompt.keyDetails.targetExpertise} ${prompt.keyDetails.mustCover}`
    : '';

  const support = overlap(words, corpus);
  const relevance = Math.min(1, overlap(words, angleText) * 2.5);
  const isVague = VAGUE_PATTERN.test(text);
  const isConfidential = CONFIDENTIAL_PATTERN.test(text);

  const confidence = Math.round(clamp(
    48 + support * 36 + relevance * 14 - (isVague ? 14 : 0) - (isConfidential ? 30 : 0),
    32,
    97,
  ));

  let message = 'Well supported by the advisor\'s profile and screeners.';
  let kind: IssueKind = 'supported';
  if (isConfidential) {
    message = 'References confidential information - rephrase to stay within MNPI policy.';
    kind = 'confidential';
  } else if (support < 0.5) {
    message = `Isn't clearly supported by ${profile.name.split(' ').slice(-1)[0]}'s profile or screener answers.`;
    kind = 'unsupported';
  } else if (isVague) {
    message = 'This statement is vague - add specifics from their screener answers.';
    kind = 'vague';
  } else if (relevance < 0.3) {
    message = 'Doesn\'t clearly connect to the angle\'s must-cover topics.';
    kind = 'off-angle';
  } else if (confidence < 80) {
    message = 'Partially supported - tighten it with sourced detail.';
    kind = 'partial';
  }

  return { confidence, message, kind };
};

/**
 * Offline suggestions for one statement: one grounded in the best screener answer,
 * one connecting the statement to the angle's must-cover topics.
 */
const buildSuggestions = (
  issueId: string,
  text: string,
  profile: Profile,
  prompt: AnglePrompt | undefined,
  sources: PitchSource[],
): PitchSuggestion[] => {
  const ranked = rankSources(text, sources);
  const suggestions: PitchSuggestion[] = [];

  if (ranked[0]) {
    const statement = answerToStatement(ranked[0].answer).replace(/\bconfidential\b/gi, 'public');
    // Short answers ("yes, wide variations by geography") add evidence to the original
    // statement instead of replacing it, so the pitch keeps its context
    const groundedText = statement.split(/\s+/).length < 10
      ? `${text.replace(/[.\s]+$/, '').replace(/\bthat is not confidential\b/i, 'based on public information')} - ${lowerFirst(statement)}`
      : statement;
    suggestions.push({
      id: `${issueId}-grounded`,
      title: 'Uses their screener answer',
      text: groundedText,
      sources: ranked.slice(0, 3),
    });
  }

  const topics = prompt?.keyDetails.mustCover.split('\n').map((line) => line.trim()).filter(Boolean) || [];
  const topic = [...topics].sort((a, b) => overlap(keywords(b), text) - overlap(keywords(a), text))[0];
  if (topic) {
    const base = text.replace(/[.\s]+$/, '').replace(/\bthat is not confidential\b/i, 'based on public information');
    suggestions.push({
      id: `${issueId}-angle`,
      title: 'Connects to the angle',
      text: `${base}, including ${lowerFirst(topic)}`,
      sources: rankSources(topic, sources).slice(0, 2),
    });
  }

  const latestJob = profile.profileDetails?.jobHistory?.[0];
  if (suggestions.length < 2 && latestJob) {
    suggestions.push({
      id: `${issueId}-role`,
      title: 'Adds their role',
      text: `As ${latestJob.role} at ${latestJob.companyName}, ${lowerFirst(text.replace(/[.\s]+$/, ''))}`,
      sources: ranked.slice(0, 1),
    });
  }

  return suggestions.slice(0, 2);
};

export const describeScore = (score: number): string => {
  if (score >= 90) return 'Excellent quality - ready to send.';
  if (score >= 85) return 'Good quality, with a bit of room for improvement.';
  if (score >= 70) return 'Fair quality, with a bit of room for improvement.';
  return 'Needs work - review the flagged statements before sending.';
};

const summarize = (issues: PitchIssue[]): Pick<PitchAnalysis, 'score' | 'summary' | 'counts'> => {
  const counts: Record<ConfidenceLevel, number> = { high: 0, medium: 0, low: 0 };
  issues.forEach((issue) => { counts[issue.level] += 1; });
  const score = issues.length
    ? Math.round(issues.reduce((total, issue) => total + issue.confidence, 0) / issues.length)
    : 0;
  return { score, summary: describeScore(score), counts };
};

/**
 * Analyze a pitch: score each statement, explain issues and suggest sourced fixes
 */
export const analyzePitch = (profile: Profile, prompt: AnglePrompt | undefined): PitchAnalysis => {
  const sources = getProfileSources(profile);
  const issues = extractBullets(profile.contentHtml).map((text, index) => {
    const id = `${profile.id}-issue-${index}`;
    const { confidence, message, kind } = scoreStatement(text, profile, prompt, sources);
    const level = getConfidenceLevel(confidence);
    return {
      id,
      index,
      text,
      confidence,
      level,
      message,
      kind,
      suggestions: level === 'high' ? [] : buildSuggestions(id, text, profile, prompt, sources),
    };
  });

  return { issues, ...summarize(issues) };
};

/**
 * Mark an issue resolved after its text was replaced, and rescore the pitch
 */
export const resolveIssue = (analysis: PitchAnalysis, issueId: string, newText: string): PitchAnalysis => {
  const issues = analysis.issues.map((issue) =>
    issue.id === issueId
      ? { ...issue, text: newText, confidence: Math.max(issue.confidence + 20, 88), level: 'high' as ConfidenceLevel, resolved: true }
      : issue
  );
  return { issues, ...summarize(issues) };
};

/**
 * Replace the bullet at `index` in pitch HTML
 */
export const replaceBullet = (html: string, index: number, text: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const item = doc.querySelectorAll('li')[index];
  if (!item) return html;
  item.textContent = text;
  return doc.body.innerHTML;
};

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

/**
 * "Prompt A Change": rewrite a statement following the user's instruction.
 * Uses the model when available, otherwise rewrites from the most relevant sources.
 * Rejects with an AbortError when stopped.
 */
export const generatePromptedSuggestions = async (
  issue: PitchIssue,
  userPrompt: string,
  profile: Profile,
  signal?: AbortSignal,
): Promise<PitchSuggestion[]> => {
  const sources = getProfileSources(profile);
  const ranked = rankSources(`${userPrompt} ${issue.text}`, sources);
  const minimumWait = sleep(1200, signal);

  try {
    const context = ranked.slice(0, 4).map((source) => `Q: ${source.question}\nA: ${source.answer}`).join('\n');
    const content = await generateCompletion(
      `Rewrite this expert-network pitch statement about ${profile.name} following the instruction.\n\n` +
      `Statement: "${issue.text}"\nInstruction: ${userPrompt}\n\nSource screener answers:\n${context}\n\n` +
      'Return exactly 2 alternative statements, one per line, plain text, no numbering or labels. Only use facts from the sources.',
      signal,
    );
    await minimumWait;
    const lines = parseResponseLines(content).slice(0, 2);
    if (lines.length > 0) {
      return lines.map((text, index) => ({
        id: `${issue.id}-prompt-${index}`,
        title: index === 1 ? 'From your prompt - detailed' : 'From your prompt',
        text,
        sources: ranked.slice(index, index + 2),
      }));
    }
  } catch (error) {
    if (isAbortError(error)) throw error;
    console.warn('Prompted rewrite fell back to offline sources:', error);
  }

  await minimumWait;
  const base = issue.text.replace(/[.\s]+$/, '');
  return ranked.slice(0, 2).map((source, index) => ({
    id: `${issue.id}-prompt-${index}`,
    title: index === 0 ? 'From your prompt' : 'From your prompt - their words',
    text: index === 0
      ? `${base} - ${lowerFirst(answerToStatement(source.answer))}`
      : answerToStatement(source.answer),
    sources: [source],
  }));
};

/** Analyses saved from the editor (keeps "resolved" state), keyed by profile id */
export type SavedAnalyses = Record<string, { html: string; analysis: PitchAnalysis }>;

/**
 * The analysis for a profile's current pitch: the saved one if the pitch hasn't
 * changed since, otherwise a fresh analysis against its angle prompt
 */
export const getPitchAnalysis = (
  profile: Profile,
  prompts: Record<number, AnglePrompt>,
  saved: SavedAnalyses,
): PitchAnalysis => {
  const entry = saved[profile.id];
  if (entry && entry.html === (profile.contentHtml || '')) return entry.analysis;
  return analyzePitch(profile, prompts[profile.angles[0]?.number]);
};

/**
 * Biography -> pitch line: "X is currently serving as CFO at Y, a public..." -> "Currently CFO at Y"
 */
const biographyToStatement = (biography: string): string => {
  let text = firstSentence(biography);
  const former = text.match(/\bis (?:a )?former\s+(.*)$/i);
  text = former
    ? `Former ${former[1]}`
    : text.replace(/^.*?\b(?:is|has been)\s+(?:currently\s+)?(?:serving\s+as\s+)?(?:an?\s+)?/i, 'Currently ');
  return text.replace(/,\s+(?:a|an|where|which)\s.*$/i, '');
};

/** A piece of profile data the user selected in the profile drawer */
export interface SelectedProfileItem {
  kind: 'biography' | 'job' | 'screener';
  /** Biography text, "Role at Company (dates)", or the screener question */
  text: string;
  /** Screener answer */
  answer?: string;
}

/**
 * Turn selected profile data into pitch bullets, optionally following the user's prompt.
 * Uses the model when available, otherwise builds bullets directly from the selection.
 * Rejects with an AbortError when stopped.
 */
export const generateBulletsFromProfileData = async (
  advisorName: string,
  items: SelectedProfileItem[],
  userPrompt: string,
  anglePrompt: AnglePrompt | undefined,
  signal?: AbortSignal,
): Promise<string[]> => {
  const instruction = userPrompt.trim();
  const minimumWait = sleep(900, signal);
  const context = items.map((item) => {
    if (item.kind === 'screener') return `Screener Q: ${item.text}\nA: ${item.answer || ''}`;
    if (item.kind === 'job') return `Job: ${item.text}`;
    return `Biography: ${item.text}`;
  }).join('\n');

  try {
    const content = await generateCompletion(
      `Write concise expert-network pitch bullets about ${advisorName} using ONLY the profile data below.\n` +
      (anglePrompt ? `Angle: ${anglePrompt.angleLabel}. Client objective: ${anglePrompt.keyDetails.clientObjective}\n` : '') +
      (instruction ? `Instruction: ${instruction}\n` : '') +
      `\nProfile data:\n${context}\n\n` +
      `Return one bullet per line (at most ${Math.max(2, Math.min(items.length, 5))}), plain text, no numbering, labels or markdown.`,
      signal,
    );
    await minimumWait;
    const lines = parseResponseLines(content);
    if (lines.length > 0) return lines.slice(0, 5);
  } catch (error) {
    if (isAbortError(error)) throw error;
    console.warn('Profile data generation fell back to offline bullets:', error);
  }

  await minimumWait;
  // Offline: one bullet per selected item, most relevant to the prompt first
  const promptWords = keywords(instruction);
  const ranked = promptWords.length
    ? [...items].sort((a, b) => overlap(promptWords, `${b.text} ${b.answer || ''}`) - overlap(promptWords, `${a.text} ${a.answer || ''}`))
    : items;
  const bullets = ranked.map((item) => {
    if (item.kind === 'job') return item.text.replace(/\s*\([^)]*\)\s*$/, '');
    if (item.kind === 'screener') return answerToStatement(item.answer || item.text);
    return biographyToStatement(item.text);
  });
  return Array.from(new Set(bullets.filter(Boolean))).slice(0, 5);
};

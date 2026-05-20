import { callClaude } from './anthropic';
import { ProgressState, ActivityFeedback, AIGeneratedActivity, Activity } from '../types';
import activitiesData from '../data/activities.json';

const SYSTEM_PROMPT = `You are an expert child development activity designer for the "Little Bloom" app.
The app helps parents nurture 3-year-old children across 6 developmental areas: cognitive, language, emotional, empathy, self-regulation, and motor.

Analyze the child's progress data and generate ONE new, perfectly calibrated activity.

OUTPUT ONLY VALID JSON — no markdown, no prose, just the raw JSON object:
{
  "id": "ai_XXXXXX",
  "title": "Activity Name Here",
  "description": "One or two sentences describing the activity and its developmental benefit.",
  "category": "indoor",
  "developmentalFocus": ["emotional", "language"],
  "duration": 15,
  "difficulty": "medium",
  "materials": ["Item 1", "Item 2"],
  "youtubeSearchQuery": "toddler self regulation breathing activity 3 year old",
  "youtubeTitle": "Toddler Calming Breathing Exercise | Preschool Self-Regulation",
  "instructions": [
    "Step one instruction here.",
    "Step two instruction here.",
    "Step three instruction here.",
    "Step four instruction here.",
    "Step five instruction here."
  ],
  "milestoneCategory": "emotional",
  "points": 15,
  "tags": ["calming", "breathing", "emotions"],
  "emoji": "🌬️",
  "generatedReason": "One sentence explaining exactly why this activity was chosen based on the child's data."
}

Rules:
- id must be "ai_" followed by 6 random alphanumeric characters
- duration: integer between 5 and 30
- points: 10 for easy, 15 for medium, 20 for hard
- materials: common household items only, maximum 4 items
- instructions: exactly 4-5 steps, written directly to the parent
- youtubeSearchQuery: what a parent would literally type into YouTube search
- If the parent specifies a duration or location (indoor/outdoor), you MUST honour it`;

function parseActivity(raw: string): AIGeneratedActivity {
  const jsonStr = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  const parsed = JSON.parse(jsonStr) as Omit<AIGeneratedActivity, 'isAIGenerated' | 'generatedAt'>;
  return { ...parsed, isAIGenerated: true as const, generatedAt: new Date().toISOString() };
}

function buildAdaptiveMessage(
  state: ProgressState,
  feedbacks: ActivityFeedback[],
  existingIds: string[]
): string {
  const { childProfile, completedActivities, emotionalPoints, intellectualPoints } = state;
  const activities = activitiesData.activities as Activity[];

  const completedDetails = completedActivities.slice(-6).map((c) => {
    const a = activities.find((ac) => ac.id === c.activityId);
    return a ? `"${a.title}" (${a.difficulty}, ${a.developmentalFocus.join('+')})` : c.activityId;
  });

  const feedbackLines = feedbacks.slice(-8).map((f) => {
    const a = activities.find((ac) => ac.id === f.activityId);
    return `- "${a?.title ?? f.activityId}": ${f.feedback}`;
  });

  const focusCount: Record<string, number> = {};
  completedActivities.forEach((c) => {
    const a = activities.find((ac) => ac.id === c.activityId);
    a?.developmentalFocus.forEach((f) => { focusCount[f] = (focusCount[f] ?? 0) + 1; });
  });
  const allFocus = ['cognitive', 'language', 'emotional', 'empathy', 'self-regulation', 'motor'];
  const gaps = allFocus.filter((f) => !focusCount[f] || focusCount[f] < 2);

  const recent = feedbacks.slice(-5);
  const tooEasy = recent.filter((f) => f.feedback === 'too-easy').length;
  const tooHard = recent.filter((f) => f.feedback === 'too-hard').length;
  let difficultyNote = 'medium difficulty is appropriate';
  if (tooEasy >= 2) difficultyNote = 'child finds activities easy — target medium or hard';
  if (tooHard >= 2) difficultyNote = 'child is struggling — target easy or easy-medium';

  const avoidIds = [...existingIds, ...completedActivities.map((c) => c.activityId)].slice(0, 15);

  return `CHILD:
Name: ${childProfile.name}, Age: ~3 years old
Emotional points: ${emotionalPoints} | Intellectual points: ${intellectualPoints}

RECENTLY COMPLETED:
${completedDetails.length ? completedDetails.join('\n') : 'None yet'}

PARENT FEEDBACK:
${feedbackLines.length ? feedbackLines.join('\n') : 'No feedback yet'}

DIFFICULTY GUIDANCE: ${difficultyNote}
DEVELOPMENTAL GAPS (prioritise): ${gaps.length ? gaps.join(', ') : 'all covered — choose freely'}
IDs TO AVOID: ${avoidIds.join(', ')}

Generate one new activity addressing the gaps and matching the child's current level.`;
}

// ─── Adaptive generation (based on progress data) ────────────────────────────
export async function generateAdaptiveActivity(
  state: ProgressState,
  feedbacks: ActivityFeedback[],
  existingIds: string[]
): Promise<AIGeneratedActivity> {
  const raw = await callClaude({
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildAdaptiveMessage(state, feedbacks, existingIds) }],
    maxTokens: 900,
    temperature: 0.85,
  });
  return parseActivity(raw);
}

// ─── On-demand generation (parent's specific request) ─────────────────────────
export async function generateCustomActivity(
  customPrompt: string,
  state: ProgressState,
  feedbacks: ActivityFeedback[],
  existingIds: string[]
): Promise<AIGeneratedActivity> {
  const { childProfile } = state;
  const avoidIds = [...existingIds].slice(0, 15);

  const userMessage = `CHILD: ${childProfile.name}, approximately 3 years old.

PARENT'S SPECIFIC REQUEST: "${customPrompt}"

IDs TO AVOID: ${avoidIds.join(', ')}

Generate exactly one activity that fulfils the parent's request. Honour all constraints they specified (duration, location, energy level, context). Set generatedReason to a one-sentence confirmation of how this activity meets their request.`;

  const raw = await callClaude({
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 900,
    temperature: 0.8,
  });

  const activity = parseActivity(raw);
  // Ensure the reason reflects the parent's prompt if the model didn't set one
  if (!activity.generatedReason || activity.generatedReason.length < 10) {
    activity.generatedReason = `Generated based on your request: "${customPrompt}"`;
  }
  return activity;
}

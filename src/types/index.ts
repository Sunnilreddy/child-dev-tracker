export type Category = 'indoor' | 'outdoor';

export type DevFocus =
  | 'cognitive'
  | 'language'
  | 'emotional'
  | 'empathy'
  | 'self-regulation'
  | 'motor';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type MilestoneCategory = 'emotional' | 'intellectual';

export interface Activity {
  id: string;
  title: string;
  titleTe?: string;
  description: string;
  descriptionTe?: string;
  category: Category;
  developmentalFocus: DevFocus[];
  duration: number; // minutes
  difficulty: Difficulty;
  materials: string[];
  youtubeVideoId: string;
  youtubeTitle: string;
  instructions: string[];
  instructionsTe?: string[];
  milestoneCategory: MilestoneCategory;
  points: number;
  tags: string[];
  emoji: string;
}

export interface CompletedActivity {
  activityId: string;
  completedAt: string; // ISO date string
  notes?: string;
}

export interface ChildProfile {
  name: string;
  birthDate: string;
  avatarEmoji: string;
}

export interface ProgressState {
  completedActivities: CompletedActivity[];
  emotionalPoints: number;
  intellectualPoints: number;
  streak: number;
  lastActiveDate: string | null;
  childProfile: ChildProfile;
  weeklyGoal: number;
}

export interface Milestone {
  id: string;
  title: string;
  titleTe?: string;
  description: string;
  descriptionTe?: string;
  category: MilestoneCategory;
  requiredPoints: number;
  emoji: string;
}

export interface WeeklyProgress {
  day: string;
  shortDay: string;
  count: number;
}

export type ProgressAction =
  | { type: 'COMPLETE_ACTIVITY'; payload: CompletedActivity }
  | { type: 'UNCOMPLETE_ACTIVITY'; payload: { activityId: string } }
  | { type: 'UPDATE_CHILD_PROFILE'; payload: Partial<ChildProfile> }
  | { type: 'SET_WEEKLY_GOAL'; payload: number }
  | { type: 'HYDRATE'; payload: ProgressState };

// ─── AI Layer Types ───────────────────────────────────────────────────────────

export type ActivityFeedbackType = 'too-easy' | 'loved' | 'too-hard';

export interface ActivityFeedback {
  activityId: string;
  feedback: ActivityFeedbackType;
  timestamp: string;
}

export interface AIGeneratedActivity {
  id: string;
  title: string;
  description: string;
  category: Category;
  developmentalFocus: DevFocus[];
  duration: number;
  difficulty: Difficulty;
  materials: string[];
  youtubeSearchQuery: string;
  youtubeTitle: string;
  instructions: string[];
  milestoneCategory: MilestoneCategory;
  points: number;
  tags: string[];
  emoji: string;
  isAIGenerated: true;
  generatedAt: string;
  generatedReason: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

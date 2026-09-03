export type ReflectionMode = 'reflect' | 'summarize' | 'actionable' | 'brainstorm';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  content: string;
  timestamp: string;
  model?: string;
}

export interface ReflectionInteraction {
  id: string;
  userId: string;
  title: string;
  mode: ReflectionMode;
  messages: ChatMessage[];
  summary?: string;
  tags: string[];
  sentiment?: 'thoughtful' | 'positive' | 'challenging' | 'creative' | 'neutral';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isDemo?: boolean;
}

export interface GeminiReflectResponse {
  success: boolean;
  text: string;
  modelUsed: string;
  fallbackCount: number;
  timestamp: string;
}

export interface ThreatZoneAssessment {
  zone: string;
  threat: string;
  countermeasure: string;
  status: 'Implemented' | 'Enforced' | 'Verified';
}

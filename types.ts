export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  createdAt: string;
}

export interface MoodEntry {
  id: string;
  userEmail: string;
  score: number; // 1-10
  notes: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  userEmail: string;
  date: string;
  reflection: string;
  gratitude: string;
  advice: string;
}

export interface Contact {
  name: string;
  phone: string;
  relation: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

export interface AISettings {
  botName: string;
}

export interface Habit {
  id: string;
  title: string;
  completed: boolean;
  lastUpdated: string; // ISO date string YYYY-MM-DD
}

export interface SleepLog {
  id: string;
  date: string;
  hours: number;
  quality: number; // 1-5
}

export interface CopingStrategy {
  id: string;
  title: string;
  category: 'calm' | 'active' | 'social' | 'creative';
}

export type Theme = 'light' | 'dark';
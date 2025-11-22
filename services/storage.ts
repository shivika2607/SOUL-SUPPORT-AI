import { User, MoodEntry, JournalEntry, Contact, AISettings, Habit, SleepLog, Theme, CopingStrategy } from '../types';

const KEY_USERS = 'ss_users';
const KEY_SESSION = 'ss_session';
const KEY_MOODS = 'ss_moods';
const KEY_JOURNAL = 'ss_journal';
const KEY_CONTACTS = 'ss_contacts';
const KEY_AI_SETTINGS = 'ss_ai_settings';
const KEY_HABITS = 'ss_habits';
const KEY_SLEEP = 'ss_sleep';
const KEY_THEME = 'ss_theme';
const KEY_COPING = 'ss_coping';

// Helper to generate IDs
const uuid = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export const StorageService = {
  // --- Auth ---
  getCurrentUser: (): User | null => {
    const email = localStorage.getItem(KEY_SESSION);
    if (!email) return null;
    const users = StorageService.getUsers();
    return users.find(u => u.email === email) || null;
  },

  getUsers: (): User[] => {
    const raw = localStorage.getItem(KEY_USERS);
    return raw ? JSON.parse(raw) : [];
  },

  register: (name: string, email: string, pass: string): boolean => {
    const users = StorageService.getUsers();
    const normalizedEmail = email.toLowerCase().trim();
    if (users.some(u => u.email === normalizedEmail)) return false;

    const newUser: User = {
      id: uuid(),
      name,
      email: normalizedEmail,
      password: pass,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem(KEY_USERS, JSON.stringify(users));
    return true;
  },

  login: (email: string, pass: string): boolean => {
    const users = StorageService.getUsers();
    const normalizedEmail = email.toLowerCase().trim();
    const user = users.find(u => u.email === normalizedEmail && u.password === pass);
    
    if (user) {
      localStorage.setItem(KEY_SESSION, normalizedEmail);
      return true;
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem(KEY_SESSION);
  },

  // --- Moods ---
  addMood: (score: number, notes: string) => {
    const user = StorageService.getCurrentUser();
    if (!user) return;
    
    const moods = StorageService.getMoods();
    const newMood: MoodEntry = {
      id: uuid(),
      userEmail: user.email,
      score,
      notes,
      timestamp: new Date().toISOString()
    };
    moods.push(newMood);
    localStorage.setItem(KEY_MOODS, JSON.stringify(moods));
  },

  getMoods: (): MoodEntry[] => {
    const raw = localStorage.getItem(KEY_MOODS);
    const all: MoodEntry[] = raw ? JSON.parse(raw) : [];
    const user = StorageService.getCurrentUser();
    if (!user) return [];
    
    return all
      .filter(m => m.userEmail === user.email)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  // --- Journal ---
  addJournal: (reflection: string, gratitude: string, advice: string) => {
    const user = StorageService.getCurrentUser();
    if (!user) return;

    const journals = StorageService.getJournalsRaw();
    const entry: JournalEntry = {
      id: uuid(),
      userEmail: user.email,
      date: new Date().toISOString(),
      reflection,
      gratitude,
      advice
    };
    journals.push(entry);
    localStorage.setItem(KEY_JOURNAL, JSON.stringify(journals));
  },

  getJournalsRaw: (): JournalEntry[] => {
    const raw = localStorage.getItem(KEY_JOURNAL);
    return raw ? JSON.parse(raw) : [];
  },

  getJournals: (): JournalEntry[] => {
    const user = StorageService.getCurrentUser();
    if (!user) return [];
    const all = StorageService.getJournalsRaw();
    return all
      .filter(j => j.userEmail === user.email)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  // --- Contacts ---
  saveContact: (contact: Contact) => {
    const user = StorageService.getCurrentUser();
    if (!user) return;

    const raw = localStorage.getItem(KEY_CONTACTS);
    const all = raw ? JSON.parse(raw) : {};
    all[user.email] = contact;
    localStorage.setItem(KEY_CONTACTS, JSON.stringify(all));
  },

  getContact: (): Contact | null => {
    const user = StorageService.getCurrentUser();
    if (!user) return null;
    const raw = localStorage.getItem(KEY_CONTACTS);
    if (!raw) return null;
    const all = JSON.parse(raw);
    return all[user.email] || null;
  },

  // --- AI Settings ---
  getAISettings: (): AISettings => {
    const user = StorageService.getCurrentUser();
    if (!user) return { botName: 'SoulCompanion' };
    
    const raw = localStorage.getItem(KEY_AI_SETTINGS);
    const all = raw ? JSON.parse(raw) : {};
    return all[user.email] || { botName: 'SoulCompanion' };
  },

  saveAISettings: (settings: AISettings) => {
    const user = StorageService.getCurrentUser();
    if (!user) return;

    const raw = localStorage.getItem(KEY_AI_SETTINGS);
    const all = raw ? JSON.parse(raw) : {};
    all[user.email] = settings;
    localStorage.setItem(KEY_AI_SETTINGS, JSON.stringify(all));
  },

  // --- Habits ---
  getHabits: (): Habit[] => {
    const user = StorageService.getCurrentUser();
    if (!user) return [];
    const raw = localStorage.getItem(KEY_HABITS);
    const all = raw ? JSON.parse(raw) : {};
    return all[user.email] || [
      { id: 'h1', title: 'Drink Water', completed: false, lastUpdated: '' },
      { id: 'h2', title: 'Meditate 5 mins', completed: false, lastUpdated: '' },
      { id: 'h3', title: 'No Sugar', completed: false, lastUpdated: '' },
    ];
  },

  saveHabits: (habits: Habit[]) => {
    const user = StorageService.getCurrentUser();
    if (!user) return;
    const raw = localStorage.getItem(KEY_HABITS);
    const all = raw ? JSON.parse(raw) : {};
    all[user.email] = habits;
    localStorage.setItem(KEY_HABITS, JSON.stringify(all));
  },

  // --- Sleep ---
  addSleep: (hours: number, quality: number) => {
    const user = StorageService.getCurrentUser();
    if (!user) return;
    const raw = localStorage.getItem(KEY_SLEEP);
    const all = raw ? JSON.parse(raw) : {};
    const userLog: SleepLog[] = all[user.email] || [];
    
    userLog.push({
      id: uuid(),
      date: new Date().toISOString(),
      hours,
      quality
    });
    
    // Keep only last 30 days
    const keep = userLog.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 30);
    
    all[user.email] = keep;
    localStorage.setItem(KEY_SLEEP, JSON.stringify(all));
  },

  getSleep: (): SleepLog[] => {
    const user = StorageService.getCurrentUser();
    if (!user) return [];
    const raw = localStorage.getItem(KEY_SLEEP);
    const all = raw ? JSON.parse(raw) : {};
    return (all[user.email] || []).reverse();
  },

  // --- Coping Toolbox ---
  getCopingStrategies: (): CopingStrategy[] => {
    const user = StorageService.getCurrentUser();
    if (!user) return [];
    const raw = localStorage.getItem(KEY_COPING);
    const all = raw ? JSON.parse(raw) : {};
    return all[user.email] || [
      { id: 'c1', title: 'Deep Breathing', category: 'calm' },
      { id: 'c2', title: 'Call a Friend', category: 'social' },
      { id: 'c3', title: 'Go for a Walk', category: 'active' },
      { id: 'c4', title: 'Draw or Doodle', category: 'creative' },
    ];
  },

  saveCopingStrategies: (strategies: CopingStrategy[]) => {
    const user = StorageService.getCurrentUser();
    if (!user) return;
    const raw = localStorage.getItem(KEY_COPING);
    const all = raw ? JSON.parse(raw) : {};
    all[user.email] = strategies;
    localStorage.setItem(KEY_COPING, JSON.stringify(all));
  },

  addCopingStrategy: (title: string, category: CopingStrategy['category']) => {
    const strategies = StorageService.getCopingStrategies();
    strategies.push({ id: uuid(), title, category });
    StorageService.saveCopingStrategies(strategies);
  },

  removeCopingStrategy: (id: string) => {
    const strategies = StorageService.getCopingStrategies();
    StorageService.saveCopingStrategies(strategies.filter(s => s.id !== id));
  },

  // --- Theme ---
  getTheme: (): Theme => {
    return (localStorage.getItem(KEY_THEME) as Theme) || 'light';
  },

  setTheme: (theme: Theme) => {
    localStorage.setItem(KEY_THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};
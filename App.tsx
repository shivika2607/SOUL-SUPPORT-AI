
import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { 
  Activity, BookOpen, MessageCircle, Phone, Heart, LogOut, Plus, Menu, ChevronLeft, Send, AlertTriangle, Smile, Music, ShieldAlert, Home, Calendar, Mic, Bluetooth, Wind, Thermometer, Watch, Flame, Settings, Edit3, CloudRain, Cloud, Leaf, Moon, Sun, CheckCircle, List, Users, Book, Play, Pause, MoonIcon, Coffee, Info, X, Waves, Fan, Train, Flower, Briefcase, Palette, Dumbbell, Loader2
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts';
import { StorageService } from './services/storage';
import { MoodEntry, JournalEntry, Contact, ChatMessage, Habit, SleepLog, Theme, CopingStrategy } from './types';

// --- Theme Context ---
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({ theme: 'light', toggleTheme: () => {} });

// --- Audio Engine (Zen & Music) ---

// Simple noise generator using Web Audio API to ensure sound actually plays without external dependencies
class ZenAudioEngine {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;

  constructor() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  private createNoiseBuffer(type: 'white' | 'pink' | 'brown') {
    if (!this.ctx) return null;
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; 
        b6 = white * 0.115926;
      }
    } else if (type === 'brown') {
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
    }
    return buffer;
  }

  play(type: 'rain' | 'forest' | 'white' | 'night' | 'ocean' | 'fire' | 'fan' | 'train') {
    if (!this.ctx) return;
    this.stop();
    
    let noiseType: 'white' | 'pink' | 'brown' = 'white';
    
    // Map sounds to noise types
    if (type === 'rain') noiseType = 'brown';
    if (type === 'forest') noiseType = 'pink';
    if (type === 'white') noiseType = 'white';
    if (type === 'night') noiseType = 'pink';
    if (type === 'ocean') noiseType = 'brown';
    if (type === 'fire') noiseType = 'brown';
    if (type === 'fan') noiseType = 'white';
    if (type === 'train') noiseType = 'pink';

    const buffer = this.createNoiseBuffer(noiseType);
    if (!buffer) return;

    this.source = this.ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;
    
    this.gainNode = this.ctx.createGain();
    // Adjust volume per type for better experience
    let volume = 0.05;
    if (type === 'fire') volume = 0.08;
    if (type === 'fan') volume = 0.03;
    if (type === 'ocean') volume = 0.06;
    
    this.gainNode.gain.value = volume; 
    
    this.source.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);
    this.source.start();
  }

  stop() {
    if (this.source) {
      this.source.stop();
      this.source.disconnect();
      this.source = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
  }
}

const zenAudio = new ZenAudioEngine();

// --- Reusable Components ---

const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-slate-900 rounded-3xl shadow-lg shadow-indigo-100/50 dark:shadow-none border border-white dark:border-slate-800 p-6 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02] dark:hover:bg-slate-800' : ''} ${className}`}
  >
    {children}
  </div>
);

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gradient';
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: React.ElementType;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  fullWidth = false, 
  disabled = false,
  icon: Icon,
  type = "button",
  className = ""
}) => {
  const baseClass = "inline-flex items-center justify-center px-6 py-3 rounded-2xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none focus:ring-indigo-500 disabled:opacity-50 disabled:shadow-none",
    secondary: "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-50 dark:border-slate-700 hover:border-indigo-100 hover:bg-indigo-50 dark:hover:bg-slate-700 focus:ring-indigo-200",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-none focus:ring-red-500",
    ghost: "text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800",
    gradient: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-xl hover:shadow-indigo-300 dark:shadow-none disabled:opacity-50"
  };
  
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseClass} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {Icon && <Icon className="w-5 h-5 mr-2" />}
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  textarea?: boolean;
}

const Input: React.FC<InputProps> = ({ label, textarea, ...props }) => (
  <div className="mb-5">
    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2 ml-1">{label}</label>
    {textarea ? (
       <textarea 
        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white min-h-[100px]"
        {...props as any} 
      />
    ) : (
      <input 
        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white"
        {...props as any} 
      />
    )}
  </div>
);

// --- Data & Helpers ---

const JOURNAL_PROMPTS: Record<string, string[]> = {
  'Gratitude': [
    "What are three things that made you smile today?",
    "Who is someone you are grateful to have in your life and why?",
    "What is a small win you experienced recently?"
  ],
  'Self-Discovery': [
    "What does your ideal day look like?",
    "What is a value you hold dear and how do you practice it?",
    "If you could talk to your younger self, what would you say?"
  ],
  'Stress Management': [
    "What is currently causing you stress and is it within your control?",
    "List 5 things that help you relax immediately.",
    "Write about a difficult situation you overcame in the past."
  ]
};

type MusicRegion = 'English' | 'Bollywood' | 'Punjabi' | 'Tamil';

interface Track {
  url: string;
  title: string;
  artist: string;
}

// Updated with HIGHLY RELIABLE, PERMANENT PUBLIC DOMAIN LINKS (Archive.org / FMA)
const MUSIC_LIBRARY: Record<MusicRegion, { low: Track; mid: Track; high: Track }> = {
  'English': {
    low: {
      url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Tours/Enthusiast/Tours_-_01_-_Enthusiast.mp3', 
      title: 'Enthusiast',
      artist: 'Tours'
    },
    mid: {
      url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Kai_Engel/Satin/Kai_Engel_-_04_-_Sentinel.mp3',
      title: 'Sentinel',
      artist: 'Kai Engel'
    },
    high: {
      url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Elipses.mp3',
      title: 'Elipses',
      artist: 'Chad Crouch'
    }
  },
  'Bollywood': {
    low: {
      url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/Music_for_Video/Mid-Air_Machine/Best_of_2015-2018_Instrumentals/Mid-Air_Machine_-_02_-_Saraswati_Healing_Mantra.mp3', // Indian style ambient
      title: 'Saraswati Mantra',
      artist: 'Mid-Air Machine'
    },
    mid: {
      url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Yung_Kartz/August_2018/Yung_Kartz_-_04_-_One_Way.mp3', // Modern Beat
      title: 'City Vibe',
      artist: 'Yung Kartz'
    },
    high: {
      url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Scott_Holmes/Music_for_Media_Vol_2/Scott_Holmes_-_12_-_Urban_Lullaby.mp3',
      title: 'Urban Beats',
      artist: 'Scott Holmes'
    }
  },
  'Punjabi': {
    low: {
      url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Siddhartha_Corsus/Constellations/Siddhartha_Corsus_-_05_-_Pushti.mp3', // Sitar/Folk
      title: 'Village Dawn',
      artist: 'Siddhartha'
    },
    mid: {
      url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Yung_Kartz/July_2019/Yung_Kartz_-_05_-_Levels.mp3', // Hip hop beat
      title: 'Desi HipHop',
      artist: 'YK Beats'
    },
    high: {
      url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Ketsa/Raising_Frequencies/Ketsa_-_11_-_Get_Ready.mp3', // Upbeat
      title: 'Get Ready',
      artist: 'Ketsa'
    }
  },
  'Tamil': {
    low: {
      url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Siddhartha_Corsus/Constellations/Siddhartha_Corsus_-_03_-_Kailash_Pati.mp3', // Spiritual
      title: 'Kailash Pati',
      artist: 'Siddhartha'
    },
    mid: {
      url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Ketsa/1000/Ketsa_-_06_-_Memories_Renewed.mp3', // Melodic
      title: 'Chennai Breeze',
      artist: 'Ketsa'
    },
    high: {
      url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Scott_Holmes/Inspiring__Upbeat_Music/Scott_Holmes_-_05_-_Little_Idea.mp3',
      title: 'Good Vibes',
      artist: 'Scott Holmes'
    }
  }
};

const getPlaylistRecommendation = (score: number, region: MusicRegion) => {
  const lib = MUSIC_LIBRARY[region];
  
  if (score <= 4) return { 
    title: `Comforting ${region}`, 
    color: "from-blue-500 to-cyan-400",
    bg: "bg-blue-50 dark:bg-slate-800",
    text: "text-blue-600 dark:text-blue-400",
    desc: "Gentle tunes to hug your soul.",
    genre: "Acoustic & Melodic",
    icon: <Music className="text-white" />,
    track: lib.low
  };
  if (score <= 7) return { 
    title: `Lo-Fi ${region}`, 
    color: "from-indigo-500 to-purple-500",
    bg: "bg-indigo-50 dark:bg-slate-800",
    text: "text-indigo-600 dark:text-indigo-400",
    desc: "Relaxing beats to help you breathe and focus.",
    genre: "Chill & Fusion",
    icon: <Music className="text-white" />,
    track: lib.mid
  };
  return { 
    title: `Upbeat ${region}`, 
    color: "from-amber-400 to-orange-500",
    bg: "bg-amber-50 dark:bg-slate-800",
    text: "text-amber-600 dark:text-amber-400",
    desc: "High energy tracks to celebrate your mood!",
    genre: "Dance & Pop",
    icon: <Activity className="text-white" />,
    track: lib.high
  };
};

// --- Chat Bot Logic ---
const generateBotResponse = (input: string, userName: string) => {
  const lower = input.toLowerCase();
  
  if (lower.includes('sad') || lower.includes('cry') || lower.includes('depressed') || lower.includes('lonely') || lower.includes('pain')) {
    return `I hear you, ${userName}, and I want you to know that your feelings are completely valid. It takes so much strength to carry what you are carrying right now. Please remember that this heavy feeling is a cloud passing through the sky of your life—it is not the sky itself.\n\nYou are safe here, you are not alone, and I am right here with you while we navigate this storm together. Take a deep breath, and let's just be here for a moment. Would you like to tell me more about what's making you feel this way?`;
  }
  
  if (lower.includes('anxious') || lower.includes('scared') || lower.includes('worry') || lower.includes('panic') || lower.includes('stress')) {
    return `I can sense that things feel overwhelming right now, ${userName}. Anxiety has a way of making everything feel urgent and loud, but let's try to slow things down together. You are safe in this present moment.\n\nTry to focus on your breathing—inhale slowly for four seconds, hold it, and let it out. You have handled difficult moments before, and you have the resilience to get through this one too. I'm here holding space for you. Is there one specific thing that is worrying you the most?`;
  }

  if (lower.includes('happy') || lower.includes('good') || lower.includes('great') || lower.includes('excited') || lower.includes('awesome')) {
    return `That is absolutely wonderful to hear, ${userName}! It brings me so much joy to see you feeling this way. Hold onto this feeling—savor it, let it fill you up.\n\nThese moments of light are so important, and you deserve every bit of this happiness. Thank you for sharing your joy with me; it truly brightens the day. What is the best part about how you're feeling right now? I'd love to hear more about it!`;
  }
  
  if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('sleep') || lower.includes('busy')) {
    return `It sounds like your body and mind are asking for some well-deserved rest, ${userName}. We often push ourselves so hard that we forget that rest is productive too.\n\nIt is okay to put down your burdens for a while and just be. Please be gentle with yourself today. Maybe a warm cup of tea or some quiet time is what you need. You don't have to carry the world on your shoulders. I'm here whenever you're ready to talk again.`;
  }

  return `Thank you for sharing that with me, ${userName}. I am listening intently to every word. Life is a complex tapestry of emotions, and whatever you are feeling right now is okay. There is no "right" way to feel.\n\nI am here to support you, without judgment, through whatever is on your mind. You are doing the best you can, and that is enough. Tell me more about what's on your mind?`;
};


// --- Screens ---

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (StorageService.login(email, password)) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white dark:border-slate-800">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200 dark:shadow-none transform -rotate-3">
            <Heart className="w-8 h-8 text-white" fill="currentColor" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white tracking-tight">SoulSupport</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Your mental health companion</p>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 text-sm text-center font-medium border border-red-100 dark:border-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input 
            label="Email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <Input 
            label="Password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          
          <Button fullWidth type="submit" variant="gradient" className="mt-4">Sign In</Button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-slate-500 dark:text-slate-400">New here? </span>
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (StorageService.register(name, email, password)) {
      alert('Registration successful! Please login.');
      navigate('/login');
    } else {
      setError('Email already registered');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white dark:border-slate-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Create Account</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Join our supportive community</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <Input 
            label="Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
          <Input 
            label="Email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <Input 
            label="Password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          
          <Button fullWidth type="submit" variant="gradient" className="mt-4">Register</Button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/login" className="text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

const BioSyncScreen = () => {
  const [connected, setConnected] = useState(false);
  const [heartRate, setHeartRate] = useState(0);
  const [temp, setTemp] = useState(0);
  const [scanning, setScanning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const connectDevice = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setConnected(true);
      intervalRef.current = setInterval(() => {
        const newHr = Math.floor(Math.random() * (110 - 65 + 1)) + 65;
        setHeartRate(newHr);
        setTemp(36.5 + Math.random() * 0.5);
      }, 2000);
    }, 2000);
  };

  const disconnect = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setConnected(false);
    setHeartRate(0);
    setTemp(0);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Bio-Sync IoT</h2>
        <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-medium text-slate-500 dark:text-slate-400">
          v1.2 Beta
        </div>
      </div>

      {!connected ? (
        <Card className="text-center py-12 space-y-6">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${scanning ? 'bg-indigo-50 dark:bg-indigo-900/30 animate-pulse' : 'bg-indigo-50 dark:bg-indigo-900/30'}`}>
            <Bluetooth className={`w-12 h-12 ${scanning ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              {scanning ? 'Scanning for devices...' : 'Connect Wearable'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Pair your smartwatch to track real-time stress levels and heart rate variability.
            </p>
          </div>
          <Button onClick={connectDevice} disabled={scanning} variant="gradient">
            {scanning ? 'Connecting...' : 'Find Device'}
          </Button>
        </Card>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          {heartRate > 100 && (
             <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 p-4 rounded-2xl flex items-start gap-3">
               <div className="bg-red-100 dark:bg-red-800 p-2 rounded-full">
                 <AlertTriangle className="w-5 h-5 text-red-600 dark:text-white" />
               </div>
               <div>
                 <h3 className="font-bold text-red-900 dark:text-red-200">High Stress Detected</h3>
                 <p className="text-red-700 dark:text-red-300 text-sm mb-2">Your heart rate is elevated. We recommend a quick breathing exercise.</p>
                 <Link to="/breathe" className="text-red-800 dark:text-red-200 font-bold text-sm underline">Start Breathing &rarr;</Link>
               </div>
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Card className="flex flex-col items-center justify-center py-8 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50 dark:border-rose-900 border-rose-100">
              <div className="flex items-center gap-2 text-rose-500 mb-2">
                <Heart className="w-5 h-5 animate-pulse fill-rose-500" />
                <span className="font-bold uppercase text-xs tracking-wider">Heart Rate</span>
              </div>
              <span className="text-4xl font-bold text-slate-800 dark:text-white">{heartRate}</span>
              <span className="text-slate-400 dark:text-slate-500 text-sm font-medium">BPM</span>
            </Card>

            <Card className="flex flex-col items-center justify-center py-8 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 dark:border-amber-900 border-amber-100">
               <div className="flex items-center gap-2 text-orange-500 mb-2">
                <Thermometer className="w-5 h-5" />
                <span className="font-bold uppercase text-xs tracking-wider">Skin Temp</span>
              </div>
              <span className="text-4xl font-bold text-slate-800 dark:text-white">{temp.toFixed(1)}°</span>
              <span className="text-slate-400 dark:text-slate-500 text-sm font-medium">Celsius</span>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Watch className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">Galaxy Watch 6</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Connected • Battery 82%</p>
                </div>
              </div>
              <button onClick={disconnect} className="text-slate-400 hover:text-red-500 text-sm font-medium">
                Disconnect
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const ZenScreen = () => {
  const [activeSound, setActiveSound] = useState<string | null>(null);

  const sounds = [
    { id: 'rain', name: 'Heavy Rain', icon: CloudRain, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
    { id: 'forest', name: 'Forest Creek', icon: Leaf, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' },
    { id: 'white', name: 'White Noise', icon: Wind, color: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
    { id: 'night', name: 'Night Crickets', icon: Moon, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' },
    { id: 'ocean', name: 'Ocean Waves', icon: Waves, color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400' },
    { id: 'fire', name: 'Fireplace', icon: Flame, color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' },
    { id: 'fan', name: 'Ceiling Fan', icon: Fan, color: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    { id: 'train', name: 'Train Journey', icon: Train, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
  ];

  useEffect(() => {
    return () => zenAudio.stop();
  }, []);

  const toggleSound = (id: string) => {
    if (activeSound === id) {
      zenAudio.stop();
      setActiveSound(null);
    } else {
      zenAudio.play(id as any);
      setActiveSound(id);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Zen Zone</h2>
        <p className="text-slate-500 dark:text-slate-400">Immersive soundscapes for focus and sleep.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sounds.map(sound => (
          <Card 
            key={sound.id} 
            className={`flex flex-col items-center text-center py-8 cursor-pointer transition-all ${
              activeSound === sound.id 
                ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900 bg-indigo-50/50 dark:bg-indigo-900/20 scale-95' 
                : 'hover:border-indigo-200 dark:hover:border-indigo-800'
            }`}
            onClick={() => toggleSound(sound.id)}
          >
             <div className={`p-4 rounded-full mb-3 ${sound.color} ${activeSound === sound.id ? 'animate-pulse' : ''}`}>
               <sound.icon className="w-8 h-8" />
             </div>
             <h3 className="font-bold text-slate-800 dark:text-white">{sound.name}</h3>
             <span className="text-xs font-medium text-slate-400 mt-1">
               {activeSound === sound.id ? 'Playing...' : 'Tap to Play'}
             </span>
          </Card>
        ))}
      </div>

      {activeSound && (
        <div className="fixed bottom-20 left-4 right-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-10 z-50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            <div>
              <p className="font-bold text-sm">Playing {sounds.find(s => s.id === activeSound)?.name}</p>
              <p className="text-slate-400 dark:text-slate-600 text-xs">Audio Active</p>
            </div>
          </div>
          <button 
            onClick={() => { zenAudio.stop(); setActiveSound(null); }}
            className="bg-white/10 dark:bg-slate-200 p-2 rounded-full hover:bg-white/20 dark:hover:bg-slate-300"
          >
            <div className="w-3 h-3 bg-white dark:bg-slate-900 rounded-sm"></div>
          </button>
        </div>
      )}
    </div>
  );
};

const BreathingScreen = () => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [timeLeft, setTimeLeft] = useState(4);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (active) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 1) {
            if (phase === 'inhale') {
              setPhase('hold');
              return 4;
            } else if (phase === 'hold') {
              setPhase('exhale');
              return 4;
            } else {
              setPhase('inhale');
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [active, phase]);

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center pb-20 space-y-12">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Box Breathing</h2>
        <p className="text-slate-500 dark:text-slate-400">Reduce anxiety and regain control.</p>
      </div>

      <div className="relative flex items-center justify-center">
        <div 
          className={`absolute w-64 h-64 rounded-full border-4 border-indigo-100 dark:border-indigo-900 transition-all duration-[4000ms] ease-in-out ${active ? 'opacity-100' : 'opacity-50'}`}
          style={{ transform: `scale(${active ? (phase === 'exhale' ? 1 : 1.5) : 1})` }}
        ></div>
        <div 
          className={`absolute w-48 h-48 rounded-full bg-indigo-50 dark:bg-indigo-900/20 transition-all duration-[4000ms] ease-in-out`}
           style={{ transform: `scale(${active ? (phase === 'exhale' ? 0.8 : 1.2) : 1})` }}
        ></div>
        
        <div className="relative z-10 w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-200 dark:shadow-none transition-all duration-300">
           {active ? (
             <span className="text-4xl font-bold font-mono">{timeLeft}</span>
           ) : (
             <Wind className="w-10 h-10" />
           )}
        </div>
      </div>

      <div className="text-center h-12">
         {active && (
           <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 animate-in fade-in duration-300">
             {phase === 'inhale' ? "Breathe In..." : phase === 'hold' ? "Hold..." : "Breathe Out..."}
           </h3>
         )}
      </div>

      <Button 
        variant={active ? 'secondary' : 'gradient'} 
        onClick={() => { setActive(!active); setPhase('inhale'); setTimeLeft(4); }}
        className="w-48"
      >
        {active ? 'Stop Exercise' : 'Start Breathing'}
      </Button>
    </div>
  );
};

// --- New Features Screens ---

const HabitScreen = () => {
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    const h = StorageService.getHabits();
    // Reset if new day
    const today = new Date().toISOString().split('T')[0];
    const resetHabits = h.map(habit => {
      if (habit.lastUpdated !== today) {
        return { ...habit, completed: false, lastUpdated: today };
      }
      return habit;
    });
    setHabits(resetHabits);
  }, []);

  const toggle = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = habits.map(h => 
      h.id === id ? { ...h, completed: !h.completed, lastUpdated: today } : h
    );
    setHabits(updated);
    StorageService.saveHabits(updated);
  };

  return (
    <div className="space-y-6 pb-20">
       <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Daily Rituals</h2>
       <Card>
         <div className="space-y-4">
            {habits.map(h => (
              <div 
                key={h.id} 
                onClick={() => toggle(h.id)}
                className={`flex items-center p-4 rounded-2xl border transition-all cursor-pointer ${
                  h.completed 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${
                  h.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-500'
                }`}>
                  {h.completed && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <span className={`font-medium text-lg ${h.completed ? 'text-green-800 dark:text-green-300 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                  {h.title}
                </span>
              </div>
            ))}
         </div>
       </Card>
       <p className="text-center text-sm text-slate-400">Habits reset automatically every day at midnight.</p>
    </div>
  );
};

const SleepScreen = () => {
  const [sleepLog, setSleepLog] = useState<SleepLog[]>([]);
  const [hours, setHours] = useState(7);
  const [quality, setQuality] = useState(3);
  const [savedToday, setSavedToday] = useState(false);

  useEffect(() => {
    setSleepLog(StorageService.getSleep());
  }, []);

  const saveSleep = () => {
    StorageService.addSleep(hours, quality);
    setSleepLog(StorageService.getSleep());
    setSavedToday(true);
  };

  const chartData = sleepLog.map(l => ({
    date: new Date(l.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    hours: l.hours
  }));

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Sleep Tracker</h2>
      
      {!savedToday ? (
        <Card>
          <h3 className="font-bold text-lg mb-6 dark:text-white">How did you sleep?</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Hours Slept: {hours}</label>
              <input 
                type="range" min="1" max="12" step="0.5"
                value={hours} onChange={e => setHours(parseFloat(e.target.value))}
                className="w-full h-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Quality (1-5)</label>
              <div className="flex justify-between">
                {[1,2,3,4,5].map(q => (
                  <button 
                    key={q}
                    onClick={() => setQuality(q)}
                    className={`w-10 h-10 rounded-full font-bold ${
                      quality === q 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <Button fullWidth onClick={saveSleep} variant="gradient">Log Sleep</Button>
          </div>
        </Card>
      ) : (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-4 rounded-2xl text-center font-medium">
          Sleep logged for today. Sweet dreams!
        </div>
      )}

      {chartData.length > 0 && (
        <Card className="h-64">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={chartData}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
               <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
               <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
             </BarChart>
           </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
};

const CommunityScreen = () => {
  const messages = [
    { id: 1, text: "You are stronger than you know. Keep going!", from: "Anonymous, London", time: "2h ago" },
    { id: 2, text: "Breathe. This too shall pass.", from: "Sarah, NY", time: "4h ago" },
    { id: 3, text: "Sending love to anyone feeling lonely today.", from: "Mike, Toronto", time: "5h ago" },
    { id: 4, text: "It's okay to rest. You don't have to be productive every second.", from: "A Friend", time: "6h ago" },
  ];

  return (
    <div className="space-y-6 pb-20">
       <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Hope Board</h2>
        <p className="text-slate-500 dark:text-slate-400">Safe space. Positive vibes only.</p>
      </div>
      
      <div className="space-y-4">
        {messages.map(m => (
          <Card key={m.id} className="!p-5">
            <p className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-3">"{m.text}"</p>
            <div className="flex justify-between text-xs text-slate-400 font-medium uppercase tracking-wide">
              <span>{m.from}</span>
              <span>{m.time}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const LearnScreen = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  const topics = [
    { id: 't1', title: 'Understanding Anxiety', content: "Anxiety is your body's natural response to stress. It's a feeling of fear or apprehension about what's to come..." },
    { id: 't2', title: 'Better Sleep Hygiene', content: "Stick to a sleep schedule. Pay attention to what you eat and drink. Create a restful environment..." },
    { id: 't3', title: 'Grounding Techniques', content: "The 5-4-3-2-1 technique: Acknowledge 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste." },
  ];

  return (
    <div className="space-y-6 pb-20">
       <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Mind Library</h2>
       <div className="space-y-3">
         {topics.map(t => (
           <div key={t.id} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
             <button 
              className="w-full flex justify-between items-center p-5 text-left font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setOpenId(openId === t.id ? null : t.id)}
             >
               {t.title}
               <ChevronLeft className={`w-5 h-5 transition-transform ${openId === t.id ? '-rotate-90' : 'rotate-180'}`} />
             </button>
             {openId === t.id && (
               <div className="p-5 pt-0 text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                 {t.content}
               </div>
             )}
           </div>
         ))}
       </div>
    </div>
  );
};

const GratitudeGardenScreen = () => {
  const [flowerCount, setFlowerCount] = useState(0);

  useEffect(() => {
    const journals = StorageService.getJournals();
    // Count entries where gratitude is not empty
    const count = journals.filter(j => j.gratitude && j.gratitude.trim().length > 0).length;
    setFlowerCount(count);
  }, []);

  return (
    <div className="space-y-6 pb-20">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gratitude Garden</h2>
        <p className="text-slate-500 dark:text-slate-400">Each gratitude entry plants a flower.</p>
      </div>
      
      <div className="bg-gradient-to-b from-sky-100 to-green-100 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 min-h-[400px] relative overflow-hidden border border-white/50 dark:border-slate-700 shadow-inner">
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-green-200/50 dark:bg-emerald-900/30 blur-xl"></div>
        
        {flowerCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-50">
            <Leaf className="w-16 h-16 text-green-600 dark:text-green-400 mb-4" />
            <p className="text-center font-medium text-slate-600 dark:text-slate-300">Your garden is empty.<br/>Write in your journal to plant seeds.</p>
            <Link to="/journal" className="mt-4 text-indigo-600 font-bold underline">Go to Journal</Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center items-end h-full pb-4">
            {Array.from({ length: flowerCount }).map((_, i) => (
              <div key={i} className="flex flex-col items-center animate-in slide-in-from-bottom-10 duration-700" style={{ animationDelay: `${i * 100}ms` }}>
                <Flower 
                  className={`w-10 h-10 ${
                    i % 3 === 0 ? 'text-pink-500' : i % 3 === 1 ? 'text-purple-500' : 'text-yellow-500'
                  } fill-current`} 
                />
                <div className="w-1 h-12 bg-green-500/50 rounded-full"></div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Card className="text-center">
        <p className="text-slate-500 dark:text-slate-400">
          <span className="font-bold text-2xl text-indigo-600 dark:text-indigo-400">{flowerCount}</span> Flowers Bloomed
        </p>
      </Card>
    </div>
  );
};

const CopingToolboxScreen = () => {
  const [strategies, setStrategies] = useState<CopingStrategy[]>([]);
  const [newStrategy, setNewStrategy] = useState('');

  useEffect(() => {
    setStrategies(StorageService.getCopingStrategies());
  }, []);

  const add = () => {
    if (!newStrategy.trim()) return;
    StorageService.addCopingStrategy(newStrategy, 'calm');
    setStrategies(StorageService.getCopingStrategies());
    setNewStrategy('');
  };

  const remove = (id: string) => {
    StorageService.removeCopingStrategy(id);
    setStrategies(StorageService.getCopingStrategies());
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Coping Toolbox</h2>
        <p className="text-slate-500 dark:text-slate-400">Your personal kit for tough moments.</p>
      </div>

      <Card className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900">
        <div className="flex gap-3">
          <input 
             className="flex-1 px-4 py-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
             placeholder="Add a strategy (e.g., 'Drink Tea')"
             value={newStrategy}
             onChange={(e) => setNewStrategy(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button onClick={add} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </Card>

      <div className="grid gap-3">
        {strategies.map(s => (
          <Card key={s.id} className="!p-4 flex justify-between items-center group">
             <div className="flex items-center gap-3">
               <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full text-green-600 dark:text-green-400">
                 <ShieldAlert className="w-5 h-5" />
               </div>
               <span className="font-bold text-slate-700 dark:text-slate-200">{s.title}</span>
             </div>
             <button onClick={() => remove(s.id)} className="text-slate-300 hover:text-red-500 transition-colors">
               <X className="w-5 h-5" />
             </button>
          </Card>
        ))}
      </div>
      
      {strategies.length === 0 && (
         <p className="text-center text-slate-400 mt-8">Your toolbox is empty. Add strategies that work for you.</p>
      )}
    </div>
  );
};

// --- Dashboard ---

const DashboardScreen = () => {
  const user = StorageService.getCurrentUser();
  const [latestMood, setLatestMood] = useState<MoodEntry | undefined>(undefined);

  useEffect(() => {
    const moods = StorageService.getMoods();
    if (moods.length > 0) setLatestMood(moods[0]);
  }, []);

  const menuItems = [
    { title: 'Mood Tracker', icon: Activity, path: '/mood', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400', desc: 'Log feelings' },
    { title: 'Journal', icon: BookOpen, path: '/journal', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', desc: 'Reflect daily' },
    { title: 'Gratitude Garden', icon: Flower, path: '/garden', color: 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400', desc: 'Your Growth' },
    { title: 'Coping Toolbox', icon: Briefcase, path: '/toolbox', color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400', desc: 'Crisis Kit' },
    { title: 'Zen Zone', icon: Cloud, path: '/zen', color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400', desc: 'Sleep & Focus' },
    { title: 'Bio-Sync IoT', icon: Bluetooth, path: '/biosync', color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400', desc: 'Connect Device' },
    { title: 'Breathing', icon: Wind, path: '/breathe', color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400', desc: 'Calm down' },
    { title: 'Daily Rituals', icon: CheckCircle, path: '/habits', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400', desc: 'Habits' },
    { title: 'Sleep', icon: MoonIcon, path: '/sleep', color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400', desc: 'Track Rest' },
    { title: 'Hope Board', icon: Users, path: '/community', color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400', desc: 'Community' },
    { title: 'Affirmations', icon: Heart, path: '/affirmation', color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400', desc: 'Positivity' },
    { title: 'Library', icon: Book, path: '/learn', color: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400', desc: 'Learn' },
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center pt-2">
        <div>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Good day,</p>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{user?.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full text-orange-600 dark:text-orange-400 font-bold text-sm border border-orange-100 dark:border-orange-900">
            <Flame className="w-4 h-4 fill-orange-500" />
            <span>3 Day Streak</span>
          </div>
          <div className="bg-indigo-100 dark:bg-indigo-900 p-1 rounded-full">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-8 -translate-y-8">
          <Activity className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h2 className="text-indigo-100 text-sm font-semibold uppercase tracking-wider mb-2">Latest Mood Check-in</h2>
          <div className="flex items-baseline gap-3">
            {latestMood ? (
              <>
                <span className="text-5xl font-bold">{latestMood.score}</span>
                <span className="text-indigo-200 font-medium">/ 10</span>
              </>
            ) : (
              <div>
                <span className="text-2xl font-bold">No check-ins yet</span>
                <p className="text-indigo-200 mt-1">Start tracking your journey today.</p>
              </div>
            )}
          </div>
          <div className="mt-6">
             <Link to="/mood" className="bg-white text-indigo-600 px-5 py-2 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors inline-flex items-center">
               Check In Now <ChevronLeft className="w-4 h-4 rotate-180 ml-1" />
             </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <Link key={item.title} to={item.path}>
            <Card className="h-full hover:border-indigo-100 dark:hover:border-indigo-900 flex flex-col items-start">
              <div className={`p-3 rounded-2xl mb-3 ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm md:text-base">{item.title}</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm">{item.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
      
      <div className="bg-red-50 dark:bg-red-900/20 rounded-3xl p-6 border border-red-100 dark:border-red-900 flex items-center gap-4 shadow-sm">
         <div className="bg-red-100 dark:bg-red-800 p-3 rounded-full shrink-0">
           <AlertTriangle className="w-6 h-6 text-red-500 dark:text-white" />
         </div>
         <div className="flex-1">
           <h3 className="font-bold text-red-900 dark:text-red-200">Emergency SOS</h3>
           <p className="text-red-700 dark:text-red-300 text-sm">Access help immediately</p>
         </div>
         <Link to="/sos" className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-red-200 dark:shadow-none hover:bg-red-600">
           Open
         </Link>
      </div>
    </div>
  );
};

const MoodScreen = () => {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [score, setScore] = useState(5);
  const [notes, setNotes] = useState('');
  const [view, setView] = useState<'add' | 'list'>('list');
  const [playing, setPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [musicRegion, setMusicRegion] = useState<MusicRegion>('English');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMoods(StorageService.getMoods());
  }, [view]);

  // Reset playback when track/playlist changes
  useEffect(() => {
    if(audioRef.current) {
        audioRef.current.pause();
        setPlaying(false);
        setIsLoading(false);
        audioRef.current.load();
    }
  }, [musicRegion, score]);

  const handleSave = () => {
    StorageService.addMood(score, notes);
    setView('list');
    setScore(5);
    setNotes('');
  };

  const chartData = moods.slice().reverse().map(m => ({
    date: new Date(m.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: m.score
  }));

  const currentPlaylist = moods.length > 0 ? getPlaylistRecommendation(moods[0].score, musicRegion) : null;

  const toggleMusic = () => {
    if (!audioRef.current) return;
    
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      setIsLoading(true);
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlaying(true);
            setIsLoading(false);
          })
          .catch(error => {
            console.error("Audio playback failed:", error);
            setPlaying(false);
            setIsLoading(false);
            alert("Playback failed. Please check your connection.");
          });
      }
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Mood Tracker</h2>
        <Button 
          variant={view === 'list' ? 'gradient' : 'secondary'}
          onClick={() => setView(view === 'list' ? 'add' : 'list')} 
          icon={view === 'list' ? Plus : ChevronLeft}
          className="!rounded-xl !py-2"
        >
          {view === 'list' ? 'Log Mood' : 'History'}
        </Button>
      </div>

      {view === 'add' ? (
        <Card className="border-t-4 border-indigo-500">
          <div className="space-y-8">
            <div className="text-center">
              <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">
                How are you feeling?
              </label>
              
              <div className="relative pt-6 pb-2">
                <div className="text-6xl font-bold text-indigo-600 dark:text-indigo-400 mb-4 transition-all duration-300 transform scale-110">
                  {score}
                </div>
                <input 
                  type="range" min="1" max="10" 
                  value={score} 
                  onChange={(e) => setScore(parseInt(e.target.value))}
                  className="w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                  <span>Rough Day</span>
                  <span>Amazing</span>
                </div>
              </div>
            </div>

            <Input 
              label="Add a note (Optional)" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What's on your mind?"
            />
            
            <Button fullWidth onClick={handleSave} variant="gradient" className="py-4 text-lg">
              Save Mood
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {chartData.length > 1 && (
            <Card className="h-72 !p-4 overflow-hidden">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ml-2">Mood Trend</h3>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Area type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}

          {currentPlaylist && (
            <div className={`relative rounded-3xl p-6 overflow-hidden bg-gradient-to-br ${currentPlaylist.color} text-white shadow-xl shadow-indigo-200 dark:shadow-none transition-all`}>
              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    Recommended For You
                  </span>
                  
                  <select 
                    value={musicRegion}
                    onChange={(e) => setMusicRegion(e.target.value as MusicRegion)}
                    className="bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-lg px-2 py-1 border-none outline-none cursor-pointer hover:bg-white/30 transition-colors"
                  >
                    <option value="English" className="text-slate-900">🇺🇸 English</option>
                    <option value="Bollywood" className="text-slate-900">🇮🇳 Bollywood</option>
                    <option value="Punjabi" className="text-slate-900">👳 Punjabi</option>
                    <option value="Tamil" className="text-slate-900">🌴 Tamil</option>
                  </select>
                </div>
                
                <h4 className="text-2xl font-bold mb-1">{currentPlaylist.title}</h4>
                <p className="text-white/90 mb-6 text-sm">{currentPlaylist.track.artist} - {currentPlaylist.track.title}</p>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-2 rounded-full">
                       {currentPlaylist.icon}
                    </div>
                    <span className="font-medium">{currentPlaylist.genre}</span>
                  </div>
                  <button 
                    onClick={toggleMusic}
                    disabled={isLoading}
                    className="bg-white text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center hover:bg-indigo-50 transition-all shadow-lg disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : playing ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-1" />
                    )}
                  </button>
                </div>
                <audio 
                  ref={audioRef} 
                  src={currentPlaylist.track.url} 
                  onEnded={() => setPlaying(false)} 
                  onWaiting={() => setIsLoading(true)}
                  onCanPlay={() => setIsLoading(false)}
                  onError={() => { setPlaying(false); setIsLoading(false); alert("Could not load this track. Please check internet connection."); }}
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white px-1">Recent Logs</h3>
            {moods.map(mood => (
              <div key={mood.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex gap-4 items-start">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${
                  mood.score >= 8 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 
                  mood.score >= 5 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 
                  'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                }`}>
                  {mood.score}
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium mb-1">
                    {new Date(mood.timestamp).toLocaleDateString()} • {new Date(mood.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  {mood.notes && <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{mood.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ChatScreen = () => {
  const [botName, setBotName] = useState('SoulCompanion');
  const [isEditingName, setIsEditingName] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = StorageService.getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    const settings = StorageService.getAISettings();
    setBotName(settings.botName);
    setMessages([
      { id: '0', text: `Hello! I am ${settings.botName}, your support bot. How are you feeling today?`, sender: 'bot', timestamp: Date.now() }
    ]);
  }, []);

  const saveBotName = () => {
    StorageService.saveAISettings({ botName });
    setIsEditingName(false);
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), text: input, sender: 'user', timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    const userInput = input;
    setInput('');

    // Safety Check
    const dangerWords = ['suicide', 'kill myself', 'hurt myself', 'die', 'end it all', 'self harm'];
    const isDanger = dangerWords.some(w => userInput.toLowerCase().includes(w));

    if (isDanger) {
       setTimeout(() => {
         setMessages(prev => [...prev, { 
           id: Date.now().toString(), 
           text: "🚨 CRITICAL ALERT: I am detecting that you might be in danger. Initiating emergency protocols. Calling for help now.", 
           sender: 'bot', 
           timestamp: Date.now() 
         }]);
         navigate('/sos'); 
         window.location.href = "tel:112"; // Auto-dial logic
       }, 1000);
       return;
    }

    setTimeout(() => {
      const replyText = generateBotResponse(userInput, user?.name || 'friend');
      const reply: ChatMessage = { id: (Date.now() + 1).toString(), text: replyText, sender: 'bot', timestamp: Date.now() };
      setMessages(prev => [...prev, reply]);
    }, 1500);
  };

  return (
    <div className="relative h-[calc(100vh-160px)] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-indigo-50 dark:border-slate-800 overflow-hidden mb-20">
      <div className="bg-indigo-50/80 dark:bg-slate-800 backdrop-blur-sm p-4 border-b border-indigo-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-white dark:bg-slate-700 p-2 rounded-full mr-3 shadow-sm">
            <Smile className="text-indigo-600 dark:text-indigo-400 w-5 h-5" />
          </div>
          <div>
             {isEditingName ? (
              <div className="flex items-center gap-2">
                <input 
                  value={botName} 
                  onChange={(e) => setBotName(e.target.value)}
                  className="text-sm font-bold text-indigo-900 bg-white border border-indigo-200 rounded px-2 py-1 w-32"
                  autoFocus
                />
                <button onClick={saveBotName} className="text-green-600 text-xs font-bold">OK</button>
              </div>
            ) : (
              <span className="font-bold text-indigo-900 dark:text-white block text-sm">{botName}</span>
            )}
            <span className="text-xs text-indigo-400 flex items-center gap-1">Online</span>
          </div>
        </div>
        <button onClick={() => setIsEditingName(!isEditingName)} className="p-2 text-indigo-300 hover:text-indigo-600">
          <Settings className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 dark:bg-slate-950">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] md:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm ${
              msg.sender === 'user' 
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'
            }`}>
              <p className="leading-relaxed text-sm md:text-base whitespace-pre-wrap">{msg.text}</p>
              <span className={`text-[10px] block mt-2 opacity-70 ${msg.sender === 'user' ? 'text-indigo-100' : 'text-slate-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex gap-3">
          <input 
            className="flex-1 px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
          />
          <button onClick={handleSend} className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SOSScreen = () => {
  return (
     <div className="space-y-8 pb-20">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Emergency Help</h2>
        <p className="text-slate-500 dark:text-slate-400">You are not alone.</p>
      </div>
      <a href="tel:112" className="block w-full relative overflow-hidden group">
        <div className="absolute inset-0 bg-red-600 rounded-3xl animate-pulse opacity-20"></div>
        <div className="relative bg-gradient-to-br from-red-500 to-red-600 text-white p-8 rounded-3xl shadow-xl flex flex-col items-center text-center border border-red-400">
          <div className="bg-white/20 p-4 rounded-full mb-4 backdrop-blur-sm"><Phone className="w-12 h-12 animate-bounce" /></div>
          <div className="text-4xl font-extrabold tracking-tight mb-1">CALL 112</div>
          <div className="text-red-100 font-medium text-lg">National Emergency</div>
        </div>
      </a>

       <div className="grid grid-cols-2 gap-4">
        <a href="tel:100" className="bg-slate-800 text-white p-6 rounded-2xl text-center hover:bg-slate-700">
          <div className="font-bold text-2xl mb-1">100</div>
          <div className="text-slate-400 text-xs uppercase font-bold">Police</div>
        </a>
        <a href="tel:108" className="bg-slate-800 text-white p-6 rounded-2xl text-center hover:bg-slate-700">
          <div className="font-bold text-2xl mb-1">108</div>
          <div className="text-slate-400 text-xs uppercase font-bold">Ambulance</div>
        </a>
         <a href="tel:1091" className="bg-pink-600 text-white p-6 rounded-2xl text-center hover:bg-pink-700">
          <div className="font-bold text-2xl mb-1">1091</div>
          <div className="text-pink-200 text-xs uppercase font-bold">Women Helpline</div>
        </a>
        <a href="tel:18005990019" className="bg-indigo-600 text-white p-6 rounded-2xl text-center hover:bg-indigo-700">
          <div className="font-bold text-lg mb-1">KIRAN</div>
          <div className="text-indigo-200 text-xs uppercase font-bold">Mental Health</div>
        </a>
      </div>
    </div>
  );
};

const JournalScreen = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [view, setView] = useState<'list' | 'add'>('list');
  const [reflection, setReflection] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [advice, setAdvice] = useState('');
  const [showPrompts, setShowPrompts] = useState(false);

  useEffect(() => {
    setEntries(StorageService.getJournals());
  }, [view]);

  const handleSave = () => {
    if (!reflection) return;
    StorageService.addJournal(reflection, gratitude, advice);
    setReflection('');
    setGratitude('');
    setAdvice('');
    setView('list');
  };

  const selectPrompt = (text: string) => {
    setReflection(text + " ");
    setShowPrompts(false);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Journal</h2>
        <Button 
          variant={view === 'list' ? 'gradient' : 'secondary'}
          onClick={() => setView(view === 'list' ? 'add' : 'list')} 
          icon={view === 'list' ? Edit3 : ChevronLeft}
          className="!rounded-xl !py-2"
        >
          {view === 'list' ? 'New Entry' : 'View All'}
        </Button>
      </div>

      {view === 'add' ? (
        <div className="space-y-6 animate-in slide-in-from-right-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
             <button 
               onClick={() => setShowPrompts(!showPrompts)}
               className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
             >
               ✨ Guided Prompts
             </button>
          </div>

          {showPrompts && (
            <div className="grid gap-4 mb-4">
              {Object.entries(JOURNAL_PROMPTS).map(([category, prompts]) => (
                <div key={category} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-3 text-sm uppercase tracking-wider">{category}</h4>
                  <div className="space-y-2">
                    {prompts.map((p, i) => (
                      <button 
                        key={i} 
                        onClick={() => selectPrompt(p)}
                        className="block w-full text-left text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Card className="space-y-4">
            <Input 
              label="Reflection" 
              textarea 
              value={reflection} 
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Write your thoughts here..." 
            />
            <Input 
              label="One good thing that happened (Adds a flower!)" 
              value={gratitude} 
              onChange={(e) => setGratitude(e.target.value)}
            />
            <Input 
              label="Advice to self" 
              value={advice} 
              onChange={(e) => setAdvice(e.target.value)}
            />
            <Button fullWidth onClick={handleSave} variant="gradient" className="py-4">
              Save Entry
            </Button>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-slate-800 dark:text-white font-bold">Empty Journal</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Start writing your story today.</p>
            </div>
          ) : (
            entries.map(entry => (
              <Card key={entry.id} className="group">
                 <div className="flex items-center gap-2 mb-3">
                   <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2 py-1 rounded-lg uppercase">
                     {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short'})}
                   </div>
                   <span className="text-slate-400 text-xs">
                     {new Date(entry.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </span>
                 </div>
                 <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed mb-4 font-medium">
                   {entry.reflection}
                 </p>
                 {(entry.gratitude || entry.advice) && (
                   <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3 text-sm">
                     {entry.gratitude && (
                       <div className="flex gap-2">
                         <Heart className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                         <span className="text-slate-600 dark:text-slate-400">{entry.gratitude}</span>
                       </div>
                     )}
                     {entry.advice && (
                       <div className="flex gap-2">
                         <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                         <span className="text-slate-600 dark:text-slate-400 italic">"{entry.advice}"</span>
                       </div>
                     )}
                   </div>
                 )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const AffirmationScreen = () => { 
   const aff = "You are doing better than you think.";
   return (
    <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center p-4 pb-20">
      <Card className="max-w-lg w-full text-center py-20 px-8">
        <Heart className="w-16 h-16 text-pink-400 mx-auto mb-8 animate-bounce" fill="#f472b6" fillOpacity={0.2} />
        <p className="text-2xl md:text-3xl font-medium text-slate-800 dark:text-white leading-relaxed mb-12">"{aff}"</p>
      </Card>
    </div>
   );
};


// --- Layout & Routing ---

const BottomNav = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/mood', icon: Activity, label: 'Mood' },
    { path: '/zen', icon: Cloud, label: 'Zen' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/sos', icon: ShieldAlert, label: 'SOS', danger: true },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe z-40">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              isActive(item.path) 
                ? (item.danger ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400') 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <item.icon className={`w-6 h-6 ${isActive(item.path) ? 'fill-current opacity-20 stroke-[2.5px]' : ''}`} />
            <span className="text-[10px] font-medium mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  
  const handleLogout = () => {
    StorageService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-md w-full mx-auto min-h-screen bg-white dark:bg-slate-950 shadow-2xl shadow-slate-200/50 dark:shadow-none relative flex flex-col">
        <header className="px-6 pt-6 pb-2 flex items-center justify-between bg-white dark:bg-slate-950 sticky top-0 z-20">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-indigo-700 dark:text-indigo-400">
            <Heart className="w-6 h-6 fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400" /> 
            <span className="tracking-tight">SoulSupport</span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>
        <main className="flex-1 px-6 py-4 overflow-y-auto">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = StorageService.getCurrentUser();
  return user ? <>{children}</> : <Navigate to="/login" />;
};

export default function App() {
  const [theme, setTheme] = useState<Theme>(StorageService.getTheme());

  useEffect(() => {
    StorageService.setTheme(theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<PrivateRoute><Layout><DashboardScreen /></Layout></PrivateRoute>} />
          <Route path="/mood" element={<PrivateRoute><Layout><MoodScreen /></Layout></PrivateRoute>} />
          <Route path="/journal" element={<PrivateRoute><Layout><JournalScreen /></Layout></PrivateRoute>} />
          <Route path="/zen" element={<PrivateRoute><Layout><ZenScreen /></Layout></PrivateRoute>} />
          <Route path="/biosync" element={<PrivateRoute><Layout><BioSyncScreen /></Layout></PrivateRoute>} />
          <Route path="/breathe" element={<PrivateRoute><Layout><BreathingScreen /></Layout></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><Layout><ChatScreen /></Layout></PrivateRoute>} />
          <Route path="/sos" element={<PrivateRoute><Layout><SOSScreen /></Layout></PrivateRoute>} />
          <Route path="/affirmation" element={<PrivateRoute><Layout><AffirmationScreen /></Layout></PrivateRoute>} />
          <Route path="/habits" element={<PrivateRoute><Layout><HabitScreen /></Layout></PrivateRoute>} />
          <Route path="/sleep" element={<PrivateRoute><Layout><SleepScreen /></Layout></PrivateRoute>} />
          <Route path="/community" element={<PrivateRoute><Layout><CommunityScreen /></Layout></PrivateRoute>} />
          <Route path="/learn" element={<PrivateRoute><Layout><LearnScreen /></Layout></PrivateRoute>} />
          <Route path="/garden" element={<PrivateRoute><Layout><GratitudeGardenScreen /></Layout></PrivateRoute>} />
          <Route path="/toolbox" element={<PrivateRoute><Layout><CopingToolboxScreen /></Layout></PrivateRoute>} />
        </Routes>
      </HashRouter>
    </ThemeContext.Provider>
  );
}

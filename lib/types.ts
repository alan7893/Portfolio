export type Person = {
  id: string;
  name: string;
  role?: string;
  color: string;
  createdAt: string;
};

export type PhotoMemory = {
  id: string;
  personId: string;
  filename: string;
  url: string;
  uploadedAt: string;
  analysis: PhotoAnalysis;
};

export type PhotoAnalysis = {
  summary: string;
  tags: string[];
  mood: string;
  setting: string;
  peopleVisible: string;
  colors: string[];
  sparklingMoment: string;
  source: "gemini" | "openai" | "local";
};

export type TrackRecord = {
  id: string;
  personId: string;
  title: string;
  date: string;
  category: "work" | "growth" | "relationship" | "milestone" | "other";
  notes: string;
  highlight: number; // 1-5 sparkle intensity
  createdAt: string;
};

export type PortfolioReport = {
  personId: string;
  generatedAt: string;
  activity: {
    headline: string;
    summary: string;
    themes: string[];
    cadence: string;
  };
  positiveFeedback: {
    headline: string;
    strengths: string[];
    encouragement: string;
  };
  sparklingHours: {
    headline: string;
    moments: Array<{
      title: string;
      when: string;
      why: string;
      source: "photo" | "record";
    }>;
  };
  narrative: string;
  source: "gemini" | "local";
  pagesEstimate: number;
  model: string | null;
};

export type AppStore = {
  activePersonId: string | null;
  people: Person[];
  photos: PhotoMemory[];
  records: TrackRecord[];
  reports: Record<string, PortfolioReport>;
};

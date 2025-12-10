export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface JobSearchSource {
  title: string;
  uri: string;
}

export interface JobListing {
  title: string;
  company: string;
  location?: string;
  description: string;
  sources: JobSearchSource[];
}

export enum AppView {
  RESUME_OPTIMIZER = 'RESUME_OPTIMIZER',
  JOB_FINDER = 'JOB_FINDER',
  INTERVIEW_PREP = 'INTERVIEW_PREP'
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

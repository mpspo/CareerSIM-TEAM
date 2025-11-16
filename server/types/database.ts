export interface User {
  id: string;
  username: string;
  password: string;
  study?: string;
  target?: string;
}

export interface Session {
  username: string;
  created: number;
}

export interface InterviewQuestion {
  question: string;
  answer: string;
  time: number;
}

export interface Interview {
  username: string;
  questions: string[];
  index: number;
  history: InterviewQuestion[];
}

export interface Database {
  users: User[];
  sessions: Record<string, Session>;
  interviews: Record<string, Interview>;
}

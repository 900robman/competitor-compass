export interface InterviewSession {
  id: string;
  project_id: string;
  session_token: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  started_at: string;
  completed_at: string | null;
  last_activity_at: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface InterviewMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ClientResponse {
  id: string;
  session_id: string;
  question_category: string;
  extracted_data: Record<string, any>;
  confidence_score: number | null;
  source_message_ids: string[];
  created_at: string;
  updated_at: string;
}

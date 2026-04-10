export interface Module {
  id: string;
  name: string;
  icon: string;
  description?: string;
}
 
export type MessageRole = "user" | "serqet" | "error";
 
export interface ChatMessage {
  role: MessageRole;
  text: string;
  image?: string;
  audio_url?: string;
}
 
export interface IntentResponse {
  status: string;
  message: string;
  action?: string;
  audio_url?: string;
  data?: Record<string, unknown>;
}
 
export interface AgentConfig {
  slug: string;
  name: string;
  system_prompt: string;
  allowed_tools: string;
}
 
export interface ChatSession {
  session_id: string;
  title: string;
  UserID: string;
  UpdatedAt: string;
}
 
export interface UploadResponse {
  path: string;
  url: string;
}

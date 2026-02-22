export interface Module {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface ChatMessage {
  role: 'user' | 'serqet' | 'error';
  text: string;
}

export interface IntentResponse {
  status: string;
  message: string;
  action?: string;
}
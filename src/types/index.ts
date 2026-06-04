export interface User {
  id: number;
  username: string;
  password: string;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  created_at: string;
  created_by: number;
  user_count?: number;
}

export interface RoomUser {
  room_id: string;
  user_id: number;
  joined_at: string;
}

export interface Message {
  id: number;
  room_id: string;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
}

export interface WSMessage {
  type: 'auth' | 'join_room' | 'leave_room' | 'message' | 'ping';
  token?: string;
  roomId?: string;
  content?: string;
}

export interface WSResponse {
  type: 'auth_success' | 'join_success' | 'leave_success' | 'message' | 'user_joined' | 'user_left' | 'room_users' | 'pong' | 'error';
  userId?: number;
  username?: string;
  roomId?: string;
  roomName?: string;
  history?: Message[];
  users?: Array<{ id: number; username: string; joined_at: string }>;
  content?: string;
  timestamp?: string;
  error?: string;
}

export interface AuthenticatedClient {
  userId: number;
  username: string;
  currentRoom: string | null;
}

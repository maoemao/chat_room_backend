import { v4 as uuidv4 } from 'uuid';
import { query, run, get } from '../db';
import { Room, Message } from '../types';

export async function createRoom(name: string, description: string, createdBy: number): Promise<{ success: boolean; roomId?: string; name?: string; description?: string; error?: string }> {
  if (!name) {
    return { success: false, error: 'Room name is required' };
  }

  const roomId = uuidv4();
  await run('INSERT INTO rooms (id, name, description, created_by) VALUES (?, ?, ?, ?)',
    [roomId, name, description || '', createdBy]);

  await run('INSERT INTO room_users (room_id, user_id) VALUES (?, ?)', [roomId, createdBy]);

  return { success: true, roomId, name, description };
}

export async function getAllRooms(): Promise<Room[]> {
  return await query<Room>(`
    SELECT r.*, COUNT(ru.user_id) as user_count
    FROM rooms r
    LEFT JOIN room_users ru ON r.id = ru.room_id
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `);
}

export async function getRoomById(roomId: string): Promise<Room | null> {
  const room = await get<Room>(`
    SELECT r.*, COUNT(ru.user_id) as user_count
    FROM rooms r
    LEFT JOIN room_users ru ON r.id = ru.room_id
    WHERE r.id = ?
    GROUP BY r.id
  `, [roomId]);

  return room || null;
}

export async function joinRoom(roomId: string, userId: number): Promise<{ success: boolean; roomId?: string; error?: string }> {
  const room = await getRoomById(roomId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  const existing = await get('SELECT * FROM room_users WHERE room_id = ? AND user_id = ?', [roomId, userId]);

  if (existing) {
    return { success: false, error: 'Already in this room' };
  }

  await run('INSERT INTO room_users (room_id, user_id) VALUES (?, ?)', [roomId, userId]);

  return { success: true, roomId };
}

export async function leaveRoom(roomId: string, userId: number): Promise<{ success: boolean; roomId?: string; error?: string }> {
  const room = await getRoomById(roomId);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  const existing = await get('SELECT * FROM room_users WHERE room_id = ? AND user_id = ?', [roomId, userId]);

  if (!existing) {
    return { success: false, error: 'Not in this room' };
  }

  await run('DELETE FROM room_users WHERE room_id = ? AND user_id = ?', [roomId, userId]);

  return { success: true, roomId };
}

export async function getRoomUsers(roomId: string): Promise<Array<{ id: number; username: string; joined_at: string }>> {
  return await query(`
    SELECT u.id, u.username, ru.joined_at
    FROM room_users ru
    JOIN users u ON ru.user_id = u.id
    WHERE ru.room_id = ?
    ORDER BY ru.joined_at ASC
  `, [roomId]);
}

export async function saveMessage(roomId: string, userId: number, username: string, content: string): Promise<void> {
  await run('INSERT INTO messages (room_id, user_id, username, content) VALUES (?, ?, ?, ?)',
    [roomId, userId, username, content]);
}

export async function getRoomMessages(roomId: string, limit: number = 50): Promise<Message[]> {
  const messages = await query<Message>(`
    SELECT m.*
    FROM messages m
    WHERE m.room_id = ?
    ORDER BY m.created_at DESC
    LIMIT ?
  `, [roomId, limit]);
  return messages.reverse();
}

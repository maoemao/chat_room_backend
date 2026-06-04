import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import { config } from '../config';
import { verifyToken } from '../services/authService';
import {
  getRoomById,
  joinRoom,
  leaveRoom,
  getRoomUsers,
  saveMessage,
  getRoomMessages
} from '../services/roomService';
import { AuthenticatedClient, WSMessage, WSResponse, Message } from '../types';

const authenticatedClients = new Map<WebSocket, AuthenticatedClient>();
let wss: WebSocketServer;

export function initWebSocket(server: http.Server): void {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        await handleWebSocketMessage(ws, message);
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', error: 'Invalid message format' }));
      }
    });

    ws.on('close', async () => {
      const clientData = authenticatedClients.get(ws);
      if (clientData && clientData.currentRoom) {
        await leaveRoom(clientData.currentRoom, clientData.userId);
        broadcastToRoom(clientData.currentRoom, {
          type: 'user_left',
          roomId: clientData.currentRoom,
          userId: clientData.userId,
          username: clientData.username
        });
        await broadcastRoomUsers(clientData.currentRoom);
      }
      authenticatedClients.delete(ws);
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      authenticatedClients.delete(ws);
    });
  });
}

function broadcastToRoom(roomId: string, message: WSResponse, excludeWs?: WebSocket): void {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
      const clientData = authenticatedClients.get(client);
      if (clientData && clientData.currentRoom === roomId) {
        client.send(JSON.stringify(message));
      }
    }
  });
}

async function broadcastRoomUsers(roomId: string): Promise<void> {
  const users = await getRoomUsers(roomId);
  const message: WSResponse = {
    type: 'room_users',
    roomId,
    users
  };
  broadcastToRoom(roomId, message);
}

async function handleWebSocketMessage(ws: WebSocket, message: WSMessage): Promise<void> {
  switch (message.type) {
    case 'auth': {
      if (!message.token) {
        ws.send(JSON.stringify({ type: 'error', error: 'Token is required for authentication' }));
        return;
      }
      const authResult = verifyToken(message.token);
      if (!authResult.valid || !authResult.userId || !authResult.username) {
        ws.send(JSON.stringify({ type: 'error', error: authResult.error || 'Authentication failed' }));
        ws.close();
        return;
      }
      authenticatedClients.set(ws, {
        userId: authResult.userId,
        username: authResult.username,
        currentRoom: null
      });
      const response: WSResponse = {
        type: 'auth_success',
        userId: authResult.userId,
        username: authResult.username
      };
      ws.send(JSON.stringify(response));
      break;
    }

    case 'join_room': {
      const clientData = authenticatedClients.get(ws);
      if (!clientData) {
        ws.send(JSON.stringify({ type: 'error', error: 'Not authenticated. Please authenticate first.' }));
        return;
      }
      if (!message.roomId) {
        ws.send(JSON.stringify({ type: 'error', error: 'Room ID is required' }));
        return;
      }

      const room = await getRoomById(message.roomId);
      if (!room) {
        ws.send(JSON.stringify({ type: 'error', error: 'Room not found' }));
        return;
      }

      const joinResult = await joinRoom(message.roomId, clientData.userId);
      if (!joinResult.success) {
        ws.send(JSON.stringify({ type: 'error', error: joinResult.error }));
        return;
      }

      clientData.currentRoom = message.roomId;
      const history: Message[] = await getRoomMessages(message.roomId, 50);

      const response: WSResponse = {
        type: 'join_success',
        roomId: message.roomId,
        roomName: room.name,
        history
      };
      ws.send(JSON.stringify(response));

      broadcastToRoom(message.roomId, {
        type: 'user_joined',
        roomId: message.roomId,
        userId: clientData.userId,
        username: clientData.username
      }, ws);

      await broadcastRoomUsers(message.roomId);
      break;
    }

    case 'leave_room': {
      const clientData = authenticatedClients.get(ws);
      if (!clientData) {
        ws.send(JSON.stringify({ type: 'error', error: 'Not authenticated' }));
        return;
      }

      const roomId = clientData.currentRoom;
      if (!roomId) {
        ws.send(JSON.stringify({ type: 'error', error: 'Not in any room' }));
        return;
      }

      await leaveRoom(roomId, clientData.userId);

      broadcastToRoom(roomId, {
        type: 'user_left',
        roomId,
        userId: clientData.userId,
        username: clientData.username
      });

      clientData.currentRoom = null;
      await broadcastRoomUsers(roomId);

      const response: WSResponse = {
        type: 'leave_success',
        roomId
      };
      ws.send(JSON.stringify(response));
      break;
    }

    case 'message': {
      const clientData = authenticatedClients.get(ws);
      if (!clientData) {
        ws.send(JSON.stringify({ type: 'error', error: 'Not authenticated. Please authenticate first.' }));
        return;
      }
      if (!clientData.currentRoom) {
        ws.send(JSON.stringify({ type: 'error', error: 'Not in any room. Please join a room first.' }));
        return;
      }
      if (!message.content || message.content.trim() === '') {
        ws.send(JSON.stringify({ type: 'error', error: 'Message content cannot be empty' }));
        return;
      }

      await saveMessage(clientData.currentRoom, clientData.userId, clientData.username, message.content);

      const msgToBroadcast: WSResponse = {
        type: 'message',
        roomId: clientData.currentRoom,
        userId: clientData.userId,
        username: clientData.username,
        content: message.content,
        timestamp: new Date().toISOString()
      };

      broadcastToRoom(clientData.currentRoom, msgToBroadcast);
      break;
    }

    case 'ping': {
      const response: WSResponse = {
        type: 'pong',
        timestamp: new Date().toISOString()
      };
      ws.send(JSON.stringify(response));
      break;
    }

    default: {
      ws.send(JSON.stringify({ type: 'error', error: 'Unknown message type' }));
    }
  }
}

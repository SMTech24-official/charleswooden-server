// // src/websocket/websocket.service.ts
// import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
// import { HttpAdapterHost } from '@nestjs/core';
// import { WebSocket, WebSocketServer } from 'ws';
// import { JwtService } from '@nestjs/jwt';
// import { ConfigService } from '@nestjs/config';
// import { PrismaService } from '@/helper/prisma.service';

// interface ExtendedWebSocket extends WebSocket {
//   userId?: string;
// }

// @Injectable()
// export class WebSocketService implements OnApplicationBootstrap {
//   private wss: WebSocketServer;
//   private readonly onlineUsers = new Set<string>();
//   private readonly userSockets = new Map<string, ExtendedWebSocket>();

//   constructor(
//     private httpAdapterHost: HttpAdapterHost,
//     private prisma: PrismaService,
//     private jwt: JwtService,
//     private config: ConfigService,
//   ) {}

//   onApplicationBootstrap(): void {
//     const httpServer = this.httpAdapterHost.httpAdapter.getHttpServer();
//     this.wss = new WebSocketServer({ server: httpServer });
//     this.setupListeners();
//     console.log('WebSocket server initialized');
//   }

//   private setupListeners(): void {
//     this.wss.on('connection', (ws: ExtendedWebSocket) => {
//       console.log('A user connected');

//       ws.on('message', async (data: Buffer) => {
//         try {
//           const parsedData = JSON.parse(data.toString());
//           switch (parsedData.event) {
//             case 'authenticate': {
//               const token = parsedData.token;
//               if (!token) {
//                 console.log('No token provided');
//                 ws.close();
//                 return;
//               }
//               const decoded = this.jwt.verify(token, {
//                 secret: this.config.get('JWT_SECRET'),
//               });
//               if (!decoded) {
//                 console.log('Invalid token');
//                 ws.close();
//                 return;
//               }
//               const { id } = decoded;
//               ws.userId = id;
//               this.onlineUsers.add(id);
//               this.userSockets.set(id, ws);
//               this.broadcast({
//                 event: 'userStatus',
//                 data: { userId: id, isOnline: true },
//               });
//               break;
//             }

//             case 'joinRoom': {
//               const { roomId } = parsedData.data || {};
//               if (!ws.userId || !roomId) return;

//               const room = await this.prisma.room.findUnique({
//                 where: { id: roomId },
//               });
//               if (!room) {
//                 ws.send(
//                   JSON.stringify({ event: 'error', message: 'Room not found' }),
//                 );
//                 return;
//               }

//               try {
//                 await this.prisma.roomUser.create({
//                   data: { userId: ws.userId, roomId },
//                 });
//                 ws.send(
//                   JSON.stringify({ event: 'joinedRoom', data: { roomId } }),
//                 );
//               } catch (err) {
//                 if ((err as any).code === 'P2002') {
//                   ws.send(
//                     JSON.stringify({
//                       event: 'alreadyInRoom',
//                       data: { roomId },
//                     }),
//                   );
//                 } else {
//                   console.error('Join room failed:', err);
//                   ws.send(
//                     JSON.stringify({
//                       event: 'error',
//                       message: 'Failed to join room',
//                     }),
//                   );
//                 }
//               }
//               break;
//             }

//             // Add cases for leaveRoom, message, etc., similarly refactored

//             default:
//               console.warn(`Unknown event: ${parsedData.event}`);
//           }
//         } catch (error) {
//           console.error('Error handling message:', error);
//         }
//       });

//       ws.on('close', () => {
//         if (ws.userId) {
//           this.onlineUsers.delete(ws.userId);
//           this.userSockets.delete(ws.userId);
//           this.broadcast({
//             event: 'userStatus',
//             data: { userId: ws.userId, isOnline: false },
//           });
//         }
//         console.log('User disconnected');
//       });
//     });
//   }

//   private broadcast(message: any): void {
//     this.wss.clients.forEach((client) => {
//       if (client.readyState === WebSocket.OPEN) {
//         client.send(JSON.stringify(message));
//       }
//     });
//   }
// }

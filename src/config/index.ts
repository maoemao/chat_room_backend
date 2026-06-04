export const config = {
  server: {
    httpPort: 3000,
    wsPort: 3001,
    host: '0.0.0.0'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: '7d'
  },
  bcrypt: {
    saltRounds: 10
  },
  database: {
    path: './chatroom.db'
  }
};

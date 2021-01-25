module.exports = {
  CONNECTION_URL: process.env.MONGO_URL || 'mongodb://user:user@localhost:27017/chat-storm',
  DATABASE: 'chat-storm',
  OPTIONS: {
    family: 4,
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
};
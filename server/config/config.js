var env = process.env.NODE_ENV || 'development';

if (env === 'development') {
  process.env.PORT = 3000;
  process.env.MONGODB_URI = 'mongodb://heroku_4kxr0m6x:o6iqditcgf7kkptdm49vb9r30o@ds113749.mlab.com:13749/heroku_4kxr0m6x/TodoApp';
} else if (env === 'test') {
  process.env.PORT = 3000;
  process.env.MONGODB_URI = 'mongodb://localhost:27017/TodoAppTest';
}

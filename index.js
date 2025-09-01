const express = require('express');
require('dotenv').config({ quiet: true });
const bodyParser = require('body-parser');
const cors = require('cors');
const mainRouter = require('./Routes/Routes.js');
const { keepaToMs } = require('./Utils/GraphCsvUtils.js');

const app = express();

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Server online and ready for lift-off!');
});

const time = keepaToMs(7714794)
console.log(new Date(1741164933840));


app.use('/api/v1', mainRouter);

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 2000;
  app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
  });
}

module.exports = app;

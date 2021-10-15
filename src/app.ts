// app.ts
import express from 'express';
import {getSolendUserDepositBalance} from './controllers';
​
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('The server is working!');
});

app.get('/getSolendUserDepositBalance', getSolendUserDepositBalance);

app.listen(port, () => {
  if (port === 3000) {
    console.log('true')
  }
  console.log(`server is listening on ${port} !!!`);
});
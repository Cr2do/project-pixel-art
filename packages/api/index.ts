import express from 'express';
import cors from 'cors';
import api from './api';

const app = express();
const port = 8000;

app.use(cors()); //autorise le CORS
app.use(express.json());

app.get('/', (req, res) => { // GET SUR localhost:8000/
	res.json('Hello World!');
});

app.use('/api', api);

app.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(`Server listening on ${port}`);
});

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db';
import api from './api';

const app = express();
const port = 8000;

app.use(cors()); //autorise le CORS
app.use(express.json());

app.get('/', (req, res) => { // GET SUR localhost:8000/
	res.json('Hello World!');
});

app.use('/api', api);

connectDB().then(() => {
	app.listen(port, () => {
		// console.log(`Server listening on ${port}`);
	});
});

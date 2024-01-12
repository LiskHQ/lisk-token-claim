import express, { Express } from 'express';
import { check } from './check';

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/check', check);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.info(`server up on port ${PORT}`);
});

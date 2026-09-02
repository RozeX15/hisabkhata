import express from 'express';
import serverless from 'serverless-http';
import apiRouter from '../../src/server/routes';

const app = express();

app.use(express.json());

// Support both /api/* and direct function routes /.netlify/functions/api/*
app.use('/api', apiRouter);
app.use('/.netlify/functions/api', apiRouter);
app.use('/', apiRouter);

export const handler = serverless(app);

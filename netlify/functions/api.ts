import serverless from 'serverless-http';
import { createApp } from '../../server/app';

let app: any;

async function initializeApp() {
  if (!app) {
    const { app: expressApp } = await createApp();
    app = expressApp;
  }
  return app;
}

export const handler = async (event: any, context: any) => {
  const expressApp = await initializeApp();
  const serverlessHandler = serverless(expressApp);
  return await serverlessHandler(event, context);
};

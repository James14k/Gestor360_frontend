import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { configureAmplify } from './app/core/auth/amplify-config';

configureAmplify();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

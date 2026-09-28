import { Amplify } from 'aws-amplify';
import { ENV } from '../env';

/**
 * Configura AWS Amplify (equivalente funcional a MSAL para Azure AD) contra
 * el User Pool de Amazon Cognito. Debe llamarse ANTES de bootstrapApplication
 * (ver main.ts), igual que MSAL se inicializa antes de arrancar Angular.
 */
export function configureAmplify(): void {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: ENV.cognito.userPoolId,
        userPoolClientId: ENV.cognito.userPoolClientId,
        loginWith: {
          oauth: {
            domain: ENV.cognito.domain,
            scopes: [...ENV.cognito.scopes],
            redirectSignIn: [ENV.cognito.redirectSignIn],
            redirectSignOut: [ENV.cognito.redirectSignOut],
            responseType: 'code',
          },
        },
      },
    },
  });
}

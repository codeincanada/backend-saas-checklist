import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import fetch from 'node-fetch';

// GitHub OAuth callback handler
export async function githubAuth(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`GitHub Auth function processed request for url "${request.url}"`);

    const code = request.query.get('code');
    const state = request.query.get('state');
    
    // Validate required params
    if (!code) {
        return {
            status: 400,
            body: JSON.stringify({ error: 'Missing code parameter' }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }

    try {
        // Get environment variables
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;
        
        if (!clientId || !clientSecret) {
            context.error('Missing GitHub OAuth credentials in environment variables');
            return {
                status: 500,
                body: JSON.stringify({ error: 'Server configuration error' }),
                headers: {
                    'Content-Type': 'application/json'
                }
            };
        }

        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                state: state
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            context.error('GitHub OAuth error:', tokenData.error);
            return {
                status: 400,
                body: JSON.stringify({ error: tokenData.error }),
                headers: {
                    'Content-Type': 'application/json'
                }
            };
        }

        // Get the access token
        const accessToken = tokenData.access_token;

        // Get allowed origins from env variables or use default
        const productionFrontendUrl = 'https://checklist.codein.ca';
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [productionFrontendUrl];
        
        // Determine redirect URL with success or error
        let redirectUrl = productionFrontendUrl; // Always redirect to production
        
        // Create a URL object to handle query params
        const redirectUri = new URL(redirectUrl);
        
        // For security, redirect to the origin without path
        redirectUri.pathname = '/';
        
        // Add token as query param for the frontend to extract
        redirectUri.searchParams.set('token', accessToken);
        
        // Redirect the user to the app with the token
        return {
            status: 302,
            headers: {
                'Location': redirectUri.toString()
            }
        };

    } catch (error) {
        context.error('Error during GitHub auth:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Internal server error' }),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }
};

app.http('githubAuth', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: githubAuth
}); 
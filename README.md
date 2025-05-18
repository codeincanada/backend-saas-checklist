# Backend Microservice Checklist

An interactive checklist application for backend microservice development best practices.

## Features

- Comprehensive checklist of best practices for microservice development
- Filter by category to focus on specific areas
- Progress tracking for each section and overall
- GitHub authentication to save user progress
- User avatar display when logged in

## Local Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a GitHub OAuth App:
   - Go to GitHub Developer Settings: https://github.com/settings/developers
   - Click "New OAuth App"
   - Fill in the details:
     - Application name: Backend Microservice Checklist
     - Homepage URL: https://mellifluous-meringue-b16ddc.netlify.app (or your production URL)
     - Authorization callback URL: https://github-auth-function-20556.azurewebsites.net/api/githubAuth
   - Register the application
   - Copy the Client ID and Client Secret

3. Set up Azure Function for GitHub OAuth (Secure Backend):
   - Navigate to the API directory:
     ```bash
     cd api
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Update local.settings.json with your GitHub credentials:
     ```json
     {
       "Values": {
         "GITHUB_CLIENT_ID": "your-client-id",
         "GITHUB_CLIENT_SECRET": "your-client-secret"
       }
     }
     ```
   - Start the function locally:
     ```bash
     npm start
     ```
   - The function will be deployed to Azure

4. Configure the frontend application:
   - Open `src/contexts/AuthContext.tsx`
   - Replace `YOUR_GITHUB_CLIENT_ID` with your actual Client ID
   - Update `AZURE_FUNCTION_URL` if you've deployed to a custom URL

5. Start the development server:
   ```bash
   npm run dev
   ```

## Production Deployment

1. Deploy the Azure Function:
   ```bash
   cd api
   ./deploy.sh
   ```
   This script will:
   - Create Azure resources
   - Deploy your function
   - Configure settings and CORS
   - Output the function URL

2. Update GitHub OAuth App settings:
   - Update the Authorization callback URL with your Azure Function URL

3. Update the frontend code:
   - Open `src/contexts/AuthContext.tsx`
   - Update the AZURE_FUNCTION_URL with your deployed function URL
   - Update the GitHub Client ID

4. Deploy your React application to your hosting service (like Netlify)

## Security Notes

The secure architecture uses:
- GitHub OAuth for authentication
- Azure Function as a secure backend to handle OAuth exchange
- Client secret never exposed to frontend code
- CORS configured to only allow requests from approved origins

## License

MIT 
# Shop-n-Save
Shopping app that searches for savings on your shopping.

## Current state
Netlify-ready setup preview connected to the Shop-n-Save Supabase project.
The connection check calls the Auth settings endpoint using a public publishable key; it does not claim to verify database tables or shopping features.
No price feeds, account screens, shopping tables or comparisons have been implemented yet.

## Deploy to Netlify
Import this GitHub repository, choose main, leave the build command empty, and use public as the publish directory. netlify.toml provides the publish directory automatically.
No environment variables are needed for this static setup preview.

## Supabase
Project reference: nbwqrudslnwoghgakeuf
Public configuration: public/config.js
Only the browser-safe publishable key is committed. Never add a service_role key, secret key or database password to public files.
The service can take a few minutes to finish provisioning; use Check connection after deployment.
Before adding shopping data, create the required tables with row-level security and appropriate ownership policies. Account redirect URLs will need the deployed Netlify URL when authentication is implemented.

## Local preview
Serve public with any static HTTP server, for example:
python3 -m http.server 8080 --directory public

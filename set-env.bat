@echo off
echo Setting up environment variables for Vercel...

rem Basic settings
echo Setting NODE_ENV...
echo production | vercel env add NODE_ENV production

echo Setting NEXT_PUBLIC_APP_URL...
echo https://project-clean-7gleo53di-shuke0525s-projects-e6c88d83.vercel.app | vercel env add NEXT_PUBLIC_APP_URL production

echo Setting NEXT_PUBLIC_API_URL...
echo https://project-clean-7gleo53di-shuke0525s-projects-e6c88d83.vercel.app/api | vercel env add NEXT_PUBLIC_API_URL production

echo Setting CORS_ORIGIN...
echo https://project-clean-7gleo53di-shuke0525s-projects-e6c88d83.vercel.app | vercel env add CORS_ORIGIN production

rem Security keys
echo Setting JWT_SECRET...
echo 81194234fb86d73714dafe083e54ba70514cb574404d924f0b3f596847f82d6c | vercel env add JWT_SECRET production

echo Setting SESSION_SECRET...
echo 8f7689254b28d080b7ae660d39541ed9a5b938ff801a2a57adab7beb5df490db | vercel env add SESSION_SECRET production

echo Setting NEXTAUTH_SECRET...
echo f4b1d79f9df7fb91b70e6050404edb58a7c3399d3c7e6a3bd4d0bde8861830ee | vercel env add NEXTAUTH_SECRET production

rem Supabase settings
echo Setting NEXT_PUBLIC_SUPABASE_URL...
echo https://gfzmwtvnktvvckzbybdl.supabase.co | vercel env add NEXT_PUBLIC_SUPABASE_URL production

echo All environment variables set!
pause 
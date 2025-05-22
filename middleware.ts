import { NextRequest, NextResponse } from "next/server";

export default function middleware(req: NextRequest){
    // Temporarily disable auth checks
    return NextResponse.next();

    // Original code commented out
    /*
    // Check for Appwrite session cookies - Appwrite uses various cookie names
    const appwriteAuthCookies = ['a1-auth', 'a1-session', 'appwrite-session'];
    const hasSession = appwriteAuthCookies.some(cookieName => req.cookies.has(cookieName));
    
    // Alternative: You can also check for the Next-Auth session cookie since you're using signIn from next-auth/react
    const hasNextAuthSession = req.cookies.has('next-auth.session-token') || 
                              req.cookies.has('__Secure-next-auth.session-token');
    
    // Use either Appwrite or Next-Auth session
    const isAuthenticated = hasSession || hasNextAuthSession;

    const protectedRoutes = [
        '/dashboard',
        '/settings',
        '/premium',
        "/admin",
        '/groups',
        '/groups/:path*',
        '/channels',
        '/channels/:path*',
    ]

    if(protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))){
        if(!isAuthenticated){
            return NextResponse.redirect(new URL('/login', req.url))
        }
    }

    return NextResponse.next()
    */
}

export const config = {
    matcher: ['/dashboard/:path*', '/settings/:path*', '/premium', '/email-verification', '/channels/:path*', '/groups/:path*'],
};

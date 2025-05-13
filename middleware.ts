import { NextRequest, NextResponse } from "next/server";

export default function middleware(req: NextRequest){
    const token = req.cookies.get('refresh-token')

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
        if(!token){
            return NextResponse.redirect(new URL('/login', req.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/settings/:path*', '/premium', '/email-verification', '/channels/:path*', '/groups/:path*'],
  };

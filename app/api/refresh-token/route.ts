import { API_ROUTES } from "@/lib/api";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(){

    try{
        const response = await axios.get(API_ROUTES.refreshToken, {
            withCredentials: true
        })
        const nextRes = NextResponse.json(response.data, {status: 200});

        const cookies = response.headers['set-cookie'];
        if(cookies) {
            nextRes.headers.set('Set-Cookie', cookies.join(','))
        }

        return nextRes;
    } catch(err){
        console.error('could not refresh token', err)
        return NextResponse.json({ message: 'Refresh failed'}, {status: 401})
    }

}
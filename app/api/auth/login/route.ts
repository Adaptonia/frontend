import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest){
    const body = await req.json()
      console.log("📥 Incoming login API call:", body);


    try{
        const response = await axios.post("http://localhost:3001/auth/login", body, {
            withCredentials: true
        })

        const cookies = response.headers['set-cookie']

        const res = NextResponse.json(response.data, {status: 200})

        if(cookies) {
            // Set cookies on the browser manually
            res.headers.set("Set-Cookie", cookies.join(","))
        }
        

        console.log("🎯 Headers:", cookies);
        console.log("🎯 Backend responded with:", response.data);
        console.log("🎯 Headers:", response.headers);
        console.log("🎯 Set-Cookie header:", response.headers["set-cookie"]);

        return res
    } catch(error : any){
            console.error(
              "🚨 Error from backend:",
              error.response?.data || error
            );

        return NextResponse.json({
            message: error.response?.data?.message || 'somehting went wrong'},

            {status: error.response?.status|| 500}
        )
    }

}
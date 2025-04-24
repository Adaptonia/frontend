import { API_ROUTES } from "@/lib/api";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest){
    const body = await req.json()
      console.log("📥 Incoming login API call:", body);


    try {
      const response = await axios.post(API_ROUTES.login, body, {
        withCredentials: true,
      });

      const cookies = response.headers["set-cookie"];

      const res = NextResponse.json(response.data, { status: 200 });

      if (cookies) {
        // Set cookies on the browser manually
        res.headers.set("Set-Cookie", cookies.join(","));
      }

      return res;
    } catch (error: unknown) {
      let message = "Something went wrong";
      let status = 500;

      // If it's an Axios error with a response
      if (axios.isAxiosError(error) && error.response) {
        message = error.response.data?.message || message;
        status = error.response.status || status;
      } else if (error instanceof Error) {
        // It's a standard JS error
        message = error.message;
      }

      console.error("🚨 Error from backend:", message);

      return NextResponse.json({ message }, { status });
    }

}
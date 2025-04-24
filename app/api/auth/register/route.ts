import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { API_ROUTES } from "@/lib/api";

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const response = await axios.post(API_ROUTES.register, body);

    // Axios already returns parsed JSON, no need to do response.json()
    return NextResponse.json(response.data, { status: 200 });

  } catch (error: unknown) {
     if (axios.isAxiosError(error) && error.response) {
       return NextResponse.json(
         { message: error.response.data?.message || "Something went wrong" },
         { status: error.response.status || 500 }
       );
     }

     const message =
       error instanceof Error ? error.message : "Unknown error occurred";
     return NextResponse.json({ message }, { status: 500 });
  }
}

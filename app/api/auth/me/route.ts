import { API_ROUTES } from "@/lib/api";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const response = await axios.get(API_ROUTES.me, {
      headers: {
        Cookie: req.headers.get("cookie") || "",
      },
      withCredentials: true,
    });

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
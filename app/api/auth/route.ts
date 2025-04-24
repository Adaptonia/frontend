import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const response = await axios.post("http://localhost:3001/auth/register", body);

    // Axios already returns parsed JSON, no need to do response.json()
    return NextResponse.json(response.data, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { message: error.response?.data?.message || "Something went wrong" },
      { status: error.response?.status || 500 }
    );
  }
}

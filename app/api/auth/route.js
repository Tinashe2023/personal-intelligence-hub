import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { passcode } = await request.json();
    const correctPasscode = process.env.ACCESS_PASSCODE || "admin";

    if (passcode === correctPasscode) {
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ success: false, error: "Access Denied" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Bad Request" }, { status: 400 });
  }
}

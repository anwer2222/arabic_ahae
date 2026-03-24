import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Unwrap the params for Next.js 15
  const { id } = await params;
  const cleanId = id.trim();
  
  // Use the official Google Drive API with your key for a guaranteed direct media stream
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;
  const driveUrl = `https://www.googleapis.com/drive/v3/files/${cleanId}?alt=media&key=${apiKey}`;

  try {
    const response = await fetch(driveUrl);
    
    if (!response.ok) {
      console.error("Drive API Error:", await response.text());
      return new NextResponse("Failed to fetch from Google Drive", { status: response.status });
    }

    // Convert the response to an ArrayBuffer. 
    // This allows us to know the exact file size, which is CRITICAL for the browser's audio player.
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": arrayBuffer.byteLength.toString(), // Tells the browser the exact size
        "Accept-Ranges": "bytes", // Tells the browser it's a media file it can stream/seek
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Proxy Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
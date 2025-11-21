import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { appointmentId } = await req.json();
    console.log("Cancel session request received for appointmentId:", appointmentId, typeof appointmentId);

    if (!appointmentId) {
      return NextResponse.json({ error: "Missing appointmentId" }, { status: 400 });
    }

    // Ensure appointmentId is a string for Acuity API
    const stringAppointmentId = String(appointmentId);
    // Convert to number for Supabase query
    const numericAppointmentId = parseInt(stringAppointmentId, 10);
    console.log("Using appointment ID:", stringAppointmentId, "(numeric:", numericAppointmentId, ")");

    // 1. Cancel appointment in Acuity
    const acuityUserId = process.env.ACUITY_USER_ID;
    const acuityApiKey = process.env.ACUITY_API_KEY;

    console.log("Acuity credentials check - User ID exists:", !!acuityUserId, "API Key exists:", !!acuityApiKey);

    if (!acuityUserId || !acuityApiKey) {
      return NextResponse.json({ error: "Acuity credentials not configured" }, { status: 500 });
    }

    const cancelRes = await fetch(
      `https://acuityscheduling.com/api/v1/appointments/${encodeURIComponent(stringAppointmentId)}`,
      {
        method: "PUT",
        headers: {
          Authorization:
            "Basic " + Buffer.from(`${acuityUserId}:${acuityApiKey}`).toString("base64"),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ canceled: true })
      }
    );

    console.log("Acuity API response status:", cancelRes.status);

    if (!cancelRes.ok) {
      const errorText = await cancelRes.text();
      console.error("Acuity cancellation failed:", cancelRes.status, errorText);
      return NextResponse.json(
        { error: `Unable to update appointment in Acuity: ${errorText}` },
        { status: 500 }
      );
    }

    console.log("Acuity appointment marked as cancelled");

    // 2. Update Supabase status
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;

    console.log("Supabase credentials check - URL exists:", !!supabaseUrl, "Service key exists:", !!supabaseServiceKey);

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase credentials not configured" }, { status: 500 });
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

    console.log("Updating Supabase session status for appointment ID:", numericAppointmentId);

    const { error } = await supabase
      .from("sessions")
      .update({ status: "cancelled" })
      .eq("acuity_appointment_id", numericAppointmentId);

    if (error) {
      console.error("Supabase update failed:", error);
      return NextResponse.json(
        { error: `Unable to update session status: ${error.message}` },
        { status: 500 }
      );
    }

    console.log("Supabase update successful");
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Cancel session API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

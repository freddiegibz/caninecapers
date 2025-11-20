import { NextResponse } from 'next/server'

type AcuityTime = {
  time: string; // ISO string
};

type NormalizedAvailability = {
  calendarID: number;
  startTime: string; // ISO string
};

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNextNDates(n: number): string[] {
  const dates: string[] = [];
  const base = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const appointmentTypeID = url.searchParams.get('appointmentTypeID');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  const userId = process.env.ACUITY_USER_ID;
  const apiKey = process.env.ACUITY_API_KEY;
  const calendarIdsEnv = process.env.ACUITY_CALENDAR_IDS;

  if (!appointmentTypeID) {
    return NextResponse.json({ error: 'appointmentTypeID query parameter is required' }, { status: 400 });
  }

  if (!userId || !apiKey || !calendarIdsEnv) {
    return NextResponse.json({ error: 'Missing Acuity credentials or calendar IDs' }, { status: 400 });
  }

  const calendarIds = calendarIdsEnv
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  // Generate date range based on parameters or default to next 5 days
  let dates: string[];
  if (startDate && endDate) {
    dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(formatDate(new Date(d)));
    }
  } else {
    dates = getNextNDates(5); // today + next 4 days (fallback)
  }
  const authHeader = `Basic ${Buffer.from(`${userId}:${apiKey}`).toString('base64')}`;

  try {
    const requests: Array<Promise<NormalizedAvailability[]>> = [];

    for (const date of dates) {
      for (const calendarID of calendarIds) {
        const endpoint = `https://acuityscheduling.com/api/v1/availability/times?calendarID=${encodeURIComponent(
          calendarID
        )}&appointmentTypeID=${encodeURIComponent(appointmentTypeID)}&date=${encodeURIComponent(date)}`;

        const p = fetch(endpoint, {
          headers: {
            Authorization: authHeader,
          },
          cache: 'no-store',
        })
          .then(async (res) => {
            if (!res.ok) return [] as NormalizedAvailability[];
            const data: AcuityTime[] = await res.json();
            return data.map((item) => {
              // Acuity times are in calendar timezone (London = UTC)
              // Handle different time formats: +0000, Z, or no timezone
              let timeString = item.time;
              if (timeString.includes('+0000')) {
                // Replace +0000 with Z for proper UTC parsing
                timeString = timeString.replace('+0000', 'Z');
              } else if (!timeString.includes('Z')) {
                // Add Z if no timezone indicator
                timeString = timeString + 'Z';
              }

              const utcTime = new Date(timeString);

              return {
                calendarID: Number(calendarID),
                startTime: utcTime.toISOString(), // Store as GMT London time (UTC)
              };
            });
          })
          .catch(() => [] as NormalizedAvailability[]);

        requests.push(p);
      }
    }

    const results = await Promise.all(requests);
    const merged: NormalizedAvailability[] = results.flat();

    merged.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return NextResponse.json(merged, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}



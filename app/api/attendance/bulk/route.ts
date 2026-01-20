import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Expecting an array called 'records'
    const { records, school_id, date, teacher_id } = body

    if (!records || !Array.isArray(records) || !school_id || !date) {
      return NextResponse.json({ error: 'Missing required fields or invalid format' }, { status: 400 })
    }

    // Format the data for Supabase
    const attendanceData = records.map((row: any) => ({
      school_id,
      date,
      teacher_id,
      section: row.section,
      boys_present: parseInt(row.boys_present) || 0,
      girls_present: parseInt(row.girls_present) || 0,
    }))

    // Bulk insert/update
    const { data, error } = await supabase
      .from('attendance_records')
      .upsert(attendanceData, {
        onConflict: 'school_id,section,date'
      })
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to save bulk attendance' }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: data.length })
  } catch (error) {
    console.error('Attendance submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 },)
  }
}
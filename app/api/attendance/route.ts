import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { school_id, section, date, boys_present, girls_present, teacher_id } = body

    // Validate required fields
    if (!school_id || !section || !date || boys_present === undefined || girls_present === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate section
    const validSections = ['1A', '1B', '2', '3', '4', '5']
    if (!validSections.includes(section)) {
      return NextResponse.json(
        { error: 'Invalid section' },
        { status: 400 }
      )
    }

    // Insert attendance record (or update if exists)
    const { data, error } = await supabase
      .from('attendance_records')
      .upsert({
        school_id,
        section,
        date,
        boys_present: parseInt(boys_present),
        girls_present: parseInt(girls_present),
        teacher_id: teacher_id || null,
      }, {
        onConflict: 'school_id,section,date'
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save attendance' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Attendance submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import bcrypt from 'bcryptjs'
import { supabase } from './supabase'

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

// Verify a password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Teacher login
export async function loginTeacher(username: string, password: string) {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('username', username)
    .single()

  if (error || !data) {
    return { success: false, error: 'Invalid username or password' }
  }

  const isValid = await verifyPassword(password, data.password_hash)
  if (!isValid) {
    return { success: false, error: 'Invalid username or password' }
  }

  return {
    success: true,
    user: {
      id: data.id,
      username: data.username,
      school_id: data.school_id,
      full_name: data.full_name,
      role: 'teacher'
    }
  }
}

// Central office login
export async function loginCentralOffice(username: string, password: string) {
  const { data, error } = await supabase
    .from('central_office_users')
    .select('*')
    .eq('username', username)
    .single()

  if (error || !data) {
    return { success: false, error: 'Invalid username or password' }
  }

  const isValid = await verifyPassword(password, data.password_hash)
  if (!isValid) {
    return { success: false, error: 'Invalid username or password' }
  }

  return {
    success: true,
    user: {
      id: data.id,
      username: data.username,
      role: 'central_office'
    }
  }
}
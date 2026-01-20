'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  username: string
  school_id: string
  full_name?: string
  role: string
}

interface RowData {
  section: string
  boys_present: string
  girls_present: string
}

export default function TeacherDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const sections = ['1A', '1B', '2', '3', '4', '5']

  // The single source of truth for the attendance table
  const [rows, setRows] = useState<RowData[]>(
    sections.map((section) => ({
      section,
      boys_present: '',
      girls_present: '',
    }))
  )

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'teacher') {
      router.push('/')
      return
    }

    setUser(parsedUser)
  }, [router])

  // Logic to calculate totals for the footer
  const calculateTotal = (field: 'boys_present' | 'girls_present') => {
    return rows.reduce((sum, row) => sum + (parseInt(row[field]) || 0), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    if (!user || !user.school_id) {
      setMessage({ type: 'error', text: 'User not authenticated' })
      setLoading(false)
      return
    }

    // Validation: Check if any cell is empty
    const isIncomplete = rows.some(row => row.boys_present === '' || row.girls_present === '')
    if (isIncomplete) {
      setMessage({ type: 'error', text: 'Please enter attendance for all sections (use 0 if none).' })
      setLoading(false)
      return
    }

    try {
      // Send a separate request for each row in the table
      const submissionPromises = rows.map((row) =>
        fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            school_id: user.school_id,
            section: row.section,
            date: selectedDate,
            boys_present: parseInt(row.boys_present),
            girls_present: parseInt(row.girls_present),
            teacher_id: user.id,
          }),
        })
      )

      const results = await Promise.all(submissionPromises)
      const allOk = results.every((res) => res.ok)

      if (!allOk) {
        throw new Error('One or more submissions failed')
      }

      setMessage({ type: 'success', text: 'All attendance records submitted successfully!' })

      // Reset table after success
      setRows(sections.map(s => ({ section: s, boys_present: '', girls_present: '' })))

      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: 'Error submitting attendance. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user.full_name || user.username}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Submit Attendance</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 border border-gray-300 text-center text-gray-700">Section</th>
                    <th className="px-4 py-2 border border-gray-300 text-left text-gray-700">Boys Present</th>
                    <th className="px-4 py-2 border border-gray-300 text-left text-gray-700">Girls Present</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.section}>
                      <td className="px-4 py-2 border border-gray-300 font-bold bg-gray-50 text-center text-gray-700">{row.section}</td>
                      <td className="px-4 py-2 border border-gray-300 text-gray-700">
                        <input
                          type="number"
                          min="0"
                          value={row.boys_present}
                          onChange={(e) => {
                            const val = e.target.value
                            setRows(prev => prev.map((r, i) => i === idx ? { ...r, boys_present: val } : r))
                          }}
                          className="w-full px-2 py-1 border border-gray-400 rounded bg-white text-gray-900 placeholder-gray-40"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-2 border">
                        <input
                          type="number"
                          min="0"
                          value={row.girls_present}
                          onChange={(e) => {
                            const val = e.target.value
                            setRows(prev => prev.map((r, i) => i === idx ? { ...r, girls_present: val } : r))
                          }}
                          className="w-full px-2 py-1 border border-gray-400 rounded bg-white text-gray-900 placeholder-gray-400"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td className="px-4 py-2 border border-gray-300 text-center text-gray-700">Totals:</td>
                    <td className="px-4 py-2 border border-gray-300 text-blue-700">{calculateTotal('boys_present')}</td>
                    <td className="px-4 py-2 border border-gray-300 text-pink-700">{calculateTotal('girls_present')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {message && (
              <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Submitting All Sections...' : 'Submit Attendance'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
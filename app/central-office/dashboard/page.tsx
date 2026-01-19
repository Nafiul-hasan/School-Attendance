'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface User {
  id: string
  username: string
  role: string
}

interface School {
  id: string
  name: string
}

interface AttendanceRecord {
  id: string
  school_id: string
  section: string
  date: string
  boys_present: number
  girls_present: number
  schools: School
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function CentralOfficeDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchool, setSelectedSchool] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'central_office') {
      router.push('/')
      return
    }

    setUser(parsedUser)
    fetchSchools()
  }, [router])

  useEffect(() => {
    if (user) {
      fetchAttendanceData()
    }
  }, [selectedSchool, startDate, endDate, user])

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/schools')
      const result = await response.json()
      if (result.success) {
        setSchools(result.data)
      }
    } catch (error) {
      console.error('Error fetching schools:', error)
    }
  }

  const fetchAttendanceData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (selectedSchool !== 'all') params.append('schoolId', selectedSchool)

      const response = await fetch(`/api/attendance-data?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setAttendanceData(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  // Prepare data for charts
  const getSectionData = () => {
    const sectionMap: Record<string, { boys: number; girls: number; total: number }> = {}

    attendanceData.forEach((record) => {
      if (!sectionMap[record.section]) {
        sectionMap[record.section] = { boys: 0, girls: 0, total: 0 }
      }
      sectionMap[record.section].boys += record.boys_present
      sectionMap[record.section].girls += record.girls_present
      sectionMap[record.section].total += record.boys_present + record.girls_present
    })

    return Object.entries(sectionMap).map(([section, data]) => ({
      section,
      boys: data.boys,
      girls: data.girls,
      total: data.total,
    })).sort((a, b) => a.section.localeCompare(b.section))
  }

  const getDateTrendData = () => {
    const dateMap: Record<string, { boys: number; girls: number }> = {}

    attendanceData.forEach((record) => {
      if (!dateMap[record.date]) {
        dateMap[record.date] = { boys: 0, girls: 0 }
      }
      dateMap[record.date].boys += record.boys_present
      dateMap[record.date].girls += record.girls_present
    })

    return Object.entries(dateMap)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        boys: data.boys,
        girls: data.girls,
        total: data.boys + data.girls,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const getGenderData = () => {
    let totalBoys = 0
    let totalGirls = 0

    attendanceData.forEach((record) => {
      totalBoys += record.boys_present
      totalGirls += record.girls_present
    })

    return [
      { name: 'Boys', value: totalBoys },
      { name: 'Girls', value: totalGirls },
    ]
  }

  const exportToCSV = () => {
    if (attendanceData.length === 0) {
      alert('No data to export')
      return
    }

    const headers = ['Date', 'School', 'Section', 'Boys Present', 'Girls Present', 'Total']
    const rows = attendanceData.map((record) => [
      record.date,
      record.schools?.name || 'Unknown',
      record.section,
      record.boys_present,
      record.girls_present,
      record.boys_present + record.girls_present,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-report-${startDate || 'all'}-${endDate || 'all'}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const sectionData = getSectionData()
  const trendData = getDateTrendData()
  const genderData = getGenderData()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Central Office Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user.username}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Schools</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={exportToCSV}
                disabled={attendanceData.length === 0}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading data...</div>
        ) : attendanceData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No attendance data found for the selected filters.</div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Records</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{attendanceData.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Boys</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {attendanceData.reduce((sum, r) => sum + r.boys_present, 0)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Girls</h3>
                <p className="text-3xl font-bold text-pink-600 mt-2">
                  {attendanceData.reduce((sum, r) => sum + r.girls_present, 0)}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart - Attendance by Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance by Section</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="section" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="boys" fill="#0088FE" name="Boys" />
                    <Bar dataKey="girls" fill="#00C49F" name="Girls" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart - Gender Distribution */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gender Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Line Chart - Attendance Trend */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trend Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="boys" stroke="#0088FE" name="Boys" />
                  <Line type="monotone" dataKey="girls" stroke="#00C49F" name="Girls" />
                  <Line type="monotone" dataKey="total" stroke="#FF8042" name="Total" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
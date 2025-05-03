'use client'

import React, { useState, useEffect } from 'react'

interface CalendarDate {
  day: number
  weekday: string
  isSelected: boolean
  isToday: boolean
  month?: string
}

interface CalendarProps {
  onDateSelect?: (date: Date) => void
}

const Calendar: React.FC<CalendarProps> = ({ onDateSelect }) => {
  const [dates, setDates] = useState<CalendarDate[]>([])
  const [currentMonth, setCurrentMonth] = useState<string>('')

  useEffect(() => {
    const calendarDates = generateCalendarDates()
    setDates(calendarDates)
    setCurrentMonth('February') // This would normally be dynamic based on current date
  }, [])

  function generateCalendarDates(): CalendarDate[] {
    const today = new Date()
    const currentDay = today.getDate()
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun', 'Mon']
    
    // Generate dates for current month
    return Array.from({ length: 9 }, (_, i) => {
      const day = currentDay - 3 + i
      const date = new Date()
      date.setDate(day)
      
      return {
        day,
        weekday: weekdays[i],
        isSelected: i === 3, // Selected day is the 4th in this array (6th of the month in the image)
        isToday: day === currentDay,
        month: i === 0 ? 'February' : undefined // Only show month on first date
      }
    })
  }

  const selectDate = (index: number) => {
    const newDates = dates.map((date, i) => ({
      ...date,
      isSelected: i === index
    }))
    setDates(newDates)
    
    // Create actual date object to pass to parent component
    const selectedDate = new Date()
    selectedDate.setDate(dates[index].day)
    onDateSelect?.(selectedDate)
  }

  return (
    <div className="mb-6 bg-white p-4 sticky top-0 z-10">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold">{currentMonth}</h2>
      </div>
      
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {dates.map((date, index) => (
          <div 
            key={index}
            onClick={() => selectDate(index)}
            className={`flex flex-col items-center p-3 rounded-xl min-w-[50px] transition-colors duration-200 ${
              date.isSelected 
                ? 'bg-blue-500 text-white' 
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <span className="text-xs font-medium">{date.weekday}</span>
            <span className="text-lg font-bold">{date.day < 10 ? `0${date.day}` : date.day}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Calendar 
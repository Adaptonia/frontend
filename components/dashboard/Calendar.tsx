'use client'

import React, { useState, useEffect, useRef } from 'react'

interface CalendarDate {
  date: Date
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
  const initialSelectionMade = useRef(false)

  useEffect(() => {
    const calendarDates = generateCalendarDates()
    setDates(calendarDates)
    
    // Get current month name
    const today = new Date()
    setCurrentMonth(today.toLocaleString('default', { month: 'long' }))
    
    // Only notify parent of initial date selection once
    if (!initialSelectionMade.current && onDateSelect) {
      const todayDate = calendarDates.find(date => date.isToday)
      if (todayDate) {
        onDateSelect(todayDate.date)
        initialSelectionMade.current = true
      }
    }
  }, []) // Empty dependency array to run only once

  function generateCalendarDates(): CalendarDate[] {
    const today = new Date()
    // const currentDay = today.getDate()
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    // Generate 9 dates centered around today (-4 days to +4 days)
    return Array.from({ length: 9 }, (_, i) => {
      // Create a proper date object
      const date = new Date(today)
      date.setDate(today.getDate() - 4 + i)
      
      const day = date.getDate()
      const weekday = weekdays[date.getDay()]
      const isToday = date.getDate() === today.getDate() && 
                      date.getMonth() === today.getMonth() && 
                      date.getFullYear() === today.getFullYear()
      
      return {
        date,
        day,
        weekday,
        isSelected: isToday, // Select today by default
        isToday,
        // Only show month name if it's the first day of a month or first date in our array
        month: day === 1 || i === 0 ? date.toLocaleString('default', { month: 'long' }) : undefined
      }
    })
  }

  const selectDate = (index: number) => {
    const newDates = dates.map((date, i) => ({
      ...date,
      isSelected: i === index
    }))
    setDates(newDates)
    
    // Pass selected date to parent component
    if (onDateSelect) {
      onDateSelect(dates[index].date)
    }
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
                : date.isToday
                  ? 'bg-blue-50'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <span className="text-xs font-medium">{date.weekday}</span>
            <span className="text-lg font-bold">{date.day < 10 ? `0${date.day}` : date.day}</span>
            {date.month && <span className="text-xs mt-1">{date.month}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Calendar 
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MultiSelectCalendarProps {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  year?: number;
}

export function MultiSelectCalendar({ selectedDates, onChange, year = new Date().getFullYear() }: MultiSelectCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(year);

  const months = [
    "一月", "二月", "三月", "四月", "五月", "六月",
    "七月", "八月", "九月", "十月", "十一月", "十二月"
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const isSelected = (year: number, month: number, day: number) => {
    return selectedDates.includes(formatDate(year, month, day));
  };

  const toggleDate = (year: number, month: number, day: number) => {
    const dateStr = formatDate(year, month, day);
    if (selectedDates.includes(dateStr)) {
      onChange(selectedDates.filter((d) => d !== dateStr));
    } else {
      onChange([...selectedDates, dateStr]);
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <Button type="button" variant="ghost" size="sm" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium">
          {currentYear}年 {months[currentMonth]}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground py-1">
            {day}
          </div>
        ))}
        
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const selected = isSelected(currentYear, currentMonth, day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleDate(currentYear, currentMonth, day)}
              className={cn(
                "h-8 w-8 rounded-md text-sm flex items-center justify-center transition-colors",
                selected
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-accent"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      {selectedDates.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              已选择 {selectedDates.length} 个日期
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
              className="text-muted-foreground"
            >
              清空
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {selectedDates.map((date) => (
              <div
                key={date}
                className="flex items-center gap-1 px-2 py-1 bg-secondary rounded text-xs"
              >
                {date}
                <button
                  type="button"
                  onClick={() => onChange(selectedDates.filter((d) => d !== date))}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

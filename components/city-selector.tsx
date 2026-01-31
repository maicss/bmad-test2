"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface CityInfo {
  name: string
  code: string
}

interface ProvinceInfo {
  code: string
  municipality: boolean
  cities: CityInfo[]
}

interface CityData {
  [key: string]: ProvinceInfo
}

interface CitySelectorProps {
  value: {
    province: string
    city: string
  }
  onChange: (value: { province: string; city: string }) => void
  error?: {
    province?: string
    city?: string
  }
  disabled?: boolean
}

import citiesData from "@/constants/cities.json"

export function CitySelector({ value, onChange, error, disabled }: CitySelectorProps) {
  const [provinceList, setProvinceList] = useState<string[]>([])
  const [cityList, setCityList] = useState<string[]>([])
  const data = citiesData as CityData

  useEffect(() => {
    const provinces = Object.keys(data).sort()
    setProvinceList(provinces)
  }, [])

  useEffect(() => {
    if (value.province && data[value.province]) {
      const provinceInfo = data[value.province]
      if (provinceInfo.municipality) {
        setCityList([value.province])
        if (value.city !== value.province) {
          onChange({ ...value, city: value.province })
        }
      } else {
        const cities = provinceInfo.cities.map((c) => c.name).sort()
        setCityList(cities)
      }
    } else {
      setCityList([])
    }
  }, [value.province])

  const handleProvinceChange = (province: string) => {
    if (data[province]?.municipality) {
      onChange({ province, city: province })
    } else {
      onChange({ province, city: "" })
    }
  }

  const handleCityChange = (city: string) => {
    onChange({ ...value, city })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          省份
        </Label>
        <Select
          value={value.province}
          onValueChange={handleProvinceChange}
          disabled={disabled}
        >
          <SelectTrigger className={cn(error?.province && "border-red-500")}>
            <SelectValue placeholder="选择省份" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {provinceList.map((province) => (
              <SelectItem key={province} value={province}>
                {province}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error?.province && (
          <p className="text-sm text-red-500">{error.province}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z" />
            <circle cx="12" cy="11" r="3" />
          </svg>
          城市
        </Label>
        <Select
          value={value.city}
          onValueChange={handleCityChange}
          disabled={disabled || !value.province || cityList.length === 0}
        >
          <SelectTrigger className={cn(error?.city && "border-red-500")}>
            <SelectValue placeholder={
              !value.province
                ? "先选省份"
                : cityList.length === 0
                ? "无城市"
                : data[value.province]?.municipality
                ? "直辖市"
                : "选择城市"
            } />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {cityList.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error?.city && (
          <p className="text-sm text-red-500">{error.city}</p>
        )}
      </div>
    </div>
  )
}

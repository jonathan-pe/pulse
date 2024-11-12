'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/app/lib/utils'
import { Button } from '@/app/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/app/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover'
import { useAppStore } from '@/app/store'
import { useState, useEffect } from 'react'
import { Sportsbook } from '@/types/sportsbook'

export default function SportsbookComboBox() {
  const [open, setOpen] = useState(false)
  const [sportsbooks, setSportsbooks] = useState<Sportsbook[]>([])

  useEffect(() => {
    getSportsbooks()
  }, [])

  const getSportsbooks = async () => {
    const response = await fetch(`${process.env.BACKEND_URL}/sportsbooks`)
    const data = await response.json()

    setSportsbooks(data)
    return data
  }

  const selectedSportsbook = useAppStore((state) => state.sportsbook)
  const setSportsbook = useAppStore((state) => state.setSportsbook)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' role='combobox' aria-expanded={open} className='w-full justify-between'>
          <span>{selectedSportsbook?.name ?? 'Select Sportsbook...'}</span>
          <ChevronsUpDown className='opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full p-0'>
        <Command>
          <CommandInput placeholder='Search...' />
          <CommandList>
            <CommandEmpty>No sportsbooks found.</CommandEmpty>
            <CommandGroup>
              {sportsbooks.map((sportsbook) => (
                <CommandItem
                  key={sportsbook.id}
                  value={sportsbook.id}
                  onSelect={(currentValue) => {
                    if (currentValue !== selectedSportsbook?.id) {
                      setSportsbook(sportsbooks.find((sb) => sb.id === currentValue) ?? null)
                    }
                    setOpen(false)
                  }}
                >
                  {sportsbook.name}
                  <Check
                    className={cn('ml-auto', selectedSportsbook?.id === sportsbook.id ? 'opacity-100' : 'opacity-0')}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
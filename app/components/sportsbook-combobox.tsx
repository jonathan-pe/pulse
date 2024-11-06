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
import { sportsbooks } from '@/app/constants/sportsbooks'
import { useAppStore } from '@/app/store'

export default function SportsbookComboBox() {
  const [open, setOpen] = React.useState(false)

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
          <CommandInput placeholder='Search framework...' />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
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

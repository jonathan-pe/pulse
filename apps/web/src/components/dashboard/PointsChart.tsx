import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { PointsTimeSeries } from '@pulse/types'

interface PointsChartProps {
  data: PointsTimeSeries[]
  isLoading?: boolean
}

export function PointsChart({ data, isLoading }: PointsChartProps) {
  // Get computed primary color for the chart
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Points Over Time</CardTitle>
          <CardDescription>Daily points earned in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='h-80 flex items-center justify-center text-muted-foreground'>Loading chart...</div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Points Over Time</CardTitle>
          <CardDescription>Daily points earned</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='h-80 flex items-center justify-center text-muted-foreground'>
            No data yet. Make predictions to see your progress!
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Points Over Time</CardTitle>
        <CardDescription>Daily points earned over the last {data.length} days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={320}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
            <XAxis
              dataKey='date'
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getMonth() + 1}/${date.getDate()}`
              }}
              className='text-xs'
            />
            <YAxis className='text-xs' />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
              formatter={(value: number) => [`${value} points`, 'Points']}
            />
            <Line
              type='monotone'
              dataKey='pointsEarned'
              stroke={primaryColor}
              strokeWidth={2}
              dot={{ fill: primaryColor }}
              activeDot={{ r: 6, fill: primaryColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

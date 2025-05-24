import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart4,
  CandlestickChart,
  LineChart as LineChartIcon,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data for demonstration
const mockData = [
  { time: '00:00', price: 27500 },
  { time: '04:00', price: 27580 },
  { time: '08:00', price: 27450 },
  { time: '12:00', price: 27620 },
  { time: '16:00', price: 27820 },
  { time: '20:00', price: 27950 },
  { time: '24:00', price: 27890 },
  { time: '28:00', price: 28050 },
  { time: '32:00', price: 28120 },
  { time: '36:00', price: 27980 },
  { time: '40:00', price: 28200 },
  { time: '44:00', price: 28150 },
  { time: '48:00', price: 28350 },
].map(item => ({
  ...item,
  price: Number(item.price),
}));

export default function TradingChart() {
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [chartType, setChartType] = useState('line');

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='flex flex-row items-center justify-between px-6 py-5 border-b'>
        <div className='flex items-center'>
          <CardTitle className='text-base font-normal'>
            <Select defaultValue={symbol} onValueChange={setSymbol}>
              <SelectTrigger className='border-0 p-0 h-auto w-auto font-bold text-lg bg-transparent'>
                <SelectValue placeholder='Select coin' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='BTC/USDT'>BTC/USDT</SelectItem>
                <SelectItem value='ETH/USDT'>ETH/USDT</SelectItem>
                <SelectItem value='SOL/USDT'>SOL/USDT</SelectItem>
                <SelectItem value='ADA/USDT'>ADA/USDT</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>

          <div className='text-sm ml-4 flex'>
            <div className='mr-3'>
              <span className='text-muted-foreground'>24h:</span>{' '}
              <span className='text-success font-medium'>+3.54%</span>
            </div>
            <div>
              <span className='text-muted-foreground'>Vol:</span>{' '}
              <span className='font-medium'>$12.34B</span>
            </div>
          </div>
        </div>

        <div className='flex items-center'>
          <div className='flex border rounded-md mr-2'>
            <Button
              variant={chartType === 'line' ? 'default' : 'ghost'}
              size='sm'
              className='h-8 rounded-r-none'
              onClick={() => setChartType('line')}
            >
              <LineChartIcon className='h-4 w-4' />
            </Button>
            <Button
              variant={chartType === 'area' ? 'default' : 'ghost'}
              size='sm'
              className='h-8 rounded-none border-x'
              onClick={() => setChartType('area')}
            >
              <BarChart4 className='h-4 w-4' />
            </Button>
            <Button
              variant={chartType === 'candle' ? 'default' : 'ghost'}
              size='sm'
              className='h-8 rounded-l-none'
              onClick={() => setChartType('candle')}
            >
              <CandlestickChart className='h-4 w-4' />
            </Button>
          </div>

          <Tabs
            defaultValue='1d'
            className='w-auto'
          >
            <TabsList className='grid grid-cols-5 h-8'>
              <TabsTrigger value='1h' className='text-xs px-2'>
                1H
              </TabsTrigger>
              <TabsTrigger value='1d' className='text-xs px-2'>
                1D
              </TabsTrigger>
              <TabsTrigger value='1w' className='text-xs px-2'>
                1W
              </TabsTrigger>
              <TabsTrigger value='1m' className='text-xs px-2'>
                1M
              </TabsTrigger>
              <TabsTrigger value='1y' className='text-xs px-2'>
                1Y
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className='p-0'>
        <div className='h-[400px] bg-background'>
          <ResponsiveContainer width='100%' height='100%'>
            {chartType === 'line' ? (
              <LineChart
                data={mockData}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  vertical={false}
                  stroke='#333'
                />
                <XAxis
                  dataKey='time'
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  minTickGap={40}
                />
                <YAxis
                  domain={['dataMin - 200', 'dataMax + 200']}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tickFormatter={value => `$${value}`}
                  width={60}
                />
                <Tooltip
                  formatter={value => [`$${value}`, 'Price']}
                  labelFormatter={label => `Time: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(22, 23, 29, 0.9)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  type='monotone'
                  dataKey='price'
                  stroke='#2563eb'
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : chartType === 'area' ? (
              <AreaChart
                data={mockData}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  vertical={false}
                  stroke='#333'
                />
                <XAxis
                  dataKey='time'
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  minTickGap={40}
                />
                <YAxis
                  domain={['dataMin - 200', 'dataMax + 200']}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tickFormatter={value => `$${value}`}
                  width={60}
                />
                <Tooltip
                  formatter={value => [`$${value}`, 'Price']}
                  labelFormatter={label => `Time: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(22, 23, 29, 0.9)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <defs>
                  <linearGradient id='colorPrice' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#2563eb' stopOpacity={0.3} />
                    <stop offset='95%' stopColor='#2563eb' stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type='monotone'
                  dataKey='price'
                  stroke='#2563eb'
                  strokeWidth={2}
                  fill='url(#colorPrice)'
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            ) : (
              // Simplified candlestick visualization since recharts doesn't have a built-in candlestick
              <div className='flex items-center justify-center h-full text-muted-foreground'>
                <div className='text-center'>
                  <CandlestickChart className='h-12 w-12 mx-auto mb-2 opacity-50' />
                  <p>
                    Candlestick chart visualization would be implemented here
                  </p>
                  <p className='text-sm mt-2'>
                    Using integrated TradingView or custom candlestick component
                  </p>
                </div>
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

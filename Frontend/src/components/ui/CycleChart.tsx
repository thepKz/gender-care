import React from 'react';
import { Card, Alert, Tag, Tooltip } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Tooltip as RechartsTooltip } from 'recharts';

interface CycleChartProps {
  chartData: Array<{
    date: string;
    dayNumber: number;
    mucusObservation?: string;
    feeling?: string;
    symbol: string;
    fertilityProbability: number;
    isPeakDay: boolean;
  }>;
  resultCalculation?: {
    peakDayX?: number;
    dayXPlus1?: number;
    dayY?: number;
    result?: number;
    status: 'normal' | 'short' | 'long' | 'incomplete';
    message: string;
  };
  statistics: {
    totalDays: number;
    peakDay?: number;
    fertileDays: number;
    dryDays: number;
  };
}

const CycleChart: React.FC<CycleChartProps> = ({ chartData, resultCalculation, statistics }) => {
  // Màu sắc cho các symbol
  const symbolColors: Record<string, string> = {
    'M': '#e53935', // Đỏ cho kinh nguyệt
    'X': '#ff9800', // Cam cho ngày đỉnh
    '1': '#fdd835', // Vàng cho ngày 1 sau đỉnh
    '2': '#66bb6a', // Xanh lá cho ngày 2 sau đỉnh
    '3': '#42a5f5', // Xanh dương cho ngày 3 sau đỉnh
    'C': '#ab47bc', // Tím cho có thể thụ thai
    'S': '#26c6da', // Xanh nhạt cho an toàn
    'D': '#78909c'  // Xám cho khô
  };

  // Tạo dữ liệu cho fertility chart
  const fertilityChartData = chartData.map(day => ({
    dayNumber: day.dayNumber,
    fertilityProbability: day.fertilityProbability,
    symbol: day.symbol,
    date: new Date(day.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    isPeakDay: day.isPeakDay
  }));

  // Thống kê symbol distribution
  const symbolStats = chartData.reduce((acc, day) => {
    acc[day.symbol] = (acc[day.symbol] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(symbolStats).map(([symbol, count]) => ({
    name: getSymbolDescription(symbol),
    value: count,
    color: symbolColors[symbol]
  }));

  function getSymbolDescription(symbol: string): string {
    const descriptions: Record<string, string> = {
      'M': 'Kinh nguyệt',
      'X': 'Ngày đỉnh',
      '1': 'Sau đỉnh 1',
      '2': 'Sau đỉnh 2', 
      '3': 'Sau đỉnh 3',
      'C': 'Có thể thụ thai',
      'S': 'An toàn',
      'D': 'Khô'
    };
    return descriptions[symbol] || symbol;
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'normal': return 'success';
      case 'short': return 'warning';
      case 'long': return 'processing';
      case 'incomplete': return 'default';
      default: return 'default';
    }
  }

  function getStatusText(status: string): string {
    switch (status) {
      case 'normal': return 'Chu kỳ bình thường';
      case 'short': return 'Chu kỳ ngắn';
      case 'long': return 'Chu kỳ dài';
      case 'incomplete': return 'Chưa hoàn thành';
      default: return status;
    }
  }

  // Custom dot cho line chart
  const CustomDot = (props: { cx?: number; cy?: number; payload?: { symbol: string; isPeakDay: boolean } }) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload) return null;
    
    const color = symbolColors[payload.symbol] || '#999';
    const size = payload.isPeakDay ? 8 : 6;
    
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={size} 
        fill={color} 
        stroke="#fff" 
        strokeWidth={2}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Result Calculation Card */}
      {resultCalculation && (
        <Card 
          title={
            <div className="flex items-center gap-2">
              <span>📊 Phân tích theo công thức Billings</span>
              <Tag color={getStatusColor(resultCalculation.status)}>
                {getStatusText(resultCalculation.status)}
              </Tag>
            </div>
          }
          className="mb-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {resultCalculation.peakDayX && (
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-700">
                  {resultCalculation.peakDayX}
                </div>
                <div className="text-sm text-orange-600">Ngày đỉnh (X)</div>
              </div>
            )}
            {resultCalculation.dayXPlus1 && (
              <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-700">
                  {resultCalculation.dayXPlus1}
                </div>
                <div className="text-sm text-yellow-600">Ngày X + 1</div>
              </div>
            )}
            {resultCalculation.dayY && (
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">
                  {resultCalculation.dayY}
                </div>
                <div className="text-sm text-blue-600">Ngày Y</div>
              </div>
            )}
            {resultCalculation.result !== undefined && (
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">
                  {resultCalculation.result}
                </div>
                <div className="text-sm text-green-600">Result</div>
              </div>
            )}
          </div>
          
          <Alert
            message={resultCalculation.message}
            type={resultCalculation.status === 'normal' ? 'success' : 
                  resultCalculation.status === 'incomplete' ? 'info' : 'warning'}
            showIcon
            className="mb-4"
          />
          
          {resultCalculation.result !== undefined && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <strong>Công thức:</strong> Result = (Ngày X + 1) - Ngày Y = {resultCalculation.dayXPlus1} - {resultCalculation.dayY} = {resultCalculation.result}
              <br />
              <strong>Đánh giá:</strong> 
              {resultCalculation.status === 'normal' && ' Result nằm trong khoảng bình thường (-16 đến -11 hoặc 11 đến 16)'}
              {resultCalculation.status === 'short' && ' Result < 11 (chu kỳ ngắn)'}
              {resultCalculation.status === 'long' && ' Result > 16 (chu kỳ dài)'}
            </div>
          )}
        </Card>
      )}

      {/* Statistics Overview */}
      <Card title="📈 Thống kê tổng quan" className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{statistics.totalDays}</div>
            <div className="text-sm text-gray-600">Tổng số ngày</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {statistics.peakDay || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Ngày đỉnh</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{statistics.fertileDays}</div>
            <div className="text-sm text-gray-600">Ngày có thể thụ thai</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{statistics.dryDays}</div>
            <div className="text-sm text-gray-600">Ngày khô</div>
          </div>
        </div>
      </Card>

      {/* Fertility Probability Chart */}
      <Card title="📊 Biểu đồ khả năng thụ thai" className="mb-4">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={fertilityChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis 
              label={{ value: 'Khả năng thụ thai (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
            />
            <RechartsTooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="fertilityProbability" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={<CustomDot />}
              name="Khả năng thụ thai (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Symbol Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="🎯 Phân bố các ký hiệu" className="h-fit">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="📊 Biểu đồ cột theo ngày" className="h-fit">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fertilityChartData.slice(0, 20)}> {/* Hiển thị 20 ngày đầu */}
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="dayNumber" 
                label={{ value: 'Ngày trong chu kỳ', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'Khả năng thụ thai (%)', angle: -90, position: 'insideLeft' }}
                domain={[0, 100]}
              />
              <RechartsTooltip />
              <Bar dataKey="fertilityProbability" name="Khả năng thụ thai (%)">
                {fertilityChartData.slice(0, 20).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={symbolColors[entry.symbol]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Cycle Timeline */}
      <Card title="⏰ Dòng thời gian chu kỳ" className="mt-4">
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-max py-4">
            {chartData.map((day, index) => (
              <Tooltip 
                key={index}
                title={
                  <div>
                    <div><strong>Ngày {day.dayNumber}</strong></div>
                    <div>{new Date(day.date).toLocaleDateString('vi-VN')}</div>
                    <div>{getSymbolDescription(day.symbol)}</div>
                    <div>Khả năng thụ thai: {day.fertilityProbability}%</div>
                    {day.mucusObservation && <div>Quan sát: {day.mucusObservation}</div>}
                    {day.feeling && <div>Cảm giác: {day.feeling}</div>}
                  </div>
                }
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer transition-transform hover:scale-110 ${
                    day.isPeakDay ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: symbolColors[day.symbol] }}
                >
                  {day.symbol}
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">Chú thích:</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(symbolColors).map(([symbol, color]) => (
              <div key={symbol} className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600">
                  {symbol} - {getSymbolDescription(symbol)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CycleChart; 
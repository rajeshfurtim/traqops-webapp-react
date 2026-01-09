import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function InventoryStockChart({ data = [] }) {
  // Validate and transform data for Chart.js
  const chartData = (Array.isArray(data) ? data : []).map((item, index) => ({
    category: item?.category || `Category ${index + 1}`,
    stock: Number(item?.stock) || 0,
    capacity: Number(item?.capacity) || 0,
    utilization: item?.capacity > 0 
      ? ((Number(item?.stock) / Number(item?.capacity)) * 100).toFixed(1)
      : 0
  })).filter(item => item.stock >= 0 && item.capacity >= 0)

  if (!chartData || chartData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600, color: '#333' }}>
          Inventory Stock Levels by Category
        </h3>
        <p>No data available</p>
      </div>
    )
  }

  // Create gradient functions
  const createGradient = (ctx, colorStart, colorMid, colorEnd) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400)
    gradient.addColorStop(0, colorStart)
    gradient.addColorStop(0.5, colorMid)
    gradient.addColorStop(1, colorEnd)
    return gradient
  }

  const chartConfig = {
    labels: chartData.map(item => item.category),
    datasets: [
      {
        label: 'Current Stock',
        data: chartData.map(item => item.stock),
        backgroundColor: (context) => {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) return '#3498db'
          return createGradient(ctx, '#3498db', '#2980b9', '#1f6391')
        },
        borderColor: '#2980b9',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 'flex',
        maxBarThickness: 60
      },
      {
        label: 'Capacity',
        data: chartData.map(item => item.capacity),
        backgroundColor: (context) => {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) return '#95a5a6'
          return createGradient(ctx, '#95a5a6', '#7f8c8d', '#6c757d')
        },
        borderColor: '#7f8c8d',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 'flex',
        maxBarThickness: 60
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 15,
          font: {
            size: 13,
            weight: 500
          },
          usePointStyle: true,
          pointStyle: 'rectRounded'
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#e0e0e0',
        borderWidth: 2,
        padding: 12,
        titleFont: {
          size: 15,
          weight: 'bold'
        },
        bodyFont: {
          size: 14
        },
        displayColors: true,
        callbacks: {
          title: (context) => {
            return context[0].label
          },
          label: (context) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y || 0
            return `${label}: ${value.toLocaleString()}`
          },
          afterBody: (context) => {
            const item = chartData[context[0].dataIndex]
            if (item) {
              const utilizationColor = item.utilization > 80 ? '#dc3545' : item.utilization > 60 ? '#ffc107' : '#28a745'
              return [
                '',
                `Utilization: ${item.utilization}%`
              ]
            }
            return []
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 12
          },
          color: '#666',
          maxRotation: 0,
          minRotation: 0
        },
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 12
          },
          color: '#666',
          callback: function(value) {
            return value.toLocaleString()
          }
        },
        title: {
          display: true,
          text: 'Quantity',
          font: {
            size: 13,
            weight: 500
          },
          color: '#666'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart',
      delay: (context) => {
        return context.dataIndex * 100
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }

  return (
    <div>
      <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600, color: '#333' }}>
        Inventory Stock Levels by Category
      </h3>
      <div style={{ height: 300, position: 'relative' }}>
        <Bar data={chartConfig} options={options} />
      </div>
    </div>
  )
}

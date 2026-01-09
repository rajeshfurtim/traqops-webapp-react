import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const COLORS = ['#28a745', '#ffc107', '#17a2b8', '#dc3545', '#6c757d', '#6610f2']

export default function MaintenanceStatusChart({ data = [] }) {
  // Validate and transform data for Chart.js
  const chartData = (Array.isArray(data) ? data : []).map((item, index) => ({
    label: item?.name || `Item ${index + 1}`,
    value: Number(item?.value) || 0,
    color: item?.color || COLORS[index % COLORS.length]
  })).filter(item => item.value > 0)

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  if (!chartData || chartData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600, color: '#333' }}>
          Maintenance Status Distribution
        </h3>
        <p>No data available</p>
      </div>
    )
  }

  const chartConfig = {
    labels: chartData.map(item => item.label),
    datasets: [
      {
        label: 'Maintenance Status',
        data: chartData.map(item => item.value),
        backgroundColor: chartData.map(item => item.color),
        borderColor: chartData.map(item => item.color),
        borderWidth: 3,
        hoverBorderWidth: 5,
        hoverOffset: 10,
        cutout: '60%'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 13,
            weight: 500
          },
          usePointStyle: true,
          pointStyle: 'circle',
          generateLabels: (chart) => {
            const data = chart.data
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0]
                const value = dataset.data[i]
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                return {
                  text: `${label}: ${value} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor[i],
                  lineWidth: dataset.borderWidth,
                  hidden: false,
                  index: i
                }
              })
            }
            return []
          }
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
          size: 16,
          weight: 'bold'
        },
        bodyFont: {
          size: 14
        },
        displayColors: true,
        callbacks: {
          label: (context) => {
            const label = context.label || ''
            const value = context.parsed || 0
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
            return [
              `${label}: ${value.toLocaleString()}`,
              `Percentage: ${percentage}%`
            ]
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'point'
    }
  }

  return (
    <div>
      <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600, color: '#333' }}>
        Maintenance Status Distribution
      </h3>
      <div style={{ height: 300, position: 'relative' }}>
        <Doughnut data={chartConfig} options={options} />
      </div>
    </div>
  )
}

import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import HighchartsAccessibility from 'highcharts/modules/accessibility'

// Initialize accessibility module
HighchartsAccessibility(Highcharts)

export default function MaintenanceStatusChart({ data }) {
  const options = {
    chart: {
      type: 'pie',
      height: 300
    },
    title: {
      text: 'Maintenance Status Distribution'
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    },
    accessibility: {
      point: {
        valueSuffix: '%'
      }
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.percentage:.1f} %'
        }
      }
    },
    series: [{
      name: 'Status',
      colorByPoint: true,
      data: data.map(item => ({
        name: item.name,
        y: item.value,
        color: item.color
      }))
    }]
  }

  return <HighchartsReact highcharts={Highcharts} options={options} />
}


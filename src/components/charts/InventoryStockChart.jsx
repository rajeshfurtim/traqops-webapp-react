import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import HighchartsAccessibility from 'highcharts/modules/accessibility'

// Initialize accessibility module
HighchartsAccessibility(Highcharts)

export default function InventoryStockChart({ data }) {
  const options = {
    chart: {
      type: 'column',
      height: 300
    },
    title: {
      text: 'Inventory Stock Levels by Category'
    },
    xAxis: {
      categories: data.map(item => item.category),
      crosshair: true
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Quantity'
      }
    },
    tooltip: {
      headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
      pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
        '<td style="padding:0"><b>{point.y}</b></td></tr>',
      footerFormat: '</table>',
      shared: true,
      useHTML: true
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0
      }
    },
    series: [
      {
        name: 'Current Stock',
        data: data.map(item => item.stock),
        color: '#3498db'
      },
      {
        name: 'Capacity',
        data: data.map(item => item.capacity),
        color: '#95a5a6'
      }
    ]
  }

  return <HighchartsReact highcharts={Highcharts} options={options} />
}


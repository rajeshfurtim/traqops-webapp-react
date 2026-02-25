// npm install xlsx jspdf jspdf-autotable
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const prepareTableData = (columns, data) => {

  const validColumns = columns.filter(col => col.title)

  const headers = validColumns.map(col => col.title)

  const rows = data.map((row, index) =>
    validColumns.map(col => {

      if (col.render) {
        return col.render(row[col.dataIndex], row, index) || "-"
      }

      return row[col.dataIndex] || "-"
    })
  )

  return { headers, rows }
}


export const exportToExcel = async (
  columns,
  data,
  filename = 'attendance-report'
) => {
  if (!data || data.length === 0) return

  const { headers, rows } = prepareTableData(columns, data)

  const worksheetData = [headers, ...rows]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')

  XLSX.writeFile(workbook, `${filename}.xlsx`)
}


export const exportToPDF = async (
  columns,
  data,
  filename
) => {
  if (!data || data.length === 0) return

  const { headers, rows } = prepareTableData(columns, data)

  const doc = new jsPDF('l', 'mm', 'a4') // landscape for wide tables

  doc.setFontSize(14)
  doc.text(filename, 14, 15)

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 20,
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [22, 119, 255] // AntD blue
    }
  })

  doc.save(`${filename}.pdf`)
}

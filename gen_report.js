const { generateReport } = require('./report/buildReport')

generateReport().catch((error) => {
  console.error('Không thể tạo BAO_CAO_DU_AN.docx')
  console.error(error)
  process.exit(1)
})

const fs = require('fs')
const helpers = require('./docxHelpers')
const coverAndOverview = require('./sections/coverAndOverview')
const architectureAndDatabase = require('./sections/architectureAndDatabase')
const features = require('./sections/features')
const evaluation = require('./sections/evaluation')

const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  PRIMARY,
  TextRun,
  convertInchesToTwip,
  t,
} = helpers

const ctx = helpers

const buildChildren = () => [
  ...coverAndOverview(ctx),
  ...architectureAndDatabase(ctx),
  ...features(ctx),
  ...evaluation(ctx),
]

const buildDocument = () =>
  new Document({
    styles: {
      default: {
        document: { run: { font: 'Times New Roman', size: 24 } },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          run: { bold: true, size: 32, color: PRIMARY, font: 'Times New Roman' },
          paragraph: { spacing: { before: 360, after: 160 } },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          run: { bold: true, size: 28, color: '1E3A5F', font: 'Times New Roman' },
          paragraph: { spacing: { before: 260, after: 100 } },
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          run: { bold: true, size: 24, color: '2C5F8A', font: 'Times New Roman' },
          paragraph: { spacing: { before: 160, after: 80 } },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1.1),
            bottom: convertInchesToTwip(1.0),
            left: convertInchesToTwip(1.3),
            right: convertInchesToTwip(0.9),
          },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [t('BÁO CÁO DỰ ÁN — HỆ THỐNG BÁN SÁCH TRỰC TUYẾN BOOKSTORE', { color: '888888', size: 18 })],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC', space: 6 } },
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              t('Trang ', { color: '888888', size: 18 }),
              new TextRun({ children: [PageNumber.CURRENT], color: '888888', size: 18 }),
              t(' / ', { color: '888888', size: 18 }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], color: '888888', size: 18 }),
            ],
          })],
        }),
      },
      children: buildChildren(),
    }],
  })

const generateReport = async (output = 'BAO_CAO_DU_AN.docx') => {
  const buffer = await Packer.toBuffer(buildDocument())
  fs.writeFileSync(output, buffer)
  console.log(`${output} đã được tạo thành công!`)
}

module.exports = {
  buildDocument,
  generateReport,
}

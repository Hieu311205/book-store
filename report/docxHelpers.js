const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  convertInchesToTwip,
} = require('docx')

const PRIMARY = '1A56B0'
const HEADER_FILL = 'D6E4F7'

const h = (text, level = HeadingLevel.HEADING_1) =>
  new Paragraph({
    text,
    heading: level,
    spacing: { before: 260, after: 120 },
    run: { bold: true, color: level === HeadingLevel.HEADING_1 ? PRIMARY : '1E3A5F' },
  })

const h2 = (text) => h(text, HeadingLevel.HEADING_2)
const h3 = (text) => h(text, HeadingLevel.HEADING_3)

const p = (...runs) =>
  new Paragraph({ children: runs, spacing: { before: 60, after: 80 }, alignment: AlignmentType.JUSTIFIED })

const t = (text, opts = {}) =>
  new TextRun({ text, font: 'Times New Roman', size: 24, ...opts })

const bold = (text) => t(text, { bold: true })
const italic = (text) => t(text, { italics: true, color: '555555' })

const bullet = (text) =>
  new Paragraph({
    bullet: { level: 0 },
    children: [t(text)],
    spacing: { before: 40, after: 40 },
  })

const bullet2 = (text) =>
  new Paragraph({
    bullet: { level: 1 },
    children: [t(text)],
    spacing: { before: 20, after: 20 },
  })

const pageBreak = () => new Paragraph({ children: [new PageBreak()] })

const cell = (text, shade = false, isBold = false) =>
  new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, font: 'Times New Roman', size: 22, bold: isBold })],
      alignment: AlignmentType.LEFT,
      spacing: { before: 40, after: 40 },
    })],
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    shading: shade ? { fill: HEADER_FILL, type: ShadingType.CLEAR } : undefined,
  })

const cellC = (text, shade = false, isBold = false) =>
  new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, font: 'Times New Roman', size: 22, bold: isBold })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 40 },
    })],
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    shading: shade ? { fill: HEADER_FILL, type: ShadingType.CLEAR } : undefined,
  })

const headerRow = (...cols) =>
  new TableRow({ children: cols.map((col) => cellC(col, true, true)), tableHeader: true })

const dataRow = (...cols) =>
  new TableRow({ children: cols.map((col, index) => (index === 0 ? cellC(col) : cell(col))) })

module.exports = {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  convertInchesToTwip,
  PRIMARY,
  HEADER_FILL,
  h,
  h2,
  h3,
  p,
  t,
  bold,
  italic,
  bullet,
  bullet2,
  pageBreak,
  cell,
  cellC,
  headerRow,
  dataRow,
}

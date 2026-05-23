import { jsPDF } from 'jspdf'
import { TYPE_LABELS } from './constants.js'

const BRAND = 'GRÜN FALCOT & CO'
const BRAND_SUB = 'Courtage en vins'

const C = {
  navy: [30, 58, 84],
  gold: [197, 160, 89],
  light: [245, 244, 242],
  border: [220, 215, 208],
  text: [30, 27, 24],
  muted: [120, 113, 108],
  white: [255, 255, 255],
}

function hex(rgb) {
  return `#${rgb.map(v => v.toString(16).padStart(2, '0')).join('')}`
}

function setFill(doc, rgb) { doc.setFillColor(...rgb) }
function setDraw(doc, rgb) { doc.setDrawColor(...rgb) }
function setTextColor(doc, rgb) { doc.setTextColor(...rgb) }

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function wrapText(doc, text, x, y, maxWidth, lineHeight) {
  const lines = doc.splitTextToSize(text, maxWidth)
  doc.text(lines, x, y)
  return y + lines.length * lineHeight
}

export function generatePDF(item) {
  const isOrder = !item.type || item._source === 'order'
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 18

  // ── Header band ──────────────────────────────────────────────────────────
  setFill(doc, C.navy)
  doc.rect(0, 0, W, 38, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  setTextColor(doc, C.white)
  doc.text(BRAND, margin, 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setTextColor(doc, [180, 195, 210])
  doc.text(BRAND_SUB, margin, 22)

  // Document type label (right side)
  const docLabel = isOrder ? 'BON DE COMMANDE' : `FICHE — ${(TYPE_LABELS[item.type] ?? 'TÂCHE').toUpperCase()}`
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setTextColor(doc, C.gold)
  doc.text(docLabel, W - margin, 16, { align: 'right' })

  // Gold accent line
  setFill(doc, C.gold)
  doc.rect(0, 38, W, 1.2, 'F')

  // ── Reference block ───────────────────────────────────────────────────────
  let y = 52

  const refId = (item.id ?? '').toUpperCase().slice(0, 8)
  const refDate = formatDate(item.created_at)

  setFill(doc, C.light)
  setDraw(doc, C.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, y - 6, W - margin * 2, 18, 2, 2, 'FD')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  setTextColor(doc, C.muted)
  doc.text('RÉFÉRENCE', margin + 5, y)
  doc.text('DATE', W / 2, y)
  doc.text('STATUT', W - margin - 5, y, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setTextColor(doc, C.text)
  doc.text(`#${refId}`, margin + 5, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.text(refDate, W / 2, y + 6)

  const statusColors = {
    'Traitée': C.gold,
    'À traiter': [180, 120, 20],
    'Entrante': C.navy,
  }
  setTextColor(doc, statusColors[item.status] ?? C.muted)
  doc.setFont('helvetica', 'bold')
  doc.text((item.status ?? '—').toUpperCase(), W - margin - 5, y + 6, { align: 'right' })

  if (item.urgent) {
    setFill(doc, [220, 38, 38])
    doc.circle(W - margin + 4, y - 2, 2.5, 'F')
    setTextColor(doc, C.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.text('!', W - margin + 4, y - 0.5, { align: 'center' })
  }

  y += 22

  // ── Info grid ─────────────────────────────────────────────────────────────
  function infoBlock(label, value, x, blockY, w) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setTextColor(doc, C.muted)
    doc.text(label, x, blockY)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    setTextColor(doc, C.text)
    const lines = doc.splitTextToSize(value || '—', w - 4)
    doc.text(lines, x, blockY + 5)
    return blockY + 5 + lines.length * 5
  }

  // Divider label
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  setTextColor(doc, C.muted)
  doc.text('INFORMATIONS', margin, y)
  setFill(doc, C.border)
  doc.rect(margin + 28, y - 1, W - margin * 2 - 28, 0.4, 'F')

  y += 7

  const col1 = margin
  const col2 = W / 2 + 5
  const colW = W / 2 - margin - 5

  const nextY1 = infoBlock('CLIENT', item.client_name, col1, y, colW)
  const nextY2 = infoBlock('FOURNISSEUR', item.supplier_name, col2, y, colW)
  y = Math.max(nextY1, nextY2) + 8

  // ── Content block ─────────────────────────────────────────────────────────
  const contentLabel = isOrder ? 'RETRANSCRIPTION' : 'DESCRIPTION'
  const contentText = (isOrder ? item.transcription : item.description) ?? '—'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  setTextColor(doc, C.muted)
  doc.text(contentLabel, margin, y)
  setFill(doc, C.border)
  doc.rect(margin + 35, y - 1, W - margin * 2 - 35, 0.4, 'F')

  y += 5

  setFill(doc, C.light)
  setDraw(doc, C.border)
  doc.setLineWidth(0.3)

  // Measure text height first
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  const contentLines = doc.splitTextToSize(contentText, W - margin * 2 - 10)
  const boxH = Math.max(20, contentLines.length * 5.5 + 8)

  doc.roundedRect(margin, y, W - margin * 2, boxH, 2, 2, 'FD')
  setTextColor(doc, C.text)
  doc.text(contentLines, margin + 5, y + 7)

  y += boxH + 8

  // Raw transcription (if available and different)
  if (item.raw_transcription && item.raw_transcription !== contentText) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    setTextColor(doc, C.muted)
    doc.text('MESSAGE ORIGINAL', margin, y)
    setFill(doc, C.border)
    doc.rect(margin + 38, y - 1, W - margin * 2 - 38, 0.4, 'F')

    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    setTextColor(doc, C.muted)
    const rawLines = doc.splitTextToSize(item.raw_transcription, W - margin * 2 - 10)
    const rawBoxH = Math.max(14, rawLines.length * 4.8 + 6)

    setFill(doc, [250, 249, 247])
    setDraw(doc, C.border)
    doc.roundedRect(margin, y, W - margin * 2, rawBoxH, 2, 2, 'FD')
    doc.text(rawLines, margin + 5, y + 5.5)

    y += rawBoxH + 8
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = 282
  setFill(doc, C.light)
  doc.rect(0, footerY - 2, W, 18, 'F')
  setFill(doc, C.gold)
  doc.rect(0, footerY - 2, W, 0.5, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setTextColor(doc, C.muted)
  doc.text(`Généré le ${formatDateTime(new Date().toISOString())}`, margin, footerY + 4)
  doc.text(BRAND, W - margin, footerY + 4, { align: 'right' })
  doc.text(`Réf. complète : ${(item.id ?? '').toUpperCase()}`, margin, footerY + 9)

  // ── Save ──────────────────────────────────────────────────────────────────
  const slug = isOrder ? 'commande' : (item.type ?? 'tache')
  const client = (item.client_name ?? 'client').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const dateSlug = new Date(item.created_at).toISOString().slice(0, 10)
  doc.save(`${slug}-${client}-${dateSlug}.pdf`)
}

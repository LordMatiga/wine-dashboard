import { jsPDF } from 'jspdf'
import { TYPE_LABELS } from './constants.js'

// ── Company info — update with real values ────────────────────────────────
const COMPANY = {
  name:    'GRÜN FALCOT & CO',
  address: '19 All. Chante-Vent',
  city:    '69370 Saint-Didier-au-Mont-d\'Or',
  siret:   '530 290 725 00015',
  tva:     'FR 19 530290725',
  tel:     '06 47 05 89 12',
  email:   'contact@grunfalcot.fr',
}

const C = {
  navy:   [30, 58, 84],
  gold:   [197, 160, 89],
  light:  [245, 244, 242],
  border: [220, 215, 208],
  text:   [30, 27, 24],
  muted:  [120, 113, 108],
  white:  [255, 255, 255],
}

const setFill      = (doc, rgb) => doc.setFillColor(...rgb)
const setDraw      = (doc, rgb) => doc.setDrawColor(...rgb)
const setTextColor = (doc, rgb) => doc.setTextColor(...rgb)

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

function mimeShort(mime) {
  if (!mime) return 'Fichier'
  if (mime.startsWith('image/')) return 'Image'
  if (mime === 'application/pdf') return 'PDF'
  if (mime.includes('word')) return 'Word'
  if (mime.includes('sheet') || mime.includes('excel')) return 'Excel'
  return mime.split('/')[1]?.toUpperCase() ?? 'Fichier'
}

// Draws a section divider label + horizontal rule
function sectionHeader(doc, label, y, margin, W) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  setTextColor(doc, C.muted)
  doc.text(label, margin, y)
  const labelW = doc.getTextWidth(label)
  setFill(doc, C.border)
  doc.rect(margin + labelW + 3, y - 1, W - margin * 2 - labelW - 3, 0.4, 'F')
  return y + 7
}

export function generatePDF(item, docs = []) {
  const isOrder = item._source === 'order'
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 18
  const pageH = 297
  const footerH = 18

  // ── Header band ────────────────────────────────────────────────────────
  setFill(doc, C.navy)
  doc.rect(0, 0, W, 36, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  setTextColor(doc, C.white)
  doc.text(COMPANY.name, margin, 15)

  const docLabel = isOrder
    ? 'BON DE COMMANDE'
    : `FICHE — ${(TYPE_LABELS[item.type] ?? 'TÂCHE').toUpperCase()}`
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setTextColor(doc, C.gold)
  doc.text(docLabel, W - margin, 15, { align: 'right' })

  // Gold accent line
  setFill(doc, C.gold)
  doc.rect(0, 36, W, 1, 'F')

  // ── Two-column block: company info (left) + reference (right) ───────────
  let y = 46
  const midX = W / 2 + 5

  // Left — company admin info
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setTextColor(doc, C.text)
  doc.text(COMPANY.address, margin, y)
  doc.text(COMPANY.city, margin, y + 4.5)

  doc.setFontSize(7.5)
  setTextColor(doc, C.muted)
  doc.text(`SIRET : ${COMPANY.siret}`, margin, y + 10)
  doc.text(`N° TVA : ${COMPANY.tva}`, margin, y + 14.5)
  doc.text(`Tél : ${COMPANY.tel}`, margin, y + 19)
  doc.text(COMPANY.email, margin, y + 23.5)

  // Right — reference block
  const refId = (item.id ?? '').toUpperCase().slice(0, 8)
  setFill(doc, C.light)
  setDraw(doc, C.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(midX, y - 3, W - midX - margin, 30, 2, 2, 'FD')

  const rx = midX + 5
  doc.setFontSize(7)
  setTextColor(doc, C.muted)
  doc.text('RÉFÉRENCE', rx, y + 1)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setTextColor(doc, C.text)
  doc.text(`#${refId}`, rx, y + 7)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setTextColor(doc, C.muted)
  doc.text('DATE', rx, y + 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  setTextColor(doc, C.text)
  doc.text(formatDate(item.created_at), rx, y + 18.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setTextColor(doc, C.muted)
  doc.text('STATUT', W - margin - 5, y + 1, { align: 'right' })

  const statusColors = {
    'Traitée':   C.gold,
    'À traiter': [180, 120, 20],
    'Entrante':  C.navy,
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  setTextColor(doc, statusColors[item.status] ?? C.muted)
  doc.text((item.status ?? '—').toUpperCase(), W - margin - 5, y + 6.5, { align: 'right' })

  if (item.urgent) {
    setFill(doc, [220, 38, 38])
    doc.circle(W - margin - 5, y + 14, 3.5, 'F')
    setTextColor(doc, C.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('URGENT', W - margin - 5, y + 14.8, { align: 'center' })
  }

  y += 36

  // ── Client / Supplier ──────────────────────────────────────────────────
  const fullW = W - margin * 2
  y = sectionHeader(doc, 'INFORMATIONS', y, margin, W)

  const colW = fullW / 2 - 4

  function infoBlock(label, value, x, blockY, w) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setTextColor(doc, C.muted)
    doc.text(label, x, blockY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    setTextColor(doc, C.text)
    const lines = doc.splitTextToSize(value || '—', w)
    doc.text(lines, x, blockY + 5)
    return blockY + 5 + lines.length * 5
  }

  const y1 = infoBlock('CLIENT', item.client_name, margin, y, colW)
  const y2 = infoBlock('FOURNISSEUR', item.supplier_name, margin + fullW / 2 + 4, y, colW)
  y = Math.max(y1, y2) + 9

  // ── Content ────────────────────────────────────────────────────────────
  const contentLabel = isOrder ? 'RETRANSCRIPTION' : 'DESCRIPTION'
  const contentText = (isOrder ? item.transcription : item.description) ?? '—'

  y = sectionHeader(doc, contentLabel, y, margin, W)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  setTextColor(doc, C.text)
  const contentLines = doc.splitTextToSize(contentText, fullW - 10)
  const contentBoxH = Math.max(18, contentLines.length * 5.5 + 8)

  setFill(doc, C.light)
  setDraw(doc, C.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, y, fullW, contentBoxH, 2, 2, 'FD')
  doc.text(contentLines, margin + 5, y + 7)
  y += contentBoxH + 9

  // ── Raw transcription ──────────────────────────────────────────────────
  if (item.raw_transcription && item.raw_transcription !== contentText) {
    y = sectionHeader(doc, 'MESSAGE ORIGINAL', y, margin, W)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    setTextColor(doc, C.muted)
    const rawLines = doc.splitTextToSize(item.raw_transcription, fullW - 10)
    const rawBoxH = Math.max(14, rawLines.length * 4.8 + 6)
    setFill(doc, [250, 249, 247])
    setDraw(doc, C.border)
    doc.roundedRect(margin, y, fullW, rawBoxH, 2, 2, 'FD')
    doc.text(rawLines, margin + 5, y + 5.5)
    y += rawBoxH + 9
  }

  // ── Documents ──────────────────────────────────────────────────────────
  if (docs.length > 0) {
    // New page if not enough space
    if (y > pageH - footerH - 20 - docs.length * 9) {
      doc.addPage()
      y = margin + 10
    }

    y = sectionHeader(doc, `DOCUMENTS JOINTS (${docs.length})`, y, margin, W)

    docs.forEach((d, i) => {
      if (y > pageH - footerH - 12) {
        doc.addPage()
        y = margin + 10
      }
      const rowY = y
      const isEven = i % 2 === 0
      if (isEven) {
        setFill(doc, C.light)
        doc.rect(margin, rowY - 3.5, fullW, 9, 'F')
      }

      // Type badge
      const typeLabel = mimeShort(d.mime_type)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      setTextColor(doc, C.navy)
      doc.text(typeLabel, margin + 2, rowY + 1.5)

      // Filename
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      setTextColor(doc, C.text)
      const maxNameW = fullW - 55
      const nameLines = doc.splitTextToSize(d.filename ?? '—', maxNameW)
      doc.text(nameLines[0], margin + 20, rowY + 1.5)

      // Date (right-aligned)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      setTextColor(doc, C.muted)
      doc.text(formatDate(d.created_at), W - margin - 2, rowY + 1.5, { align: 'right' })

      y += 9
    })

    y += 4
  }

  // ── Footer (on every page) ─────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    const fy = pageH - footerH + 2
    setFill(doc, C.light)
    doc.rect(0, fy, W, footerH, 'F')
    setFill(doc, C.gold)
    doc.rect(0, fy, W, 0.5, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setTextColor(doc, C.muted)
    doc.text(`Généré le ${formatDateTime(new Date().toISOString())}`, margin, fy + 5)
    doc.text(COMPANY.name, W - margin, fy + 5, { align: 'right' })
    doc.text(`Réf. complète : ${(item.id ?? '').toUpperCase()}`, margin, fy + 10)
    if (totalPages > 1) {
      doc.text(`Page ${p} / ${totalPages}`, W - margin, fy + 10, { align: 'right' })
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────
  const slug   = isOrder ? 'commande' : (item.type ?? 'tache')
  const client = (item.client_name ?? 'client').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const dateSlug = new Date(item.created_at).toISOString().slice(0, 10)
  doc.save(`${slug}-${client}-${dateSlug}.pdf`)
}

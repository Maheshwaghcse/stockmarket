import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Formats a currency amount into clean INR text suitable for standard PDF fonts.
 * Avoids raw unicode ₹ symbol to prevent encoding/rendering corruption in PDF viewers.
 */
export function formatPdfINR(val, showSign = false) {
  if (val === null || val === undefined || isNaN(val)) return 'INR 0.00'
  const num = typeof val === 'number' ? val : parseFloat(val) || 0
  const isNeg = num < 0
  const abs = Math.abs(num)
  const sign = isNeg ? '-' : showSign && num > 0 ? '+' : ''
  return `${sign}INR ${abs.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Robust helper to extract before trade emotion from trade
export const extractBeforeEmotion = (t) => {
  if (!t) return ''
  const val =
    t.beforeTradeEmotions ||
    t.beforeEmotions ||
    t.beforeTradeEmotion ||
    t.beforeEmotion ||
    t.emotionsBefore ||
    t.emotions?.before ||
    ''
  if (val && typeof val === 'string' && val.trim()) return val.trim()
  if (Array.isArray(val) && val.length > 0) return String(val[0]).trim()
  return ''
}

// Robust helper to extract after trade emotion from trade
export const extractAfterEmotion = (t) => {
  if (!t) return ''
  const val =
    t.afterTradeEmotions ||
    t.afterEmotions ||
    t.afterTradeEmotion ||
    t.afterEmotion ||
    t.emotionsAfter ||
    t.emotions?.after ||
    ''
  if (val && typeof val === 'string' && val.trim()) return val.trim()
  if (Array.isArray(val) && val.length > 0) return String(val[0]).trim()
  return ''
}

/**
 * Computes complete audit metrics for filtered trades.
 */
export function computePdfAuditStats(trades = []) {
  const totalTrades = trades.length
  const closedTrades = trades
    .filter((t) => t && t.status === 'CLOSED')
    .sort((a, b) => new Date(a.entryDate || a.createdAt || 0) - new Date(b.entryDate || b.createdAt || 0))
  const openTrades = trades.filter((t) => t && t.status !== 'CLOSED')

  let grossProfit = 0
  let grossLoss = 0
  let winCount = 0
  let lossCount = 0
  let breakEvenCount = 0

  let largestWinTrade = null
  let largestLossTrade = null

  let runningWinStreak = 0
  let maxWinStreak = 0
  let runningLossStreak = 0
  let maxLossStreak = 0

  let cumulativePnl = 0
  let peakPnl = 0
  let maxDrawdown = 0

  closedTrades.forEach((t) => {
    const pnl = typeof t.pnl === 'number' ? t.pnl : parseFloat(t.pnl) || 0
    cumulativePnl += pnl

    if (cumulativePnl > peakPnl) {
      peakPnl = cumulativePnl
    }
    const currentDrawdown = peakPnl - cumulativePnl
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown
    }

    if (pnl > 0) {
      grossProfit += pnl
      winCount++
      runningWinStreak++
      runningLossStreak = 0
      if (runningWinStreak > maxWinStreak) maxWinStreak = runningWinStreak
      if (!largestWinTrade || pnl > largestWinTrade.pnl) largestWinTrade = { ...t, pnl }
    } else if (pnl < 0) {
      const absLoss = Math.abs(pnl)
      grossLoss += absLoss
      lossCount++
      runningLossStreak++
      runningWinStreak = 0
      if (runningLossStreak > maxLossStreak) maxLossStreak = runningLossStreak
      if (!largestLossTrade || pnl < largestLossTrade.pnl) largestLossTrade = { ...t, pnl }
    } else {
      breakEvenCount++
      runningWinStreak = 0
      runningLossStreak = 0
    }
  })

  const netPnl = +(grossProfit - grossLoss).toFixed(2)
  const winRate = closedTrades.length > 0 ? +((winCount / closedTrades.length) * 100).toFixed(1) : 0
  const lossRate = closedTrades.length > 0 ? +((lossCount / closedTrades.length) * 100).toFixed(1) : 0
  const avgWinner = winCount > 0 ? +(grossProfit / winCount).toFixed(2) : 0
  const avgLoser = lossCount > 0 ? +(grossLoss / lossCount).toFixed(2) : 0
  const profitFactor = grossLoss > 0 ? +(grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? 99.9 : 0
  const payoffRatio = avgLoser > 0 ? +(avgWinner / avgLoser).toFixed(2) : avgWinner > 0 ? 1 : 0
  const avgPnlPerTrade = closedTrades.length > 0 ? +(netPnl / closedTrades.length).toFixed(2) : 0

  return {
    totalTrades,
    closedTradesCount: closedTrades.length,
    openTradesCount: openTrades.length,
    winCount,
    lossCount,
    breakEvenCount,
    winRate,
    lossRate,
    grossProfit,
    grossLoss,
    netPnl,
    avgWinner,
    avgLoser,
    profitFactor,
    payoffRatio,
    avgPnlPerTrade,
    maxDrawdown,
    largestWinTrade,
    largestLossTrade,
    maxWinStreak,
    maxLossStreak,
  }
}

/**
 * Computes independent performance metrics per strategy
 */
export function computeStrategyStats(trades = []) {
  const map = {}
  trades.forEach((t) => {
    const sName = t.strategy?.trim() || 'No Strategy Assigned'
    if (!map[sName]) {
      map[sName] = {
        name: sName,
        total: 0,
        wins: 0,
        losses: 0,
        breakeven: 0,
        netPnl: 0,
        grossWin: 0,
        grossLoss: 0,
      }
    }
    const item = map[sName]
    item.total++
    const pnl = typeof t.pnl === 'number' ? t.pnl : parseFloat(t.pnl) || 0
    item.netPnl += pnl
    if (pnl > 0) {
      item.wins++
      item.grossWin += pnl
    } else if (pnl < 0) {
      item.losses++
      item.grossLoss += Math.abs(pnl)
    } else {
      item.breakeven++
    }
  })

  return Object.values(map)
    .map((s) => {
      const closed = s.wins + s.losses
      const winRate = closed > 0 ? +((s.wins / closed) * 100).toFixed(1) : 0
      const avgWin = s.wins > 0 ? +(s.grossWin / s.wins).toFixed(2) : 0
      const avgLoss = s.losses > 0 ? +(s.grossLoss / s.losses).toFixed(2) : 0
      const profitFactor = s.grossLoss > 0 ? +(s.grossWin / s.grossLoss).toFixed(2) : s.grossWin > 0 ? 99.9 : 0
      return {
        ...s,
        winRate,
        avgWin,
        avgLoss,
        profitFactor,
      }
    })
    .sort((a, b) => b.netPnl - a.netPnl)
}

/**
 * Generates an analytical narrative describing each trading metric in detail.
 */
export function generatePdfNarrative(stats, filterOptions = {}) {
  const {
    netPnl,
    totalTrades,
    closedTradesCount,
    winCount,
    lossCount,
    winRate,
    profitFactor,
    payoffRatio,
    avgWinner,
    avgLoser,
    maxDrawdown,
    maxWinStreak,
    maxLossStreak,
  } = stats

  const isNetProfitable = netPnl > 0
  const isLoss = netPnl < 0

  let profitDesc = ''
  if (isNetProfitable) {
    profitDesc = `During this audit window, the account generated a net realized return of ${formatPdfINR(netPnl, true)} across ${closedTradesCount} completed trades. Realized gains of ${formatPdfINR(stats.grossProfit)} successfully offset losses of ${formatPdfINR(stats.grossLoss)}, verifying a positive capital growth trajectory.`
  } else if (isLoss) {
    profitDesc = `The account recorded a net realized loss of ${formatPdfINR(netPnl, true)} across ${closedTradesCount} completed trades. Gross losses of ${formatPdfINR(stats.grossLoss)} exceeded gains of ${formatPdfINR(stats.grossProfit)}, indicating that risk sizing or unfavorable setups exerted downside pressure.`
  } else {
    profitDesc = `The account produced a neutral breakeven performance with Net P&L of ${formatPdfINR(netPnl)} over ${closedTradesCount} completed trades, preserving baseline principal.`
  }

  let winRateDesc = ''
  if (winRate >= 55) {
    winRateDesc = `Win Rate stands at a strong ${winRate}% (${winCount} wins out of ${closedTradesCount} closed trades). A win rate in this tier indicates high setup selection consistency and disciplined execution.`
  } else if (winRate >= 45) {
    winRateDesc = `Win Rate is balanced at ${winRate}% (${winCount} wins / ${lossCount} losses). This rate is highly sustainable when combined with disciplined risk-reward targets.`
  } else {
    winRateDesc = `Win Rate registered at ${winRate}% (${winCount} wins / ${lossCount} losses). Long-term profitability in this regime relies on asymmetric risk-reward where winners strictly exceed losers.`
  }

  let profitFactorDesc = ''
  if (profitFactor >= 1.8) {
    profitFactorDesc = `Profit Factor is ${profitFactor}, ranking in the top quartile (>1.8). Every 1 Rupee risked returned Rs. ${profitFactor}, showing robust risk buffering.`
  } else if (profitFactor >= 1.2) {
    profitFactorDesc = `Profit Factor is healthy at ${profitFactor}, verifying a statistically valid trading edge with sufficient leeway against fees and slippage.`
  } else {
    profitFactorDesc = `Profit Factor is ${profitFactor}, reflecting marginal efficiency. Strict adherence to trade setups and stops is advised.`
  }

  const payoffDesc = `Average winning trade is ${formatPdfINR(avgWinner)}, compared to average loss of ${formatPdfINR(avgLoser)} (Payoff Ratio: ${payoffRatio} : 1.0). Maximum peak-to-trough drawdown reached ${formatPdfINR(maxDrawdown)}.`
  const drawdownDesc = `The longest winning streak reached ${maxWinStreak} consecutive trades, while the longest losing streak was contained to ${maxLossStreak} trades.`

  const recommendations = [
    'Enforce hard stop-losses consistently to prevent large outlier losses from eroding accumulated profits.',
    'Focus capital on top-performing setups and eliminate trades taken without a verified trigger.',
    'Review before and after trade emotions regularly to maintain emotional neutrality and eliminate revenge trading.',
  ]

  return {
    profitDesc,
    winRateDesc,
    profitFactorDesc,
    payoffDesc,
    drawdownDesc,
    recommendations,
  }
}

/**
 * Main export function: Generates and triggers download of the custom PDF Report with charts and user selections.
 */
export async function generateTradingJournalPdf({
  trades = [],
  user = null,
  fromDate = '',
  toDate = '',
  outcomeFilter = 'all',
  selectedSymbol = 'ALL',
  selectedStrategy = 'ALL',
  selectedEmotion = 'ALL',
  // User Customizable Options:
  includeSummary = true,
  includeCharts = true,
  includeStrategiesBreakdown = true,
  includeTable = true,
  includeJournalDetails = true,
  includeChartImages = true,
  includeNarrative = true,
}) {
  // Apply filtering
  let filtered = [...trades]

  if (fromDate) {
    const fromTime = new Date(fromDate).getTime()
    filtered = filtered.filter((t) => new Date(t.entryDate || t.createdAt || 0).getTime() >= fromTime)
  }
  if (toDate) {
    const toObj = new Date(toDate)
    toObj.setHours(23, 59, 59, 999)
    const toTime = toObj.getTime()
    filtered = filtered.filter((t) => new Date(t.entryDate || t.createdAt || 0).getTime() <= toTime)
  }

  if (selectedSymbol && selectedSymbol !== 'ALL') {
    filtered = filtered.filter((t) => t.symbol?.toUpperCase() === selectedSymbol.toUpperCase())
  }

  if (selectedStrategy && selectedStrategy !== 'ALL') {
    filtered = filtered.filter((t) => (t.strategy?.trim() || '').toLowerCase() === selectedStrategy.toLowerCase().trim())
  }

  if (selectedEmotion && selectedEmotion !== 'ALL') {
    const target = selectedEmotion.toLowerCase().trim()
    filtered = filtered.filter((t) => {
      const b = extractBeforeEmotion(t).toLowerCase()
      const a = extractAfterEmotion(t).toLowerCase()
      return b.includes(target) || a.includes(target)
    })
  }

  if (outcomeFilter === 'profit') {
    filtered = filtered.filter((t) => (t.pnl || 0) > 0)
  } else if (outcomeFilter === 'loss') {
    filtered = filtered.filter((t) => (t.pnl || 0) < 0)
  } else if (outcomeFilter === 'closed') {
    filtered = filtered.filter((t) => t.status === 'CLOSED')
  } else if (outcomeFilter === 'open') {
    filtered = filtered.filter((t) => t.status !== 'CLOSED')
  }

  const stats = computePdfAuditStats(filtered)
  const strategyStats = computeStrategyStats(filtered)
  const narrative = generatePdfNarrative(stats, { fromDate, toDate, outcomeFilter, selectedSymbol, selectedStrategy, selectedEmotion })

  // Initialize jsPDF document (Portrait A4)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - margin * 2

  // ── Helper: Draw Page Header & Branding ────────────────────────────────
  const drawPageHeader = (pageNumber) => {
    doc.setFillColor(15, 23, 42) // slate-900
    doc.rect(0, 0, pageWidth, 20, 'F')

    doc.setFillColor(37, 99, 235) // blue-600
    doc.rect(0, 20, pageWidth, 1.2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(255, 255, 255)
    doc.text('STOCKSENSE INDIA', margin, 10.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text('Trade History & Journal Performance Audit Desk', margin, 16)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(96, 165, 250) // blue-400
    doc.text('CUSTOM TRADE HISTORY REPORT', pageWidth - margin, 10.5, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(203, 213, 225)
    const genDate = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    })
    doc.text(`Generated: ${genDate} IST`, pageWidth - margin, 16, { align: 'right' })
  }

  // ── Helper: Draw Page Footer ──────────────────────────────────────────
  const drawPageFooter = (pageNumber, totalPages) => {
    const footerY = pageHeight - 8
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text(
      'StockSense India · Confidential Trade Audit · Charts, Emotions & Strategy Analysis',
      margin,
      footerY
    )
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' })
  }

  // Start Page 1
  drawPageHeader(1)
  let cursorY = 26

  // ── Metadata & Scope Block ────────────────────────────────────────────
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(margin, cursorY, contentWidth, 22, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(15, 23, 42)
  doc.text('TRADER PROFILE & SELECTED AUDIT SCOPE', margin + 4, cursorY + 5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(71, 85, 105)

  const traderName = user?.name || 'Verified Trader'
  const traderEmail = user?.email || 'N/A'
  doc.text(`Trader: ${traderName} (${traderEmail})`, margin + 4, cursorY + 10)

  const dateSpanText =
    fromDate && toDate
      ? `${fromDate} to ${toDate}`
      : fromDate
      ? `From ${fromDate} to Present`
      : toDate
      ? `Up to ${toDate}`
      : 'All-Time Trade History'
  const filterDesc = [
    `Records: ${filtered.length}`,
    selectedStrategy !== 'ALL' ? `Strategy: ${selectedStrategy}` : null,
    selectedEmotion !== 'ALL' ? `Emotion: ${selectedEmotion}` : null,
    selectedSymbol !== 'ALL' ? `Symbol: ${selectedSymbol}` : null,
    outcomeFilter !== 'all' ? `Outcome: ${outcomeFilter.toUpperCase()}` : null,
  ].filter(Boolean).join(' | ')

  doc.text(`Date Range: ${dateSpanText}`, margin + 4, cursorY + 15)
  doc.text(`Filter Scope: ${filterDesc}`, margin + 4, cursorY + 19.5)

  cursorY += 26

  // ── SECTION 1: EXECUTIVE PERFORMANCE METRICS (if includeSummary) ────────
  if (includeSummary) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(15, 23, 42)
    doc.text('1. Executive Performance Metrics', margin, cursorY)
    cursorY += 4

    const cardWidth = (contentWidth - 6) / 4
    const cardHeight = 14.5
    const rowGap = 3

    const cardsData = [
      {
        label: 'NET REALIZED P&L',
        val: formatPdfINR(stats.netPnl, true),
        color: stats.netPnl >= 0 ? [22, 163, 74] : [220, 38, 38],
      },
      {
        label: 'WIN RATE (%)',
        val: `${stats.winRate}%`,
        sub: `${stats.winCount}W / ${stats.lossCount}L`,
        color: stats.winRate >= 50 ? [22, 163, 74] : [220, 38, 38],
      },
      {
        label: 'TOTAL TRADES',
        val: String(stats.totalTrades),
        sub: `${stats.closedTradesCount} Closed / ${stats.openTradesCount} Open`,
        color: [30, 41, 59],
      },
      {
        label: 'PROFIT FACTOR',
        val: `${stats.profitFactor}x`,
        sub: stats.profitFactor >= 1.5 ? 'Strong Edge' : 'Moderate',
        color: stats.profitFactor >= 1.5 ? [22, 163, 74] : [30, 41, 59],
      },
      {
        label: 'AVG WINNER',
        val: formatPdfINR(stats.avgWinner, true),
        color: [22, 163, 74],
      },
      {
        label: 'AVG LOSER',
        val: formatPdfINR(stats.avgLoser ? -stats.avgLoser : 0),
        color: [220, 38, 38],
      },
      {
        label: 'PAYOFF RATIO',
        val: `${stats.payoffRatio} : 1.0`,
        sub: stats.payoffRatio >= 1.5 ? 'Asymmetric Profit' : 'Balanced',
        color: [30, 41, 59],
      },
      {
        label: 'MAX DRAWDOWN',
        val: formatPdfINR(stats.maxDrawdown ? -stats.maxDrawdown : 0),
        sub: `Max Streaks: ${stats.maxWinStreak}W / ${stats.maxLossStreak}L`,
        color: [220, 38, 38],
      },
    ]

    cardsData.forEach((c, idx) => {
      const col = idx % 4
      const row = Math.floor(idx / 4)
      const x = margin + col * (cardWidth + 2)
      const y = cursorY + row * (cardHeight + rowGap)

      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD')

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(100, 116, 139)
      doc.text(c.label, x + 2.5, y + 4)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...c.color)
      doc.text(c.val, x + 2.5, y + 9)

      if (c.sub) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(5.5)
        doc.setTextColor(148, 163, 184)
        doc.text(c.sub, x + 2.5, y + 12.8)
      }
    })

    cursorY += 2 * (cardHeight + rowGap) + 3
  }

  // ── SECTION 2: VISUAL ANALYTICS & CHARTS (if includeCharts) ─────────────
  if (includeCharts && filtered.length > 0) {
    if (cursorY > pageHeight - 80) {
      doc.addPage()
      drawPageHeader(doc.internal.getNumberOfPages())
      cursorY = 26
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(15, 23, 42)
    doc.text('2. Visual Analytics & Equity Growth Charts', margin, cursorY)
    cursorY += 4

    // CHART 1: CUMULATIVE EQUITY CURVE
    const chartHeight = 38
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(203, 213, 225)
    doc.roundedRect(margin, cursorY, contentWidth, chartHeight, 2, 2, 'FD')

    // Chart Title Badge
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(30, 41, 59)
    doc.text('CUMULATIVE REALIZED EQUITY CURVE (INR)', margin + 3.5, cursorY + 5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(100, 116, 139)
    doc.text(`Total Closed Trades Plotted: ${stats.closedTradesCount}`, pageWidth - margin - 3.5, cursorY + 5, { align: 'right' })

    const plotMarginX = 14
    const plotMarginY = 8
    const plotX = margin + plotMarginX
    const plotY = cursorY + plotMarginY
    const plotW = contentWidth - plotMarginX * 2
    const plotH = chartHeight - plotMarginY - 6

    const closedTrades = filtered
      .filter((t) => t && t.status === 'CLOSED')
      .sort((a, b) => new Date(a.entryDate || a.createdAt || 0) - new Date(b.entryDate || b.createdAt || 0))

    let running = 0
    const points = [0]
    closedTrades.forEach((t) => {
      const pnl = typeof t.pnl === 'number' ? t.pnl : parseFloat(t.pnl) || 0
      running += pnl
      points.push(running)
    })

    const minPnl = Math.min(0, ...points)
    const maxPnl = Math.max(0, ...points)
    const pnlRange = (maxPnl - minPnl) || 1

    // Zero baseline line
    const zeroY = plotY + plotH - ((0 - minPnl) / pnlRange) * plotH
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.2)
    doc.line(plotX, zeroY, plotX + plotW, zeroY)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.setTextColor(148, 163, 184)
    doc.text('INR 0.00', plotX - 1.5, zeroY + 1, { align: 'right' })
    doc.text(formatPdfINR(maxPnl), plotX - 1.5, plotY + 2, { align: 'right' })
    doc.text(formatPdfINR(minPnl), plotX - 1.5, plotY + plotH, { align: 'right' })

    // Draw the Equity Curve Polyline
    doc.setLineWidth(0.6)
    doc.setDrawColor(stats.netPnl >= 0 ? 22 : 220, stats.netPnl >= 0 ? 163 : 38, stats.netPnl >= 0 ? 74 : 38)

    const numPoints = points.length
    for (let i = 0; i < numPoints - 1; i++) {
      const x1 = plotX + (i / (numPoints - 1)) * plotW
      const y1 = plotY + plotH - ((points[i] - minPnl) / pnlRange) * plotH
      const x2 = plotX + ((i + 1) / (numPoints - 1)) * plotW
      const y2 = plotY + plotH - ((points[i + 1] - minPnl) / pnlRange) * plotH
      doc.line(x1, y1, x2, y2)
    }

    // Final point marker & label
    const lastX = plotX + plotW
    const lastY = plotY + plotH - ((points[numPoints - 1] - minPnl) / pnlRange) * plotH
    doc.setFillColor(stats.netPnl >= 0 ? 22 : 220, stats.netPnl >= 0 ? 163 : 38, stats.netPnl >= 0 ? 74 : 38)
    doc.circle(lastX, lastY, 1.2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(stats.netPnl >= 0 ? 22 : 220, stats.netPnl >= 0 ? 163 : 38, stats.netPnl >= 0 ? 74 : 38)
    doc.text(formatPdfINR(stats.netPnl, true), lastX, lastY - 2.5, { align: 'right' })

    cursorY += chartHeight + 3.5

    // CHART 2: WIN/LOSS DISTRIBUTION & PROFIT VOLUME BARS
    const distHeight = 24
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(margin, cursorY, contentWidth, distHeight, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(30, 41, 59)
    doc.text('WIN RATE & PROFIT VOLUME DISTRIBUTION', margin + 3.5, cursorY + 5)

    // Visual Proportion Bar
    const barX = margin + 4
    const barY = cursorY + 7.5
    const barW = contentWidth - 8
    const barH = 5
    const winRatio = stats.closedTradesCount > 0 ? stats.winCount / stats.closedTradesCount : 0.5
    const winW = barW * winRatio
    const lossW = barW - winW

    // Wins segment (Green)
    doc.setFillColor(22, 163, 74)
    doc.rect(barX, barY, winW, barH, 'F')
    // Losses segment (Red)
    doc.setFillColor(220, 38, 38)
    doc.rect(barX + winW, barY, lossW, barH, 'F')

    // Labels below bar
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(22, 163, 74)
    doc.text(`Winning Trades: ${stats.winCount} (${stats.winRate}%) • Gross Gains: ${formatPdfINR(stats.grossProfit)}`, barX, barY + barH + 4)

    doc.setTextColor(220, 38, 38)
    doc.text(`Losing Trades: ${stats.lossCount} (${stats.lossRate}%) • Gross Losses: ${formatPdfINR(stats.grossLoss)}`, barX + barW, barY + barH + 4, { align: 'right' })

    cursorY += distHeight + 4
  }

  // ── SECTION 3: INDEPENDENT STRATEGY BREAKDOWN TABLE (if includeStrategiesBreakdown)
  if (includeStrategiesBreakdown && strategyStats.length > 0) {
    if (cursorY > pageHeight - 50) {
      doc.addPage()
      drawPageHeader(doc.internal.getNumberOfPages())
      cursorY = 26
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(15, 23, 42)
    doc.text('3. Strategy Performance & Independent Win Rate Breakdown', margin, cursorY)
    cursorY += 3.5

    const stratHeaders = [
      'Strategy Name',
      'Trades',
      'Wins',
      'Losses',
      'Win Rate (%)',
      'Net P&L (INR)',
      'Avg Win',
      'Avg Loss',
      'Profit Factor',
    ]

    const stratRows = strategyStats.map((s) => {
      const isPositive = s.netPnl >= 0
      return [
        s.name,
        String(s.total),
        String(s.wins),
        String(s.losses),
        `${s.winRate}%`,
        {
          content: formatPdfINR(s.netPnl, true),
          styles: {
            textColor: isPositive ? [22, 163, 74] : [220, 38, 38],
            fontStyle: 'bold',
          },
        },
        formatPdfINR(s.avgWin),
        formatPdfINR(s.avgLoss ? -s.avgLoss : 0),
        `${s.profitFactor}x`,
      ]
    })

    autoTable(doc, {
      startY: cursorY,
      head: [stratHeaders],
      body: stratRows,
      theme: 'grid',
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      styles: {
        fontSize: 6.8,
        cellPadding: 1.8,
        lineColor: [226, 232, 240],
        textColor: [51, 65, 85],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: 'bold' },
        1: { cellWidth: 12, halign: 'center' },
        2: { cellWidth: 12, halign: 'center' },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 26, halign: 'right' },
        6: { cellWidth: 20, halign: 'right' },
        7: { cellWidth: 20, halign: 'right' },
        8: { cellWidth: 20, halign: 'center' },
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          drawPageHeader(data.pageNumber)
        }
      },
    })

    cursorY = (doc.lastAutoTable?.finalY || cursorY) + 5
  }

  // ── SECTION 4: ANALYTICAL NARRATIVE & RECOMMENDATIONS (if includeNarrative)
  if (includeNarrative) {
    if (cursorY > pageHeight - 50) {
      doc.addPage()
      drawPageHeader(doc.internal.getNumberOfPages())
      cursorY = 26
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(15, 23, 42)
    doc.text('4. Analytical Performance Narrative & Risk Audit', margin, cursorY)
    cursorY += 4

    const narrativePoints = [
      { title: 'Capital Efficiency & Profitability:', text: narrative.profitDesc },
      { title: 'Win Rate Consistency & Expectancy:', text: narrative.winRateDesc },
      { title: 'Edge Strength & Profit Factor:', text: narrative.profitFactorDesc },
      { title: 'Payoff Asymmetry & Drawdown Resilience:', text: `${narrative.payoffDesc} ${narrative.drawdownDesc}` },
    ]

    narrativePoints.forEach((pt) => {
      if (cursorY > pageHeight - 20) {
        doc.addPage()
        drawPageHeader(doc.internal.getNumberOfPages())
        cursorY = 26
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(30, 41, 59)
      doc.text(pt.title, margin, cursorY)
      cursorY += 3.2

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(71, 85, 105)
      const lines = doc.splitTextToSize(pt.text, contentWidth)
      doc.text(lines, margin, cursorY)
      cursorY += lines.length * 3.2 + 2
    })

    if (narrative.recommendations.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(37, 99, 235)
      doc.text('Actionable Takeaways:', margin, cursorY)
      cursorY += 3.2

      narrative.recommendations.forEach((rec, idx) => {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(51, 65, 85)
        const lines = doc.splitTextToSize(`• [${idx + 1}] ${rec}`, contentWidth - 4)
        doc.text(lines, margin + 2, cursorY)
        cursorY += lines.length * 3 + 1
      })
      cursorY += 3
    }
  }

  // ── SECTION 5: TRADE-BY-TRADE TABLE (if includeTable) ───────────────────
  if (includeTable && filtered.length > 0) {
    if (cursorY > pageHeight - 45) {
      doc.addPage()
      drawPageHeader(doc.internal.getNumberOfPages())
      cursorY = 26
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(15, 23, 42)
    doc.text(`5. Detailed Tradebook Table (${filtered.length} Trades)`, margin, cursorY)
    cursorY += 3.5

    const tableHeaders = [
      '#',
      'Date',
      'Symbol',
      'Strategy',
      'Type',
      'Qty',
      'Entry',
      'Exit',
      'P&L (INR)',
      'Return (%)',
      'Status',
    ]

    const tableRows = filtered.map((t, idx) => {
      const pnlNum = typeof t.pnl === 'number' ? t.pnl : parseFloat(t.pnl) || 0
      const isGain = pnlNum > 0
      const isLoss = pnlNum < 0
      const d = t.entryDate ? new Date(t.entryDate) : null
      const dateStr = d ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'

      return [
        String(idx + 1),
        dateStr,
        t.symbol || '—',
        t.strategy || '—',
        t.tradeType || 'Long',
        String(t.quantity || 1),
        t.entryPrice ? `INR ${parseFloat(t.entryPrice).toFixed(1)}` : '—',
        t.exitPrice ? `INR ${parseFloat(t.exitPrice).toFixed(1)}` : '—',
        {
          content: formatPdfINR(pnlNum, true),
          styles: {
            textColor: isGain ? [22, 163, 74] : isLoss ? [220, 38, 38] : [100, 116, 139],
            fontStyle: 'bold',
          },
        },
        {
          content: t.pnlPercent ? `${t.pnlPercent > 0 ? '+' : ''}${t.pnlPercent.toFixed(1)}%` : '—',
          styles: {
            textColor: isGain ? [22, 163, 74] : isLoss ? [220, 38, 38] : [100, 116, 139],
          },
        },
        t.status || 'CLOSED',
      ]
    })

    autoTable(doc, {
      startY: cursorY,
      head: [tableHeaders],
      body: tableRows,
      theme: 'grid',
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      styles: {
        fontSize: 6.5,
        cellPadding: 1.8,
        lineColor: [226, 232, 240],
        textColor: [51, 65, 85],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { cellWidth: 16 },
        2: { cellWidth: 18, fontStyle: 'bold' },
        3: { cellWidth: 32 },
        4: { cellWidth: 12, halign: 'center' },
        5: { cellWidth: 10, halign: 'right' },
        6: { cellWidth: 18, halign: 'right' },
        7: { cellWidth: 18, halign: 'right' },
        8: { cellWidth: 22, halign: 'right' },
        9: { cellWidth: 15, halign: 'right' },
        10: { cellWidth: 14, halign: 'center' },
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          drawPageHeader(data.pageNumber)
        }
      },
    })

    cursorY = (doc.lastAutoTable?.finalY || cursorY) + 6
  }

  // ── SECTION 6: DETAILED PER-TRADE JOURNAL CARDS (if includeJournalDetails)
  if (includeJournalDetails && filtered.length > 0) {
    doc.addPage()
    drawPageHeader(doc.internal.getNumberOfPages())
    cursorY = 26

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text(`6. Per-Trade Detailed Journal & Emotion Records (${filtered.length} Trades)`, margin, cursorY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text('Displays exact setup, chosen Before & After emotions, exit reasons, and discipline notes.', margin, cursorY + 4)
    cursorY += 8

    filtered.forEach((trade, idx) => {
      const bEmotion = extractBeforeEmotion(trade)
      const aEmotion = extractAfterEmotion(trade)
      const pnlNum = typeof trade.pnl === 'number' ? trade.pnl : parseFloat(trade.pnl) || 0
      const isProfitable = pnlNum >= 0

      // Measure required height
      const cardHeight = trade.imageUrl && includeChartImages ? 62 : 36

      if (cursorY + cardHeight > pageHeight - 15) {
        doc.addPage()
        drawPageHeader(doc.internal.getNumberOfPages())
        cursorY = 26
      }

      // Card Background
      doc.setFillColor(250, 250, 252)
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(margin, cursorY, contentWidth, cardHeight, 1.8, 1.8, 'FD')

      // Card Header
      doc.setFillColor(isProfitable ? 240 : 254, isProfitable ? 253 : 242, isProfitable ? 244 : 242)
      doc.roundedRect(margin, cursorY, contentWidth, 7, 1.8, 1.8, 'F')
      doc.setDrawColor(226, 232, 240)
      doc.line(margin, cursorY + 7, margin + contentWidth, cursorY + 7)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(15, 23, 42)
      doc.text(`#${idx + 1}  ${trade.symbol || 'STOCK'}  (${trade.tradeType || 'Long'})  •  Strategy: ${trade.strategy || 'No Strategy Set'}`, margin + 3, cursorY + 5)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(isProfitable ? 22 : 220, isProfitable ? 163 : 38, isProfitable ? 74 : 38)
      const pnlLabel = `${formatPdfINR(pnlNum, true)} (${trade.pnlPercent > 0 ? '+' : ''}${trade.pnlPercent || 0}%)`
      doc.text(pnlLabel, margin + contentWidth - 3, cursorY + 5, { align: 'right' })

      // Content inside card
      let lineY = cursorY + 11.5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.8)
      doc.setTextColor(71, 85, 105)

      // Row 1: Execution Details
      const entryText = `Entry: INR ${trade.entryPrice || '—'}  |  Exit: INR ${trade.exitPrice || '—'}  |  Qty: ${trade.quantity || 1}  |  SL: INR ${trade.stopLoss || '—'}  |  Target: INR ${trade.takeProfit || '—'}  |  R:R: ${trade.riskReward || '—'}`
      doc.text(entryText, margin + 3, lineY)
      lineY += 4.5

      // Row 2: Chosen Emotions (What user chose!)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(37, 99, 235)
      doc.text('Before Emotion: ', margin + 3, lineY)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 41, 59)
      doc.text(bEmotion ? bEmotion : 'None recorded', margin + 26, lineY)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(147, 51, 234)
      doc.text('After Emotion: ', margin + 85, lineY)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 41, 59)
      doc.text(aEmotion ? aEmotion : 'None recorded', margin + 107, lineY)
      lineY += 4.5

      // Row 3: Exit Reason
      if (trade.exitReason?.trim()) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(217, 119, 6)
        doc.text('Exit Reason: ', margin + 3, lineY)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(71, 85, 105)
        const reasonLine = doc.splitTextToSize(trade.exitReason.trim(), contentWidth - 25)
        doc.text(reasonLine[0] || '—', margin + 22, lineY)
        lineY += 4.5
      }

      // Row 4: Mistakes / Discipline
      const mistakeNote = trade.mistakes?.trim() || trade.lessonLearned?.trim()
      if (mistakeNote) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(225, 29, 72)
        doc.text('Mistake/Rule: ', margin + 3, lineY)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(71, 85, 105)
        const mistLine = doc.splitTextToSize(mistakeNote, contentWidth - 25)
        doc.text(mistLine[0] || '—', margin + 22, lineY)
        lineY += 4.5
      }

      // Embedded Chart Screenshot Image (if available)
      if (trade.imageUrl && includeChartImages) {
        try {
          if (trade.imageUrl.startsWith('data:image')) {
            doc.addImage(trade.imageUrl, 'JPEG', margin + 3, lineY, 48, 24)
            doc.setFont('helvetica', 'italic')
            doc.setFontSize(6)
            doc.setTextColor(100, 116, 139)
            doc.text('[Attached Trade Chart Screenshot]', margin + 54, lineY + 12)
          }
        } catch (e) {
          // Ignore invalid image payload safely
        }
      }

      cursorY += cardHeight + 3.5
    })
  }

  // Stamp Footers and Page Numbers across all generated pages
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    drawPageFooter(i, totalPages)
  }

  // Generate clean filename
  const cleanUserName = (user?.name || 'Trader').replace(/[^a-zA-Z0-9]/g, '_')
  const dateStamp = new Date().toISOString().split('T')[0]
  const fileName = `Trade_History_Report_${cleanUserName}_${dateStamp}.pdf`

  // Trigger browser download
  doc.save(fileName)

  return {
    success: true,
    fileName,
    totalPages,
    stats,
  }
}

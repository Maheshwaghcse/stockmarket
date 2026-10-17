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
    largestWinTrade,
    largestLossTrade,
  } = stats

  const isNetProfitable = netPnl > 0
  const isLoss = netPnl < 0

  // 1. Overall Profitability Analysis
  let profitDesc = ''
  if (isNetProfitable) {
    profitDesc = `During this audit window, the trading account generated a net positive realized return of ${formatPdfINR(netPnl, true)} across ${closedTradesCount} completed trades. The gross profit generated (${formatPdfINR(stats.grossProfit)}) successfully offset the gross realized losses (${formatPdfINR(stats.grossLoss)}), confirming a positive capital growth trajectory under the current risk model.`
  } else if (isLoss) {
    profitDesc = `The account recorded a net realized loss of ${formatPdfINR(netPnl, true)} across ${closedTradesCount} completed trades. Gross losses of ${formatPdfINR(stats.grossLoss)} exceeded gross profits of ${formatPdfINR(stats.grossProfit)}, indicating that downside slippage, negative payoff asymmetry, or adverse market regimes placed pressure on total equity.`
  } else {
    profitDesc = `The account produced a neutral breakeven performance with Net P&L of ${formatPdfINR(netPnl)} over ${closedTradesCount} completed trades, preserving baseline principal balance.`
  }

  // 2. Win Rate vs. Mathematical Expectancy
  let winRateDesc = ''
  if (winRate >= 60) {
    winRateDesc = `Win Rate stands at a robust ${winRate}% (${winCount} wins out of ${closedTradesCount} closed trades). A win rate in this tier indicates high setup selection consistency, strong trend alignment, and disciplined entry timing.`
  } else if (winRate >= 45) {
    winRateDesc = `Win Rate is balanced at ${winRate}% (${winCount} wins / ${lossCount} losses). In modern equity trading, a 45-55% win rate is sustainable provided the payoff ratio (average winner / average loser) is maintained strictly above 1.5 : 1.`
  } else {
    winRateDesc = `Win Rate registered at ${winRate}% (${winCount} wins / ${lossCount} losses). When operating with a sub-45% win rate, long-term survival and profitability rely entirely on asymmetric rewards where winning positions are substantially larger than small, tightly controlled losses.`
  }

  // 3. Profit Factor Evaluation
  let profitFactorDesc = ''
  if (profitFactor >= 2.0) {
    profitFactorDesc = `Profit Factor is ${profitFactor}, which ranks in the top institutional quartile (>2.0). Every 1 Rupee risked generated Rs. ${profitFactor} in returns, demonstrating robust risk buffering and superior setup expectancy.`
  } else if (profitFactor >= 1.5) {
    profitFactorDesc = `Profit Factor is healthy at ${profitFactor}. A profit factor between 1.5 and 2.0 confirms a statistically valid trading edge with sufficient leeway to absorb intermittent market chop and execution fees.`
  } else if (profitFactor >= 1.0) {
    profitFactorDesc = `Profit Factor is ${profitFactor}, reflecting marginal profitability. While net positive, a profit factor between 1.0 and 1.5 is susceptible to fee erosion and slippage during volatile trading periods.`
  } else {
    profitFactorDesc = `Profit Factor is ${profitFactor} (<1.0), indicating that the system's gross losses currently outweigh gross gains. Immediate review of stop-loss adherence and trade filtering is recommended.`
  }

  // 4. Payoff Ratio & Loss Containment
  let payoffDesc = ''
  if (payoffRatio >= 1.5) {
    payoffDesc = `Average winning trade is ${formatPdfINR(avgWinner)}, compared to an average losing trade of ${formatPdfINR(avgLoser)} (Payoff Ratio: ${payoffRatio} : 1). This positive asymmetry confirms that losing positions are being systematically liquidated before they inflict structural damage on portfolio equity.`
  } else if (payoffRatio >= 1.0) {
    payoffDesc = `Average winning trade is ${formatPdfINR(avgWinner)}, closely mirroring average losses of ${formatPdfINR(avgLoser)} (Payoff Ratio: ${payoffRatio} : 1). Maintaining parity requires a consistently high win rate (>50%) to stay positive.`
  } else {
    payoffDesc = `Average loss (${formatPdfINR(avgLoser)}) is larger than average win (${formatPdfINR(avgWinner)}), creating a negative payoff ratio of ${payoffRatio} : 1. This imbalance creates an elevated hazard where a handful of large losses can undo weeks of consistent gains.`
  }

  // 5. Drawdown & Streak Dynamics
  const drawdownDesc = `The maximum peak-to-trough equity drawdown reached ${formatPdfINR(maxDrawdown)}. The longest consecutive winning streak was ${maxWinStreak} trades, while the longest losing streak was contained to ${maxLossStreak} trades. Managing consecutive losses within defined risk limits prevents emotional revenge trading.`

  // 6. Actionable Takeaways
  const recommendations = []
  if (payoffRatio < 1.3) {
    recommendations.push('Enforce stricter hard stop-losses to reduce the average loss size relative to average wins.')
  }
  if (maxLossStreak >= 4) {
    recommendations.push(`Implement a cooldown rule after 2-3 consecutive losses to avoid tilt and revenge trading.`)
  }
  if (winRate > 55 && payoffRatio < 1.2) {
    recommendations.push('Let high-conviction winning trades run with trailing stops to capture multi-R profit expansions.')
  }
  if (stats.openTradesCount > 0) {
    recommendations.push(`Monitor the ${stats.openTradesCount} active open positions closely with defined invalidation levels.`)
  }
  if (recommendations.length < 3) {
    recommendations.push('Continue tracking pre-trade setups, entry reasons, and exit mistakes in the journal to refine your personal edge.')
    recommendations.push('Review sector concentration and position sizing so that no individual trade risks more than 1-2% of total capital.')
  }

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
 * Main export function: Generates and triggers download of the PDF Report.
 */
export async function generateTradingJournalPdf({
  trades = [],
  user = null,
  fromDate = '',
  toDate = '',
  outcomeFilter = 'all', // 'all', 'profit', 'loss', 'closed', 'open'
  selectedSymbol = '',
  includeSummary = true,
  includeTable = true,
  includeNotes = true,
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
  const narrative = generatePdfNarrative(stats, { fromDate, toDate, outcomeFilter, selectedSymbol })

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
    // Top primary accent bar
    doc.setFillColor(15, 23, 42) // slate-900
    doc.rect(0, 0, pageWidth, 22, 'F')

    // Subtle blue line below
    doc.setFillColor(37, 99, 235) // blue-600
    doc.rect(0, 22, pageWidth, 1.2, 'F')

    // Branding Title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(255, 255, 255)
    doc.text('STOCKSENSE INDIA', margin, 11)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text('Trading Journal & Performance Audit Desk', margin, 17)

    // Right-aligned report label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(96, 165, 250) // blue-400
    doc.text('EXECUTIVE PERFORMANCE AUDIT', pageWidth - margin, 11, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(203, 213, 225)
    const genDate = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    })
    doc.text(`Generated: ${genDate} IST`, pageWidth - margin, 17, { align: 'right' })
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
      'StockSense India · Strictly Confidential Trading Audit Record · Generated for Trader Internal Review',
      margin,
      footerY
    )
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' })
  }

  // Draw first page header
  drawPageHeader(1)

  let cursorY = 28

  // ── Metadata & Audit Scope Block ──────────────────────────────────────
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(margin, cursorY, contentWidth, 23, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(15, 23, 42)
  doc.text('TRADER PROFILE & AUDIT SCOPE', margin + 4, cursorY + 5.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(71, 85, 105)

  const traderName = user?.name || 'Verified Trader'
  const traderEmail = user?.email || 'N/A'
  doc.text(`Trader: ${traderName} (${traderEmail})`, margin + 4, cursorY + 11)

  const dateSpanText =
    fromDate && toDate
      ? `${fromDate} to ${toDate}`
      : fromDate
      ? `From ${fromDate} to Present`
      : toDate
      ? `Up to ${toDate}`
      : 'Complete All-Time Tradebook'
  doc.text(`Audit Date Window: ${dateSpanText}`, margin + 4, cursorY + 16.5)

  const outcomeText =
    outcomeFilter === 'profit'
      ? 'Profitable Trades Only (Winners)'
      : outcomeFilter === 'loss'
      ? 'Loss Trades Only (Losers)'
      : outcomeFilter === 'closed'
      ? 'Closed Positions Only'
      : outcomeFilter === 'open'
      ? 'Open Positions Only'
      : 'All Trades (Winners + Losers + Open)'

  doc.text(`Filter Mode: ${outcomeText}`, margin + contentWidth / 2, cursorY + 11)
  doc.text(
    `Symbol Scope: ${selectedSymbol && selectedSymbol !== 'ALL' ? selectedSymbol : 'All Symbols'} · Total Sample: ${filtered.length} trades`,
    margin + contentWidth / 2,
    cursorY + 16.5
  )

  cursorY += 27

  // ── SECTION 1: Executive KPI Metrics Grid ─────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text('1. Executive Performance Metrics', margin, cursorY)

  cursorY += 3

  const kpiRows = [
    [
      { content: 'Net Realized P&L', styles: { fontStyle: 'bold' } },
      {
        content: formatPdfINR(stats.netPnl, true),
        styles: {
          fontStyle: 'bold',
          textColor: stats.netPnl >= 0 ? [22, 163, 74] : [220, 38, 38],
        },
      },
      { content: 'Profit Factor', styles: { fontStyle: 'bold' } },
      {
        content: `${stats.profitFactor}x`,
        styles: {
          fontStyle: 'bold',
          textColor: stats.profitFactor >= 1.5 ? [22, 163, 74] : [15, 23, 42],
        },
      },
    ],
    [
      { content: 'Total Trades Audited', styles: { fontStyle: 'bold' } },
      { content: `${stats.totalTrades} (${stats.closedTradesCount} Closed / ${stats.openTradesCount} Open)` },
      { content: 'Payoff Ratio (Win/Loss)', styles: { fontStyle: 'bold' } },
      { content: `${stats.payoffRatio} : 1.0` },
    ],
    [
      { content: 'Win Rate %', styles: { fontStyle: 'bold' } },
      {
        content: `${stats.winRate}% (${stats.winCount} Wins / ${stats.lossCount} Losses)`,
        styles: {
          fontStyle: 'bold',
          textColor: stats.winRate >= 50 ? [22, 163, 74] : [220, 38, 38],
        },
      },
      { content: 'Average Winning Trade', styles: { fontStyle: 'bold' } },
      { content: formatPdfINR(stats.avgWinner, true), styles: { textColor: [22, 163, 74] } },
    ],
    [
      { content: 'Gross Realized Profit', styles: { fontStyle: 'bold' } },
      { content: formatPdfINR(stats.grossProfit), styles: { textColor: [22, 163, 74] } },
      { content: 'Average Losing Trade', styles: { fontStyle: 'bold' } },
      { content: formatPdfINR(stats.avgLoser ? -stats.avgLoser : 0), styles: { textColor: [220, 38, 38] } },
    ],
    [
      { content: 'Gross Realized Loss', styles: { fontStyle: 'bold' } },
      { content: formatPdfINR(stats.grossLoss ? -stats.grossLoss : 0), styles: { textColor: [220, 38, 38] } },
      { content: 'Peak-to-Trough Drawdown', styles: { fontStyle: 'bold' } },
      { content: formatPdfINR(stats.maxDrawdown ? -stats.maxDrawdown : 0), styles: { textColor: [220, 38, 38] } },
    ],
    [
      { content: 'Longest Winning Streak', styles: { fontStyle: 'bold' } },
      { content: `${stats.maxWinStreak} consecutive wins` },
      { content: 'Longest Losing Streak', styles: { fontStyle: 'bold' } },
      { content: `${stats.maxLossStreak} consecutive losses` },
    ],
    [
      { content: 'Largest Single Win', styles: { fontStyle: 'bold' } },
      {
        content: stats.largestWinTrade
          ? `${formatPdfINR(stats.largestWinTrade.pnl, true)} (${stats.largestWinTrade.symbol})`
          : '—',
        styles: { textColor: [22, 163, 74] },
      },
      { content: 'Largest Single Loss', styles: { fontStyle: 'bold' } },
      {
        content: stats.largestLossTrade
          ? `${formatPdfINR(stats.largestLossTrade.pnl, true)} (${stats.largestLossTrade.symbol})`
          : '—',
        styles: { textColor: [220, 38, 38] },
      },
    ],
  ]

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    body: kpiRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 46, fillColor: [248, 250, 252] },
      1: { cellWidth: 45 },
      2: { cellWidth: 46, fillColor: [248, 250, 252] },
      3: { cellWidth: 45 },
    },
  })

  cursorY = doc.lastAutoTable.finalY + 7

  // ── SECTION 2: Professional Analytical Summary (Describe Each Point) ──
  if (includeSummary) {
    // Check if enough room exists on page 1; otherwise create a new page
    if (cursorY > pageHeight - 75) {
      doc.addPage()
      drawPageHeader(doc.internal.getNumberOfPages())
      cursorY = 28
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text('2. Professional Analytical Summary (Point-by-Point Breakdown)', margin, cursorY)
    cursorY += 4

    const narrativePoints = [
      {
        title: 'Point A: Overall Realized Profitability & Capital Efficiency',
        text: narrative.profitDesc,
      },
      {
        title: 'Point B: Win Rate Consistency & Probability Distribution',
        text: narrative.winRateDesc,
      },
      {
        title: 'Point C: Profit Factor & Trading Edge Strength',
        text: narrative.profitFactorDesc,
      },
      {
        title: 'Point D: Risk Asymmetry & Payoff Ratio (Win Size vs. Loss Size)',
        text: narrative.payoffDesc,
      },
      {
        title: 'Point E: Drawdown Resilience & Psychological Streak Dynamics',
        text: narrative.drawdownDesc,
      },
    ]

    narrativePoints.forEach((pt) => {
      // Check for space
      if (cursorY > pageHeight - 25) {
        doc.addPage()
        drawPageHeader(doc.internal.getNumberOfPages())
        cursorY = 28
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(30, 41, 59)
      doc.text(pt.title, margin, cursorY)
      cursorY += 3.5

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(71, 85, 105)
      const lines = doc.splitTextToSize(pt.text, contentWidth)
      doc.text(lines, margin, cursorY)
      cursorY += lines.length * 3.5 + 2.5
    })

    // Actionable Recommendations
    if (cursorY > pageHeight - 35) {
      doc.addPage()
      drawPageHeader(doc.internal.getNumberOfPages())
      cursorY = 28
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(37, 99, 235) // blue-600
    doc.text('Key Strategic Recommendations & Takeaways:', margin, cursorY)
    cursorY += 3.5

    narrative.recommendations.forEach((rec, idx) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(51, 65, 85)
      const bulletText = `• [${idx + 1}] ${rec}`
      const recLines = doc.splitTextToSize(bulletText, contentWidth - 4)
      doc.text(recLines, margin + 2, cursorY)
      cursorY += recLines.length * 3.4 + 1
    })

    cursorY += 4
  }

  // ── SECTION 3: Trade-by-Trade Complete Audit Table ─────────────────────
  if (includeTable && filtered.length > 0) {
    if (cursorY > pageHeight - 40) {
      doc.addPage()
      drawPageHeader(doc.internal.getNumberOfPages())
      cursorY = 28
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text(`3. Detailed Trade Audit Log (${filtered.length} Records)`, margin, cursorY)
    cursorY += 4

    const tableHeaders = [
      '#',
      'Date (IST)',
      'Symbol',
      'Side',
      'Qty',
      'Entry Price',
      'Exit Price',
      'P&L (INR)',
      'Return (%)',
      'Status',
    ]

    if (includeNotes) {
      tableHeaders.push('Strategy / Lesson Learned')
    }

    const tableRows = filtered.map((t, idx) => {
      const pnlNum = typeof t.pnl === 'number' ? t.pnl : parseFloat(t.pnl) || 0
      const isGain = pnlNum > 0
      const isLoss = pnlNum < 0
      const d = t.entryDate ? new Date(t.entryDate) : null
      const dateStr = d
        ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
        : '—'

      const row = [
        String(idx + 1),
        dateStr,
        t.symbol || '—',
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

      if (includeNotes) {
        const note = t.lessonLearned || t.entryReason || t.exitReason || '—'
        row.push(note)
      }

      return row
    })

    // Totals row at the bottom
    const totalRow = [
      {
        content: 'TOTAL REALIZED AUDIT P&L',
        colSpan: 7,
        styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] },
      },
      {
        content: formatPdfINR(stats.netPnl, true),
        styles: {
          fontStyle: 'bold',
          fillColor: [241, 245, 249],
          textColor: stats.netPnl >= 0 ? [22, 163, 74] : [220, 38, 38],
        },
      },
      {
        content: `Win: ${stats.winRate}%`,
        colSpan: includeNotes ? 2 : 1,
        styles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
      },
    ]

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin, bottom: 15 },
      head: [tableHeaders],
      body: [...tableRows, totalRow],
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42], // slate-900
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 2,
      },
      styles: {
        fontSize: 6.8,
        cellPadding: 1.8,
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
        textColor: [51, 65, 85],
        overflow: 'linebreak',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 16 },
        2: { cellWidth: 18, fontStyle: 'bold' },
        3: { cellWidth: 12 },
        4: { cellWidth: 10, halign: 'right' },
        5: { cellWidth: 17, halign: 'right' },
        6: { cellWidth: 17, halign: 'right' },
        7: { cellWidth: 22, halign: 'right' },
        8: { cellWidth: 14, halign: 'right' },
        9: { cellWidth: 14, halign: 'center' },
        ...(includeNotes ? { 10: { cellWidth: 'auto' } } : {}),
      },
      didDrawPage: (data) => {
        // Redraw header for newly added pages (page 2+)
        if (data.pageNumber > 1) {
          drawPageHeader(data.pageNumber)
        }
      },
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
  const fileName = `StockSense_Trading_Journal_${cleanUserName}_${dateStamp}.pdf`

  // Trigger browser download
  doc.save(fileName)

  return {
    success: true,
    fileName,
    totalPages,
    stats,
  }
}

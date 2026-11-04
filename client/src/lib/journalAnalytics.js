/**
 * Trading Journal Analytics & Visualization Utilities
 * Formats Indian Currency (INR), computes streaks, extremes, equity curve, and distributions.
 */

export function formatINR(val, options = {}) {
  const { compact = false, showSign = false } = options
  if (val === null || val === undefined || isNaN(val)) return '—'

  const num = typeof val === 'number' ? val : parseFloat(val)
  const isNeg = num < 0
  const abs = Math.abs(num)
  const sign = isNeg ? '-' : showSign && num > 0 ? '+' : ''

  if (compact) {
    if (abs >= 10000000) {
      return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`
    }
    if (abs >= 100000) {
      return `${sign}₹${(abs / 100000).toFixed(2)} L`
    }
    if (abs >= 1000) {
      return `${sign}₹${(abs / 1000).toFixed(1)}k`
    }
    return `${sign}₹${abs.toFixed(0)}`
  }

  return `${sign}₹${abs.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export function computeJournalAnalytics(trades = []) {
  if (!Array.isArray(trades) || trades.length === 0) {
    return {
      closedTradesCount: 0,
      winCount: 0,
      lossCount: 0,
      winRate: 0,
      lossRate: 0,
      totalWinPnl: 0,
      totalLossPnl: 0,
      netPnl: 0,
      avgWinner: 0,
      avgLoser: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      highestProfitTrade: null,
      lowestProfitTrade: null,
      longestWinStreak: 0,
      longestWinStreakPnl: 0,
      longestLossStreak: 0,
      longestLossStreakPnl: 0,
      currentStreak: { type: 'NONE', count: 0, pnl: 0 },
      streakHistory: [],
      equityCurve: [],
      symbolList: [],
      typeStats: {
        Long: { count: 0, wins: 0, losses: 0, pnl: 0, winRate: 0 },
        Short: { count: 0, wins: 0, losses: 0, pnl: 0, winRate: 0 },
      },
    }
  }

  // Filter closed trades and sort chronologically (oldest to newest)
  const closedTrades = trades
    .filter((t) => t && t.status === 'CLOSED')
    .sort((a, b) => new Date(a.entryDate || a.createdAt || 0) - new Date(b.entryDate || b.createdAt || 0))

  let totalWinPnl = 0
  let totalLossPnl = 0
  let winCount = 0
  let lossCount = 0

  let highestProfitTrade = null
  let lowestProfitTrade = null

  let longestWinStreak = 0
  let longestWinStreakPnl = 0
  let longestLossStreak = 0
  let longestLossStreakPnl = 0

  let runningWinStreak = 0
  let runningWinStreakPnl = 0
  let runningLossStreak = 0
  let runningLossStreakPnl = 0

  const streakHistory = []
  let activeStreakBlock = null

  let cumulativePnl = 0
  let peakPnl = 0
  let maxDrawdown = 0
  const equityCurve = []

  const symbolStats = {}
  const typeStats = {
    Long: { count: 0, wins: 0, losses: 0, pnl: 0, winPnl: 0, lossPnl: 0 },
    Short: { count: 0, wins: 0, losses: 0, pnl: 0, winPnl: 0, lossPnl: 0 },
  }

  closedTrades.forEach((trade, index) => {
    const pnl = typeof trade.pnl === 'number' ? trade.pnl : parseFloat(trade.pnl) || 0
    const isWin = pnl > 0
    const isLoss = pnl < 0

    const tradeSummary = {
      id: trade._id || trade.id || `trade-${index}`,
      symbol: trade.symbol || 'UNKNOWN',
      tradeType: trade.tradeType || 'Long',
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      quantity: trade.quantity,
      entryDate: trade.entryDate,
      exitDate: trade.exitDate,
      pnl: +pnl.toFixed(2),
      pnlPercent: typeof trade.pnlPercent === 'number' ? +trade.pnlPercent.toFixed(2) : 0,
      tags: trade.tags || [],
    }

    if (highestProfitTrade === null || pnl > highestProfitTrade.pnl) {
      highestProfitTrade = tradeSummary
    }

    if (lowestProfitTrade === null || pnl < lowestProfitTrade.pnl) {
      lowestProfitTrade = tradeSummary
    }

    if (isWin) {
      winCount++
      totalWinPnl += pnl

      runningWinStreak++
      runningWinStreakPnl += pnl

      if (runningWinStreak > longestWinStreak) {
        longestWinStreak = runningWinStreak
        longestWinStreakPnl = runningWinStreakPnl
      }

      runningLossStreak = 0
      runningLossStreakPnl = 0

      if (!activeStreakBlock || activeStreakBlock.type !== 'WIN') {
        if (activeStreakBlock) streakHistory.push(activeStreakBlock)
        activeStreakBlock = {
          type: 'WIN',
          count: 1,
          pnl,
          startDate: trade.entryDate,
          endDate: trade.entryDate,
          trades: [tradeSummary],
        }
      } else {
        activeStreakBlock.count++
        activeStreakBlock.pnl += pnl
        activeStreakBlock.endDate = trade.entryDate
        activeStreakBlock.trades.push(tradeSummary)
      }
    } else if (isLoss) {
      lossCount++
      totalLossPnl += pnl

      runningLossStreak++
      runningLossStreakPnl += pnl

      if (runningLossStreak > longestLossStreak) {
        longestLossStreak = runningLossStreak
        longestLossStreakPnl = runningLossStreakPnl
      }

      runningWinStreak = 0
      runningWinStreakPnl = 0

      if (!activeStreakBlock || activeStreakBlock.type !== 'LOSS') {
        if (activeStreakBlock) streakHistory.push(activeStreakBlock)
        activeStreakBlock = {
          type: 'LOSS',
          count: 1,
          pnl,
          startDate: trade.entryDate,
          endDate: trade.entryDate,
          trades: [tradeSummary],
        }
      } else {
        activeStreakBlock.count++
        activeStreakBlock.pnl += pnl
        activeStreakBlock.endDate = trade.entryDate
        activeStreakBlock.trades.push(tradeSummary)
      }
    }

    cumulativePnl += pnl
    if (cumulativePnl > peakPnl) {
      peakPnl = cumulativePnl
    }
    const currentDrawdown = peakPnl - cumulativePnl
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown
    }

    equityCurve.push({
      index: index + 1,
      date: trade.entryDate,
      symbol: trade.symbol,
      tradeType: trade.tradeType,
      pnl: +pnl.toFixed(2),
      cumulativePnl: +cumulativePnl.toFixed(2),
      peakPnl: +peakPnl.toFixed(2),
      drawdown: +currentDrawdown.toFixed(2),
    })

    const sym = trade.symbol || 'UNKNOWN'
    if (!symbolStats[sym]) {
      symbolStats[sym] = { symbol: sym, trades: 0, wins: 0, losses: 0, totalPnl: 0, winPnl: 0, lossPnl: 0 }
    }
    symbolStats[sym].trades++
    symbolStats[sym].totalPnl += pnl
    if (isWin) {
      symbolStats[sym].wins++
      symbolStats[sym].winPnl += pnl
    } else if (isLoss) {
      symbolStats[sym].losses++
      symbolStats[sym].lossPnl += pnl
    }

    const tType = trade.tradeType === 'Short' ? 'Short' : 'Long'
    typeStats[tType].count++
    typeStats[tType].pnl += pnl
    if (isWin) {
      typeStats[tType].wins++
      typeStats[tType].winPnl += pnl
    } else if (isLoss) {
      typeStats[tType].losses++
      typeStats[tType].lossPnl += pnl
    }
  })

  if (activeStreakBlock) {
    streakHistory.push(activeStreakBlock)
  }

  const currentStreak = activeStreakBlock
    ? {
        type: activeStreakBlock.type,
        count: activeStreakBlock.count,
        pnl: +activeStreakBlock.pnl.toFixed(2),
      }
    : { type: 'NONE', count: 0, pnl: 0 }

  const totalClosed = winCount + lossCount
  const winRate = totalClosed > 0 ? +((winCount / totalClosed) * 100).toFixed(1) : 0
  const lossRate = totalClosed > 0 ? +((lossCount / totalClosed) * 100).toFixed(1) : 0
  const avgWinner = winCount > 0 ? +(totalWinPnl / winCount).toFixed(2) : 0
  const avgLoser = lossCount > 0 ? +(totalLossPnl / lossCount).toFixed(2) : 0
  const profitFactor =
    Math.abs(totalLossPnl) > 0
      ? +(totalWinPnl / Math.abs(totalLossPnl)).toFixed(2)
      : totalWinPnl > 0
      ? 999
      : 0

  const symbolList = Object.values(symbolStats)
    .map((s) => ({
      ...s,
      totalPnl: +s.totalPnl.toFixed(2),
      winRate: s.trades > 0 ? +((s.wins / s.trades) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.totalPnl - a.totalPnl)

  ;['Long', 'Short'].forEach((k) => {
    typeStats[k].pnl = +typeStats[k].pnl.toFixed(2)
    typeStats[k].winRate = typeStats[k].count > 0 ? +((typeStats[k].wins / typeStats[k].count) * 100).toFixed(1) : 0
  })

  return {
    closedTradesCount: totalClosed,
    winCount,
    lossCount,
    winRate,
    lossRate,
    totalWinPnl: +totalWinPnl.toFixed(2),
    totalLossPnl: +totalLossPnl.toFixed(2),
    netPnl: +(totalWinPnl + totalLossPnl).toFixed(2),
    avgWinner,
    avgLoser,
    profitFactor,
    maxDrawdown: +maxDrawdown.toFixed(2),
    highestProfitTrade,
    lowestProfitTrade,
    longestWinStreak,
    longestWinStreakPnl: +longestWinStreakPnl.toFixed(2),
    longestLossStreak,
    longestLossStreakPnl: +longestLossStreakPnl.toFixed(2),
    currentStreak,
    streakHistory,
    equityCurve,
    symbolList,
    typeStats,
  }
}

/**
 * Compute P&L for a single trade
 */
export function calculateTradePnl(trade) {
  if (!trade) return 0

  if (typeof trade.pnl === 'number' && !isNaN(trade.pnl)) {
    return trade.pnl
  }
  if (trade.pnl !== undefined && trade.pnl !== null && trade.pnl !== '') {
    const parsed = parseFloat(trade.pnl)
    if (!isNaN(parsed)) return parsed
  }

  const entry = parseFloat(trade.entryPrice)
  const exit = parseFloat(trade.exitPrice)
  const qty = parseInt(trade.lotSize || trade.quantity, 10)

  if (!isNaN(entry) && !isNaN(exit) && entry > 0 && !isNaN(qty) && qty > 0) {
    const isLong = (trade.tradeType || 'Long').toLowerCase() === 'long'
    return isLong ? (exit - entry) * qty : (entry - exit) * qty
  }

  return 0
}

/**
 * Check if a trade is completed (has an exit price or explicit pnl)
 */
export function isTradeCompleted(trade) {
  if (!trade) return false
  if (trade.status && trade.status.toLowerCase() === 'open') return false
  if (trade.exitPrice !== undefined && trade.exitPrice !== null && trade.exitPrice !== '') return true
  if (trade.pnl !== undefined && trade.pnl !== null && trade.pnl !== '') return true
  return false
}

/**
 * Calculate consecutive winning and losing streaks chronologically
 */
export function calculateConsecutiveStreaks(trades) {
  if (!Array.isArray(trades) || trades.length === 0) {
    return {
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      currentStreakType: 'none',
      currentStreakCount: 0,
    }
  }

  const sorted = [...trades].sort((a, b) => {
    const dateA = new Date(a.entryDate || a.createdAt || 0).getTime()
    const dateB = new Date(b.entryDate || b.createdAt || 0).getTime()
    return dateA - dateB
  })

  let maxWins = 0
  let maxLosses = 0
  let currentWins = 0
  let currentLosses = 0

  for (const t of sorted) {
    const pnl = calculateTradePnl(t)
    if (pnl > 0) {
      currentWins += 1
      currentLosses = 0
      if (currentWins > maxWins) maxWins = currentWins
    } else if (pnl < 0) {
      currentLosses += 1
      currentWins = 0
      if (currentLosses > maxLosses) maxLosses = currentLosses
    }
  }

  let currentStreakType = 'none'
  let currentStreakCount = 0
  if (currentWins > 0) {
    currentStreakType = 'win'
    currentStreakCount = currentWins
  } else if (currentLosses > 0) {
    currentStreakType = 'loss'
    currentStreakCount = currentLosses
  }

  return {
    maxConsecutiveWins: maxWins,
    maxConsecutiveLosses: maxLosses,
    currentStreakType,
    currentStreakCount,
  }
}

/**
 * Calculate independent strategy performance metrics
 * STRICTLY uses only the trades provided in the array.
 */
export function calculateStrategyMetrics(trades) {
  if (!Array.isArray(trades) || trades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      openTrades: 0,
      winRate: 0,
      lossRate: 0,
      totalPnl: 0,
      totalProfit: 0,
      totalLoss: 0,
      averageProfit: 0,
      averageLoss: 0,
      averagePnlPerTrade: 0,
      riskRewardRatio: '0.00',
      riskRewardNumeric: 0,
      profitFactor: '0.00',
      largestWin: 0,
      largestLoss: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      currentStreakType: 'none',
      currentStreakCount: 0,
    }
  }

  const totalTrades = trades.length
  let winningTrades = 0
  let losingTrades = 0
  let breakevenTrades = 0
  let openTrades = 0

  let totalWinAmount = 0
  let totalLossAmount = 0
  let netPnl = 0

  let largestWin = 0
  let largestLoss = 0

  const completedTrades = []

  for (const t of trades) {
    const completed = isTradeCompleted(t)
    if (!completed) {
      openTrades += 1
      continue
    }

    completedTrades.push(t)
    const pnl = calculateTradePnl(t)
    netPnl += pnl

    if (pnl > 0) {
      winningTrades += 1
      totalWinAmount += pnl
      if (pnl > largestWin) largestWin = pnl
    } else if (pnl < 0) {
      losingTrades += 1
      totalLossAmount += Math.abs(pnl)
      if (pnl < largestLoss) largestLoss = pnl
    } else {
      breakevenTrades += 1
    }
  }

  const finishedCount = completedTrades.length
  const winRate = finishedCount > 0 ? (winningTrades / finishedCount) * 100 : 0
  const lossRate = finishedCount > 0 ? (losingTrades / finishedCount) * 100 : 0

  const averageProfit = winningTrades > 0 ? totalWinAmount / winningTrades : 0
  const averageLoss = losingTrades > 0 ? totalLossAmount / losingTrades : 0
  const averagePnlPerTrade = finishedCount > 0 ? netPnl / finishedCount : 0

  let rrNumeric = 0
  let riskRewardRatio = '0.00'
  if (averageLoss > 0) {
    rrNumeric = averageProfit / averageLoss
    riskRewardRatio = `1 : ${rrNumeric.toFixed(2)}`
  } else if (averageProfit > 0) {
    riskRewardRatio = '1 : ∞'
    rrNumeric = 999
  }

  let profitFactor = '0.00'
  if (totalLossAmount > 0) {
    profitFactor = (totalWinAmount / totalLossAmount).toFixed(2)
  } else if (totalWinAmount > 0) {
    profitFactor = '∞'
  }

  const streakData = calculateConsecutiveStreaks(completedTrades)

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    openTrades,
    winRate: Number(winRate.toFixed(2)),
    lossRate: Number(lossRate.toFixed(2)),
    totalPnl: netPnl,
    totalProfit: totalWinAmount,
    totalLoss: totalLossAmount,
    averageProfit: Math.round(averageProfit * 100) / 100,
    averageLoss: Math.round(averageLoss * 100) / 100,
    averagePnlPerTrade: Math.round(averagePnlPerTrade * 100) / 100,
    riskRewardRatio,
    riskRewardNumeric: rrNumeric,
    profitFactor,
    largestWin,
    largestLoss,
    maxConsecutiveWins: streakData.maxConsecutiveWins,
    maxConsecutiveLosses: streakData.maxConsecutiveLosses,
    currentStreakType: streakData.currentStreakType,
    currentStreakCount: streakData.currentStreakCount,
  }
}

/**
 * Calculate Date-wise breakdown for a strategy
 */
export function calculateDateWisePerformance(trades, options = {}) {
  const { startDate, endDate } = options
  const startTs = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null
  const endTs = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null

  const filtered = trades.filter((t) => {
    if (!startTs && !endTs) return true
    const d = new Date(t.entryDate || t.createdAt || 0).getTime()
    if (startTs && d < startTs) return false
    if (endTs && d > endTs) return false
    return true
  })

  const dayMap = {}

  for (const t of filtered) {
    const rawDate = t.entryDate || t.createdAt
    const dateKey = rawDate ? new Date(rawDate).toISOString().slice(0, 10) : 'Unknown Date'

    if (!dayMap[dateKey]) {
      dayMap[dateKey] = {
        date: dateKey,
        displayDate: dateKey !== 'Unknown Date'
          ? new Date(dateKey).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
          : 'Unknown Date',
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakevenTrades: 0,
        totalPnl: 0,
        trades: [],
      }
    }

    const pnl = calculateTradePnl(t)
    dayMap[dateKey].totalTrades += 1
    dayMap[dateKey].totalPnl += pnl
    dayMap[dateKey].trades.push(t)

    if (pnl > 0) dayMap[dateKey].winningTrades += 1
    else if (pnl < 0) dayMap[dateKey].losingTrades += 1
    else dayMap[dateKey].breakevenTrades += 1
  }

  const result = Object.values(dayMap)
    .map((item) => {
      const completed = item.winningTrades + item.losingTrades + item.breakevenTrades
      const winRate = completed > 0 ? (item.winningTrades / completed) * 100 : 0
      const lossRate = completed > 0 ? (item.losingTrades / completed) * 100 : 0
      return {
        ...item,
        winRate: Number(winRate.toFixed(1)),
        lossRate: Number(lossRate.toFixed(1)),
      }
    })
    .sort((a, b) => (b.date > a.date ? 1 : -1))

  return result
}

/**
 * Calculate Monthly Strategy Performance
 */
export function calculateMonthlyPerformance(trades, options = {}) {
  const { year } = options
  const monthMap = {}

  for (const t of trades) {
    const rawDate = t.entryDate || t.createdAt
    if (!rawDate) continue

    const d = new Date(rawDate)
    const tYear = d.getFullYear()
    if (year && tYear !== parseInt(year, 10)) continue

    const monthKey = `${tYear}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const monthLabel = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })

    if (!monthMap[monthKey]) {
      monthMap[monthKey] = {
        monthKey,
        monthLabel,
        year: tYear,
        monthNumber: d.getMonth() + 1,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakevenTrades: 0,
        totalPnl: 0,
        grossProfit: 0,
        grossLoss: 0,
        trades: [],
      }
    }

    const pnl = calculateTradePnl(t)
    monthMap[monthKey].totalTrades += 1
    monthMap[monthKey].totalPnl += pnl
    monthMap[monthKey].trades.push(t)

    if (pnl > 0) {
      monthMap[monthKey].winningTrades += 1
      monthMap[monthKey].grossProfit += pnl
    } else if (pnl < 0) {
      monthMap[monthKey].losingTrades += 1
      monthMap[monthKey].grossLoss += Math.abs(pnl)
    } else {
      monthMap[monthKey].breakevenTrades += 1
    }
  }

  const result = Object.values(monthMap)
    .map((m) => {
      const completed = m.winningTrades + m.losingTrades + m.breakevenTrades
      const winRate = completed > 0 ? (m.winningTrades / completed) * 100 : 0
      const lossRate = completed > 0 ? (m.losingTrades / completed) * 100 : 0
      const avgPnl = completed > 0 ? m.totalPnl / completed : 0
      return {
        ...m,
        winRate: Number(winRate.toFixed(1)),
        lossRate: Number(lossRate.toFixed(1)),
        averagePnl: Math.round(avgPnl * 100) / 100,
      }
    })
    .sort((a, b) => (b.monthKey > a.monthKey ? 1 : -1))

  return result
}

export interface PricingResult {
  durationHours: number
  baseRatePerHour: number
  baseTotal: number
  isPeak: boolean
  peakSurcharge: number // e.g. 0.20
  discountPercent: number // e.g. 0.20 for member
  courtPrice: number
  racketFee: number
  ballFee: number
  totalPrice: number
}

export function calculatePricing(
  startTimeStr: string,
  endTimeStr: string,
  userTier: string,
  addons: { racketCount: number, ballCount: number } = { racketCount: 0, ballCount: 0 }
): PricingResult {
  const start = new Date(startTimeStr)
  const end = new Date(endTimeStr)

  // 1. Calculate duration in hours
  const diffMs = end.getTime() - start.getTime()
  const durationHours = Math.max(0, diffMs / (1000 * 60 * 60))

  // 2. Base rate is $50/hour
  const baseRatePerHour = 50.00
  const baseTotal = durationHours * baseRatePerHour

  // 3. Peak surcharge (20% for weekends or times starting >= 17:00)
  const startHour = start.getHours()
  const startDay = start.getDay() // 0 is Sunday, 6 is Saturday
  const isWeekend = startDay === 0 || startDay === 6
  const isEvening = startHour >= 17 // 5:00 PM or later
  const isPeak = isWeekend || isEvening

  const peakSurcharge = isPeak ? 0.20 : 0.00
  const priceBeforeDiscount = baseTotal * (1 + peakSurcharge)

  // 4. Member discount (20% for tier === 'member')
  const discountPercent = userTier === 'member' ? 0.20 : 0.00
  const courtPrice = priceBeforeDiscount * (1 - discountPercent)

  // 5. Addon rentals (racket: $5 each, ball pack: $3 each)
  const racketFee = addons.racketCount * 5.00
  const ballFee = addons.ballCount * 3.00

  // 6. Total Price
  const totalPrice = courtPrice + racketFee + ballFee

  return {
    durationHours,
    baseRatePerHour,
    baseTotal: Math.round(baseTotal * 100) / 100,
    isPeak,
    peakSurcharge,
    discountPercent,
    courtPrice: Math.round(courtPrice * 100) / 100,
    racketFee: Math.round(racketFee * 100) / 100,
    ballFee: Math.round(ballFee * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100
  }
}

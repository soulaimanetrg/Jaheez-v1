import { logger } from '../../config/logger';
import { isMissingColumnError } from '../../utils/schemaCompatibility';
import { CommissionRepository } from './commission.repository';
import type { CommissionSettings, DeliveredOrderForCommission, ResolvedCommissionRate, ShiftSummary } from './commission.types';

const SETTING_KEYS = [
  'driver_delivery_commission_percent',
  'driver_tip_commission_percent',
  'driver_min_delivery_earning_centimes',
  'driver_commission_hold_until_shift_end',
  'driver_cod_payout_requires_settlement',
  'driver_high_tip_review_threshold_centimes',
];

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}

function madToCentimes(value: number): number {
  return Math.max(0, Math.round(Number(value || 0) * 100));
}

export class CommissionService {
  private repo = new CommissionRepository();

  async getSettings(): Promise<CommissionSettings> {
    const settings = await this.repo.getSettings(SETTING_KEYS);
    return {
      driverDeliveryCommissionPercent: parseNumber(settings.driver_delivery_commission_percent, 70),
      driverTipCommissionPercent: parseNumber(settings.driver_tip_commission_percent, 100),
      driverMinDeliveryEarningCentimes: Math.max(0, Math.round(parseNumber(settings.driver_min_delivery_earning_centimes, 800))),
      driverCommissionHoldUntilShiftEnd: parseBoolean(settings.driver_commission_hold_until_shift_end, true),
      driverCodPayoutRequiresSettlement: parseBoolean(settings.driver_cod_payout_requires_settlement, true),
      driverHighTipReviewThresholdCentimes: Math.max(0, Math.round(parseNumber(settings.driver_high_tip_review_threshold_centimes, 5000))),
    };
  }

  async resolveRate(driverId: string, at = new Date().toISOString()): Promise<ResolvedCommissionRate> {
    const override = await this.repo.getDriverOverride(driverId, at);
    if (override) {
      return { deliveryPercent: Number(override.delivery_percent), tipPercent: Number(override.tip_percent),
        source: 'driver_override', rateVersionId: null, overrideId: override.id };
    }
    const version = await this.repo.getGlobalRate(at);
    if (version) {
      return { deliveryPercent: Number(version.delivery_percent), tipPercent: Number(version.tip_percent),
        source: 'global', rateVersionId: version.id, overrideId: null };
    }
    const settings = await this.getSettings();
    return { deliveryPercent: settings.driverDeliveryCommissionPercent, tipPercent: settings.driverTipCommissionPercent,
      source: 'global', rateVersionId: null, overrideId: null };
  }

  listRates() { return this.repo.listRates(); }
  listOverrides(driverId?: string) { return this.repo.listOverrides(driverId); }
  createRate(input: { delivery_percent: number; tip_percent: number; effective_from?: string; effective_to?: string | null; reason: string }, adminId: string | null) {
    return this.repo.createRate({ ...input, effective_from: input.effective_from || new Date().toISOString(), created_by: adminId });
  }
  createOverride(input: { driver_id: string; delivery_percent: number; tip_percent: number; effective_from?: string; effective_to?: string | null; reason: string }, adminId: string | null) {
    return this.repo.createOverride({ ...input, effective_from: input.effective_from || new Date().toISOString(), created_by: adminId });
  }

  async recordDeliveredOrder(order: DeliveredOrderForCommission): Promise<void> {
    if (!order.driver_id) return;

    try {
      await this.repo.finalizeDeliveredOrder(order.id);
      return;
      /* Legacy JS calculation retained below only for historical source review.
      const settings = await this.getSettings();
      const rate = await this.resolveRate(order.driver_id);
      const shift = await this.repo.getActiveShift(order.driver_id);
      const deliveryFeeCentimes = madToCentimes(order.delivery_fee);
      const tipCentimes = madToCentimes(order.rider_tip);
      const totalCentimes = madToCentimes(order.total_amount);
      const isCodOrder = order.payment_method === 'cash';
      const deliveryEarning = Math.round(deliveryFeeCentimes * (rate.deliveryPercent / 100));
      const tipEarning = Math.round(tipCentimes * (rate.tipPercent / 100));
      const highTipHold = settings.driverHighTipReviewThresholdCentimes > 0 && tipCentimes >= settings.driverHighTipReviewThresholdCentimes;
      const status = highTipHold ? 'held' : 'pending_shift_end';
      const holdReason = highTipHold ? 'high_tip_review' : null;

      await this.repo.insertLedger({
        driver_id: order.driver_id,
        order_id: order.id,
        shift_id: shift?.id || null,
        source_type: 'delivery_commission',
        delivery_fee_centimes: deliveryFeeCentimes,
        tip_centimes: tipCentimes,
        delivery_commission_percent: rate.deliveryPercent,
        tip_commission_percent: rate.tipPercent,
        minimum_applied_centimes: 0,
        amount_centimes: deliveryEarning,
        status,
        hold_reason: holdReason,
        is_cod_order: isCodOrder,
        cod_amount_centimes: isCodOrder ? totalCentimes : 0,
        metadata: { formula: 'delivery_fee * delivery_commission_percent', financial_effect_of_delay: false },
        rate_source: rate.source, rate_version_id: rate.rateVersionId, override_id: rate.overrideId,
        calculation_version: 'commission_v2',
      });

      if (tipEarning > 0) {
        await this.repo.insertLedger({
          driver_id: order.driver_id,
          order_id: order.id,
          shift_id: shift?.id || null,
          source_type: 'tip_commission',
          delivery_fee_centimes: deliveryFeeCentimes,
          tip_centimes: tipCentimes,
          delivery_commission_percent: rate.deliveryPercent,
          tip_commission_percent: rate.tipPercent,
          minimum_applied_centimes: 0,
          amount_centimes: tipEarning,
          status,
          hold_reason: holdReason,
          is_cod_order: isCodOrder,
          cod_amount_centimes: isCodOrder ? totalCentimes : 0,
          metadata: { formula: 'tip * tip_commission_percent', financial_effect_of_delay: false },
          rate_source: rate.source, rate_version_id: rate.rateVersionId, override_id: rate.overrideId,
          calculation_version: 'commission_v2',
        });
      }
      */
    } catch (error: unknown) {
      logger.error('[commission] Financial finalization failed closed.', { order_id: order.id, error });
      throw error;
    }
  }

  async closeShift(driverId: string, shiftId: string, codBalanceCentimes: number): Promise<ShiftSummary> {
    const settings = await this.getSettings();
    const rows = await this.repo.getShiftLedgerRows(shiftId);
    const orderIds = new Set(rows.map((row) => row.order_id).filter((id): id is string => !!id));
    const grossDeliveryFeeCentimes = rows
      .filter((row) => row.source_type === 'delivery_commission')
      .reduce((sum, row) => sum + Number(row.delivery_fee_centimes || 0), 0);
    const grossTipCentimes = rows
      .filter((row) => row.source_type === 'tip_commission')
      .reduce((sum, row) => sum + Number(row.tip_centimes || 0), 0);
    const deliveryEarnings = rows
      .filter((row) => row.source_type === 'delivery_commission')
      .reduce((sum, row) => sum + Number(row.amount_centimes || 0), 0);
    const tipEarnings = rows
      .filter((row) => row.source_type === 'tip_commission')
      .reduce((sum, row) => sum + Number(row.amount_centimes || 0), 0);
    const totalEarnings = deliveryEarnings + tipEarnings;
    const codCollectedCentimes = rows
      .filter((row) => row.is_cod_order)
      .reduce((sum, row) => Math.max(sum, Number(row.cod_amount_centimes || 0)), 0);
    const alreadyHeld = rows.some((row) => row.status === 'held');
    const codBlocksPayout = settings.driverCodPayoutRequiresSettlement && codBalanceCentimes > 0;
    const payoutStatus = alreadyHeld || codBlocksPayout ? 'held' : 'pending_review';
    const holdReason = codBlocksPayout ? 'cod_due' : alreadyHeld ? 'fraud_review' : null;
    const payableCentimes = payoutStatus === 'pending_review' ? totalEarnings : 0;
    const heldCentimes = payoutStatus === 'held' ? totalEarnings : 0;

    await this.repo.updateLedgerStatusForShift(shiftId, payoutStatus === 'pending_review' ? 'payable' : 'held', holdReason);
    if (payoutStatus === 'held' && holdReason) {
      try {
        await this.repo.createPayoutHold({
          driverId,
          shiftId,
          reason: holdReason,
          metadata: { cod_balance_centimes: codBalanceCentimes },
        });
      } catch (error: unknown) {
        logger.warn('[commission] Failed to create payout hold record.', { shift_id: shiftId, error });
      }
    }

    const summary: ShiftSummary = {
      shift_id: shiftId,
      driver_id: driverId,
      orders_count: orderIds.size,
      gross_delivery_fee_centimes: grossDeliveryFeeCentimes,
      gross_tip_centimes: grossTipCentimes,
      driver_delivery_earnings_centimes: deliveryEarnings,
      driver_tip_earnings_centimes: tipEarnings,
      total_earnings_centimes: totalEarnings,
      payable_centimes: payableCentimes,
      held_centimes: heldCentimes,
      cod_collected_centimes: codCollectedCentimes,
      cod_due_at_close_centimes: codBalanceCentimes,
      payout_status: payoutStatus,
      hold_reason: holdReason,
    };

    await this.repo.updateShiftSummary(shiftId, {
      orders_count: summary.orders_count,
      gross_delivery_fee_centimes: summary.gross_delivery_fee_centimes,
      gross_tip_centimes: summary.gross_tip_centimes,
      driver_delivery_earnings_centimes: summary.driver_delivery_earnings_centimes,
      driver_tip_earnings_centimes: summary.driver_tip_earnings_centimes,
      total_earnings_centimes: summary.total_earnings_centimes,
      payable_centimes: summary.payable_centimes,
      held_centimes: summary.held_centimes,
      cod_collected_centimes: summary.cod_collected_centimes,
      cod_due_at_close_centimes: summary.cod_due_at_close_centimes,
      payout_status: summary.payout_status,
      hold_reason: summary.hold_reason,
    });

    return summary;
  }
}

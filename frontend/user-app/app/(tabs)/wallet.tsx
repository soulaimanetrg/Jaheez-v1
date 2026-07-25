import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '@/components/ui/AppIcon';
import { MotiView } from 'moti';
import {
  BRAND, FONTS, GRADIENTS, RADIUS, SPACE,
  SHADOW, SHADOW_LG, SHADOW_RED, SIZE,
} from '../../constants/brand';
import { useLangStore } from '../../store/languageStore';
import { useWallet, useWalletTransactions } from '../../hooks/queries/useWallet';
import { walletTxDirection } from '../../lib/walletApi';
import type { WalletTransaction } from '../../lib/walletApi';
import { EmptyState } from '../../components/ui/EmptyState';

const { width } = Dimensions.get('window');

type TxFilter = 'all' | 'credit' | 'debit';

// ─── Transaction row component ───
function TxRow({ tx, isRTL }: { tx: WalletTransaction; isRTL: boolean }) {
  const direction = walletTxDirection(tx);
  const isCredit = direction === 'credit';
  const amount = tx.amount_dh.toFixed(2);
  const date = new Date(tx.created_at);
  const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  const iconName = isCredit ? 'arrow-down-circle' : 'arrow-up-circle';
  const iconColor = isCredit ? BRAND.GREEN : BRAND.RED;
  const amountColor = isCredit ? BRAND.GREEN : BRAND.RED;
  const sign = isCredit ? '+' : '-';

  return (
    <View style={[styles.txRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={[styles.txIcon, { backgroundColor: isCredit ? '#ECFDF5' : BRAND.RED_LIGHT }]}>
        <AppIcon name={iconName} size={20} color={iconColor} />
      </View>
      <View style={[styles.txDetails, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.txLabel, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
          {tx.label}
        </Text>
        {tx.sublabel ? (
          <Text style={[styles.txSublabel, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {tx.sublabel}
          </Text>
        ) : null}
        <Text style={styles.txDate}>{dateStr}  {timeStr}</Text>
      </View>
      <Text style={[styles.txAmount, { color: amountColor }]}>
        {sign}{amount} DH
      </Text>
    </View>
  );
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLangStore();
  const [filter, setFilter] = useState<TxFilter>('all');

  const {
    data: wallet,
    isLoading: walletLoading,
    isError: walletError,
    refetch: refetchWallet,
    isFetching: walletFetching,
  } = useWallet();

  const txType = filter === 'all' ? undefined : filter;
  const {
    data: transactions = [],
    isLoading: txLoading,
    refetch: refetchTx,
    isFetching: txFetching,
  } = useWalletTransactions(txType);

  const isRefreshing = (!walletLoading && walletFetching) || (!txLoading && txFetching);
  const onRefresh = () => {
    refetchWallet();
    refetchTx();
  };

  const balance = wallet?.balance_dh ?? 0;
  const balanceFormatted = balance.toFixed(2);

  const filters: { key: TxFilter; label: string }[] = [
    { key: 'all',    label: isRTL ? 'الكل'    : 'Tout' },
    { key: 'credit', label: isRTL ? 'إيداع'   : 'Crédit' },
    { key: 'debit',  label: isRTL ? 'سحب'     : 'Débit' },
  ];

  const rowStyle = isRTL ? 'row-reverse' as const : 'row' as const;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[BRAND.RED]}
            tintColor={BRAND.RED}
          />
        }
      >
        {/* ─── HERO GRADIENT HEADER ─── */}
        <LinearGradient
          colors={[...GRADIENTS.CRIMSON_HERO]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 16 }]}
        >
          {/* Decorative blobs */}
          <View style={[styles.blob, { width: 200, height: 200, top: -60, right: -40, backgroundColor: 'rgba(255,255,255,0.06)' }]} />
          <View style={[styles.blob, { width: 120, height: 120, bottom: 20, left: -30, backgroundColor: 'rgba(0,0,0,0.08)' }]} />

          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing' as any, duration: 400 }}
          >
            <Text style={styles.heroTitle}>
              {isRTL ? 'المحفظة' : 'Portefeuille'}
            </Text>
          </MotiView>

          {/* ─── BALANCE CARD (Glass) ─── */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing' as any, duration: 500, delay: 100 }}
          >
            <View style={styles.balanceCard}>
              <View style={styles.balanceGlow} />
              <Text style={styles.balanceLabel}>
                {isRTL ? 'الرصيد المتاح' : 'Solde disponible'}
              </Text>

              {walletLoading ? (
                <ActivityIndicator color={BRAND.RED} size="large" style={{ marginVertical: 12 }} />
              ) : walletError ? (
                <Text style={styles.balanceError}>
                  {isRTL ? 'تعذر تحميل الرصيد' : 'Erreur de chargement'}
                </Text>
              ) : (
                <View style={[styles.balanceRow, { flexDirection: rowStyle }]}>
                  <Text style={styles.balanceCurrency}>DH</Text>
                  <Text style={styles.balanceAmount}>{balanceFormatted}</Text>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [styles.addBtn, pressed && { transform: [{ scale: 0.96 }] }]}
                accessibilityLabel={isRTL ? 'إضافة رصيد' : 'Ajouter des fonds'}
              >
                <LinearGradient
                  colors={['#F03030', '#C42020']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addBtnGrad}
                >
                  <AppIcon name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.addBtnText}>
                    {isRTL ? 'إضافة رصيد' : 'Ajouter'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </MotiView>
        </LinearGradient>

        {/* ─── FILTER CHIPS ─── */}
        <View style={styles.filterSection}>
          <View style={[styles.filterRow, { flexDirection: rowStyle }]}>
            {filters.map(f => (
              <Pressable
                key={f.key}
                style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                onPress={() => setFilter(f.key)}
                accessibilityLabel={f.label}
              >
                <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ─── TRANSACTIONS (Thermal Receipt Style) ─── */}
        <View style={styles.receiptSection}>
          <View style={styles.receiptHeader}>
            <View style={styles.receiptDash} />
            <Text style={styles.receiptTitle}>
              {isRTL ? 'سجل المعاملات' : 'Historique'}
            </Text>
            <View style={styles.receiptDash} />
          </View>

          <View style={styles.receiptCard}>
            {/* Decorative top perforation */}
            <View style={styles.perforation}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View key={i} style={styles.perfDot} />
              ))}
            </View>

            {txLoading ? (
              <View style={styles.txLoading}>
                <ActivityIndicator color={BRAND.RED} size="small" />
                <Text style={styles.txLoadingText}>
                  {isRTL ? 'جارٍ التحميل...' : 'Chargement...'}
                </Text>
              </View>
            ) : transactions.length === 0 ? (
              <EmptyState
                icon={<AppIcon name="wallet-outline" size={80} color={BRAND.TEXT3} />}
                title={isRTL ? 'لا توجد معاملات' : 'Aucune transaction'}
                subtitle={isRTL ? 'ستظهر معاملاتك هنا' : 'Vos transactions apparaîtront ici'}
              />
            ) : (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'timing' as any, duration: 350 }}
              >
                {transactions.map((tx, i) => (
                  <React.Fragment key={tx.id}>
                    <TxRow tx={tx} isRTL={isRTL} />
                    {i < transactions.length - 1 && <View style={styles.txDivider} />}
                  </React.Fragment>
                ))}
              </MotiView>
            )}

            {/* Decorative bottom perforation */}
            <View style={styles.perforation}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View key={i} style={styles.perfDot} />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.BG },
  blob: { position: 'absolute', borderRadius: 999 },

  // ── Hero
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  heroTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 28,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.5,
  },

  // ── Balance Card (Glass)
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.XL,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  balanceGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(245,206,46,0.15)',
  },
  balanceLabel: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: 'rgba(255,255,255,0.70)',
    marginBottom: 8,
  },
  balanceRow: {
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 20,
  },
  balanceAmount: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 42,
    color: '#fff',
    letterSpacing: -1,
  },
  balanceCurrency: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 16,
    color: BRAND.YELLOW,
  },
  balanceError: {
    fontFamily: FONTS.BODY,
    fontSize: 14,
    color: 'rgba(255,255,255,0.60)',
    marginVertical: 12,
  },

  // ── Add Button
  addBtn: {
    borderRadius: RADIUS.PILL,
    overflow: 'hidden',
    ...SHADOW_RED,
  },
  addBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.PILL,
  },
  addBtnText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 14,
    color: '#fff',
  },

  // ── Filter Section
  filterSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  filterRow: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: RADIUS.PILL,
    backgroundColor: BRAND.LIGHT,
    borderWidth: 1,
    borderColor: BRAND.BORDER,
  },
  filterChipActive: {
    backgroundColor: BRAND.RED,
    borderColor: BRAND.RED,
  },
  filterText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 13,
    color: BRAND.TEXT2,
  },
  filterTextActive: {
    color: '#fff',
  },

  // ── Receipt Section
  receiptSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  receiptDash: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: BRAND.BORDER,
  },
  receiptTitle: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 16,
    color: BRAND.TEXT,
  },

  // ── Receipt Card (Thermal style)
  receiptCard: {
    backgroundColor: BRAND.SURFACE,
    borderRadius: RADIUS.CARD,
    borderWidth: 1,
    borderColor: BRAND.BORDER,
    overflow: 'hidden',
    ...SHADOW,
  },
  perforation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  perfDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND.BG,
  },

  // ── Transaction Rows
  txRow: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txDetails: {
    flex: 1,
  },
  txLabel: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 14,
    color: BRAND.TEXT,
    marginBottom: 2,
  },
  txSublabel: {
    fontFamily: FONTS.BODY,
    fontSize: 12,
    color: BRAND.TEXT3,
    marginBottom: 2,
  },
  txDate: {
    fontFamily: FONTS.BODY,
    fontSize: 11,
    color: BRAND.TEXT3,
  },
  txAmount: {
    fontFamily: FONTS.DISPLAY,
    fontSize: 15,
    letterSpacing: -0.3,
  },
  txDivider: {
    height: 1,
    backgroundColor: BRAND.BORDER2,
    marginHorizontal: 16,
  },

  // ── Loading state
  txLoading: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  txLoadingText: {
    fontFamily: FONTS.BODY,
    fontSize: 13,
    color: BRAND.TEXT3,
  },
});

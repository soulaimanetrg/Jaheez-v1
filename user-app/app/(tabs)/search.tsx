import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image,
  TextInput, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND, FONTS, SHADOW, SHADOW_SM, SHADOW_LG } from '../../constants/brand';
import { fetchSafiPlaces, PlaceResult } from '../../lib/placesApi';
import { getAllStores, searchStores } from '../../lib/storeApi';
import { TText } from '../../components/ui/TText';

const { width } = Dimensions.get('window');
const CARD_W = (width - 52) / 2;

// ─── Category filters ─────────────────────────────────────────────
const CATS = [
  { key: 'all',      label: 'الكل',    emoji: '🍽️', color: BRAND.RED   },
  { key: 'food',     label: 'مطاعم',   emoji: '🍔', color: '#F97316'   },
  { key: 'grocery',  label: 'بقالة',   emoji: '🛒', color: BRAND.GREEN  },
  { key: 'pharmacy', label: 'صيدلية',  emoji: '💊', color: BRAND.BLUE   },
  { key: 'bakery',   label: 'حلويات',  emoji: '🧁', color: '#EC4899'   },
  { key: 'cafe',     label: 'مقاهي',   emoji: '☕', color: '#92400E'   },
];

// ─── Filter real API places ───────────────────────────────────────
function filterRealPlaces(places: PlaceResult[], lq: string, cat: string): PlaceResult[] {
  return places.filter(p => {
    const catOk = cat === 'all' ||
      (cat === 'food'     && ['restaurant', 'fast_food'].includes(p.category)) ||
      (cat === 'grocery'  && ['supermarket', 'grocery'].includes(p.category)) ||
      (cat === 'pharmacy' && p.category === 'pharmacy') ||
      (cat === 'bakery'   && p.category === 'bakery') ||
      (cat === 'cafe'     && p.category === 'cafe') ||
      p.category === cat;
    if (!catOk) return false;
    if (!lq) return true;
    return p.name.toLowerCase().includes(lq) || p.name_ar.toLowerCase().includes(lq) ||
      p.cuisine_tags.some(t => t.toLowerCase().includes(lq));
  });
}

// ─── Main component ───────────────────────────────────────────────
export default function SearchScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const params  = useLocalSearchParams<{ q?: string; category?: string }>();

  const [query,      setQuery]      = useState(params.q || '');
  const [cat,        setCat]        = useState(params.category || 'all');
  const [showFilters,setShowFilters]= useState(false);
  const [sort,       setSort]       = useState('rating');
  const [focused,    setFocused]    = useState(false);
  const [recents,    setRecents]    = useState<string[]>([]);
  const [realPlaces, setRealPlaces] = useState<PlaceResult[]>([]);
  const [dbStores,   setDbStores]   = useState<any[]>([]);
  const [dbResults,  setDbResults]  = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const inputRef = useRef<TextInput>(null);

  // Fetch real places from Overpass API on mount
  useEffect(() => {
    fetchSafiPlaces()
      .then(p => setRealPlaces(p))
      .catch(() => {})
      .finally(() => setLoading(false));
    // Load Supabase stores for default view
    getAllStores().then(r => { if (r.data) setDbStores(r.data.data); });
  }, []);

  const hasQ = query.trim().length > 0;
  const lq   = query.trim().toLowerCase();

  // Search Supabase when query changes
  useEffect(() => {
    if (!hasQ) { setDbResults([]); return; }
    const t = setTimeout(async () => {
      const r = await searchStores(query);
      if (r.data) setDbResults(r.data);
    }, 300);
    return () => clearTimeout(t);
  }, [query, hasQ]);

  // Search results
  const searchedRealPlaces = hasQ ? filterRealPlaces(realPlaces, lq, cat).sort((a, b) => {
    if (sort === 'time') return a.delivery_time_min - b.delivery_time_min;
    if (sort === 'fee') return a.delivery_fee - b.delivery_fee;
    return b.rating_avg - a.rating_avg;
  }) : [];
  
  const sortedDbResults = [...dbResults].sort((a, b) => {
    if (sort === 'time') return a.delivery_time_min - b.delivery_time_min;
    if (sort === 'fee') return a.delivery_fee - b.delivery_fee;
    return b.rating_avg - a.rating_avg;
  });

  const commit = useCallback((t: string) => {
    if (!t.trim()) return;
    setRecents(p => [t, ...p.filter(x => x !== t)].slice(0, 5));
  }, []);
  const apply = (t: string) => { setQuery(t); commit(t); inputRef.current?.blur(); };

  // ─── Store pill (horizontal scroll) ─────────────────────────
  function StorePill({ store }: { store: any }) {
    const imgUrl = ('logo_url' in store && store.logo_url) ||
                   ('cover_url' in store && store.cover_url) ||
                   'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&h=120&fit=crop';
    return (
      <Pressable
        style={s.storePill}
        onPress={() => router.push(`/(flows)/store/${store.id}` as any)}
        accessibilityLabel={store.name_ar}
      >
        <Image source={{ uri: imgUrl }} style={s.storePillImg} />
        <View style={s.storePillInfo}>
          <TText ar={store.name_ar} style={s.storePillName} numberOfLines={1} />
          <View style={s.storePillMeta}>
            <Ionicons name="star" size={11} color={BRAND.YELLOW} />
            <Text style={s.storePillRating}>{store.rating_avg?.toFixed(1) ?? '4.5'}</Text>
            <Text style={s.storePillDot}>·</Text>
            <Text style={s.storePillTime}>{store.delivery_time_min}–{store.delivery_time_max}د</Text>
          </View>
          <Text style={s.storePillFee} numberOfLines={1}>
            {store.delivery_fee === 0 ? '🚴 مجاني' : `🚴 ${store.delivery_fee} د.م.`}
          </Text>
        </View>
      </Pressable>
    );
  }

  // ─── Store full-width row (search results) ───────────────────
  function StoreRow({ store, onPress }: { store: any; onPress: () => void }) {
    const img = store.cover_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop';
    return (
      <Pressable style={s.storeRow} onPress={onPress} accessibilityLabel={store.name_ar}>
        <Image source={{ uri: img }} style={s.storeRowImg} />
        <View style={s.storeRowBody}>
          <View style={s.storeRowTop}>
            <View style={s.storeRowRating}>
              <Ionicons name="star" size={11} color={BRAND.YELLOW} />
              <Text style={s.storeRowRatingTxt}>{store.rating_avg ? store.rating_avg.toFixed(1) : '4.5'}</Text>
            </View>
            <TText ar={store.name_ar} style={s.storeRowName} />
          </View>
          <Text style={s.storeRowTags}>{(store.cuisine_tags || []).join(' • ')}</Text>
          <View style={s.storeRowMeta}>
            <View style={s.storeRowMetaItem}>
              <Ionicons name="bicycle-outline" size={12} color={store.delivery_fee === 0 ? BRAND.GREEN : BRAND.TEXT3} />
              <Text style={[s.storeRowMetaTxt, store.delivery_fee === 0 && { color: BRAND.GREEN }]}>
                {store.delivery_fee === 0 ? 'مجاني' : `${store.delivery_fee} د.م.`}
              </Text>
            </View>
            <View style={s.storeRowMetaItem}>
              <Ionicons name="time-outline" size={12} color={BRAND.TEXT3} />
              <Text style={s.storeRowMetaTxt}>{store.delivery_time_min}–{store.delivery_time_max} د</Text>
            </View>
            {store._source === 'real' && (
              <View style={s.realBadge}>
                <Text style={s.realBadgeTxt}>📍 آسفي الحقيقية</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  }

  const totalStoreResults = searchedRealPlaces.length + dbResults.length;

  // ─── Render ──────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* ══ HERO ══ */}
      <LinearGradient
        colors={['#F03030', '#C42020', '#8B0000']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[s.hero, { paddingTop: insets.top + 12 }]}
      >
        <View style={s.heroBlob1} />
        <View style={s.heroBlob2} />

        <View style={s.heroTitleRow}>
          <View style={s.heroTitleBadge}>
            <Ionicons name="search" size={14} color={BRAND.YELLOW} />
            <Text style={s.heroTitleBadgeTxt}>اكتشف</Text>
          </View>
          <Text style={s.heroTitle}>ابحث في جاهز</Text>
        </View>

        {/* Search bar */}
        <View style={[s.searchBar, focused && s.searchBarFocused]}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : null}>
            <Ionicons name="arrow-back" size={19} color={focused ? BRAND.RED : BRAND.TEXT3} style={{ marginLeft: 4 }} />
          </Pressable>
          <Ionicons name="search-outline" size={18} color={BRAND.TEXT3} style={{ marginHorizontal: 8 }} />
          <TextInput
            ref={inputRef}
            style={s.searchInput}
            placeholder="ابحث عن مطعم، منتج، صيدلية..."
            placeholderTextColor={BRAND.TEXT3}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={() => commit(query)}
            returnKeyType="search"
            textAlign="right"
          />
          {hasQ && (
            <Pressable onPress={() => setQuery('')} style={s.clearBtn} accessibilityLabel="مسح">
              <Ionicons name="close-circle" size={17} color={BRAND.TEXT3} />
            </Pressable>
          )}
          <View style={s.searchDivider} />
          <Pressable 
            onPress={() => setShowFilters(p => !p)} 
            style={[s.filterBtn, showFilters && s.filterBtnActive]}
            accessibilityLabel="فلترة"
          >
            <Ionicons name="options-outline" size={20} color={showFilters ? '#FFF' : BRAND.TEXT} />
            <Text style={[s.filterBtnTxt, showFilters && s.filterBtnTxtActive]}>تصفية</Text>
          </Pressable>
        </View>

        {/* Filters Panel */}
        {showFilters && (
          <View style={s.filterContainer}>
            <View style={s.filterOptionsRow}>
              <Pressable style={[s.filterOpt, sort === 'rating' && s.filterOptActive]} onPress={() => setSort('rating')}>
                <Ionicons name="star" size={14} color={sort === 'rating' ? '#FFF' : 'rgba(255,255,255,0.8)'} />
                <Text style={[s.filterOptTxt, sort === 'rating' && s.filterOptTxtActive]}>الأعلى تقييماً</Text>
              </Pressable>
              <Pressable style={[s.filterOpt, sort === 'time' && s.filterOptActive]} onPress={() => setSort('time')}>
                <Ionicons name="time" size={14} color={sort === 'time' ? '#FFF' : 'rgba(255,255,255,0.8)'} />
                <Text style={[s.filterOptTxt, sort === 'time' && s.filterOptTxtActive]}>الأسرع</Text>
              </Pressable>
              <Pressable style={[s.filterOpt, sort === 'fee' && s.filterOptActive]} onPress={() => setSort('fee')}>
                <Ionicons name="bicycle" size={14} color={sort === 'fee' ? '#FFF' : 'rgba(255,255,255,0.8)'} />
                <Text style={[s.filterOptTxt, sort === 'fee' && s.filterOptTxtActive]}>توصيل مجاني</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Category pills */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catsRow}
          style={s.catsScroll}
        >
          {CATS.map(c => {
            const active = cat === c.key;
            return (
              <Pressable
                key={c.key}
                style={[s.catBtn, active && s.catBtnActive]}
                onPress={() => setCat(c.key)}
                accessibilityLabel={c.label}
              >
                <Text style={s.catEmoji}>{c.emoji}</Text>
                <Text style={[s.catLabel, active && s.catLabelActive]}>{c.label}</Text>
                {active && <View style={s.catDot} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* ══ BODY ══ */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.body, { paddingBottom: 120 }]}
      >

        {/* ── DEFAULT (no query) ── */}
        {!hasQ && (
          <>
            {/* Recent searches */}
            {recents.length > 0 && (
              <View style={s.section}>
                <View style={s.secHeader}>
                  <Pressable onPress={() => setRecents([])}>
                    <Text style={s.secAction}>مسح الكل</Text>
                  </Pressable>
                  <Text style={s.secTitle}>بحث سابق</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: 'row' }}>
                  {recents.map(t => (
                    <Pressable key={t} style={s.recentPill} onPress={() => apply(t)}>
                      <Ionicons name="time-outline" size={13} color={BRAND.TEXT3} />
                      <Text style={s.recentTxt}>{t}</Text>
                      <Pressable onPress={() => setRecents(p => p.filter(x => x !== t))} hitSlop={8}>
                        <Ionicons name="close" size={12} color={BRAND.TEXT3} />
                      </Pressable>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Trending */}
            <View style={s.section}>
              <Text style={s.secTitle}>الأكثر طلبًا اليوم 🔥</Text>
              <View style={s.trendWrap}>
                {['شاورما', 'بيتزا', 'كوسكوس', 'أتاي', 'كرواسون', 'برغر', 'طاجين', 'حريرة'].map(t => (
                  <Pressable key={t} style={s.trendPill} onPress={() => apply(t)}>
                    <Text style={s.trendTxt}>{t}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Real stores from Overpass API */}
            <View style={s.section}>
              <View style={s.secHeader}>
                <View style={s.apiBadge}>
                  {loading
                    ? <ActivityIndicator size={12} color={BRAND.RED} />
                    : <Text style={s.apiBadgeTxt}>📍 {realPlaces.length} محل حقيقي</Text>
                  }
                </View>
                <Text style={s.secTitle}>محلات في آسفي</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
                {loading
                  ? [1,2,3].map(i => <View key={i} style={[s.storePill, { backgroundColor: '#F0F0F0' }]} />)
                  : realPlaces.slice(0, 12).map(p => (
                      <Pressable
                        key={p.id}
                        style={s.storePill}
                        onPress={() => router.push(`/(flows)/store/${p.id}` as any)}
                        accessibilityLabel={p.name_ar}
                      >
                        <Image
                          source={{ uri: p.cover_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&h=120&fit=crop' }}
                          style={s.storePillImg}
                        />
                        <View style={s.storePillInfo}>
                          <TText ar={p.name_ar} style={s.storePillName} numberOfLines={1} />
                          <View style={s.storePillMeta}>
                            <Ionicons name="star" size={11} color={BRAND.YELLOW} />
                            <Text style={s.storePillRating}>{p.rating_avg.toFixed(1)}</Text>
                            <Text style={s.storePillDot}>·</Text>
                            <Text style={s.storePillTime}>{p.delivery_time_min}–{p.delivery_time_max}د</Text>
                          </View>
                          <Text style={s.storePillFee}>{p.delivery_fee === 0 ? '🚴 مجاني' : `🚴 ${p.delivery_fee} د.م.`}</Text>
                        </View>
                      </Pressable>
                    ))
                }
                {/* Supabase stores */}
                {dbStores.map(p => <StorePill key={p.id} store={p as any} />)}
              </ScrollView>
            </View>

          </>
        )}

        {/* ── SEARCH RESULTS ── */}
        {hasQ && (
          <>
            {/* ── Real places (Overpass) FIRST ── */}
            {searchedRealPlaces.length > 0 && (
              <View style={s.section}>
                <View style={s.secHeader}>
                  <View style={s.apiBadge}>
                    <Text style={s.apiBadgeTxt}>📍 حقيقية</Text>
                  </View>
                  <Text style={s.secTitle}>محلات في آسفي ({searchedRealPlaces.length})</Text>
                </View>
                {searchedRealPlaces.map(p => (
                  <StoreRow
                    key={p.id}
                    store={{ ...p, _source: 'real' }}
                    onPress={() => router.push(`/(flows)/store/${p.id}` as any)}
                  />
                ))}
              </View>
            )}

            {/* ── Supabase DB stores ── */}
            {sortedDbResults.length > 0 && (
              <View style={s.section}>
                <View style={s.secHeader}>
                  <Text style={s.secCount}>{sortedDbResults.length}</Text>
                  <Text style={s.secTitle}>محلات</Text>
                </View>
                {sortedDbResults.map(store => (
                  <StoreRow
                    key={store.id}
                    store={store}
                    onPress={() => router.push(`/(flows)/store/${store.id}` as any)}
                  />
                ))}
              </View>
            )}

            {/* ── No results ── */}
            {totalStoreResults === 0 && (
              <View style={s.empty}>
                <Text style={s.emptyEmoji}>🔍</Text>
                <Text style={s.emptyTitle}>لا توجد نتائج</Text>
                <Text style={s.emptySub}>لم نجد شيئًا لـ "{query}"</Text>
                <Pressable style={s.emptyBtn} onPress={() => setQuery('')}>
                  <Text style={s.emptyBtnTxt}>تصفح الكل</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.BG },

  // Hero
  hero: { paddingBottom: 24, overflow: 'hidden' },
  heroBlob1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.06)', top: -100, right: -80 },
  heroBlob2: { position: 'absolute', width: 150, height: 150, borderRadius: 75,  backgroundColor: 'rgba(255,255,255,0.04)', bottom: -40, left: 20 },
  heroTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingHorizontal: 20, marginBottom: 18, marginTop: 10 },
  heroTitle: { fontFamily: FONTS.DISPLAY, fontSize: 24, color: '#FFF' },
  heroTitleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(245,206,46,0.18)', borderWidth: 1, borderColor: 'rgba(245,206,46,0.3)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 24,
  },
  heroTitleBadgeTxt: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.YELLOW },

  // Search bar
  searchBar: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, borderRadius: 20,
    backgroundColor: '#FFF', paddingHorizontal: 14, height: 54,
    borderWidth: 2, borderColor: '#F3F4F6', ...SHADOW_LG,
  },
  searchBarFocused: { borderColor: BRAND.RED, shadowColor: BRAND.RED, shadowOpacity: 0.15 },
  searchInput: { flex: 1, fontFamily: FONTS.BODY, fontSize: 15, color: BRAND.TEXT, paddingHorizontal: 8 },
  clearBtn: { padding: 6 },
  searchDivider: { width: 1, height: 26, backgroundColor: BRAND.BORDER, marginHorizontal: 10 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  filterBtnActive: { backgroundColor: BRAND.RED },
  filterBtnTxt: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT },
  filterBtnTxtActive: { color: '#FFF' },
  
  filterContainer: { paddingHorizontal: 16, paddingBottom: 10, paddingTop: 6 },
  filterOptionsRow: { flexDirection: 'row-reverse', gap: 8, justifyContent: 'flex-start' },
  filterOpt: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  filterOptActive: { backgroundColor: BRAND.RED, borderColor: BRAND.RED },
  filterOptTxt: { fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  filterOptTxtActive: { color: '#FFF' },

  // Category pills
  catsScroll: { marginTop: 14 },
  catsRow: { gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  catBtn: {
    alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, position: 'relative',
  },
  catBtnActive: { backgroundColor: '#FFF', borderColor: 'transparent', ...SHADOW_SM },
  catEmoji: { fontSize: 18, lineHeight: 22 },
  catLabel: { fontFamily: FONTS.SEMIBOLD, fontSize: 11, color: 'rgba(255,255,255,0.88)' },
  catLabelActive: { color: BRAND.RED },
  catDot: { position: 'absolute', bottom: -2, left: '50%', width: 4, height: 4, borderRadius: 2, backgroundColor: BRAND.RED },

  // Body
  body: { paddingHorizontal: 16, paddingTop: 20 },
  section: { marginBottom: 28, backgroundColor: '#FFF', borderRadius: 20, padding: 16, ...SHADOW_SM },
  secHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  secTitle: { fontFamily: FONTS.DISPLAY, fontSize: 18, color: BRAND.TEXT },
  secCount: { fontFamily: FONTS.BODY, fontSize: 12, color: BRAND.TEXT3 },
  secAction: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.RED },

  // API badge
  apiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: BRAND.RED_LIGHT, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(240,48,48,0.15)',
  },
  apiBadgeTxt: { fontFamily: FONTS.SEMIBOLD, fontSize: 11, color: BRAND.RED },

  // Real badge in results
  realBadge: {
    backgroundColor: BRAND.RED_LIGHT, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(240,48,48,0.15)',
  },
  realBadgeTxt: { fontFamily: FONTS.SEMIBOLD, fontSize: 10, color: BRAND.RED },

  // Recent pills
  recentPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: BRAND.SURFACE, borderWidth: 1, borderColor: BRAND.BORDER,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, ...SHADOW_SM,
  },
  recentTxt: { fontFamily: FONTS.BODY, fontSize: 13, color: BRAND.TEXT },

  // Trending
  trendWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trendPill: { backgroundColor: BRAND.SURFACE, borderWidth: 1, borderColor: BRAND.BORDER, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, ...SHADOW_SM },
  trendTxt: { fontFamily: FONTS.SEMIBOLD, fontSize: 13, color: BRAND.TEXT2 },

  // Dish card
  dishGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  dishCard: { width: CARD_W, backgroundColor: BRAND.SURFACE, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: BRAND.BORDER, ...SHADOW },
  dishImgWrap: { width: '100%', height: 120, position: 'relative' },
  dishImg: { width: '100%', height: '100%' },
  dishHot: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  dishHotTxt: { fontSize: 12 },
  dishHeart: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.90)', alignItems: 'center', justifyContent: 'center' },
  dishBody: { padding: 10 },
  dishName: { fontFamily: FONTS.SEMIBOLD, fontSize: 14, color: BRAND.TEXT, textAlign: 'right', marginBottom: 4 },
  dishDesc: { fontFamily: FONTS.BODY, fontSize: 11, color: BRAND.TEXT3, textAlign: 'right', marginBottom: 6, lineHeight: 16 },
  sizesScroll: { marginBottom: 4 },
  sizesRow: { flexDirection: 'row', gap: 4 },
  sizeTag: { backgroundColor: BRAND.LIGHT, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  sizeTxt: { fontFamily: FONTS.SEMIBOLD, fontSize: 10, color: BRAND.TEXT2 },
  dishSupps: { fontFamily: FONTS.BODY, fontSize: 10, color: BRAND.TEXT3, textAlign: 'right', marginBottom: 8 },
  dishFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: BRAND.RED, alignItems: 'center', justifyContent: 'center' },
  dishPrice: { fontFamily: FONTS.DISPLAY, fontSize: 15, color: BRAND.TEXT },
  dishCurr: { fontFamily: FONTS.BODY, fontSize: 11, color: BRAND.TEXT3 },

  // Store pill (horizontal)
  storePill: { width: 140, backgroundColor: BRAND.SURFACE, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: BRAND.BORDER, ...SHADOW_SM },
  storePillImg: { width: '100%', height: 80 },
  storePillInfo: { padding: 8 },
  storePillName: { fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: BRAND.TEXT, textAlign: 'right', marginBottom: 4 },
  storePillMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
  storePillRating: { fontFamily: FONTS.SEMIBOLD, fontSize: 11, color: BRAND.TEXT },
  storePillDot: { color: BRAND.TEXT3, fontSize: 11 },
  storePillTime: { fontFamily: FONTS.BODY, fontSize: 11, color: BRAND.TEXT3 },
  storePillFee: { fontFamily: FONTS.BODY, fontSize: 11, color: BRAND.TEXT3, textAlign: 'right', marginTop: 2 },

  // Store full-width row
  storeRow: { backgroundColor: BRAND.SURFACE, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: BRAND.BORDER, marginBottom: 12, ...SHADOW },
  storeRowImg: { width: '100%', height: 110 },
  storeRowBody: { padding: 14 },
  storeRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  storeRowName: { fontFamily: FONTS.DISPLAY, fontSize: 16, color: BRAND.TEXT, flex: 1, textAlign: 'right', marginRight: 8 },
  storeRowRating: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BRAND.LIGHT, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  storeRowRatingTxt: { fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: BRAND.TEXT },
  storeRowTags: { fontFamily: FONTS.BODY, fontSize: 12, color: BRAND.TEXT3, textAlign: 'right', marginBottom: 10 },
  storeRowMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'flex-end' },
  storeRowMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  storeRowMetaTxt: { fontFamily: FONTS.SEMIBOLD, fontSize: 12, color: BRAND.TEXT3 },

  // Empty state
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontFamily: FONTS.DISPLAY, fontSize: 20, color: BRAND.TEXT },
  emptySub: { fontFamily: FONTS.BODY, fontSize: 14, color: BRAND.TEXT3, textAlign: 'center' },
  emptyBtn: { backgroundColor: BRAND.RED, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, marginTop: 8 },
  emptyBtnTxt: { fontFamily: FONTS.SEMIBOLD, fontSize: 15, color: '#FFF' },
});

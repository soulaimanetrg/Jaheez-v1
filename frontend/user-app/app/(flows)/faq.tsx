import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  LayoutAnimation,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Ionicons';
import { AppSearchBar } from '../../components/ui/AppSearchBar';
import { BRAND, FONTS } from '../../constants/brand';
import { useLangStore } from '../../store/languageStore';
import { dirRow, dirItems, dirText, backArrow } from '../../lib/direction';
import { useAppContent } from '../../hooks/queries/useContent';
import { usePlatformStore } from '../../features/stores/store/platformStore';

export default function FAQScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { lang, isRTL } = useLangStore();
  
  const [search, setSearch] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  const { data: faqItems = [], isLoading } = useAppContent('faq');
  const supportPhone = usePlatformStore(s => s.supportPhoneE164);

  const isAr = lang === 'ar';

  const toggleFaq = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === key ? null : key);
  };

  const handleWhatsappPress = () => {
    if (!supportPhone) return router.push('/(tabs)/chat');
    Linking.openURL(`https://wa.me/${supportPhone.replace(/\D/g,'')}`).catch(() => {
      router.push('/(tabs)/chat');
    });
  };

  return (
    <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 8, flexDirection: dirRow(isRTL) }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
        >
          <Ionicons name={backArrow(isRTL)} size={22} color="#1E293B" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isAr ? '\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0634\u0627\u0626\u0639\u0629' : 'Questions frequentes'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.subtitle, { textAlign: dirText(isRTL) }]}>
          {isAr ? '\u0643\u064a\u0641 \u064a\u0645\u0643\u0646\u0646\u0627 \u0645\u0633\u0627\u0639\u062f\u062a\u0643 \u0627\u0644\u064a\u0648\u0645\u061f' : 'Comment pouvons-nous vous aider ?'}
        </Text>

                <AppSearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={isAr ? '\u0627\u0628\u062d\u062b \u0639\u0646 \u0625\u062c\u0627\u0628\u0629...' : 'Rechercher une reponse...'}
          accessibilityLabel={isAr ? '\u0627\u0628\u062d\u062b \u0639\u0646 \u0625\u062c\u0627\u0628\u0629' : 'Rechercher une reponse'}
          isRTL={isRTL}
          showClear
          onClear={() => setSearch('')}
          showSubmit={false}
          style={styles.searchBar}
        />

                {isLoading ? (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={BRAND.RED} />
          </View>
        ) : (
          (() => {
            const filteredItems = faqItems.filter(item => {
              const q = (isAr ? item.titleAr : item.titleFr) || '';
              const a = (isAr ? item.bodyAr : item.bodyFr) || '';
              return (
                q.toLowerCase().includes(search.toLowerCase()) ||
                a.toLowerCase().includes(search.toLowerCase())
              );
            });

            if (filteredItems.length === 0) {
              return (
                <View style={{ marginTop: 40, alignItems: 'center' }}>
                  <Text style={{ fontFamily: FONTS.BODY, color: '#94A3B8' }}>
                    {isAr ? '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c \u062a\u0637\u0627\u0628\u0642 \u0628\u062d\u062b\u0643.' : 'Aucun resultat ne correspond a votre recherche.'}
                  </Text>
                </View>
              );
            }

            return (
              <View style={styles.section}>
                <View style={styles.sectionCard}>
                  {filteredItems.map((item, idx) => {
                    const question = isAr ? item.titleAr : item.titleFr;
                    const answer = isAr ? item.bodyAr : item.bodyFr;
                    const isOpen = expandedIndex === item.slug;
                    const isLast = idx === filteredItems.length - 1;

                    return (
                      <View key={item.slug} style={[!isLast && styles.itemBorder]}>
                        <Pressable
                          style={[styles.faqRow, { flexDirection: dirRow(isRTL) }]}
                          onPress={() => toggleFaq(item.slug)}
                        >
                          <Text style={[styles.faqQuestion, { textAlign: dirText(isRTL) }]}>
                            {question}
                          </Text>
                          <Ionicons
                            name={isOpen ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color="#94A3B8"
                          />
                        </Pressable>

                        {isOpen && (
                          <View style={[styles.answerContainer, { alignItems: dirItems(isRTL) }]}>
                            <Text style={[styles.answerText, { textAlign: dirText(isRTL) }]}>
                              {answer}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })()
        )}

                <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isAr ? '\u0644\u0645 \u062a\u062c\u062f \u0645\u0627 \u062a\u0628\u062d\u062b \u0639\u0646\u0647\u061f' : 'Vous n\'avez pas trouve ?'}
          </Text>
          <View style={[styles.footerRow, { flexDirection: dirRow(isRTL) }]}>
            <Pressable style={[styles.footerBtn, styles.btnWhatsapp]} onPress={handleWhatsappPress}>
              <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
              <Text style={styles.btnTxtWhite}>WhatsApp</Text>
            </Pressable>
            <Pressable
              style={[styles.footerBtn, styles.btnTicket]}
              onPress={() => router.push('/(flows)/support-ticket')}
            >
              <Ionicons name="information-circle-outline" size={18} color="#EF4444" />
              <Text style={styles.btnTxtRed}>
                {isAr ? '\u062a\u0630\u0643\u0631\u0629 \u062f\u0639\u0645' : 'Support Ticket'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONTS.DISPLAY,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: FONTS.DISPLAY,
    fontWeight: 'bold',
    color: '#0F172A',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  searchBar: {
    marginHorizontal: 20,
    marginTop: 14,
    minHeight: 56,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FONTS.SEMIBOLD,
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  faqRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.SEMIBOLD,
    color: '#1E293B',
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  answerText: {
    fontSize: 13,
    fontFamily: FONTS.BODY,
    color: '#64748B',
    lineHeight: 18,
  },
  footer: {
    marginTop: 32,
    marginHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    fontSize: 13,
    fontFamily: FONTS.SEMIBOLD,
    color: '#64748B',
  },
  footerRow: {
    gap: 10,
    width: '100%',
  },
  footerBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnWhatsapp: {
    backgroundColor: '#25D366',
  },
  btnTicket: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BRAND.RED,
  },
  btnTxtWhite: {
    fontSize: 13.5,
    fontFamily: FONTS.SEMIBOLD,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  btnTxtRed: {
    fontSize: 13.5,
    fontFamily: FONTS.SEMIBOLD,
    color: BRAND.RED,
    fontWeight: 'bold',
  },
});

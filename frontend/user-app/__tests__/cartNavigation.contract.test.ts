import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

describe('cart navigation contract', () => {
  it('has one canonical tab screen and a replace-style legacy redirect', () => {
    expect(read('app/(tabs)/cart.tsx')).toContain("../../features/orders/CartScreen");
    const legacy = read('app/(flows)/cart.tsx');
    expect(legacy).toContain('<Redirect href="/(tabs)/cart" />');
    expect(legacy).not.toContain('CartScreen');
  });

  it('does not push or replace the legacy cart route', () => {
    const activeFiles = [
      'app/(flows)/store/[id].tsx',
      'app/(flows)/checkout.tsx',
      'app/(flows)/payment-success.tsx',
      'features/orders/CartScreen.tsx',
    ];
    for (const file of activeFiles) {
      const source = read(file);
      expect(source).not.toMatch(/router\.(push|replace)\([^\n]*\(flows\)\/cart/);
    }
  });

  it('returns from product editing by popping rather than stacking another cart', () => {
    const store = read('app/(flows)/store/[id].tsx');
    expect(store).toContain('if (router.canGoBack()) router.back();');
    expect(store).toContain("router.replace({ pathname: '/(tabs)/cart'");
  });

  it('pops the existing store-to-cart entry instead of replacing it with a duplicate store', () => {
    const cart = read('features/orders/CartScreen.tsx');
    expect(cart).toMatch(/if \(returnStoreId\)[\s\S]*router\.canGoBack\(\)[\s\S]*router\.back\(\)/);
  });
});

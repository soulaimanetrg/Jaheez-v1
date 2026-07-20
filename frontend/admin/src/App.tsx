import { useEffect, Suspense, lazy, Component, type ReactNode } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore, defaultPathForRole } from './features/auth/store/authStore';
import { canAccessPath } from './features/auth/permissions';
import { getToken, api, clearToken } from './lib/api';

// Lazy-load pages so a crash in one page doesn't nuke the whole app
const Login            = lazy(() => import('./features/auth/views/login'));
const Stats            = lazy(() => import('./features/dashboard/views/stats'));
const Orders           = lazy(() => import('./features/orders/views/orders'));
const Stores           = lazy(() => import('./features/stores/views/stores'));
const Products         = lazy(() => import('./features/stores/views/products'));
const Users            = lazy(() => import('./features/users/views/users'));
const Drivers          = lazy(() => import('./features/users/views/drivers'));
const Categories       = lazy(() => import('./features/stores/views/categories'));

const Promotions       = lazy(() => import('./features/stores/views/promotions'));
const Support          = lazy(() => import('./features/support/views/support'));
const Errands          = lazy(() => import('./features/orders/views/errands'));
const Analytics        = lazy(() => import('./features/dashboard/views/analytics'));
const Settings         = lazy(() => import('./features/settings/views/settings'));
const Admins           = lazy(() => import('./features/users/views/admins'));
const AuditLogs        = lazy(() => import('./features/users/views/audit-logs'));
const Cities           = lazy(() => import('./features/settings/views/cities'));
const ServiceCategories = lazy(() => import('./features/settings/views/service-categories'));
const Refunds          = lazy(() => import('./features/orders/views/refunds'));
const Wallets          = lazy(() => import('./features/users/views/wallets'));
const Finance          = lazy(() => import('./features/orders/views/finance'));
const CodReconciliation= lazy(() => import('./features/orders/views/cod-reconciliation'));
const DriverPayouts    = lazy(() => import('./features/orders/views/driver-payouts'));
const Commission       = lazy(() => import('./features/settings/views/commission'));
const Reliability      = lazy(() => import('./features/users/views/reliability'));
const NotificationsPage = lazy(() => import('./features/settings/views/notifications'));

const AppContent       = lazy(() => import('./features/content/views/app-content'));
const VehicleTypes     = lazy(() => import('./features/settings/views/vehicle-types'));
const DriverIssues     = lazy(() => import('./features/users/views/driver-issues'));
const NotFound         = lazy(() => import('./features/dashboard/views/not-found'));

// ─── Error Boundary ─────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'Cairo, sans-serif' }}>
          <h2 style={{ color: '#F03030', fontSize: 20, fontWeight: 700 }}>Une erreur est survenue</h2>
          <pre style={{ marginTop: 12, padding: 16, background: '#fef2f2', borderRadius: 8, fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            style={{ marginTop: 16, padding: '8px 20px', background: '#F03030', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
          >
            Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Loading spinner ────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e8e6df', borderTopColor: '#F03030', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleGuard({ path, children }: { path: string; children: ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user) return <PageLoader />;
  if (!canAccessPath(user.role, path)) {
    return <Navigate to={defaultPathForRole(user.role)} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { logout, setUser, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token && isAuthenticated) {
      logout();
      return;
    }
    if (token && !user) {
      api.me().then((admin: any) => {
        setUser({
          id:        admin.id,
          auth_id:   admin.id,
          email:     admin.email,
          full_name: admin.full_name,
          role:      admin.role as import('./features/auth/store/authStore').AdminRole,
        });
      }).catch(() => {
        clearToken();
        logout();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const defaultPath = defaultPathForRole(user?.role);

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to={defaultPath} replace /> : <Login />} />
          <Route path="/" element={<Navigate to={defaultPath} replace />} />
          <Route path="/dashboard"          element={<RoleGuard path="/dashboard"><Stats /></RoleGuard>} />
          <Route path="/orders"             element={<RoleGuard path="/orders"><Orders /></RoleGuard>} />
          <Route path="/stores"             element={<RoleGuard path="/stores"><Stores /></RoleGuard>} />
          <Route path="/products/:storeId"  element={<RoleGuard path="/products"><Products /></RoleGuard>} />
          <Route path="/users"              element={<RoleGuard path="/users"><Users /></RoleGuard>} />
          <Route path="/drivers"            element={<RoleGuard path="/drivers"><Drivers /></RoleGuard>} />
          <Route path="/categories"         element={<RoleGuard path="/categories"><Categories /></RoleGuard>} />
          <Route path="/promotions"         element={<RoleGuard path="/promotions"><Promotions /></RoleGuard>} />
          <Route path="/support"            element={<RoleGuard path="/support"><Support /></RoleGuard>} />
          <Route path="/errands"            element={<RoleGuard path="/errands"><Errands /></RoleGuard>} />
          <Route path="/analytics"          element={<RoleGuard path="/analytics"><Analytics /></RoleGuard>} />
          <Route path="/settings"           element={<RoleGuard path="/settings"><Settings /></RoleGuard>} />
          <Route path="/admins"             element={<RoleGuard path="/admins"><Admins /></RoleGuard>} />
          <Route path="/audit-logs"         element={<RoleGuard path="/audit-logs"><AuditLogs /></RoleGuard>} />
          <Route path="/cities"             element={<RoleGuard path="/cities"><Cities /></RoleGuard>} />
          <Route path="/service-categories" element={<RoleGuard path="/service-categories"><ServiceCategories /></RoleGuard>} />
          <Route path="/refunds"            element={<RoleGuard path="/refunds"><Refunds /></RoleGuard>} />
          <Route path="/wallets"            element={<RoleGuard path="/wallets"><Wallets /></RoleGuard>} />
          <Route path="/finance"            element={<RoleGuard path="/finance"><Finance /></RoleGuard>} />
          <Route path="/driver-payouts"     element={<RoleGuard path="/driver-payouts"><DriverPayouts /></RoleGuard>} />
          <Route path="/commission"         element={<RoleGuard path="/commission"><Commission /></RoleGuard>} />
          <Route path="/reliability"        element={<RoleGuard path="/reliability"><Reliability /></RoleGuard>} />
          <Route path="/notifications"      element={<RoleGuard path="/notifications"><NotificationsPage /></RoleGuard>} />
          <Route path="/cod-reconciliation" element={<RoleGuard path="/cod-reconciliation"><CodReconciliation /></RoleGuard>} />

          <Route path="/app-content"        element={<RoleGuard path="/app-content"><AppContent /></RoleGuard>} />
          <Route path="/vehicle-types"      element={<RoleGuard path="/vehicle-types"><VehicleTypes /></RoleGuard>} />
          <Route path="/driver-issues"      element={<RoleGuard path="/driver-issues"><DriverIssues /></RoleGuard>} />
          <Route path="/stats"              element={<RoleGuard path="/stats"><Stats /></RoleGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

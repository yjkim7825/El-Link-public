import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { PartnerLayout } from '@/components/layout/PartnerLayout'
import { ADMIN_NAV } from '@/lib/constants'

import { HomePage } from '@/features/HomePage'
import { LoginChoicePage } from '@/features/LoginChoicePage'
import { NotFoundPage } from '@/features/NotFoundPage'

import { AdminLoginPage } from '@/features/admin/LoginPage'
import { AdminDashboardPage } from '@/features/admin/DashboardPage'
import { MaterialsPage } from '@/features/admin/materials/MaterialsPage'
import { MaterialNewPage } from '@/features/admin/materials/MaterialNewPage'
import { MaterialDetailPage } from '@/features/admin/materials/MaterialDetailPage'
import { ProposalsPage } from '@/features/admin/proposals/ProposalsPage'
import { ProposalNewPage } from '@/features/admin/proposals/ProposalNewPage'
import { ProposalDetailPage } from '@/features/admin/proposals/ProposalDetailPage'
import { PartnersPage } from '@/features/admin/partners/PartnersPage'
import { CatalogPage } from '@/features/admin/catalog/CatalogPage'
import { AdminDocumentsPage } from '@/features/admin/documents/DocumentsPage'
import { DocumentIssuesPage } from '@/features/admin/documents/DocumentIssuesPage'

import { PartnerLoginPage } from '@/features/partnership/LoginPage'
import { ChangePasswordPage } from '@/features/partnership/account/ChangePasswordPage'
import { PortfolioPage } from '@/features/partnership/portfolio/PortfolioPage'
import { PartnerDocumentsPage } from '@/features/partnership/documents/DocumentsPage'
import { QuotePage } from '@/features/partnership/quote/QuotePage'
import { QuotesListPage } from '@/features/partnership/quote/QuotesListPage'
import { QuoteDetailPage } from '@/features/partnership/quote/QuoteDetailPage'
import { AccountPage } from '@/features/partnership/account/AccountPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginChoicePage />} />

      {/* ===== 관리자 ===== */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<ProtectedRoute role="ADMIN" />}>
        <Route path="/admin" element={<AppLayout scopeLabel="관리자" nav={ADMIN_NAV} loginPath="/admin/login" />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="materials" element={<MaterialsPage />} />
          <Route path="materials/new" element={<MaterialNewPage />} />
          <Route path="materials/:id" element={<MaterialDetailPage />} />
          <Route path="proposals" element={<ProposalsPage />} />
          <Route path="proposals/new" element={<ProposalNewPage />} />
          <Route path="proposals/:id" element={<ProposalDetailPage />} />
          <Route path="partners" element={<PartnersPage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="documents" element={<AdminDocumentsPage />} />
          <Route path="documents/issues" element={<DocumentIssuesPage />} />
        </Route>
      </Route>

      {/* ===== 파트너 ===== */}
      <Route path="/partner/login" element={<PartnerLoginPage />} />
      {/* 비밀번호 변경: 보호하되 mustChangePassword 가드는 적용하지 않음(무한 리다이렉트 방지) */}
      <Route element={<ProtectedRoute role="PARTNER" />}>
        <Route path="/partner/change-password" element={<ChangePasswordPage />} />
      </Route>
      <Route element={<ProtectedRoute role="PARTNER" enforcePasswordChange />}>
        <Route path="/partner" element={<PartnerLayout />}>
          <Route index element={<Navigate to="portfolio" replace />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="documents" element={<PartnerDocumentsPage />} />
          <Route path="quote" element={<QuotePage />} />
          <Route path="quotes" element={<QuotesListPage />} />
          <Route path="quotes/:id" element={<QuoteDetailPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

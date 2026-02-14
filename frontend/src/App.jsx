import { Routes, Route, Outlet } from "react-router-dom";
import { MainLayout } from "./components/Layout/MainLayout";
import Dashboard from "./Pages/Dashboard";
import AgreementsPage from "./Pages/Agreements";
import CreateAgreement from "./Pages/CreateAgreement";
import PreviewAgreement from "./Pages/PreviewAgreement";
import EditAgreementPage from "./Pages/EditAgreement";
import SignIn from "./Pages/SignIn";
import ResetPassword from "./Pages/ResetPassword";
import ChangePassword from "./Pages/ChangePassword";
import React from "react";
import ForgotPasswordReset from "./Pages/ForgotPasswordReset";
import { LettersPage, LetterForm } from "./Pages/Letters/letter_index";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { ProtectedAgreementRoute } from "./components/Auth/ProtectedAgreementRoute";
import LetterView from "./components/Letter/LetterView";

// Configuration imports
import UserConfig from "./components/Configurations/UserManagement/UserConfig";
import UserForm from "./components/Configurations/UserManagement/UserForm";
import DepartmentsConfig from "./components/Configurations/Accounts/DepartmentsConfig";
import DesignationsConfig from "./components/Configurations/Accounts/DesignationsConfig";
import SignatoriesConfig from "./components/Configurations/Accounts/SignatoriesConfig";
import DepartmentForm from "./components/Configurations/Accounts/DepartmentForm";
import DesignationForm from "./components/Configurations/Accounts/DesignationForm";
import SignatoryForm from "./components/Configurations/Accounts/SignatoryForm";
import VendorsConfig from "./components/Configurations/Agreements/VendorsConfig";
import VendorForm from "./components/Configurations/Agreements/VendorForm";
import AgreementTypesConfig from "./components/Configurations/Agreements/AgreementTypesConfig";
import AgreementTypeForm from "./components/Configurations/Agreements/AgreementTypeForm";
import CategoriesConfig from "./components/Configurations/Letters/CategoriesConfig";
import CategoryForms from "./components/Configurations/Letters/CategoryForms";
import OrganizationsConfig from "./components/Configurations/Letters/OrganizationsConfig";
import OrganizationForm from "./components/Configurations/Letters/OrganizationForm";
import RecipientsConfig from "./components/Configurations/Letters/RecipientsConfig";
import RecipientForm from "./components/Configurations/Letters/RecipientForm";

function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public route for forgot password reset */}
      <Route path="/forgot-password-reset" element={<ForgotPasswordReset />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Outlet />
            </MainLayout>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="agreements" element={<AgreementsPage />} />
        <Route path="letters" element={<LettersPage />} />
        <Route path="/letters/create" element={<LetterForm />} />
        <Route
          path="agreements/create"
          element={
            <ProtectedAgreementRoute restrictedForExecutives={true}>
              <CreateAgreement />
            </ProtectedAgreementRoute>
          }
        />
        <Route path="agreements/preview/:id" element={<PreviewAgreement />} />
        <Route path="agreements/preview" element={<PreviewAgreement />} />
        <Route
          path="agreements/edit/:id"
          element={
            <ProtectedAgreementRoute restrictedForExecutives={true}>
              <EditAgreementPage />
            </ProtectedAgreementRoute>
          }
        />
        <Route path="change-password" element={<ChangePassword />} />
        <Route path="/letters/view/:id" element={<LetterView />} />

        {/* Configuration Routes - Superuser Only */}

        {/* User Management Configuration */}
        <Route path="/user-management/*">
          <Route path="all-users" element={<UserConfig />} />
          <Route path="all-users/add" element={<UserForm />} />
          <Route path="all-users/:userId/edit" element={<UserForm />} />
        </Route>
        <Route path="/configurations/*">
          {/* Accounts Configuration */}
          <Route path="accounts/departments" element={<DepartmentsConfig />} />
          <Route path="accounts/departments/add" element={<DepartmentForm />} />
          <Route
            path="accounts/departments/:departmentId/edit"
            element={<DepartmentForm />}
          />

          <Route
            path="accounts/designations"
            element={<DesignationsConfig />}
          />
          <Route
            path="accounts/designations/add"
            element={<DesignationForm />}
          />
          <Route
            path="accounts/designations/:designationId/edit"
            element={<DesignationForm />}
          />

          <Route path="accounts/signatories" element={<SignatoriesConfig />} />
          <Route path="accounts/signatories/add" element={<SignatoryForm />} />
          <Route
            path="accounts/signatories/:signatoryId/edit"
            element={<SignatoryForm />}
          />

          {/* Agreements Configuration */}
          <Route path="agreements/vendors" element={<VendorsConfig />} />
          <Route path="agreements/vendors/add" element={<VendorForm />} />
          <Route
            path="agreements/vendors/:vendorId/edit"
            element={<VendorForm />}
          />

          <Route path="agreements/types" element={<AgreementTypesConfig />} />
          <Route path="agreements/types/add" element={<AgreementTypeForm />} />
          <Route
            path="agreements/types/:typeId/edit"
            element={<AgreementTypeForm />}
          />

          {/* Letters Configuration */}
          <Route path="letters/categories" element={<CategoriesConfig />} />
          <Route path="letters/categories/add" element={<CategoryForms />} />
          <Route
            path="letters/categories/:categoryId/edit"
            element={<CategoryForms />}
          />

          <Route
            path="letters/organizations"
            element={<OrganizationsConfig />}
          />
          <Route
            path="letters/organizations/add"
            element={<OrganizationForm />}
          />
          <Route
            path="letters/organizations/:organizationId/edit"
            element={<OrganizationForm />}
          />

          <Route path="letters/recipients" element={<RecipientsConfig />} />
          <Route path="letters/recipients/add" element={<RecipientForm />} />
          <Route
            path="letters/recipients/:recipientId/edit"
            element={<RecipientForm />}
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;

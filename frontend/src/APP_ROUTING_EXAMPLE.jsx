import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import SuperuserRoute from './components/Auth/SuperuserRoute';
import { MainLayout } from './components/Layout/MainLayout';

// Pages
import SignIn from './Pages/SignIn';
import Dashboard from './Pages/Dashboard';
import Agreements from './Pages/Agreements';
import Letters from './Pages/Letters';

// Configuration Pages
import ConfigurationLayout from './components/Configurations/ConfigurationLayout';
import DepartmentsConfig from './components/Configurations/Accounts/DepartmentsConfig';
import DesignationsConfig from './components/Configurations/Accounts/DesignationsConfig';
import SignatoriesConfig from './components/Configurations/Accounts/SignatoriesConfig';
import VendorsConfig from './components/Configurations/Agreements/VendorsConfig';
import AgreementTypesConfig from './components/Configurations/Agreements/AgreementTypesConfig';
import CategoriesConfig from './components/Configurations/Letters/CategoriesConfig';
import OrganizationsConfig from './components/Configurations/Letters/OrganizationsConfig';
import RecipientsConfig from './components/Configurations/Letters/RecipientsConfig';

/**
 * ROUTING SETUP WITH SUPERUSER-RESTRICTED CONFIGURATIONS
 * 
 * This shows how to set up your routes with the new role-based access control
 * All configuration routes are protected by SuperuserRoute
 * Only superusers can access the /configurations/* routes
 */
const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/signin" element={<SignIn />} />

        {/* Protected Routes - Wrapped in ProtectedRoute */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  {/* Main pages accessible to all authenticated users */}
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/agreements" element={<Agreements />} />
                  <Route path="/letters" element={<Letters />} />

                  {/* CONFIGURATION ROUTES - SUPERUSER ONLY */}
                  <Route
                    path="/configurations/*"
                    element={
                      <SuperuserRoute>
                        <ConfigurationLayout>
                          <Routes>
                            {/* Accounts Configuration */}
                            <Route
                              path="accounts/departments"
                              element={<DepartmentsConfig />}
                            />
                            <Route
                              path="accounts/designations"
                              element={<DesignationsConfig />}
                            />
                            <Route
                              path="accounts/signatories"
                              element={<SignatoriesConfig />}
                            />

                            {/* Agreements Configuration */}
                            <Route
                              path="agreements/vendors"
                              element={<VendorsConfig />}
                            />
                            <Route
                              path="agreements/types"
                              element={<AgreementTypesConfig />}
                            />

                            {/* Letters Configuration */}
                            <Route
                              path="letters/categories"
                              element={<CategoriesConfig />}
                            />
                            <Route
                              path="letters/organizations"
                              element={<OrganizationsConfig />}
                            />
                            <Route
                              path="letters/recipients"
                              element={<RecipientsConfig />}
                            />
                          </Routes>
                        </ConfigurationLayout>
                      </SuperuserRoute>
                    }
                  />

                  {/* Add other protected routes here */}
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRoutes;

/**
 * ALTERNATIVE: Using RoleBasedAccess for more flexible control
 * 
 * If you want to allow multiple roles access to configurations:
 * 
 * import RoleBasedAccess from './components/Auth/RoleBasedAccess';
 * 
 * <Route
 *   path="/configurations/*"
 *   element={
 *     <RoleBasedAccess requiredRole={["superuser"]} redirectTo="/denied">
 *       <ConfigurationLayout>
 *         {/* nested routes */}
 *       </ConfigurationLayout>
 *     </RoleBasedAccess>
 *   }
 * />
 */

/**
 * ROUTING SETUP GUIDE
 * 
 * Add these routes to your main routing configuration file (typically App.jsx or main routing file)
 */

// Import the form components
import DepartmentForm from './components/Configurations/Accounts/DepartmentForm';
import DesignationForm from './components/Configurations/Accounts/DesignationForm';
import SignatoryForm from './components/Configurations/Accounts/SignatoryForm';
import DepartmentsConfig from './components/Configurations/Accounts/DepartmentsConfig';
import DesignationsConfig from './components/Configurations/Accounts/DesignationsConfig';
import SignatoriesConfig from './components/Configurations/Accounts/SignatoriesConfig';

// Add these route definitions to your router configuration:

{
  path: '/configuration',
  children: [
    {
      path: 'departments',
      element: <DepartmentsConfig />,
    },
    {
      path: 'departments/add',
      element: <DepartmentForm />,
    },
    {
      path: 'departments/:departmentId/edit',
      element: <DepartmentForm />,
    },
    {
      path: 'designations',
      element: <DesignationsConfig />,
    },
    {
      path: 'designations/add',
      element: <DesignationForm />,
    },
    {
      path: 'designations/:designationId/edit',
      element: <DesignationForm />,
    },
    {
      path: 'signatories',
      element: <SignatoriesConfig />,
    },
    {
      path: 'signatories/add',
      element: <SignatoryForm />,
    },
    {
      path: 'signatories/:signatoryId/edit',
      element: <SignatoryForm />,
    },
  ],
}

/**
 * EXAMPLE: If you're using React Router v6 with createBrowserRouter
 * 
 * const router = createBrowserRouter([
 *   {
 *     path: '/',
 *     element: <App />,
 *     children: [
 *       // ... other routes ...
 *       {
 *         path: 'configuration',
 *         children: [
 *           {
 *             path: 'departments',
 *             element: <DepartmentsConfig />,
 *           },
 *           {
 *             path: 'departments/add',
 *             element: <DepartmentForm />,
 *           },
 *           {
 *             path: 'departments/:departmentId/edit',
 *             element: <DepartmentForm />,
 *           },
 *           // ... more routes as shown above ...
 *         ],
 *       },
 *     ],
 *   },
 * ]);
 */

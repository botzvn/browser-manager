import { Outlet, Route, Routes } from 'react-router-dom';

import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';

import { ProxyPage } from '../features/proxy/ProxyPage.page';
import { GroupsPage } from '../features/groups/GroupsPage.page';
import { ProfilesPage } from '../features/profiles/pages/profiles';
import { ProfileEditor } from '../features/profiles/pages/profile-editor';

function MainLayout() {
  return (
    <div className="flex h-screen w-screen bg-brand-gradient overflow-hidden text-cyan-900 dark:text-cyan-50 font-sans antialiased text-sm select-none">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto min-w-0 min-h-0 w-full custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { registry } from '../lib/registry';

export function AppRouter() {
  const extensionRoutes = registry.getRoutes();

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<ProfilesPage />} />
        <Route path="profile/create" element={<ProfileEditor />} />
        <Route path="profile/edit/:id" element={<ProfileEditor />} />
        <Route path="proxy" element={<ProxyPage />} />
        <Route path="groups" element={<GroupsPage />} />
        
        {/* Render extension routes */}
        {extensionRoutes.map((route: any, idx: number) => (
          <Route 
            key={idx} 
            path={route.path} 
            element={route.element} 
            index={route.index}
          >
            {route.children?.map((child: any, childIdx: number) => (
              <Route 
                key={childIdx} 
                path={child.path} 
                element={child.element} 
                index={child.index} 
              />
            ))}
          </Route>
        ))}
      </Route>
    </Routes>
  );
}

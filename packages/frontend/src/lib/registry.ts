import type { ReactNode, ElementType } from 'react';

export interface MenuItem {
  icon: ElementType;
  label: string;
  path?: string;
  badge?: string;
  active?: boolean;
}

export interface ExtensionRoute {
  path: string;
  element: ReactNode;
  children?: ExtensionRoute[];
  index?: boolean;
}

class FrontendRegistry {
  private menuItems: MenuItem[] = [];
  private routes: ExtensionRoute[] = [];

  registerMenuItem(item: MenuItem) {
    this.menuItems.push(item);
  }

  registerRoute(route: ExtensionRoute) {
    this.routes.push(route);
  }

  getMenuItems() {
    return this.menuItems;
  }

  getRoutes() {
    return this.routes;
  }
}

export const registry = new FrontendRegistry();

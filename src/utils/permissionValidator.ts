import { User } from '../types/auth';

export type CRUDAction = 'create' | 'read' | 'update' | 'delete';

/**
 * Permission validator utility for checking user access rights
 */
export class PermissionValidator {
  private user: User | null;

  constructor(user: User | null) {
    this.user = user;
  }

  /**
   * Check if user has permission for a specific module and action
   */
  hasPermission(module: string, action: CRUDAction): boolean {
    if (!this.user) return false;

    return this.user.role.permissions.some(
      permission => permission.module === module && permission.action === action
    );
  }

  /**
   * Check if user has any of the specified actions for a module
   */
  hasAnyPermission(module: string, actions: CRUDAction[]): boolean {
    if (!this.user) return false;

    return actions.some(action => this.hasPermission(module, action));
  }

  /**
   * Check if user has all of the specified actions for a module
   */
  hasAllPermissions(module: string, actions: CRUDAction[]): boolean {
    if (!this.user) return false;

    return actions.every(action => this.hasPermission(module, action));
  }

  /**
   * Get all modules the user has any permission for
   */
  getAccessibleModules(): string[] {
    if (!this.user) return [];

    const modules = new Set<string>();
    this.user.role.permissions.forEach(permission => {
      modules.add(permission.module);
    });

    return Array.from(modules);
  }

  /**
   * Get all actions the user can perform on a specific module
   */
  getModuleActions(module: string): CRUDAction[] {
    if (!this.user) return [];

    const actions: CRUDAction[] = [];
    this.user.role.permissions
      .filter(permission => permission.module === module)
      .forEach(permission => {
        if (['create', 'read', 'update', 'delete'].includes(permission.action)) {
          actions.push(permission.action as CRUDAction);
        }
      });

    return actions;
  }

  /**
   * Check if user has full access (all CRUD operations) to a module
   */
  hasFullAccess(module: string): boolean {
    return this.hasAllPermissions(module, ['create', 'read', 'update', 'delete']);
  }

  /**
   * Check if user is an admin (has Admin role)
   */
  isAdmin(): boolean {
    if (!this.user) return false;
    return this.user.role.name === 'Admin' || this.user.role.name === 'Super Admin';
  }

  /**
   * Check if user has at least read access to a module
   */
  canView(module: string): boolean {
    return this.hasPermission(module, 'read');
  }

  /**
   * Check if user can create in a module
   */
  canCreate(module: string): boolean {
    return this.hasPermission(module, 'create');
  }

  /**
   * Check if user can update in a module
   */
  canUpdate(module: string): boolean {
    return this.hasPermission(module, 'update');
  }

  /**
   * Check if user can delete in a module
   */
  canDelete(module: string): boolean {
    return this.hasPermission(module, 'delete');
  }

  /**
   * Get a summary of user's permissions for a module
   */
  getPermissionSummary(module: string): {
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  } {
    return {
      canCreate: this.canCreate(module),
      canRead: this.canView(module),
      canUpdate: this.canUpdate(module),
      canDelete: this.canDelete(module),
    };
  }
}

/**
 * Create a permission validator instance for a user
 */
export const createPermissionValidator = (user: User | null): PermissionValidator => {
  return new PermissionValidator(user);
};

/**
 * Quick permission check helper
 */
export const checkPermission = (user: User | null, module: string, action: CRUDAction): boolean => {
  const validator = new PermissionValidator(user);
  return validator.hasPermission(module, action);
};

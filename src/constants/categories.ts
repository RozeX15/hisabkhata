import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Income Categories
  { id: 'cat-sal', nameKey: 'cat_salary', type: 'income', icon: 'Briefcase', color: '#10B981', isSystem: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-fre', nameKey: 'cat_freelance', type: 'income', icon: 'Laptop', color: '#06B6D4', isSystem: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-bus', nameKey: 'cat_business', type: 'income', icon: 'Building2', color: '#8B5CF6', isSystem: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-gif', nameKey: 'cat_gift', type: 'income', icon: 'Gift', color: '#EC4899', isSystem: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-oin', nameKey: 'cat_other_income', type: 'income', icon: 'Coins', color: '#14B8A6', isSystem: true, createdAt: '2026-01-01T00:00:00.000Z' },

  // Expense Categories
  { id: 'cat-foo', nameKey: 'cat_food', type: 'expense', icon: 'Utensils', color: '#F59E0B', isSystem: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-tra', nameKey: 'cat_transport', type: 'expense', icon: 'Car', color: '#3B82F6', isSystem: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-sho', nameKey: 'cat_shopping', type: 'expense', icon: 'ShoppingBag', color: '#EC4899', isSystem: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-bil', nameKey: 'cat_bills', type: 'expense', icon: 'Zap', color: '#EAB308', isSystem: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-edu', nameKey: 'cat_education', type: 'expense', icon: 'GraduationCap', color: '#6366F1', isSystem: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-ent', nameKey: 'cat_entertainment', type: 'expense', icon: 'Film', color: '#A855F7', isSystem: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-hea', nameKey: 'cat_health', type: 'expense', icon: 'HeartPulse', color: '#EF4444', isSystem: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-ren', nameKey: 'cat_rent', type: 'expense', icon: 'Home', color: '#0F766E', isSystem: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-fam', nameKey: 'cat_family', type: 'expense', icon: 'Users', color: '#F97316', isSystem: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'cat-oex', nameKey: 'cat_other_expense', type: 'expense', icon: 'MoreHorizontal', color: '#64748B', isSystem: true, createdAt: '2026-01-01T00:00:00.000Z' },
];

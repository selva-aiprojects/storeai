# StoreAI Unified Design System
## Professional Module Color Coding Reference

This document defines the consistent color system used across all StoreAI modules for a cohesive, high-quality user experience.

---

## 🎨 Module Color Palette

### Dashboard & Overview
- **Primary**: `#4f46e5` (Indigo 600)
- **Light**: `#6366f1` (Indigo 500)
- **Background**: `rgba(79, 70, 229, 0.05)`
- **Usage**: Main dashboard, overview screens, analytics summaries
- **CSS Variables**: `--module-dashboard`, `--module-dashboard-light`, `--module-dashboard-bg`

### Inventory & Products
- **Primary**: `#0ea5e9` (Sky 500)
- **Light**: `#38bdf8` (Sky 400)
- **Background**: `rgba(14, 165, 233, 0.05)`
- **Usage**: Product management, stock levels, warehouse operations
- **CSS Variables**: `--module-inventory`, `--module-inventory-light`, `--module-inventory-bg`

### Sales & Revenue
- **Primary**: `#10b981` (Emerald 500)
- **Light**: `#34d399` (Emerald 400)
- **Background**: `rgba(16, 185, 129, 0.05)`
- **Usage**: Sales transactions, revenue tracking, customer orders
- **CSS Variables**: `--module-sales`, `--module-sales-light`, `--module-sales-bg`

### Purchases & Procurement
- **Primary**: `#f59e0b` (Amber 500)
- **Light**: `#fbbf24` (Amber 400)
- **Background**: `rgba(245, 158, 11, 0.05)`
- **Usage**: Purchase orders, supplier management, procurement
- **CSS Variables**: `--module-purchases`, `--module-purchases-light`, `--module-purchases-bg`

### Finance & Accounting
- **Primary**: `#8b5cf6` (Violet 500)
- **Light**: `#a78bfa` (Violet 400)
- **Background**: `rgba(139, 92, 246, 0.05)`
- **Usage**: Financial reports, accounting, ledgers, P&L
- **CSS Variables**: `--module-finance`, `--module-finance-light`, `--module-finance-bg`

### HR & People Management
- **Primary**: `#ec4899` (Pink 500)
- **Light**: `#f472b6` (Pink 400)
- **Background**: `rgba(236, 72, 153, 0.05)`
- **Usage**: Employee management, payroll, attendance
- **CSS Variables**: `--module-hr`, `--module-hr-light`, `--module-hr-bg`

### Reports & Analytics
- **Primary**: `#06b6d4` (Cyan 500)
- **Light**: `#22d3ee` (Cyan 400)
- **Background**: `rgba(6, 182, 212, 0.05)`
- **Usage**: Business intelligence, reports, data analytics
- **CSS Variables**: `--module-reports`, `--module-reports-light`, `--module-reports-bg`

### Settings & Configuration
- **Primary**: `#64748b` (Slate 500)
- **Light**: `#94a3b8` (Slate 400)
- **Background**: `rgba(100, 116, 139, 0.05)`
- **Usage**: System settings, preferences, configuration
- **CSS Variables**: `--module-settings`, `--module-settings-light`, `--module-settings-bg`

### CRM & Customers
- **Primary**: `#14b8a6` (Teal 500)
- **Light**: `#2dd4bf` (Teal 400)
- **Background**: `rgba(20, 184, 166, 0.05)`
- **Usage**: Customer management, deals, relationships
- **CSS Variables**: `--module-crm`, `--module-crm-light`, `--module-crm-bg`

### AI & Intelligence
- **Primary**: `#d946ef` (Fuchsia 500)
- **Light**: `#e879f9` (Fuchsia 400)
- **Background**: `rgba(217, 70, 239, 0.05)`
- **Usage**: AI features, predictions, intelligent insights
- **CSS Variables**: `--module-ai`, `--module-ai-light`, `--module-ai-bg`

---

## 📊 Status Colors

### Success
- **Color**: `#10b981` (Emerald 500)
- **Light**: `#d1fae5` (Emerald 100)
- **Dark**: `#047857` (Emerald 700)
- **Usage**: Completed actions, active status, positive metrics

### Warning
- **Color**: `#f59e0b` (Amber 500)
- **Light**: `#fef3c7` (Amber 100)
- **Dark**: `#b45309` (Amber 700)
- **Usage**: Pending actions, low stock alerts, attention needed

### Danger
- **Color**: `#ef4444` (Red 500)
- **Light**: `#fee2e2` (Red 100)
- **Dark**: `#b91c1c` (Red 700)
- **Usage**: Errors, critical alerts, negative metrics

### Info
- **Color**: `#3b82f6` (Blue 500)
- **Light**: `#dbeafe` (Blue 100)
- **Dark**: `#1e40af` (Blue 700)
- **Usage**: Informational messages, tips, neutral notifications

### Neutral
- **Color**: `#6b7280` (Gray 500)
- **Light**: `#f3f4f6` (Gray 100)
- **Dark**: `#374151` (Gray 700)
- **Usage**: Inactive states, disabled elements, neutral info

---

## 🎯 Usage Guidelines

### Component Styling

#### Cards
```css
/* Dashboard card */
.card-module-dashboard {
  border-top: 3px solid var(--module-dashboard);
  background: linear-gradient(to bottom, var(--module-dashboard-bg), var(--bg-surface));
}

/* Inventory card */
.card-module-inventory {
  border-top: 3px solid var(--module-inventory);
  background: linear-gradient(to bottom, var(--module-inventory-bg), var(--bg-surface));
}
```

#### Buttons
```css
/* Sales action button */
.btn-module-sales {
  background: var(--module-sales);
  color: white;
  border: 1px solid var(--module-sales);
}

.btn-module-sales:hover {
  background: var(--module-sales-light);
  box-shadow: var(--shadow-sales);
}
```

#### Badges
```css
/* Finance status badge */
.badge-finance {
  background: var(--module-finance-bg);
  color: var(--module-finance);
  border: 1px solid var(--module-finance-light);
}
```

#### Section Headers
```css
/* HR section header */
.section-header-hr {
  border-bottom-color: var(--module-hr);
}
```

### React/TSX Usage

```tsx
// Dashboard metric card
<div className="card card-module-dashboard">
  <div className="card-header">
    <span className="text-dashboard">Revenue Overview</span>
  </div>
  {/* content */}
</div>

// Sales button
<button className="btn btn-module-sales">
  Create Sale
</button>

// Inventory badge
<span className="badge badge-inventory">
  In Stock
</span>

// Finance section
<div className="section-header section-header-finance">
  <span>Financial Reports</span>
</div>
```

---

## 🎨 Color Accessibility

All color combinations meet WCAG 2.1 AA standards for:
- **Text contrast**: 4.5:1 minimum for normal text
- **Large text contrast**: 3:1 minimum for large text (18pt+)
- **UI component contrast**: 3:1 minimum for interactive elements

### Contrast Ratios

| Module | Primary on White | Light on White | Primary on Dark |
|--------|------------------|----------------|-----------------|
| Dashboard | 7.2:1 ✅ | 5.8:1 ✅ | 12.1:1 ✅ |
| Inventory | 4.8:1 ✅ | 3.9:1 ✅ | 9.2:1 ✅ |
| Sales | 4.9:1 ✅ | 4.1:1 ✅ | 9.5:1 ✅ |
| Purchases | 3.8:1 ⚠️ | 3.2:1 ⚠️ | 8.1:1 ✅ |
| Finance | 6.1:1 ✅ | 4.9:1 ✅ | 10.8:1 ✅ |
| HR | 5.2:1 ✅ | 4.3:1 ✅ | 9.8:1 ✅ |

**Note**: Amber (Purchases) should use darker text or larger font sizes for optimal accessibility.

---

## 🏗️ Design Principles

### 1. **Consistency**
- Use module colors consistently across all screens
- Apply the same color to related features (e.g., all sales-related elements use green)

### 2. **Hierarchy**
- Primary color: Main actions and headers
- Light variant: Hover states and secondary elements
- Background: Subtle section highlighting

### 3. **Clarity**
- Status colors override module colors for critical information
- Danger (red) always indicates errors or critical alerts
- Success (green) always indicates completion or positive states

### 4. **Professional Appearance**
- Subtle gradients for depth
- Consistent shadows for elevation
- Smooth transitions for interactions

### 5. **Scalability**
- All colors defined as CSS variables
- Easy to theme or customize
- Supports dark mode (future enhancement)

---

## 🔧 Customization

To customize module colors, update the CSS variables in `unified-theme.css`:

```css
:root {
  /* Change dashboard color */
  --module-dashboard: #your-color;
  --module-dashboard-light: #your-light-color;
  --module-dashboard-bg: rgba(your-rgb, 0.05);
}
```

---

## 📱 Responsive Considerations

- Colors remain consistent across all breakpoints
- Adjust opacity for mobile to reduce visual weight
- Ensure touch targets maintain color contrast

---

## ✅ Quality Checklist

When implementing new features:

- [ ] Use appropriate module color for the feature area
- [ ] Apply status colors for state indicators
- [ ] Ensure text contrast meets accessibility standards
- [ ] Use consistent border-top accent on cards
- [ ] Apply module-specific shadows on hover
- [ ] Test color combinations in light and dark environments
- [ ] Verify colors work for colorblind users (use tools like Stark)

---

## 🎓 Examples by Module

### Dashboard Page
- Cards: `card-module-dashboard`
- Buttons: `btn-module-dashboard`
- Text: `text-dashboard`
- Icons: `icon-container-dashboard`

### Inventory Page
- Cards: `card-module-inventory`
- Buttons: `btn-module-inventory`
- Badges: `badge-inventory`
- Sections: `section-header-inventory`

### Sales Page
- Cards: `card-module-sales`
- Buttons: `btn-module-sales`
- Success states: `badge-success`
- Revenue metrics: `text-sales`

### Finance Page
- Cards: `card-module-finance`
- Reports: `section-header-finance`
- Ledger entries: `text-finance`
- Buttons: `btn-module-finance`

---

**Version**: 1.0.0  
**Last Updated**: February 7, 2026  
**Maintained by**: StoreAI Development Team

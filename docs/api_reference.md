# StoreAI Enterprise: API Reference Documentation
**Version**: 1.0.0
**Base URL**: `/api/v1`

---

## 1. Authentication (`/auth`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/login` | Authenticate user and return JWT. | Public |
| `POST` | `/register` | Register a new user and tenant (Onboarding). | Public |
| `GET` | `/me` | Get current user profile and active tenant. | JWT |

## 2. Inventory Management (`/products`, `/inventory`, `/categories`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | List all products for the active tenant. | JWT |
| `POST` | `/products` | Create a new product. | JWT |
| `PATCH` | `/products/:id` | Update product details. | JWT |
| `GET` | `/inventory/summary` | Get high-level stock status report. | JWT |
| `POST` | `/categories` | Create a product category. | JWT |

## 3. Human Resources (`/hr`, `/hr/payroll`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/hr/employees` | List active employees. | JWT |
| `POST` | `/hr/employees` | Onboard a new employee. | JWT |
| `POST` | `/hr/attendance` | Log daily attendance. | JWT |
| `GET` | `/hr/payroll` | Fetch historical payroll records. | JWT |
| `POST` | `/hr/payroll/generate` | Trigger monthly payroll calculation. | JWT |

## 4. Sales & Commerce (`/sales`, `/customers`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/sales` | List all sales transactions. | JWT |
| `POST` | `/sales` | Execute a new sale (Deducts stock automatically). | JWT |
| `GET` | `/customers` | List company customers. | JWT |
| `POST` | `/customers` | Register a new customer. | JWT |

## 5. Procurement (`/orders`, `/suppliers`, `/requisitions`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/orders` | Fetch purchase order history. | JWT |
| `POST` | `/orders` | Create a new Purchase Order. | JWT |
| `PATCH` | `/orders/:id/approve` | Approve a pending PO. | JWT |
| `POST` | `/orders/:id/grn` | Create Goods Receipt Note (Inward stock). | JWT |
| `GET` | `/suppliers` | List approved suppliers. | JWT |

## 6. Finance & Administration (`/accounts`, `/tenants`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/accounts/tax-summary` | Aggregated GST Input/Output report. | JWT |
| `GET` | `/tenants/all` | List all tenants (System Admin only). | JWT |
| `GET` | `/dashboard/stats` | Aggregated dashboard KPI metrics. | JWT |

---

## Error Handling
The API uses standard HTTP status codes:
- `200/201`: Success
- `400`: Bad Request (Validation Error)
- `401`: Unauthorized (Invalid Token)
- `403`: Forbidden (Insufficient Permissions)
- `404`: Not Found
- `500`: Internal Server Error

**Note**: All protected endpoints require an `Authorization: Bearer <token>` header.

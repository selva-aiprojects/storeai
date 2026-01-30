# StoreAI Platform - Comprehensive Regression Report

**Timestamp:** 2026-01-30 23:27:58

## Summary

- **Total Tests:** 16
- **Passed:** 11
- **Failed:** 5
- **Pass Rate:** 68.8%

## Test Results by Module

### Connectivity (1/1)

| Test | Status | Details | Duration |
| :--- | :--- | :--- | ---: |
| Root Endpoint | PASS | StoreAI Intelligence Platform Running | 2061ms |

### Products (0/1)

| Test | Status | Details | Duration |
| :--- | :--- | :--- | ---: |
| List All Products | FAIL | Status 404 | 2030ms |

### Categories (0/1)

| Test | Status | Details | Duration |
| :--- | :--- | :--- | ---: |
| List All Categories | FAIL | Status 404 | 2032ms |

### Sales (0/1)

| Test | Status | Details | Duration |
| :--- | :--- | :--- | ---: |
| List All Sales | FAIL | Status 404 | 2031ms |

### Customers (0/1)

| Test | Status | Details | Duration |
| :--- | :--- | :--- | ---: |
| List All Customers | FAIL | Status 404 | 2023ms |

### Orders (0/1)

| Test | Status | Details | Duration |
| :--- | :--- | :--- | ---: |
| List All Orders | FAIL | Status 404 | 2030ms |

### AI Intelligence (4/4)

| Test | Status | Details | Duration |
| :--- | :--- | :--- | ---: |
| Greeting & Persona | PASS | Correct persona response | 8204ms |
| Stock Query | PASS | Source: NONE, Context: False | 3733ms |
| Sales Query | PASS | Source: NONE | 3430ms |
| Telemetry Suppression | PASS | Context correctly suppressed | 2521ms |

### Finance (4/4)

| Test | Status | Details | Duration |
| :--- | :--- | :--- | ---: |
| Daybook Endpoint | PASS | 11 records | 3182ms |
| Financial Summary | PASS | Revenue: 0.0 | 7184ms |
| Liability Report | PASS | Retrieved | 4197ms |
| P&L Report | PASS | Retrieved | 4842ms |

### HR (2/2)

| Test | Status | Details | Duration |
| :--- | :--- | :--- | ---: |
| Employee List | PASS | 6 employees | 2931ms |
| Attendance Report | PASS | Retrieved for Jan 2026 | 4210ms |


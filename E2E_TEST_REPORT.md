# StoreAI Platform - End-to-End Test Report

**Timestamp:** 2026-01-30 23:08:28

## Summary

- **Total Tests:** 11
- **Passed:** 10
- **Failed:** 1
- **Pass Rate:** 90.9%

## Test Results by Module

### Connectivity

| Test | Status | Details | Duration |
| :--- | :--- | :--- | ---: |
| Root Endpoint | PASS | StoreAI Intelligence Platform Running | 2057ms |

### AI Intelligence

| Test | Status | Details | Duration |
| :--- | :--- | :--- | ---: |
| Greeting & Persona | PASS | Correct persona response | 2029ms |
| Stock Query | PASS | Source: NONE | 2241ms |
| Sales Query | PASS | Source: NONE | 2265ms |
| Telemetry Suppression | PASS | Context correctly suppressed | 2042ms |

### Finance

| Test | Status | Details | Duration |
| :--- | :--- | :--- | ---: |
| Daybook Endpoint | PASS | 11 records | 8121ms |
| Financial Summary | PASS | Retrieved | 6665ms |
| Liability Report | PASS | Retrieved | 3899ms |
| P&L Report | PASS | Retrieved | 4115ms |

### HR

| Test | Status | Details | Duration |
| :--- | :--- | :--- | ---: |
| Employee List | FAIL | Status 500: {'detail': "name 'db' is not defined"} | 2041ms |
| Attendance Report | PASS | Retrieved for Jan 2026 | 3250ms |


# Testing Guide - Defne Qr

Bu döküman, Defne Qr projesinin test altyapısını ve test çalıştırma yöntemlerini açıklar.

## 📋 Test Yapısı

### Backend Tests
- **Framework**: Jest + Supertest
- **Lokasyon**: `backend/src/**/__tests__/`, `backend/src/**/*.test.js`
- **Coverage Target**: %70+

### Frontend Tests
- **Framework**: Jest + React Testing Library
- **Lokasyon**: `frontend/src/**/__tests__/`, `frontend/src/**/*.test.tsx`
- **Coverage Target**: %60+

### E2E Tests
- **Framework**: Playwright
- **Lokasyon**: `e2e/tests/`
- **Browsers**: Chromium, Firefox, WebKit, Mobile

---

## 🚀 Test Çalıştırma

### Backend Tests

```bash
cd backend

# Tüm testleri çalıştır (coverage ile)
npm test

# Testleri watch modunda çalıştır
npm run test:watch

# Sadece unit testler
npm run test:unit

# Sadece integration testler
npm run test:integration

# CI için (parallel: false)
npm run test:ci
```

### Frontend Tests

```bash
cd frontend

# Tüm testleri çalıştır (coverage ile)
npm test

# Testleri watch modunda çalıştır
npm run test:watch

# CI için
npm run test:ci
```

### E2E Tests

```bash
cd e2e

# İlk kurulum (Playwright browsers)
npx playwright install

# Tüm E2E testleri çalıştır
npm test

# Headed modda çalıştır (tarayıcı görünür)
npm run test:headed

# Debug mode
npm run test:debug

# UI mode (interaktif)
npm run test:ui

# Sadece Chromium
npm run test:chromium

# Sadece mobile testler
npm run test:mobile

# Test raporu göster
npm run report
```

---

## 📊 Coverage Raporları

### Backend Coverage
```bash
cd backend
npm test
# Rapor: backend/coverage/index.html
```

### Frontend Coverage
```bash
cd frontend
npm test
# Rapor: frontend/coverage/index.html
```

### Coverage Eşikleri

**Backend:**
- Branches: %70
- Functions: %70
- Lines: %70
- Statements: %70

**Frontend:**
- Branches: %60
- Functions: %60
- Lines: %60
- Statements: %60

---

## 🧪 Test Yazma Kılavuzu

### Backend Unit Test Örneği

```javascript
// src/utils/__tests__/example.unit.test.js
describe('Example Utils', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Backend Integration Test Örneği

```javascript
// src/__tests__/api.integration.test.js
const request = require('supertest');
const app = require('../app');

describe('GET /api/endpoint', () => {
  it('should return 200', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body).toHaveProperty('success', true);
  });
});
```

### Frontend Component Test Örneği

```typescript
// src/components/__tests__/Example.test.tsx
import { render, screen } from '@testing-library/react';
import { Example } from '../Example';

describe('Example Component', () => {
  it('should render', () => {
    render(<Example />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E Test Örneği

```typescript
// e2e/tests/example.spec.ts
import { test, expect } from '@playwright/test';

test('should load homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Defne Qr/);
});
```

---

## 🔧 Mock & Stub

### Prisma Mock (Backend)
```javascript
// jest.setup.js already mocks Prisma Client
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// In tests:
prisma.user.findUnique.mockResolvedValue({ id: '123', email: 'test@example.com' });
```

### API Mock (Frontend)
```typescript
// Mock api.ts
jest.mock('@/lib/api');
import api from '@/lib/api';

(api.get as jest.Mock).mockResolvedValue({ data: { success: true } });
```

---

## 🐛 Debugging Tests

### Backend
```bash
# Node.js inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# VS Code: Add breakpoint and press F5
```

### Frontend
```bash
# Chrome DevTools
node --inspect-brk node_modules/.bin/jest --runInBand
```

### E2E (Playwright)
```bash
npm run test:debug
# Opens Playwright Inspector
```

---

## 📦 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd backend && npm ci
      - run: cd backend && npm run test:ci

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd frontend && npm ci
      - run: cd frontend && npm run test:ci

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd e2e && npm ci
      - run: npx playwright install --with-deps
      - run: cd e2e && npm test
```

---

## 📝 Test Checklist

- [ ] Unit testler yazıldı mı?
- [ ] Integration testler yazıldı mı?
- [ ] E2E testler yazıldı mı?
- [ ] Coverage %70+ (backend) / %60+ (frontend)?
- [ ] Tüm testler geçiyor mu?
- [ ] CI/CD pipeline'da çalışıyor mu?

---

## 🆘 Yardım

Test ile ilgili sorunlar için:
- Backend: `backend/jest.config.js` ve `backend/jest.setup.js`
- Frontend: `frontend/jest.config.js` ve `frontend/jest.setup.js`
- E2E: `e2e/playwright.config.ts`

**Not**: İlk test çalıştırmadan önce `npm install` komutunu çalıştırmayı unutmayın!

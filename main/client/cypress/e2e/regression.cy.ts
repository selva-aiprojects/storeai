describe('StoreAI ERP Regression Suite', () => {
    const adminEmail = 'admin@storeai.com';
    const adminPassword = 'Admin@123';

    beforeEach(() => {
        // Clear local storage and cookies to ensure a fresh state
        cy.clearLocalStorage();
        cy.clearCookies();
    });

    it('1. Authentication Flow', () => {
        cy.visit('/login');

        // Check if the logo is visible (The new SVG logo)
        cy.get('svg').should('exist');

        // Perform login
        cy.get('input[type="email"]').type(adminEmail);
        cy.get('input[type="password"]').type(adminPassword);
        cy.get('button[type="submit"]').click();

        // Should redirect to dashboard (root path)
        cy.url().should('not.include', '/login');
        cy.contains('Dashboard').should('be.visible');
    });

    it('2. Dashboard Integrity Check', () => {
        // Login first
        cy.visit('/login');
        cy.get('input[type="email"]').type(adminEmail);
        cy.get('input[type="password"]').type(adminPassword);
        cy.get('button[type="submit"]').click();

        // Check for key dashboard components
        cy.contains('Total Revenue').should('be.visible');
        cy.contains('Active Products').should('be.visible');
        cy.contains('Pending Orders').should('be.visible');
    });

    it('3. Inventory & Procurement Flow', () => {
        cy.visit('/login');
        cy.get('input[type="email"]').type(adminEmail);
        cy.get('input[type="password"]').type(adminPassword);
        cy.get('button[type="submit"]').click();

        // Navigate to Inventory
        cy.visit('/inventory');
        cy.contains('Inventory').should('be.visible');

        // Check if products exist (from seeding)
        cy.contains('Enterprise Router X1').should('be.visible');

        // Navigate to Transactions (Purchases)
        cy.visit('/purchases');
        cy.contains('Orders').should('be.visible');
        cy.contains('PO-X1-001').should('be.visible');
    });

    it('4. Sales & Billing Check', () => {
        cy.visit('/login');
        cy.get('input[type="email"]').type(adminEmail);
        cy.get('input[type="password"]').type(adminPassword);
        cy.get('button[type="submit"]').click();

        // Navigate to Sales
        cy.visit('/sales');
        cy.contains('Sales').should('be.visible');
    });

    it('5. HR & Payroll Access', () => {
        cy.visit('/login');
        cy.get('input[type="email"]').type(adminEmail);
        cy.get('input[type="password"]').type(adminPassword);
        cy.get('button[type="submit"]').click();

        // Navigate to HR
        cy.visit('/hr-master');
        cy.contains('Employee Master').should('be.visible');
        cy.contains('Employee 1').should('be.visible');
    });
});

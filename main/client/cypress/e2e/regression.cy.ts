describe('StoreAI ERP Regression Suite', () => {
    const adminEmail = 'admin@storeai.com';
    const adminPassword = 'Admin@123';
    const tenantSlug = 'storeai';

    const loginAsAdmin = () => {
        cy.visit('/login');
        cy.get('input[type="email"]').clear().type(adminEmail);
        cy.get('input[type="password"]').clear().type(adminPassword);
        cy.get('input[type="text"]').then(($inputs) => {
            if ($inputs.length > 0) {
                cy.wrap($inputs.last()).clear().type(tenantSlug);
            }
        });
        cy.contains('button', 'SIGN IN TO STOREAI').click();
        cy.url().should('not.include', '/login');
        cy.contains('Dashboard').should('be.visible');
    };

    beforeEach(() => {
        // Clear local storage and cookies to ensure a fresh state
        cy.clearLocalStorage();
        cy.clearCookies();
    });

    it('1. Authentication Flow', () => {
        cy.visit('/login');
        cy.get('input[type="email"]').should('be.visible');
        loginAsAdmin();
    });

    it('2. Dashboard Integrity Check', () => {
        loginAsAdmin();

        // Check for key dashboard components
        cy.contains('Total Revenue').should('be.visible');
        cy.contains('Active Products').should('be.visible');
        cy.contains('Pending Orders').should('be.visible');
    });

    it('3. Inventory & Procurement Flow', () => {
        loginAsAdmin();

        cy.contains('button', 'Stock Master').click();
        cy.url().should('include', '/inventory');
        cy.contains('Inventory').should('be.visible');

        // Check if products exist (from seeding)
        cy.contains('Enterprise Router X1').should('be.visible');

        cy.contains('button', 'Procurement Hub').click();
        cy.url().should('include', '/purchases');
        cy.contains('Orders').should('be.visible');
        cy.contains('PO-X1-001').should('be.visible');
    });

    it('4. Sales & Billing Check', () => {
        loginAsAdmin();

        cy.contains('button', 'Sales [POS]').click();
        cy.url().should('include', '/sales');
        cy.contains('Sales').should('be.visible');
    });

    it('5. HR & Payroll Access', () => {
        loginAsAdmin();

        cy.contains('button', 'Employee Master').click();
        cy.url().should('include', '/hr-master');
        cy.contains('Employee Master').should('be.visible');
        cy.contains('Employee 1').should('be.visible');
    });
});

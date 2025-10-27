import AppSidebar from '@/components/sidebar/app-sidebar';
import { withAllProviders } from '../../support/component';
import env from '@/lib/config/env';
import { SidebarProvider } from '@/components/ui/sidebar';

function withSidebarProvider(component: React.ReactNode) {
    return <SidebarProvider>{component}</SidebarProvider>;
}

describe('<AppSidebar />', () => {
    beforeEach(() => {
        cy.intercept('GET', `${env.REST_URLS.AUTH}/api/user/me`, {
            statusCode: 200,
            body: {
                id: 'test-user-123',
                name: 'Test User',
                email: 'test@example.com',
                avatarUrl: 'https://github.com/shadcn.png'
            }
        }).as('getUser');
    });

    describe('when on login page', () => {
        beforeEach(() => {
            const searchParams = new URLSearchParams();
            cy.mount(withSidebarProvider(withAllProviders(<AppSidebar />, searchParams, '/login')));
            cy.wait('@getUser');
        });

        it('should not render sidebar', () => {
            cy.get('[data-variant="sidebar"]').should('not.exist');
        });
    });

    describe('when not on login page', () => {
        beforeEach(() => {
            const searchParams = new URLSearchParams();
            cy.mount(withSidebarProvider(withAllProviders(<AppSidebar />, searchParams, '/play')));
            cy.wait('@getUser');
        });

        it('should render sidebar', () => {
            cy.get('[data-variant="sidebar"]').should('be.visible');
        });

        it('should render Chess Game label', () => {
            cy.contains('Chess Game').should('be.visible');
        });

        describe('navigation menu items', () => {
            it('should render Play menu item', () => {
                cy.getDataCy('sidebar-play').should('be.visible');
                cy.getDataCy('sidebar-play').should('contain.text', 'Play');
            });

            it('should render Leaderboard menu item', () => {
                cy.getDataCy('sidebar-leaderboard').should('be.visible');
                cy.getDataCy('sidebar-leaderboard').should('contain.text', 'Leaderboard');
            });

            it('should render History menu item', () => {
                cy.getDataCy('sidebar-history').should('be.visible');
                cy.getDataCy('sidebar-history').should('contain.text', 'History');
            });

            it('should render all menu items with icons', () => {
                cy.getDataCy('sidebar-play').find('svg').should('exist');
                cy.getDataCy('sidebar-leaderboard').find('svg').should('exist');
                cy.getDataCy('sidebar-history').find('svg').should('exist');
            });
        });

        describe('sidebar footer', () => {
            it('should render mode toggle component', () => {
                cy.getDataCy('mode-toggle-dropdown').should('be.visible');
            });

            it('should render profile dropdown trigger', () => {
                cy.getDataCy('sidebar-profile-toggle').should('be.visible');
            });

            it('should display username', () => {
                cy.getDataCy('sidebar-profile-toggle').should('contain.text', 'Test User');
            });

            it('should render avatar', () => {
                cy.getDataCy('banner-avatar').should('be.visible');
            });

            it('should render chevron icon', () => {
                cy.getDataCy('sidebar-profile-toggle').find('svg').should('have.length.at.least', 1);
            });
        });

        describe('avatar behavior', () => {
            it('should display avatar image when URL provided', () => {
                cy.getDataCy('banner-avatar').find('img').should('exist');
            });

            it('should display fallback initials when no avatar URL', () => {
                cy.intercept('GET', `${env.REST_URLS.AUTH}/api/user/me`, {
                    statusCode: 200,
                    body: {
                        id: 'test-user-456',
                        name: 'John Doe',
                        email: 'john@example.com',
                        avatarUrl: null
                    }
                }).as('getUserNoAvatar');

                const searchParams = new URLSearchParams();
                cy.mount(withSidebarProvider(withAllProviders(<AppSidebar />, searchParams, '/play')));
                cy.wait('@getUserNoAvatar');

                cy.getDataCy('banner-avatar').should('contain.text', 'J');
            });

            it('should display "Unknown user" when no username', () => {
                cy.intercept('GET', `${env.REST_URLS.AUTH}/api/user/me`, {
                    statusCode: 200,
                    body: {
                        id: 'test-user-789',
                        name: null,
                        email: 'user@example.com',
                        avatarUrl: null
                    }
                }).as('getUserNoName');

                const searchParams = new URLSearchParams();
                cy.mount(withSidebarProvider(withAllProviders(<AppSidebar />, searchParams, '/play')));
                cy.wait('@getUserNoName');

                cy.getDataCy('sidebar-profile-toggle').should('contain.text', 'Unknown user');
            });
        });

        describe('profile dropdown', () => {
            it('should not show dropdown content initially', () => {
                cy.get('body').then(($body) => {
                    if ($body.find('[role="menu"]').length > 0) {
                        cy.get('[role="menu"]').should('not.be.visible');
                    }
                });
            });

            it('should show dropdown content after clicking profile trigger', () => {
                cy.getDataCy('sidebar-profile-toggle').click();
                cy.contains('Account').should('be.visible');
            });

            it('should render logout button in dropdown', () => {
                cy.getDataCy('sidebar-profile-toggle').click();
                cy.getDataCy('logout-button').should('be.visible');
            });
        });
    });
});

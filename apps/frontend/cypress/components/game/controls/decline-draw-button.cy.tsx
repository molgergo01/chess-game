import React from 'react';
import DeclineDrawButton from '@/components/game/controls/decline-draw-button';
import { withAllProviders } from '../../../support/component';
import { MatchmakingColor } from '@/lib/models/request/matchmaking';
import env from '@/lib/config/env';

describe('<DeclineDrawButton />', () => {
    const defaultProps = {
        gameId: 'test-game-id',
        color: MatchmakingColor.WHITE
    };

    beforeEach(() => {
        cy.intercept('GET', `${env.REST_URLS.AUTH}/api/auth/user/me`, {
            statusCode: 200,
            body: {
                user: {
                    id: 'test-user-123',
                    email: 'test@example.com',
                    name: 'Test User',
                    elo: 1500,
                    avatarUrl: null
                }
            }
        }).as('getUser');
    });

    describe('Rendering', () => {
        it('renders the button with correct data-cy attribute', () => {
            cy.mount(withAllProviders(<DeclineDrawButton {...defaultProps} />));
            cy.getDataCy('game-control-button-decline-draw').should('be.visible');
        });

        it.skip('displays the correct tooltip text', () => {
            cy.mount(withAllProviders(<DeclineDrawButton {...defaultProps} />));
            cy.getDataCy('game-control-button-decline-draw').trigger('mouseenter');
            cy.contains('Decline the draw offer').should('be.visible');
        });
    });

    describe('Dialog Interaction', () => {
        it('opens the confirmation dialog when button is clicked', () => {
            cy.mount(withAllProviders(<DeclineDrawButton {...defaultProps} />));
            cy.getDataCy('game-control-button-decline-draw').click();
            cy.getDataCy('decline-draw-confirmation-dialog').should('be.visible');
        });

        it('displays the correct dialog title', () => {
            cy.mount(withAllProviders(<DeclineDrawButton {...defaultProps} />));
            cy.getDataCy('game-control-button-decline-draw').click();
            cy.contains('Decline Draw').should('be.visible');
        });

        it('displays the correct dialog description', () => {
            cy.mount(withAllProviders(<DeclineDrawButton {...defaultProps} />));
            cy.getDataCy('game-control-button-decline-draw').click();
            cy.contains('Are you sure you want to decline the draw offer? The game will continue.').should(
                'be.visible'
            );
        });

        it('closes the dialog when cancel button is clicked', () => {
            cy.mount(withAllProviders(<DeclineDrawButton {...defaultProps} />));
            cy.getDataCy('game-control-button-decline-draw').click();
            cy.getDataCy('decline-draw-confirmation-dialog').should('be.visible');
            cy.getDataCy('decline-draw-cancel-button').click();
            cy.getDataCy('decline-draw-confirmation-dialog').should('not.exist');
        });
    });

    describe('Action Execution', () => {
        it('closes the dialog after confirmation', () => {
            cy.mount(withAllProviders(<DeclineDrawButton {...defaultProps} />));
            cy.getDataCy('game-control-button-decline-draw').click();
            cy.getDataCy('decline-draw-confirm-button').click();
            cy.getDataCy('decline-draw-confirmation-dialog').should('not.exist');
        });
    });
});

import React from 'react';
import ResignButton from '@/components/game/controls/resign-button';
import { withAllProviders } from '../../../support/component';
import { MatchmakingColor } from '@/lib/models/request/matchmaking';
import env from '@/lib/config/env';

describe('<ResignButton />', () => {
    const defaultProps = {
        gameId: 'test-game-id',
        color: MatchmakingColor.WHITE,
        gameStarted: true
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
            cy.mount(withAllProviders(<ResignButton {...defaultProps} />));
            cy.getDataCy('game-control-button-resign').should('be.visible');
        });

        it.skip('displays the correct tooltip text when game started', () => {
            cy.mount(withAllProviders(<ResignButton {...defaultProps} />));
            cy.getDataCy('game-control-button-resign').trigger('mouseenter');
            cy.contains('Resign from the game').should('be.visible');
        });

        it.skip('displays the correct tooltip text when game not started', () => {
            cy.mount(withAllProviders(<ResignButton {...defaultProps} gameStarted={false} />));
            cy.getDataCy('game-control-button-resign').trigger('mouseenter');
            cy.contains('Abandon the game').should('be.visible');
        });
    });

    describe('Dialog Interaction', () => {
        it('opens the confirmation dialog when button is clicked', () => {
            cy.mount(withAllProviders(<ResignButton {...defaultProps} />));
            cy.getDataCy('game-control-button-resign').click();
            cy.getDataCy('resign-confirmation-dialog').should('be.visible');
        });

        it('displays the correct dialog title when game started', () => {
            cy.mount(withAllProviders(<ResignButton {...defaultProps} />));
            cy.getDataCy('game-control-button-resign').click();
            cy.contains('Resign Game').should('be.visible');
        });

        it('displays the correct dialog title when game not started', () => {
            cy.mount(withAllProviders(<ResignButton {...defaultProps} gameStarted={false} />));
            cy.getDataCy('game-control-button-resign').click();
            cy.contains('Abandon Game').should('be.visible');
        });

        it('displays the correct dialog description when game started', () => {
            cy.mount(withAllProviders(<ResignButton {...defaultProps} />));
            cy.getDataCy('game-control-button-resign').click();
            cy.contains('Are you sure you want to resign? This will end the game and count as a loss.').should(
                'be.visible'
            );
        });

        it('displays the correct dialog description when game not started', () => {
            cy.mount(withAllProviders(<ResignButton {...defaultProps} gameStarted={false} />));
            cy.getDataCy('game-control-button-resign').click();
            cy.contains('Are you sure you want to abandon the game?').should('be.visible');
        });

        it('displays correct confirm button text when game started', () => {
            cy.mount(withAllProviders(<ResignButton {...defaultProps} />));
            cy.getDataCy('game-control-button-resign').click();
            cy.getDataCy('resign-confirm-button').should('contain.text', 'Resign');
        });

        it('displays correct confirm button text when game not started', () => {
            cy.mount(withAllProviders(<ResignButton {...defaultProps} gameStarted={false} />));
            cy.getDataCy('game-control-button-resign').click();
            cy.getDataCy('resign-confirm-button').should('contain.text', 'Abandon');
        });

        it('closes the dialog when cancel button is clicked', () => {
            cy.mount(withAllProviders(<ResignButton {...defaultProps} />));
            cy.getDataCy('game-control-button-resign').click();
            cy.getDataCy('resign-confirmation-dialog').should('be.visible');
            cy.getDataCy('resign-cancel-button').click();
            cy.getDataCy('resign-confirmation-dialog').should('not.exist');
        });
    });

    describe('Action Execution', () => {
        it('closes the dialog after confirmation', () => {
            cy.mount(withAllProviders(<ResignButton {...defaultProps} />));
            cy.getDataCy('game-control-button-resign').click();
            cy.getDataCy('resign-confirm-button').click();
            cy.getDataCy('resign-confirmation-dialog').should('not.exist');
        });
    });
});

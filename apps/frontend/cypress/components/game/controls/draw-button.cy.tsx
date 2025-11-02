import React from 'react';
import DrawButton from '@/components/game/controls/draw-button';
import { withAllProviders } from '../../../support/component';
import { MatchmakingColor } from '@/lib/models/request/matchmaking';
import env from '@/lib/config/env';

describe('<DrawButton />', () => {
    const defaultProps = {
        gameId: 'test-game-id',
        color: MatchmakingColor.WHITE,
        disabled: false,
        gameStarted: true
    };

    beforeEach(() => {
        cy.intercept('GET', `${env.REST_URLS.AUTH}/api/user/me`, {
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
            cy.mount(withAllProviders(<DrawButton {...defaultProps} />));
            cy.getDataCy('game-control-button-draw').should('be.visible');
        });

        it.skip('displays the correct tooltip text when game started', () => {
            cy.mount(withAllProviders(<DrawButton {...defaultProps} />));
            cy.getDataCy('game-control-button-draw').trigger('mouseenter');
            cy.contains('Offer a draw to your opponent').should('be.visible');
        });

        it.skip('displays the correct tooltip text when game not started', () => {
            cy.mount(withAllProviders(<DrawButton {...defaultProps} gameStarted={false} />));
            cy.getDataCy('game-control-button-draw').trigger('mouseenter');
            cy.contains('Wait for the game to start').should('be.visible');
        });
    });

    describe('Disabled States', () => {
        it('is disabled when disabled prop is true', () => {
            cy.mount(withAllProviders(<DrawButton {...defaultProps} disabled={true} />));
            cy.getDataCy('game-control-button-draw').should('be.disabled');
        });

        it('is disabled when game has not started', () => {
            cy.mount(withAllProviders(<DrawButton {...defaultProps} gameStarted={false} />));
            cy.getDataCy('game-control-button-draw').should('be.disabled');
        });

        it('is enabled when disabled is false and game has started', () => {
            cy.mount(withAllProviders(<DrawButton {...defaultProps} />));
            cy.getDataCy('game-control-button-draw').should('not.be.disabled');
        });

        it('does not open dialog when disabled button is clicked', () => {
            cy.mount(withAllProviders(<DrawButton {...defaultProps} disabled={true} />));
            cy.getDataCy('game-control-button-draw').click({ force: true });
            cy.getDataCy('draw-confirmation-dialog').should('not.exist');
        });
    });

    describe('Dialog Interaction', () => {
        it('opens the confirmation dialog when enabled button is clicked', () => {
            cy.mount(withAllProviders(<DrawButton {...defaultProps} />));
            cy.getDataCy('game-control-button-draw').click();
            cy.getDataCy('draw-confirmation-dialog').should('be.visible');
        });

        it('displays the correct dialog title', () => {
            cy.mount(withAllProviders(<DrawButton {...defaultProps} />));
            cy.getDataCy('game-control-button-draw').click();
            cy.contains('Offer Draw').should('be.visible');
        });

        it('displays the correct dialog description', () => {
            cy.mount(withAllProviders(<DrawButton {...defaultProps} />));
            cy.getDataCy('game-control-button-draw').click();
            cy.contains('Are you sure you want to offer a draw to your opponent?').should('be.visible');
        });

        it('closes the dialog when cancel button is clicked', () => {
            cy.mount(withAllProviders(<DrawButton {...defaultProps} />));
            cy.getDataCy('game-control-button-draw').click();
            cy.getDataCy('draw-confirmation-dialog').should('be.visible');
            cy.getDataCy('draw-cancel-button').click();
            cy.getDataCy('draw-confirmation-dialog').should('not.exist');
        });
    });

    describe('Action Execution', () => {
        it('calls onClickMessage with correct message when confirmed', () => {
            const onClickMessage = cy.stub().as('onClickMessage');
            cy.mount(withAllProviders(<DrawButton {...defaultProps} onClickMessage={onClickMessage} />));
            cy.getDataCy('game-control-button-draw').click();
            cy.getDataCy('draw-confirm-button').click();
            cy.get('@onClickMessage').should('have.been.calledWith', 'white offered a draw');
        });

        it('calls onClickMessage with correct message for black player', () => {
            const onClickMessage = cy.stub().as('onClickMessage');
            cy.mount(
                withAllProviders(
                    <DrawButton {...defaultProps} color={MatchmakingColor.BLACK} onClickMessage={onClickMessage} />
                )
            );
            cy.getDataCy('game-control-button-draw').click();
            cy.getDataCy('draw-confirm-button').click();
            cy.get('@onClickMessage').should('have.been.calledWith', 'black offered a draw');
        });

        it('closes the dialog after confirmation', () => {
            cy.mount(withAllProviders(<DrawButton {...defaultProps} onClickMessage={cy.stub()} />));
            cy.getDataCy('game-control-button-draw').click();
            cy.getDataCy('draw-confirm-button').click();
            cy.getDataCy('draw-confirmation-dialog').should('not.exist');
        });
    });
});

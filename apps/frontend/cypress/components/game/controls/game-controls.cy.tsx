import React from 'react';
import GameControls from '@/components/game/controls/game-controls';
import { withAllProviders } from '../../../support/component';
import { MatchmakingColor } from '@/lib/models/request/matchmaking';
import { DrawOffer } from '@/lib/models/request/game';
import { Color } from '@/lib/models/response/game';
import env from '@/lib/config/env';

describe('<GameControls />', () => {
    const defaultProps = {
        gameId: 'test-game-id',
        color: MatchmakingColor.WHITE,
        drawOffer: undefined,
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

    describe('Container Rendering', () => {
        it('renders the container with correct data-cy attribute', () => {
            cy.mount(withAllProviders(<GameControls {...defaultProps} />));
            cy.getDataCy('game-controls').should('be.visible');
        });
    });

    describe('Default Controls (No Draw Offer)', () => {
        it('shows resign button when no draw offer', () => {
            cy.mount(withAllProviders(<GameControls {...defaultProps} />));
            cy.getDataCy('game-control-button-resign').should('be.visible');
        });

        it('shows draw button when no draw offer', () => {
            cy.mount(withAllProviders(<GameControls {...defaultProps} />));
            cy.getDataCy('game-control-button-draw').should('be.visible');
        });

        it('does not show accept draw button when no draw offer', () => {
            cy.mount(withAllProviders(<GameControls {...defaultProps} />));
            cy.getDataCy('game-control-button-accept-draw').should('not.exist');
        });

        it('does not show decline draw button when no draw offer', () => {
            cy.mount(withAllProviders(<GameControls {...defaultProps} />));
            cy.getDataCy('game-control-button-decline-draw').should('not.exist');
        });
    });

    describe('Draw Offer Controls (Opponent Offered)', () => {
        const drawOfferFromOpponent: DrawOffer = {
            offeredBy: Color.BLACK,
            expiresAt: new Date(Date.now() + 10000)
        };

        it('shows accept draw button when opponent offers draw', () => {
            cy.mount(withAllProviders(<GameControls {...defaultProps} drawOffer={drawOfferFromOpponent} />));
            cy.getDataCy('game-control-button-accept-draw').should('be.visible');
        });

        it('shows decline draw button when opponent offers draw', () => {
            cy.mount(withAllProviders(<GameControls {...defaultProps} drawOffer={drawOfferFromOpponent} />));
            cy.getDataCy('game-control-button-decline-draw').should('be.visible');
        });

        it('does not show resign button when opponent offers draw', () => {
            cy.mount(withAllProviders(<GameControls {...defaultProps} drawOffer={drawOfferFromOpponent} />));
            cy.getDataCy('game-control-button-resign').should('not.exist');
        });

        it('does not show draw button when opponent offers draw', () => {
            cy.mount(withAllProviders(<GameControls {...defaultProps} drawOffer={drawOfferFromOpponent} />));
            cy.getDataCy('game-control-button-draw').should('not.exist');
        });
    });

    describe('Draw Offer Controls (Player Offered)', () => {
        const drawOfferFromPlayer: DrawOffer = {
            offeredBy: Color.WHITE,
            expiresAt: new Date(Date.now() + 10000)
        };

        it('shows resign button when player offers draw', () => {
            cy.mount(withAllProviders(<GameControls {...defaultProps} drawOffer={drawOfferFromPlayer} />));
            cy.getDataCy('game-control-button-resign').should('be.visible');
        });

        it('shows draw button when player offers draw', () => {
            cy.mount(withAllProviders(<GameControls {...defaultProps} drawOffer={drawOfferFromPlayer} />));
            cy.getDataCy('game-control-button-draw').should('be.visible');
        });

        it('disables draw button when player already offered draw', () => {
            cy.mount(withAllProviders(<GameControls {...defaultProps} drawOffer={drawOfferFromPlayer} />));
            cy.getDataCy('game-control-button-draw').should('be.disabled');
        });

        it('does not show accept draw button when player offers draw', () => {
            cy.mount(withAllProviders(<GameControls {...defaultProps} drawOffer={drawOfferFromPlayer} />));
            cy.getDataCy('game-control-button-accept-draw').should('not.exist');
        });

        it('does not show decline draw button when player offers draw', () => {
            cy.mount(withAllProviders(<GameControls {...defaultProps} drawOffer={drawOfferFromPlayer} />));
            cy.getDataCy('game-control-button-decline-draw').should('not.exist');
        });
    });

    describe('Props Propagation', () => {
        it('passes gameStarted prop to child components', () => {
            cy.mount(withAllProviders(<GameControls {...defaultProps} gameStarted={false} />));
            cy.getDataCy('game-control-button-draw').should('be.disabled');
        });
    });
});

import ChatBox from '@/components/game/chat/chat-box';
import { withAuthAndRouter } from '../../../support/component';
import { ChatMessage } from '@/lib/models/chat/chat';
import env from '@/lib/config/env';

const TEST_USER_ID = 'test-user-123';
const OPPONENT_USER_ID = 'opponent-456';

const userMessages: ChatMessage[] = [
    {
        messageId: 'msg-1',
        userId: TEST_USER_ID,
        message: 'Hello from user',
        timestamp: new Date()
    },
    {
        messageId: 'msg-2',
        userId: TEST_USER_ID,
        message: 'Another user message',
        timestamp: new Date()
    }
];

const opponentMessages: ChatMessage[] = [
    {
        messageId: 'msg-3',
        userId: OPPONENT_USER_ID,
        message: 'Hello from opponent',
        timestamp: new Date()
    },
    {
        messageId: 'msg-4',
        userId: OPPONENT_USER_ID,
        message: 'Another opponent message',
        timestamp: new Date()
    }
];

const systemMessages: ChatMessage[] = [
    {
        messageId: 'msg-5',
        userId: 'SYSTEM',
        message: 'Game started',
        timestamp: new Date()
    },
    {
        messageId: 'msg-6',
        userId: 'SYSTEM',
        message: 'Player joined',
        timestamp: new Date()
    }
];

const mixedMessages: ChatMessage[] = [userMessages[0], opponentMessages[0], systemMessages[0], userMessages[1]];

describe('<ChatBox />', () => {
    beforeEach(() => {
        cy.intercept('GET', `${env.REST_URLS.AUTH}/api/auth/user/me`, {
            statusCode: 200,
            body: { user: { id: TEST_USER_ID, email: 'test@example.com' } }
        }).as('getUser');
    });

    describe('Message Rendering & Display', () => {
        it('should render empty chat', () => {
            cy.mount(withAuthAndRouter(<ChatBox messages={[]} />));

            cy.getDataCy('chat-box').should('exist');
            cy.getDataCy('chat-message-user').should('not.exist');
            cy.getDataCy('chat-message-opponent').should('not.exist');
            cy.getDataCy('chat-input').should('be.visible');
        });

        it('should render user messages with correct styling', () => {
            cy.mount(withAuthAndRouter(<ChatBox messages={userMessages} />));

            cy.contains('Hello from user').should('be.visible');
            cy.contains('Another user message').should('be.visible');

            cy.getDataCy('chat-message-user').should('have.length', 2);
            cy.getDataCy('chat-message-user').first().should('have.class', 'justify-end');
            cy.getDataCy('chat-message-user').last().should('have.class', 'justify-end');

            cy.contains('Hello from user').parent().should('have.class', 'bg-primary');
            cy.contains('Hello from user').parent().should('have.class', 'rounded-br-none');

            cy.contains('You').should('exist');
        });

        it('should render opponent messages with correct styling', () => {
            cy.mount(withAuthAndRouter(<ChatBox messages={opponentMessages} />));

            cy.contains('Hello from opponent').should('be.visible');
            cy.contains('Another opponent message').should('be.visible');

            cy.getDataCy('chat-message-opponent').should('have.length', 2);
            cy.getDataCy('chat-message-opponent').first().should('have.class', 'justify-start');
            cy.getDataCy('chat-message-opponent').last().should('have.class', 'justify-start');

            cy.contains('Hello from opponent').parent().should('have.class', 'bg-muted');
            cy.contains('Hello from opponent').parent().should('have.class', 'rounded-bl-none');

            cy.contains('Opponent').should('exist');
        });

        it('should render system messages with correct styling', () => {
            cy.mount(withAuthAndRouter(<ChatBox messages={systemMessages} />));

            cy.contains('Game started').should('be.visible');
            cy.contains('Player joined').should('be.visible');

            cy.getDataCy('chat-message-system').should('have.length', 2);
            cy.getDataCy('chat-message-system').first().should('have.class', 'justify-center');
            cy.getDataCy('chat-message-system').last().should('have.class', 'justify-center');

            cy.contains('Game started').should('have.class', 'italic');
            cy.contains('Game started').should('have.class', 'text-muted-foreground');

            cy.contains('You').should('not.exist');
            cy.contains('Opponent').should('not.exist');
        });

        it('should render mixed message types in correct order', () => {
            cy.mount(withAuthAndRouter(<ChatBox messages={mixedMessages} />));

            cy.contains('Hello from user').should('be.visible');
            cy.contains('Hello from opponent').should('be.visible');
            cy.contains('Game started').should('be.visible');
            cy.contains('Another user message').should('be.visible');

            cy.getDataCy('chat-message-user').should('have.length', 2);
            cy.getDataCy('chat-message-opponent').should('have.length', 1);
            cy.getDataCy('chat-message-system').should('have.length', 1);

            cy.getDataCy('chat-message-user').first().should('have.class', 'justify-end');
            cy.getDataCy('chat-message-opponent').should('have.class', 'justify-start');
            cy.getDataCy('chat-message-system').should('have.class', 'justify-center');
        });
    });

    describe('Textarea Functionality', () => {
        it('should render textarea with placeholder', () => {
            cy.mount(withAuthAndRouter(<ChatBox messages={[]} />));

            cy.getDataCy('chat-input').should('be.visible').should('have.attr', 'placeholder', 'Type your message...');
            cy.getDataCy('chat-input').should('have.attr', 'rows', '2');
        });

        it('should update textarea value when typing', () => {
            cy.mount(withAuthAndRouter(<ChatBox messages={[]} />));

            cy.getDataCy('chat-input').type('Test message');
            cy.getDataCy('chat-input').should('have.value', 'Test message');
        });

        it('should accept multi-line input', () => {
            cy.mount(withAuthAndRouter(<ChatBox messages={[]} />));

            cy.getDataCy('chat-input').type('Line 1{shift+enter}Line 2');
            cy.getDataCy('chat-input').should('contain.value', 'Line 1\nLine 2');
        });
    });

    describe('Sending Messages', () => {
        it('should send message with Enter key and clear input', () => {
            const onSend = cy.stub().as('onSend');
            cy.mount(withAuthAndRouter(<ChatBox messages={[]} onSend={onSend} />));

            cy.getDataCy('chat-input').type('Test message{enter}');

            cy.get('@onSend').should('have.been.calledOnce');
            cy.get('@onSend').should('have.been.calledWith', 'Test message');
            cy.getDataCy('chat-input').should('have.value', '');
        });

        it('should create new line with Shift+Enter without sending', () => {
            const onSend = cy.stub().as('onSend');
            cy.mount(withAuthAndRouter(<ChatBox messages={[]} onSend={onSend} />));

            cy.getDataCy('chat-input').type('Line 1{shift+enter}Line 2');

            cy.get('@onSend').should('not.have.been.called');
            cy.getDataCy('chat-input').should('contain.value', 'Line 1\nLine 2');
        });

        it('should not send empty message', () => {
            const onSend = cy.stub().as('onSend');
            cy.mount(withAuthAndRouter(<ChatBox messages={[]} onSend={onSend} />));

            cy.getDataCy('chat-input').type('{enter}');

            cy.get('@onSend').should('not.have.been.called');
        });

        it('should not send whitespace-only message', () => {
            const onSend = cy.stub().as('onSend');
            cy.mount(withAuthAndRouter(<ChatBox messages={[]} onSend={onSend} />));

            cy.getDataCy('chat-input').type('   {enter}');

            cy.get('@onSend').should('not.have.been.called');
            cy.getDataCy('chat-input').should('have.value', '   ');
        });

        it('should send message with leading/trailing spaces', () => {
            const onSend = cy.stub().as('onSend');
            cy.mount(withAuthAndRouter(<ChatBox messages={[]} onSend={onSend} />));

            cy.getDataCy('chat-input').type('  message  {enter}');

            cy.get('@onSend').should('have.been.calledOnce');
            cy.get('@onSend').should('have.been.calledWith', '  message  ');
        });

        it('should send multiple messages sequentially', () => {
            const onSend = cy.stub().as('onSend');
            cy.mount(withAuthAndRouter(<ChatBox messages={[]} onSend={onSend} />));

            cy.getDataCy('chat-input').type('First message{enter}');
            cy.get('@onSend').should('have.been.calledOnce');

            cy.getDataCy('chat-input').type('Second message{enter}');
            cy.get('@onSend').should('have.been.calledTwice');
            cy.get('@onSend').should('have.been.calledWith', 'Second message');
        });
    });

    describe('Auto-scrolling Behavior', () => {
        it('should have scroll container with overflow', () => {
            cy.mount(withAuthAndRouter(<ChatBox messages={userMessages} />));

            cy.getDataCy('chat-messages-container').should('exist');
            cy.getDataCy('chat-messages-container').should('have.class', 'flex-1');
            cy.getDataCy('chat-messages-container').should('have.class', 'overflow-y-auto');
        });

        it('should render scroll reference element', () => {
            cy.mount(withAuthAndRouter(<ChatBox messages={userMessages} />));

            cy.getDataCy('chat-messages-container').within(() => {
                cy.get('div').last().should('exist');
            });
        });
    });

    describe('Edge Cases & Integration', () => {
        it('should work without onSend callback', () => {
            cy.mount(withAuthAndRouter(<ChatBox messages={[]} />));

            cy.getDataCy('chat-input').type('Test message{enter}');
            cy.getDataCy('chat-input').should('have.value', '');
        });

        it('should display long messages with word break', () => {
            const longMessage: ChatMessage[] = [
                {
                    messageId: 'long-1',
                    userId: TEST_USER_ID,
                    message:
                        'This is a very long message that should wrap properly and use word break styling to ensure it does not overflow the container boundaries and maintains proper layout',
                    timestamp: new Date()
                }
            ];

            cy.mount(withAuthAndRouter(<ChatBox messages={longMessage} />));

            cy.contains('This is a very long message').parent().should('have.class', 'break-words');
            cy.contains('This is a very long message').parent().should('have.class', 'max-w-[70%]');
        });

        it('should display multiple consecutive messages from same user', () => {
            cy.mount(withAuthAndRouter(<ChatBox messages={userMessages} />));

            cy.getDataCy('chat-message-user').first().should('have.class', 'justify-end');
            cy.getDataCy('chat-message-user').last().should('have.class', 'justify-end');

            cy.contains('You').should('exist');
            cy.get('.font-semibold.text-xs').should('have.length', 2);
        });

        it('should display messages with special characters', () => {
            const specialMessages: ChatMessage[] = [
                {
                    messageId: 'special-1',
                    userId: TEST_USER_ID,
                    message: 'Hello! 👋 How are you? 🎮♟️',
                    timestamp: new Date()
                }
            ];

            cy.mount(withAuthAndRouter(<ChatBox messages={specialMessages} />));

            cy.contains('Hello! 👋 How are you? 🎮♟️').should('be.visible');
        });
    });
});

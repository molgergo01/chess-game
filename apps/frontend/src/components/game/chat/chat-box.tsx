import React, { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/utils';
import { ChatMessage } from '@/lib/models/chat/chat';
import { useAuth } from '@/hooks/auth/useAuth';

interface ChatBoxProps {
    messages: ChatMessage[];
    onSend?: (message: string) => void;
}

function ChatBox({ messages, onSend, className, ...props }: ChatBoxProps & React.ComponentProps<'div'>) {
    const { userId } = useAuth();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (input.trim()) {
            onSend?.(input);
            setInput('');
        }
    };

    return (
        <div
            data-cy="chat-box"
            className={cn('flex flex-col rounded-lg border bg-background shadow-md p-2 h-full', className)}
            {...props}
        >
            <div data-cy="chat-messages-container" className="flex-1 overflow-y-auto space-y-2 p-2 min-h-0">
                {messages?.map((msg) => {
                    const isSystemMessage = msg.userId === 'SYSTEM';

                    if (isSystemMessage) {
                        return (
                            <div
                                key={msg.messageId}
                                data-cy="chat-message-system"
                                className="flex w-full justify-center"
                            >
                                <span className="text-xs italic text-muted-foreground opacity-70">{msg.message}</span>
                            </div>
                        );
                    }

                    const isUserMessage = msg.userId === userId;
                    return (
                        <div
                            key={msg.messageId}
                            data-cy={isUserMessage ? 'chat-message-user' : 'chat-message-opponent'}
                            className={`flex w-full ${isUserMessage ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm break-words shadow flex flex-col
                ${isUserMessage ? 'bg-primary text-primary-foreground rounded-br-none items-end' : 'bg-muted text-muted-foreground rounded-bl-none items-start'}`}
                            >
                                <span className="font-semibold text-xs mb-1 opacity-70">
                                    {isUserMessage ? 'You' : 'Opponent'}
                                </span>
                                <span>{msg.message}</span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-2 flex-shrink-0">
                <Textarea
                    data-cy="chat-input"
                    className="w-full resize-none rounded-lg border"
                    rows={2}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Type your message..."
                />
            </div>
        </div>
    );
}

export default ChatBox;

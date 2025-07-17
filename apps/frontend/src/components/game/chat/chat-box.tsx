import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/utils';

// Example message data structure
type Message = {
    id: number;
    text: string;
    sender: 'me' | 'other';
};

function ChatBox({ className, ...props }: React.ComponentProps<'div'>) {
    // Example messages; replace with your state/props as needed
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: 'Hello!', sender: 'other' },
        { id: 2, text: 'Hi there!', sender: 'me' },
        { id: 3, text: 'How are you?', sender: 'other' }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (input.trim()) {
            setMessages([
                ...messages,
                { id: Date.now(), text: input, sender: 'me' }
            ]);
            setInput('');
        }
    };

    return (
        <div
            className={cn(
                'flex flex-col rounded-lg border bg-background shadow-md p-2',
                className
            )}
            {...props}
        >
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto space-y-2 p-2 min-h-0">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex w-full ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm break-words shadow flex flex-col
                ${msg.sender === 'me' ? 'bg-primary text-primary-foreground rounded-br-none items-end' : 'bg-muted text-muted-foreground rounded-bl-none items-start'}`}
                        >
                            <span className="font-semibold text-xs mb-1 opacity-70">
                                {msg.sender === 'me' ? 'You' : 'Opponent'}
                            </span>
                            <span>{msg.text}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-2 flex-shrink-0">
                <Textarea
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

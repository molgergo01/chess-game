function ChatBubble({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={className} {...props}></div>;
}

export default ChatBubble;

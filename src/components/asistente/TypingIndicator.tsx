export function TypingIndicator() {
  return (
    <div className="chat-row bot">
      <div className="chat-bubble bot chat-typing">
        <span className="chat-typing-dot" />
        <span className="chat-typing-dot" />
        <span className="chat-typing-dot" />
      </div>
    </div>
  )
}

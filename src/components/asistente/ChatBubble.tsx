import type { AssistantMessage } from '../../types'

interface Props {
  message: AssistantMessage
}

function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  )
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ChatBubble({ message }: Props) {
  const isBot = message.role === 'bot'
  return (
    <div className={`chat-row ${isBot ? 'bot' : 'user'}`}>
      <div className={`chat-bubble ${isBot ? 'bot' : 'user'}`}>
        <div className="chat-bubble-text">{renderText(message.text)}</div>
        {message.list && message.list.length > 0 && (
          <div className="chat-bubble-list">
            {message.list.map((item, i) => (
              <div key={i} className="chat-bubble-list-item">
                <div className="chat-bubble-list-main">
                  <div>{item.main}</div>
                  {item.sub && <div className="chat-bubble-list-sub">{item.sub}</div>}
                </div>
                {item.amount && <div className="chat-bubble-list-amount">{item.amount}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={`chat-bubble-time ${isBot ? 'bot' : 'user'}`}>{formatTime(message.timestamp)}</div>
    </div>
  )
}

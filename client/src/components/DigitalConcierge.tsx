import { useState, useRef, useEffect } from 'react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export default function DigitalConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: "Good evening. I'm your digital concierge. How may I help you curate your next sanctuary today?",
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      sender: 'user',
      text: inputValue.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages(prev => [...prev, userMessage]);
    const typedText = inputValue.trim().toLowerCase();
    setInputValue('');

    // Simulate AI response
    setIsTyping(true);
    setTimeout(() => {
      let aiReply =
        'I would be delighted to assist you. Smart Stay AI can curate a custom itinerary for you. Would you prefer a beach sanctuary in Phu Quoc, a cultural experience in Hoi An, or a French villa in Da Lat?';

      if (typedText.includes('bali')) {
        aiReply =
          'Bali is a wonderful choice! We have 1,240 verified luxury properties there, including clifftop villas in Uluwatu and spiritual sanctuaries in Ubud. Let me know if you would like me to lock in members-only rates.';
      } else if (typedText.includes('paris')) {
        aiReply =
          'Paris exudes classic sophistication. We feature 890 curated penthouses and boutique hotels overlooking the Seine. Would you like a view of the Eiffel Tower for your stay?';
      } else if (
        typedText.includes('vietnam') ||
        typedText.includes('hạ long') ||
        typedText.includes('ha long') ||
        typedText.includes('hội an') ||
        typedText.includes('hoi an') ||
        typedText.includes('đà lạt') ||
        typedText.includes('da lat') ||
        typedText.includes('phú quốc') ||
        typedText.includes('phu quoc')
      ) {
        aiReply =
          'Vietnam offers some of our finest Quiet Luxury escapes. From emerald cruises in Ha Long Bay, heritage lantern villas in Hoi An, pine retreats in Da Lat, to sunset spa resorts in Phu Quoc. What type of scenery are you dreaming of?';
      } else if (
        typedText.includes('deal') ||
        typedText.includes('khuyến mãi') ||
        typedText.includes('giá') ||
        typedText.includes('price')
      ) {
        aiReply =
          "We currently have outstanding weekend deals! For instance, 'The Azure Sanctuary' in the Maldives is -15% off, and the 'Timberline Retreat' in Aspen is -20% off. You can see these under our 'Deals' section.";
      } else if (
        typedText.includes('hello') ||
        typedText.includes('hi') ||
        typedText.includes('xin chào')
      ) {
        aiReply =
          'Hello! I am your AI-powered Concierge. I can help you find exclusive rates, book boutique hotels, and plan your luxury travel itineraries. Where would you like to explore?';
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="fixed bottom-8 right-8 z-100 group font-be-vietnam">
      {/* Chat Window */}
      <div
        className={`absolute bottom-20 right-0 w-87.5 max-h-125 h-125 bg-surface/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'scale-100 opacity-100 pointer-events-auto'
            : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-on-surface p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-ai-glow flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-on-surface text-sm">
                auto_awesome
              </span>
            </div>
            <div>
              <h4 className="text-white text-xs font-bold font-be-vietnam">
                Digital Concierge
              </h4>
              <p className="text-white/60 text-[9px] uppercase tracking-widest font-be-vietnam">
                Always Online
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Messages List */}
        <div className="grow p-4 space-y-4 overflow-y-auto hide-scrollbar bg-surface-container-low/50">
          {messages.map((msg, index) => {
            const isAI = msg.sender === 'ai';
            return (
              <div
                key={index}
                className={`flex flex-col max-w-[85%] ${isAI ? 'self-start' : 'self-end ml-auto'}`}
              >
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    isAI
                      ? 'bg-white text-on-surface rounded-tl-none premium-shadow border border-outline-variant/10'
                      : 'bg-on-surface text-white rounded-tr-none'
                  }`}
                >
                  <p
                    className={
                      isAI
                        ? 'italic text-on-surface-variant font-medium'
                        : 'font-normal'
                    }
                  >
                    {msg.text}
                  </p>
                </div>
                <span
                  className={`text-[9px] text-on-surface-variant/60 mt-1 ${isAI ? 'text-left' : 'text-right'}`}
                >
                  {msg.time}
                </span>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex flex-col max-w-[85%] self-start">
              <div className="bg-white p-4 rounded-2xl rounded-tl-none premium-shadow border border-outline-variant/10 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSend}
          className="p-4 border-t border-outline-variant/20 bg-white"
        >
          <div className="relative flex items-center">
            <input
              className="w-full bg-surface-container-high border-none rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-1 focus:ring-ai-glow placeholder:text-outline/50 outline-none"
              placeholder="Ask anything (e.g. Bali, Paris, Deals)..."
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 text-primary hover:text-on-surface transition-colors cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </form>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-on-surface rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(143,211,211,0.4)] hover:shadow-[0_0_30px_rgba(143,211,211,0.6)] transition-all duration-300 relative overflow-hidden cursor-pointer"
      >
        <div className="absolute inset-0 bg-linear-to-tr from-ai-glow/20 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
        <span className="material-symbols-outlined text-white text-3xl z-10 transition-transform duration-300 group-hover:rotate-12">
          {isOpen ? 'close' : 'chat'}
        </span>
      </button>
    </div>
  );
}

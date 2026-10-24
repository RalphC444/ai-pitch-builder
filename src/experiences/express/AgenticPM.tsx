import React, { useEffect, useRef, useState } from 'react';
import { CloseIcon } from '../../components/icons/CloseIcon';
import {
  AdvisorFilter,
  ExpressAdvisor,
  matchesFilters,
  mergeFilters,
  parseFilterRequest,
} from '../../data/expressList';
import aiSparkleUrl from '../../assets/ai.svg';

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  /** Filters the assistant proposed in this message */
  proposal?: AdvisorFilter[];
  /** Whether this proposal was applied to the table */
  applied?: boolean;
}

interface AgenticPMProps {
  roster: ExpressAdvisor[];
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  appliedFilters: AdvisorFilter[];
  onApplyFilters: (filters: AdvisorFilter[]) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const font = "'Poppins', sans-serif";

/** Agentic PM is hidden until its design is agreed. Flip to true to show it on the Express List. */
export const AGENTIC_PM_ENABLED = false;

const SUGGESTIONS = [
  'Formers of Novo Nordisk or Eli Lilly in Angle 1, based in the US',
  'Unvetted advisors under $500 an hour',
  'Recommendation score above 85',
  'Worked at Sandoz between 2019 and 2023',
];

export const AGENTIC_PM_GREETING: ChatMessage = {
  id: 'greeting',
  role: 'assistant',
  text: "Hi, I'm your Agentic PM. Tell me who you're looking for and I'll filter the Express List - by company (current or former), angle, country, vetting status, rate, recommendation score, engagement or employment years.",
};

let messageCount = 0;
const nextId = () => `message-${Date.now()}-${messageCount++}`;

const operatorLabel = (filter: AdvisorFilter) => filter.operator;

/**
 * AgenticPM Component
 *
 * Floating chat on the right of the Express List that replaces the filter panel:
 * describe the advisors you need in plain English, review the proposed filters
 * and match count, then apply them to the table. Follow-ups add to the filters.
 */
export const AgenticPM: React.FC<AgenticPMProps> = ({
  roster,
  messages,
  setMessages,
  appliedFilters,
  onApplyFilters,
  isOpen,
  onOpenChange,
}) => {
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keep the latest message in view
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking, isOpen]);

  // Filters so far = the most recent proposal (applied or not)
  const latestProposal = [...messages].reverse().find((message) => message.proposal)?.proposal || appliedFilters;

  const updateProposal = (messageId: string, proposal: AdvisorFilter[]) => {
    setMessages((previous) => previous.map((message) => (message.id === messageId ? { ...message, proposal, applied: false } : message)));
  };

  const send = (text: string) => {
    const request = text.trim();
    if (!request || isThinking) return;
    setInput('');
    setMessages((previous) => [...previous, { id: nextId(), role: 'user', text: request }]);
    setIsThinking(true);

    setTimeout(() => {
      const parsed = parseFilterRequest(request, roster);
      let reply: ChatMessage;
      if (parsed.reset && parsed.filters.length === 0) {
        onApplyFilters([]);
        reply = { id: nextId(), role: 'assistant', text: `Cleared all filters - showing all ${roster.length} advisors.`, proposal: [], applied: true };
      } else if (parsed.filters.length === 0 && parsed.removeFields.length === 0) {
        reply = {
          id: nextId(),
          role: 'assistant',
          text: "I couldn't turn that into filters. Try a company (\"former Novo Nordisk\"), an angle (\"Angle 2\"), a country, vetting status, rate (\"under $400\"), score (\"above 80\") or years (\"between 2019 and 2023\").",
        };
      } else {
        const proposal = mergeFilters(latestProposal, parsed);
        reply = {
          id: nextId(),
          role: 'assistant',
          text: parsed.reset ? 'Starting fresh. Here’s how I’d filter the list:' : 'Here’s how I’d filter the list:',
          proposal,
        };
      }
      setMessages((previous) => [...previous, reply]);
      setIsThinking(false);
    }, 600);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => onOpenChange(true)}
        className="fixed flex items-center gap-2 rounded-full pl-3 pr-4 py-2.5 bg-white hover:bg-[#f6f8fb] transition-colors"
        style={{ right: '24px', bottom: '88px', zIndex: 55, boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.16)', fontFamily: font, fontSize: '14px', fontWeight: 600, color: '#1c2024' }}
        aria-label="Open Agentic PM"
      >
        <img src={aiSparkleUrl} alt="" width={18} height={18} />
        Agentic PM
        {appliedFilters.length > 0 && (
          <span className="rounded-full px-1.5" style={{ fontSize: '11px', backgroundColor: '#0068bc', color: '#ffffff' }}>{appliedFilters.length}</span>
        )}
      </button>
    );
  }

  return (
    <aside
      className="agentic-pm fixed flex flex-col bg-white"
      style={{ zIndex: 55, border: '1px solid #ebebeb', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.14)', fontFamily: font }}
      aria-label="Agentic PM"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3" style={{ borderBottom: '1px solid #ebebeb' }}>
        <div className="flex items-center gap-2 min-w-0">
          <img src={aiSparkleUrl} alt="" width={20} height={20} />
          <div className="flex flex-col min-w-0">
            <h2 style={{ fontSize: '15px', lineHeight: '20px', fontWeight: 600, color: '#1c2024' }}>Agentic PM</h2>
            <span className="truncate" style={{ fontSize: '11px', color: '#5c5c5c' }}>Filters your advisor list from plain English</span>
          </div>
        </div>
        <button
          onClick={() => onOpenChange(false)}
          className="flex items-center justify-center rounded-full w-8 h-8 hover:bg-black/[0.04]"
          aria-label="Minimize Agentic PM"
          title="Minimize"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" aria-live="polite">
        {messages.map((message) => (
          message.role === 'user' ? (
            <div key={message.id} className="self-end max-w-[85%] rounded-2xl rounded-br-md px-3 py-2" style={{ backgroundColor: '#0068bc', color: '#ffffff', fontSize: '13px', lineHeight: '19px' }}>
              {message.text}
            </div>
          ) : (
            <div key={message.id} className="self-start w-full flex flex-col gap-2">
              <p className="rounded-2xl rounded-bl-md px-3 py-2 self-start max-w-[95%]" style={{ backgroundColor: '#f0f4f8', color: '#1c2024', fontSize: '13px', lineHeight: '19px' }}>
                {message.text}
              </p>
              {message.proposal && message.proposal.length > 0 && (
                <ProposalCard
                  filters={message.proposal}
                  roster={roster}
                  applied={!!message.applied}
                  onChange={(filters) => updateProposal(message.id, filters)}
                  onApply={() => {
                    onApplyFilters(message.proposal || []);
                    setMessages((previous) => previous.map((item) => ({ ...item, applied: item.id === message.id })));
                    inputRef.current?.focus();
                  }}
                  onClear={() => {
                    onApplyFilters([]);
                    setMessages((previous) => [
                      ...previous.map((item) => (item.id === message.id ? { ...item, proposal: [], applied: false } : item)),
                      { id: nextId(), role: 'assistant' as const, text: `Cleared - showing all ${roster.length} advisors.` },
                    ]);
                  }}
                />
              )}
            </div>
          )
        ))}

        {isThinking && (
          <div className="self-start flex items-center gap-1 rounded-2xl px-3 py-2.5" style={{ backgroundColor: '#f0f4f8' }} aria-label="Agentic PM is thinking">
            {[0, 1, 2].map((dot) => (
              <span key={dot} className="block rounded-full animate-pulse" style={{ width: '6px', height: '6px', backgroundColor: '#8b8d98', animationDelay: `${dot * 150}ms` }} />
            ))}
          </div>
        )}

        {messages.length <= 1 && !isThinking && (
          <div className="flex flex-col gap-1.5 pt-1">
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#8b8d98', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Try</span>
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => send(suggestion)}
                className="text-left rounded-lg px-3 py-2 hover:bg-[#e8eef6] transition-colors"
                style={{ fontSize: '12px', lineHeight: '17px', color: '#1c2024', border: '1px solid #e1e5ee' }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex items-end gap-2 rounded-2xl pl-3 pr-1.5 py-1.5" style={{ border: `1px solid ${input ? '#0068bc' : '#d6d6d6'}` }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                send(input);
              }
            }}
            rows={input.length > 40 ? 3 : 1}
            placeholder={appliedFilters.length > 0 || messages.some((message) => message.proposal?.length) ? 'What would you like to add?' : 'Describe the advisors you need…'}
            className="flex-1 resize-none bg-transparent focus:outline-none self-center"
            style={{ fontSize: '13px', lineHeight: '19px', color: '#1c2024' }}
            aria-label="Message Agentic PM"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isThinking}
            className="flex items-center justify-center rounded-full shrink-0 transition-colors"
            style={{
              width: '30px',
              height: '30px',
              backgroundColor: input.trim() && !isThinking ? '#1c2024' : '#d6d6d6',
              color: input.trim() && !isThinking ? '#ffffff' : 'rgba(0, 0, 0, 0.5)',
              fontSize: '14px',
              fontWeight: 700,
            }}
            aria-label="Send"
          >
            ↑
          </button>
        </div>
      </div>
    </aside>
  );
};

/** Proposed filters as rows of removable chips, with the live match count */
const ProposalCard: React.FC<{
  filters: AdvisorFilter[];
  roster: ExpressAdvisor[];
  applied: boolean;
  onChange: (filters: AdvisorFilter[]) => void;
  onApply: () => void;
  onClear: () => void;
}> = ({ filters, roster, applied, onChange, onApply, onClear }) => {
  const matches = roster.filter((advisor) => matchesFilters(advisor, filters));
  const preview = matches.slice(0, 3).map((advisor) => advisor.profile.name.replace(/^Dr\.\s+/, ''));

  const removeValue = (filterIndex: number, value: string) => {
    const next = filters
      .map((filter, index) => (index === filterIndex ? { ...filter, values: filter.values.filter((item) => item !== value) } : filter))
      .filter((filter) => filter.values.length > 0 && !(filter.operator === 'between' && filter.values.length < 2));
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2.5 rounded-xl p-3" style={{ border: `1px solid ${applied ? '#9bd3b0' : '#e1e5ee'}`, backgroundColor: '#ffffff' }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: '#8b8d98', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Filter Advisors by:</span>
      <ul className="flex flex-col gap-2">
        {filters.map((filter, filterIndex) => (
          <li key={`${filter.field}-${filterIndex}`} className="flex flex-col gap-1">
            <span style={{ fontSize: '12px', color: '#5c5c5c' }}>
              <strong style={{ color: '#1c2024', fontWeight: 600 }}>{filter.field}</strong> {operatorLabel(filter)}
            </span>
            <span className="flex flex-wrap gap-1">
              {filter.values.map((value) => (
                <span key={value} className="inline-flex items-center gap-1 rounded-md pl-2 pr-1 py-0.5" style={{ fontSize: '12px', backgroundColor: '#e6f0fa', color: '#0068bc' }}>
                  {filter.field === 'Hourly Rate' ? `$${value}` : value}
                  <button
                    onClick={() => removeValue(filterIndex, value)}
                    className="rounded px-1 hover:bg-[#cfe1f3]"
                    aria-label={`Remove ${value}`}
                    disabled={applied}
                    style={{ opacity: applied ? 0.4 : 1 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <p style={{ fontSize: '12px', lineHeight: '17px', color: matches.length ? '#1c2024' : '#c41e2f' }}>
        <strong>{matches.length} of {roster.length}</strong> advisors match
        {preview.length > 0 && <span style={{ color: '#5c5c5c' }}>: {preview.join(', ')}{matches.length > 3 ? ` +${matches.length - 3}` : ''}</span>}
        {matches.length === 0 && ' - try removing a filter.'}
      </p>
      <div className="flex items-center justify-end gap-2">
        {applied ? (
          <span className="mr-auto inline-flex items-center gap-1" style={{ fontSize: '12px', fontWeight: 600, color: '#149c4d' }}>✓ Applied to the list</span>
        ) : null}
        <button onClick={onClear} className="px-2 py-1.5 rounded-md hover:bg-black/[0.04]" style={{ fontSize: '12px', fontWeight: 600, color: '#0068bc' }}>
          Clear
        </button>
        {!applied && (
          <button
            onClick={onApply}
            disabled={matches.length === 0}
            className="px-3 py-1.5 rounded-md disabled:opacity-50"
            style={{ fontSize: '12px', fontWeight: 600, backgroundColor: '#0068bc', color: '#ffffff' }}
          >
            Apply Filter
          </button>
        )}
      </div>
    </div>
  );
};

export default AgenticPM;

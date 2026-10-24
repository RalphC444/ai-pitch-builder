import React from 'react';
import { Modal } from '../../components/modal';
import { Tag } from '../../components/badges/Tag';
import { AngleTags } from '../../components/badges/AngleTags';
import { GuidepointLogo } from '../../components/brand/GuidepointLogo';
import type { ContentBlock } from '../../data/contentBlocks';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import XIcon from '@mui/icons-material/X';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import type { EmailDraft } from '../../data/agentReview';
import { getCurrentRoleText, hasCurrentRoleLine, Profile } from '../../data/profiles';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: EmailDraft;
  profiles: Profile[];
}


/** Email typography from the Guidepoint email template (Figma "email comp 2026") */
const EMAIL_FONT = 'Arial, Helvetica, sans-serif';

/** One added content block as it appears in the email (empty blocks are skipped) */
const EmailBlock: React.FC<{ block: ContentBlock }> = ({ block }) => {
  const isEmpty = block.html.replace(/<[^>]+>/g, '').trim() === '';
  if (block.type === 'divider') return <hr style={{ border: 0, borderTop: '1px solid #d5d5d5', margin: 0 }} />;
  if (isEmpty) return null;
  if (block.type === 'heading') return <h3 style={{ fontSize: '20px', lineHeight: 1.4, fontWeight: 700 }} dangerouslySetInnerHTML={{ __html: block.html }} />;
  if (block.type === 'callout') {
    return (
      <div className="rich-text-editor" style={{ padding: '12px 16px', backgroundColor: '#fff8db', borderLeft: '4px solid #FFCD00', borderRadius: '4px' }} dangerouslySetInnerHTML={{ __html: block.html }} />
    );
  }
  return <div className="rich-text-editor" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: block.html }} />;
};

/**
 * Rendered email body as the client will receive it: intro, each advisor
 * (name, angle and vetting tags, role, pitch) and the sign-off.
 */
export const EmailBody: React.FC<{ draft: EmailDraft; profiles: Profile[] }> = ({ draft, profiles }) => (
  <div className="flex flex-col gap-6" style={{ fontFamily: EMAIL_FONT, fontSize: '16px', lineHeight: 1.4, color: '#0b0b0b' }}>
    <div className="rich-text-editor" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: draft.introHtml }} />
    {profiles.map((profile) => {
      const currentRoleText = !hasCurrentRoleLine(profile.contentHtml) && getCurrentRoleText(profile);
      return (
        <div key={profile.id} className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span style={{ fontWeight: 700 }}>{profile.name}</span>
            <AngleTags angles={profile.angles} />
            {profile.status === 'vetted' ? <Tag label="Vetted" tone="vetted" /> : <Tag label="Unvetted" tone="unvetted" />}
          </div>
          {currentRoleText && <p>{currentRoleText}</p>}
          <div className="pitch-content" dangerouslySetInnerHTML={{ __html: profile.contentHtml || '' }} />
        </div>
      );
    })}
    {(draft.blocks || []).map((block) => <EmailBlock key={block.id} block={block} />)}
    <div className="rich-text-editor" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: draft.outroHtml }} />
  </div>
);

/**
 * Email header lines as an email client shows them (From / To / Cc / Bcc /
 * Subject; Cc includes Compliance). Shared by the preview and the sent screen
 * so they always match.
 */
export const EmailHeaderRows: React.FC<{ draft: EmailDraft; sentAt?: string }> = ({ draft, sentAt }) => {
  const rows = [
    ['From', draft.from],
    ['Sent', sentAt || ''],
    ['To', draft.to],
    ['Cc', [draft.cc, draft.complianceCc].filter(Boolean).join(', ')],
    ['Bcc', draft.bcc],
    ['Subject', draft.subject],
  ].filter(([, value]) => value);
  return (
    <div className="text-left" style={{ fontFamily: EMAIL_FONT, fontSize: '14px', lineHeight: 1.4, color: '#000000' }}>
      {rows.map(([label, value]) => (
        <p key={label} className="break-words">{label}: {value}</p>
      ))}
    </div>
  );
};

const OFFICES = 'New York | Boston | Phoenix | San Francisco | London | Dusseldorf | Athens | Dubai | Mumbai | Singapore | Hong Kong | Shanghai | Seoul | Tokyo | Sydney';

const LEGAL = 'This e-mail message, and any attachments, is intended only for the use of the individual or entity identified in the alias address of this message and may contain information that is confidential, privileged and subject to legal restrictions and penalties regarding its unauthorized disclosure and use. Any unauthorized review, copying, disclosure, distribution or use is strictly prohibited. If you have received this e-mail message in error, please notify the sender immediately by reply e-mail and delete this message, and any attachments, from your system. Thank you for your cooperation.';

const SOCIAL = [
  { label: 'LinkedIn', Icon: LinkedInIcon },
  { label: 'X', Icon: XIcon },
  { label: 'Facebook', Icon: FacebookIcon },
  { label: 'Instagram', Icon: InstagramIcon },
];

/** Logo above the body (brand: 40px logotype, 20px safety) */
export const EmailBrandHeader: React.FC = () => (
  <div className="flex justify-center w-full py-5">
    <GuidepointLogo height={40} />
  </div>
);

/** Offices line, legal disclaimer and the yellow brand footer band */
export const EmailBrandFooter: React.FC = () => (
  <>
    <div className="w-full flex justify-center px-4 sm:px-6">
      <div className="flex flex-col gap-12 w-full max-w-[600px] pt-3 pb-12" style={{ fontFamily: EMAIL_FONT, fontSize: '16px', lineHeight: 1.4, color: '#999999' }}>
        <p>{OFFICES}</p>
        <p>{LEGAL}</p>
      </div>
    </div>
    <div className="w-full flex justify-center px-4 sm:px-6" style={{ backgroundColor: '#FFCD00' }}>
      <div className="flex items-center justify-between w-full max-w-[600px]" style={{ height: '64px' }}>
        <GuidepointLogo height={24} tone="black" />
        <span className="flex items-center gap-4" style={{ color: '#000000' }}>
          {SOCIAL.map(({ label, Icon }) => <Icon key={label} sx={{ fontSize: 20 }} aria-label={label} />)}
        </span>
      </div>
    </div>
  </>
);

/**
 * EmailPreviewModal Component
 *
 * Shows the email headers and body exactly as they'll be sent.
 */
export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({ isOpen, onClose, draft, profiles }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Email Preview" width="760px">
    <div className="flex flex-col gap-4 w-full max-h-[65vh] overflow-y-auto">
      <div className="pb-3 border-b" style={{ borderColor: '#d5d5d5' }}>
        <EmailHeaderRows draft={draft} />
      </div>
      <EmailBody draft={draft} profiles={profiles} />
    </div>
  </Modal>
);

export default EmailPreviewModal;

# Pitch Curation & AI Generation Workflow Tool - Project Plan


YOU ARE NOT ALLOWED TO DOWNLOAD OR GET SVGS FROM FIGMA DO NOT ADD SVGS TO THE FILE BY YOURSELF

## Project Overview
A production-ready, frontend-only Pitch curation and AI generation workflow tool built with React and Tailwind CSS. All components must be properly componentized and reusable.

## Technical Stack
- **Framework**: React
- **Styling**: Tailwind CSS
- **Editor**: Quill (may need customization or replacement)
- **Design System**: Nexus Design System tokens
- **Backend**: None (frontend-only)
- **Design Reference**: Figma MCP

---

## Phase 1: Design System Setup & Core Components

### 0. Color Swatch Components
- [ ] Create color swatch components from Nexus design system tokens
- [ ] Ensure all color tokens are accessible and properly typed
- [ ] Document color usage patterns

### 1. Text Style Tokens
- [ ] Create text style components/tokens with configurable:
  - Font family
  - Font size
  - Font weight
- [ ] Ensure tokens are easily changeable across the application
- [ ] Create TypeScript types/interfaces for text styles

### 2. Navigation Component
- [ ] Componentize navigation bar
- [ ] Exclude close toolbar component (to be implemented in Phase 1, #5)
- [ ] Ensure responsive design
- [ ] Match Figma design specifications

### 3. Profile Cards Component (View Mode)
- [ ] Create reusable Profile Card component
- [ ] Implement view mode only (edit mode in Phase 2)
- [ ] Display profile information clearly
- [ ] Ensure proper spacing and layout
- [ ] Match Figma design specifications

### 4. AI Loading Component
- [ ] Create loading state component for AI operations
- [ ] Design smooth loading animations
- [ ] Ensure accessibility (loading states, ARIA labels)
- [ ] Match Figma design specifications

### 5. Toolbar Components
- [ ] Create toolbar component system
- [ ] Implement states (as found in Figma component)
- [ ] Support multiple variants:
  - Icon + Text
  - Icon only
  - Icon dropdown with Menu
- [ ] Close toolbar component (previously excluded from #2)
- [ ] Ensure all toolbar states match Figma specifications

### 6. Angle Badges with Numeric Icons
- [ ] Create Angle Badge component
- [ ] Integrate numeric icons (to be provided)
- [ ] Ensure proper styling and spacing
- [ ] Match Figma design specifications

### 7. Vetted/Unvetted Context Badges
- [ ] Create badge component for Vetted status
- [ ] Create badge component for Unvetted status
- [ ] Ensure clear visual distinction
- [ ] Match Figma design specifications

---

## Phase 2: Editor & Advanced Components

### Prompt Library File
- [ ] Create prompt library file (not in UI, data structure only)
- [ ] Organize prompts by angle name
- [ ] Match prompt file names to angle names
- [ ] Ensure prompts are easily accessible and maintainable

### Quill Editor Component
- [ ] Integrate Quill library for document editing
- [ ] Customize toolbar items as needed
- [ ] **Note**: May need to replace Quill with custom editor if customization requirements are too complex
- [ ] Ensure editor matches Figma design specifications
- [ ] Implement proper state management for editor content

### Edit Mode View
- [ ] Create edit mode view matching Figma MCP design
- [ ] Integrate with Profile Cards component
- [ ] Ensure smooth transition between view and edit modes
- [ ] Implement proper form validation and state management

### Profile Details Drawer
- [ ] Create complex information slide-out drawer component
- [ ] Implement launch mechanism from icon in edit mode
- [ ] Design drawer with proper animations and transitions
- [ ] Ensure responsive design
- [ ] Display comprehensive profile information
- [ ] Match Figma design specifications

---

## Phase 3: AI Features

### AI Rewrite in Document Editor
- [ ] Implement AI rewrite functionality within document editor
- [ ] Create UI for triggering AI rewrite
- [ ] Display rewrite results in editor
- [ ] Allow user to accept/reject changes
- [ ] Ensure proper loading states during AI operations

### AI Rewrite Based on Selected Profile Details
- [ ] Create mechanism to select profile details
- [ ] Implement AI rewrite that uses selected profile context
- [ ] Ensure proper integration with document editor
- [ ] Display which profile details are being used for context

### AI Sources Fetch
- [ ] Implement AI sources fetching functionality
- [ ] Surface sources in widget component
- [ ] Display sources in profile drawer when open
- [ ] **Note**: Implementation details may change - flexible approach needed
- [ ] Ensure proper loading and error states

---

## File Structure Recommendations

```
/src
  /components
    /design-system
      /colors
        ColorSwatch.tsx
        colorTokens.ts
      /typography
        TextStyles.tsx
        textTokens.ts
    /navigation
      Navigation.tsx
    /profile
      ProfileCard.tsx
      ProfileCardView.tsx
    /ai
      AILoading.tsx
    /toolbar
      Toolbar.tsx
      ToolbarIcon.tsx
      ToolbarDropdown.tsx
      CloseToolbar.tsx
    /badges
      AngleBadge.tsx
      VettedBadge.tsx
      UnvettedBadge.tsx
    /editor
      DocumentEditor.tsx
      EditorToolbar.tsx
    /drawer
      ProfileDetailsDrawer.tsx
  /lib
    /prompts
      promptLibrary.ts
      /prompts
        [angle-name].md
  /hooks
    useAI.ts
    useEditor.ts
  /types
    profile.ts
    editor.ts
    ai.ts
  /utils
    promptLoader.ts
  App.tsx
  index.tsx
```

---

## Design System Principles

1. **Componentization**: All UI elements must be reusable React components
2. **Token-Based Styling**: Use design tokens for colors, typography, and spacing
3. **Figma Compliance**: All components must match Figma MCP specifications
4. **Accessibility**: Ensure proper ARIA labels, keyboard navigation, and semantic HTML
5. **Responsive Design**: Components must work across different screen sizes
6. **Type Safety**: Use TypeScript for all components and utilities

---

## Development Guidelines

- All styles must use Tailwind CSS
- Components should be functional components with hooks
- Use TypeScript for type safety
- Follow React best practices (proper key props, memoization where needed)
- Ensure proper error boundaries
- Implement proper loading and error states
- No backend dependencies - all data should be mockable/local

---

## Notes & Considerations

- **Quill Editor**: May need to be replaced with custom editor if customization requirements exceed library capabilities
- **Icon Assets**: Numeric icons for Angle Badges to be provided
- **Toolbar Menu**: Icon dropdown menu details to be provided
- **AI Sources**: Implementation approach may evolve during Phase 3
- **Design System**: All design tokens should reference Nexus Design System
- **Figma Integration**: Use Figma MCP for design reference throughout development

---

## Next Steps

1. Set up project structure and dependencies
2. Extract design tokens from Nexus Design System
3. Begin Phase 1 implementation in order (0-7)
4. Regular design reviews against Figma MCP
5. Iterate based on feedback and requirements


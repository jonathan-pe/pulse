---
applyTo: '**'
---

# Documentation Maintenance Instructions

## Overview

Pulse uses a dual-documentation strategy:

1. **Notion** - User-facing documentation for setup, API reference, guides
2. **Repository** - Technical context and implementation history for AI/developers

## Documentation Locations

### Notion Documentation Hub

**URL**: https://www.notion.so/2b1b971a5f65815ca215db86a24c75e2

**Contents**:

- 🚀 Setup & Development (Getting Started, Database Setup, Testing Guide)
- 🔌 API Documentation (API Endpoints, Auto-Scoring, CRON Schedule, CLI Commands)
- 🏗️ Architecture & Integrations (ESPN Integrator, Logger)
- 🗺️ Planning & Roadmap (Feature Roadmap)

**Update when**:

- Adding/changing API endpoints
- Adding/modifying CLI commands
- Changing setup procedures
- Updating CRON schedules
- Shipping new features (update roadmap status)
- Adding new integrations

### Technical Context Document

**Path**: `.github/TECHNICAL_CONTEXT.md`

**Contents**:

- Architecture overview & migration history
- Critical implementation patterns (spread normalization, auto-scoring)
- Point scoring algorithm details
- Integration specifics (NatStat, ESPN)
- Database patterns & idempotency
- Known issues & gotchas
- Debugging scenarios

**Update when**:

- Making architectural decisions
- Discovering non-obvious behavior
- Changing critical algorithms
- Finding/fixing complex bugs
- Adding new integrations
- Identifying new gotchas or edge cases

## Update Workflow

### For AI Assistants

When making changes to the codebase:

1. **Identify documentation impact**

   - Does this change user-facing behavior? → Update Notion
   - Does this add/change technical patterns? → Update Technical Context
   - Does this introduce new gotchas? → Update Technical Context

2. **Update Notion** (if needed)

   ```typescript
   // Use Notion MCP tools
   mcp_notion_notion -
     update -
     page({
       data: {
         page_id: '...',
         command: 'replace_content_range',
         selection_with_ellipsis: 'old content snippet...end',
         new_str: 'updated content',
       },
     })
   ```

3. **Update Technical Context** (if needed)

   - Add new sections for new patterns
   - Update existing sections when behavior changes
   - Add to "Known Issues & Gotchas"
   - Update debugging scenarios

4. **Update Feature Roadmap** (if shipping features)
   - Move items from "Planned" → "In Progress" → "Implemented"
   - Update implementation status with dates

### For Human Developers

When making significant changes:

1. Review `.github/TECHNICAL_CONTEXT.md` - Does your change affect any documented patterns?
2. Check Notion Documentation Hub - Does user-facing behavior change?
3. Update relevant sections in both places
4. If unsure, ask the AI to update documentation after your changes

## Documentation Standards

### Writing Style

- **Technical Context**: Concise, pattern-focused, includes code examples
- **Notion Docs**: User-friendly, step-by-step, includes troubleshooting

### Code Examples

- Use TypeScript for backend examples
- Include comments explaining non-obvious behavior
- Show both correct and incorrect patterns when helpful

### Versioning

- Include "Last updated" date at bottom of documents
- For breaking changes, note the change date in relevant sections

## Examples of Good Documentation Updates

### Example 1: New Feature

**Change**: Added hedge detection warning feature

**Updates needed**:

1. Technical Context → Add to "Known Issues & Gotchas" if there are edge cases
2. Notion Feature Roadmap → Move from "Planned" to "Implemented"
3. Notion API Endpoints → Add new endpoint if applicable

### Example 2: Bug Fix

**Change**: Fixed push handling to preserve streaks

**Updates needed**:

1. Technical Context → Remove from "Known Issues & Gotchas" (now fixed)
2. Technical Context → Add to "Scoring Logic" section explaining push behavior
3. Notion Auto-Scoring → Update scoring logic description

### Example 3: Architecture Change

**Change**: Switched from polling to webhooks for score updates

**Updates needed**:

1. Technical Context → Update "Future Architectural Considerations" (decision made)
2. Technical Context → Add new "Webhook Handling" section
3. Notion CRON Schedule → Update or remove polling schedules
4. Notion Auto-Scoring → Update to reflect webhook-based scoring

## Maintenance Checklist

When completing a feature or significant change:

- [ ] Updated Technical Context if patterns/architecture changed
- [ ] Updated Notion docs if user-facing behavior changed
- [ ] Updated Feature Roadmap if shipping a planned feature
- [ ] Added/updated debugging scenarios if discovering new issues
- [ ] Updated CLI/API reference if commands/endpoints changed
- [ ] Verified all code examples are accurate
- [ ] Updated "Last updated" dates

## Tools for Documentation

### Notion MCP Tools

- `mcp_notion_search` - Find existing pages
- `mcp_notion_fetch` - Get current page content
- `mcp_notion_notion-update-page` - Update existing pages
- `mcp_notion_notion-create-pages` - Create new pages

### File Operations

- `read_file` - Check current documentation state
- `replace_string_in_file` - Update technical context
- `create_file` - Add new documentation files if needed

## Common Pitfalls to Avoid

❌ **Don't**: Make code changes without considering documentation impact
✅ **Do**: Always ask "Does this change any documented behavior?"

❌ **Don't**: Only update one documentation source when both are affected
✅ **Do**: Update both Technical Context and Notion when appropriate

❌ **Don't**: Leave outdated information in docs
✅ **Do**: Remove or update sections that are no longer accurate

❌ **Don't**: Document implementation details in Notion (user-facing)
✅ **Do**: Keep technical details in Technical Context, user guides in Notion

❌ **Don't**: Forget to update the Feature Roadmap
✅ **Do**: Move completed features from "Planned" to "Implemented" with dates

## Questions?

If unsure whether a change requires documentation updates, err on the side of updating. It's easier to maintain accurate docs than to reconstruct context later.

When in doubt:

1. Check if the change affects any existing documented patterns
2. Consider if a future developer would benefit from knowing about this change
3. Think about what you wish you knew when you started this change

---

**Remember**: Good documentation is a gift to your future self and teammates. Keep it current, accurate, and helpful.

Agentic Enterprise SaaS — AI Rules Summary

- This is a SaaS wrapper around OpenClaw (npm). NEVER modify OpenClaw source.
- Communicate with OpenClaw ONLY via IAgentEngine interface → HTTP API (port 18789).
- TypeScript strict mode. Every file < 300 lines.
- Test BEFORE feature. Interface BEFORE implementation.
- One session = one module. Commit BEFORE ending session.
- Read PROGRESS.md + architecture_state.json at start of every session.
- Update PROGRESS.md + architecture_state.json at end of every session.
- Commit format: <type>(<scope>): <description>
- No hardcoded credentials. Use environment variables.
- When in doubt, read RULES.md and ARCHITECTURE.md for full details.

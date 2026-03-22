# Contributing to Sintacks Task Manager

Thank you for considering contributing to Sintacks Task Manager! This document outlines the process and guidelines.

## Code of Conduct

Be respectful and inclusive. We're building a productive and welcoming community.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/sintacks-task-manager/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (browser, PHP version, etc.)

### Suggesting Features

1. Check existing feature requests
2. Create a new issue with:
   - Clear use case
   - Why this feature is useful
   - Possible implementation approach

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages: `git commit -m "Add: feature description"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a Pull Request with:
   - Description of changes
   - Link to related issue
   - Screenshots/GIFs if UI changes

## Development Guidelines

### Frontend (React + TypeScript)

- Follow existing code style
- Use TypeScript strictly (no `any` types unless necessary)
- Use functional components with hooks
- Keep components small and focused
- Use Lucide React for icons (no emojis)
- Follow the design system (colors, spacing)

### Backend (PHP)

- Follow PSR-12 coding standards
- Use PDO prepared statements (security)
- Return consistent JSON responses
- Add proper error handling
- Document public methods

### Git Commit Messages

Format: `Type: Short description`

Types:
- `Add`: New feature
- `Fix`: Bug fix
- `Update`: Improve existing feature
- `Remove`: Delete code/feature
- `Refactor`: Code restructuring
- `Docs`: Documentation changes
- `Style`: Formatting, no code change

Examples:
```
Add: Pomodoro timer component
Fix: Task completion not updating UI
Update: Improve mobile navigation
Docs: Add deployment guide
```

### Testing

Before submitting:
- Test on desktop and mobile
- Test in light and dark mode
- Verify API endpoints work
- Check browser console for errors
- Test with different screen sizes

## Project Structure

See README.md for full structure.

## Questions?

Open a discussion or issue on GitHub.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
